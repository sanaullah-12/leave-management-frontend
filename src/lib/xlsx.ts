/**
 * Minimal .xlsx writer.
 *
 * Exporting "to Excel" via a CSV or an HTML table saved under an .xls extension
 * makes Excel show the "file format and extension don't match" warning, and
 * loses multi-sheet layout entirely. This writes a real OOXML workbook instead:
 * a handful of small XML parts zipped together, which Excel, LibreOffice,
 * Numbers and Google Sheets all open without complaint.
 *
 * Deliberately small in scope - inline strings, numbers, three cell styles and
 * column widths. That covers tabular exports; anything richer belongs in a real
 * spreadsheet library.
 */

export type XlsxValue = string | number | null;

export interface XlsxStyledCell {
  value: XlsxValue;
  /** `header` = white-on-accent band, `title` = bold section label. */
  style?: "header" | "title";
}

export type XlsxCell = XlsxValue | XlsxStyledCell;

export interface XlsxSheet {
  name: string;
  rows: XlsxCell[][];
  /** Column widths in Excel character units. */
  colWidths?: number[];
}

const STYLE_INDEX = { default: 0, header: 1, title: 2 } as const;

/** Drop characters XML 1.0 forbids - one of them would corrupt the workbook. */
const stripControls = (v: string): string => {
  let out = "";
  for (const ch of v) {
    const code = ch.codePointAt(0) ?? 0;
    if (code === 9 || code === 10 || code === 13 || code >= 32) out += ch;
  }
  return out;
};

const xmlEscape = (v: string): string =>
  stripControls(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** 0-based column index → "A", "B", ... "AA". */
function columnName(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Excel rejects these characters in sheet names, and caps the length at 31. */
const sanitizeSheetName = (name: string, fallback: string): string =>
  (name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || fallback);

const normalise = (cell: XlsxCell): XlsxStyledCell =>
  cell !== null && typeof cell === "object" ? cell : { value: cell };

function cellXml(cell: XlsxCell, ref: string): string {
  const { value, style } = normalise(cell);
  const s = STYLE_INDEX[style ?? "default"];
  const sAttr = s ? ` s="${s}"` : "";

  if (value === null || value === undefined || value === "") {
    return s ? `<c r="${ref}"${sAttr}/>` : "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"${sAttr}><v>${value}</v></c>`;
  }
  // xml:space="preserve" keeps leading/trailing spaces (indented labels).
  return `<c r="${ref}"${sAttr} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(
    String(value)
  )}</t></is></c>`;
}

function sheetXml(sheet: XlsxSheet): string {
  const cols = sheet.colWidths?.length
    ? `<cols>${sheet.colWidths
        .map(
          (w, i) =>
            `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`
        )
        .join("")}</cols>`
    : "";

  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => cellXml(cell, `${columnName(c)}${r + 1}`))
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rows}</sheetData></worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FF111827"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf xfId="0" numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf xfId="0" numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/** Build a workbook blob. Sheets keep the order given. */
export async function buildXlsx(sheets: XlsxSheet[]): Promise<Blob> {
  if (sheets.length === 0) throw new Error("A workbook needs at least one sheet");

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const names = sheets.map((s, i) => sanitizeSheetName(s.name, `Sheet${i + 1}`));

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets
  .map(
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${
        i + 1
      }.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )
  .join("\n")}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${names
      .map(
        (name, i) =>
          `<sheet name="${xmlEscape(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
      )
      .join("")}</sheets>
</workbook>`
  );

  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets
  .map(
    (_, i) =>
      `<Relationship Id="rId${
        i + 1
      }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
        i + 1
      }.xml"/>`
  )
  .join("\n")}
<Relationship Id="rId${
      sheets.length + 1
    }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  zip.file("xl/styles.xml", STYLES_XML);
  sheets.forEach((sheet, i) => {
    zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(sheet));
  });

  return zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    compression: "DEFLATE",
  });
}

/** Save a blob under `filename` via a transient object URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
