/**
 * Employee report - output pipeline.
 *
 * Same approach already proven in Document Studio and Payroll: compose a
 * self-contained A4 document, render it inside an isolated iframe, then place
 * the capture into a true A4 jsPDF. Nothing is read from the live DOM, so the
 * export no longer depends on the viewer's screen width, colour theme or
 * scroll position.
 *
 * The one addition here is per-page capture: the template emits one `.rp-page`
 * per printed page, and each becomes its own PDF page, so cards and table rows
 * are never sliced down the middle.
 */
import logoUrl from "../../assets/nexora-logo.png";
import { composeReportHtml } from "./reportTemplate";
import { reportFileName, type ReportModel } from "./reportModel";
import { buildXlsx, downloadBlob, type XlsxSheet } from "../../lib/xlsx";

/* ------------------------------------------------------------------ */
/* Image inlining                                                      */
/* ------------------------------------------------------------------ */

const toDataUrl = async (url: string): Promise<string | undefined> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // A missing image must never block an export - the template has fallbacks.
    return undefined;
  }
};

let logoPromise: Promise<string | undefined> | null = null;

/** The brand mark as a data URL, fetched at most once per session. */
export function getLogoDataUrl(): Promise<string | undefined> {
  if (!logoPromise) logoPromise = toDataUrl(logoUrl);
  return logoPromise;
}

/**
 * Inline the logo and the employee's avatar so the captured document never
 * waits on (or is tainted by) a cross-origin image.
 */
export async function withInlinedImages(
  model: ReportModel,
  avatarUrl?: string
): Promise<ReportModel> {
  const [logoDataUrl, avatarDataUrl] = await Promise.all([
    getLogoDataUrl(),
    avatarUrl ? toDataUrl(avatarUrl) : Promise.resolve(undefined),
  ]);
  return {
    ...model,
    logoDataUrl,
    employee: { ...model.employee, avatarDataUrl },
  };
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

/** Wait until every image in a document has settled (loaded or failed). */
async function waitForImages(doc: Document): Promise<void> {
  await Promise.all(
    Array.from(doc.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          })
    )
  );
}

export interface PdfProgress {
  /** Called as pages are rendered, so the UI can show real progress. */
  onPage?: (done: number, total: number) => void;
}

/**
 * Render the report to a true A4 PDF, one captured `.rp-page` per PDF page.
 * A page that somehow runs taller than A4 is sliced rather than clipped, so no
 * content can be silently lost.
 */
export async function exportReportPdf(
  model: ReportModel,
  progress: PdfProgress = {}
): Promise<void> {
  const html = composeReportHtml(model);

  // Isolated iframe sized to A4 @96dpi (≈794px) plus breathing room.
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:820px;height:1200px;border:0;background:#fff;";
  document.body.appendChild(iframe);

  try {
    const idoc = iframe.contentWindow!.document;
    idoc.open();
    idoc.write(html);
    idoc.close();

    await new Promise<void>((res) => {
      if (idoc.readyState === "complete") res();
      else iframe.onload = () => res();
    });
    await waitForImages(idoc);

    const pages = Array.from(
      idoc.querySelectorAll<HTMLElement>(".rp-page")
    );
    if (pages.length === 0) throw new Error("Report document produced no pages");

    // Tall enough that every page element is laid out, not just the first.
    const documentHeight = pages.reduce(
      (sum, el) => sum + Math.max(el.scrollHeight, el.offsetHeight),
      0
    );
    iframe.style.height = `${documentHeight + 80}px`;

    const [{ default: html2canvas }, jspdf] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const JsPDF = (jspdf as any).jsPDF || (jspdf as any).default;

    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = 210;
    const pageH = 297;

    for (let i = 0; i < pages.length; i++) {
      const el = pages[i];
      const height = Math.max(el.scrollHeight, el.offsetHeight);

      const canvas = await html2canvas(el, {
        scale: 2.5, // higher sampling → crisp text in the PDF
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        width: el.offsetWidth,
        height,
        windowWidth: el.scrollWidth,
        windowHeight: height,
      });

      const imgData = canvas.toDataURL("image/png"); // lossless → sharp text
      const imgH = (canvas.height * pageW) / canvas.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, pageW, imgH, undefined, "FAST");

      // Defensive: only bites if a page overflows its fixed A4 height.
      let heightLeft = imgH - pageH;
      let position = 0;
      while (heightLeft > 0.5) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageW, imgH, undefined, "FAST");
        heightLeft -= pageH;
      }

      progress.onPage?.(i + 1, pages.length);
    }

    pdf.save(`${reportFileName(model)}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}

/* ------------------------------------------------------------------ */
/* Excel                                                               */
/* ------------------------------------------------------------------ */

/**
 * Export the same report as a three-sheet workbook: an overview, the balance
 * breakdown and the full leave history. Numbers are written as numbers, so the
 * sheet can be filtered, summed and pivoted rather than just read.
 */
export async function exportReportExcel(model: ReportModel): Promise<void> {
  const e = model.employee;

  const summary: XlsxSheet = {
    name: "Summary",
    colWidths: [26, 34, 16, 16, 16],
    rows: [
      [{ value: "Employee Leave Report", style: "title" }],
      ["Period", model.period],
      ["Generated", model.generatedAt],
      ["Generated by", model.generatedBy],
      [],
      [{ value: "Employee", style: "title" }],
      ["Name", e.name],
      ["Employee ID", e.employeeId || "-"],
      ["Email", e.email || "-"],
      ["Position", e.position || "-"],
      ["Department", e.department || "-"],
      ["Status", e.status || "-"],
      ["Joining date", e.joinDate || "-"],
      ["Tenure (years)", e.tenureYears ? Number(e.tenureYears) : "-"],
      [],
      [{ value: "Totals", style: "title" }],
      ["Allocated days", model.totals.allocated],
      ["Used days", model.totals.used],
      ["Remaining days", model.totals.remaining],
      [
        "Utilisation (%)",
        model.totals.allocated > 0
          ? Math.round((model.totals.used / model.totals.allocated) * 100)
          : 0,
      ],
      [],
      [{ value: "Monthly usage (approved days)", style: "title" }],
      [
        { value: "Month", style: "header" },
        { value: "Days", style: "header" },
      ],
      ...model.monthly.map((m) => [m.month, m.days]),
    ],
  };

  const balance: XlsxSheet = {
    name: "Leave Balance",
    colWidths: [24, 14, 12, 14, 16],
    rows: [
      [
        { value: "Leave type", style: "header" },
        { value: "Allocated", style: "header" },
        { value: "Used", style: "header" },
        { value: "Remaining", style: "header" },
        { value: "Used (%)", style: "header" },
      ],
      ...model.balance.map((r) => [
        r.label,
        r.allocated,
        r.used,
        r.remaining,
        r.allocated > 0 ? Math.round((r.used / r.allocated) * 100) : 0,
      ]),
      [
        { value: "Total", style: "title" },
        model.totals.allocated,
        model.totals.used,
        model.totals.remaining,
        model.totals.allocated > 0
          ? Math.round((model.totals.used / model.totals.allocated) * 100)
          : 0,
      ],
    ],
  };

  const history: XlsxSheet = {
    name: "Leave History",
    colWidths: [6, 16, 16, 16, 8, 14, 18, 46],
    rows: [
      [
        { value: "#", style: "header" },
        { value: "Type", style: "header" },
        { value: "From", style: "header" },
        { value: "To", style: "header" },
        { value: "Days", style: "header" },
        { value: "Status", style: "header" },
        { value: "Applied on", style: "header" },
        { value: "Reason", style: "header" },
      ],
      ...model.history.map((r, i) => [
        i + 1,
        r.type,
        r.from,
        r.to,
        r.days,
        r.status,
        r.appliedOn,
        r.reason,
      ]),
    ],
  };

  const blob = await buildXlsx([summary, balance, history]);
  downloadBlob(blob, `${reportFileName(model)}.xlsx`);
}
