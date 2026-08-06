/**
 * Document Studio - output pipeline.
 *
 * Composes the final, standalone A4 HTML (letterhead + body + watermark) and
 * ships it to PDF / DOCX / the printer. All heavy libraries are imported
 * lazily so they never weigh down the initial Studio bundle.
 */
import type { BrandingAsset, PageSettings } from "./types";

interface ComposeOptions {
  title: string;
  bodyHtml: string;
  page: PageSettings;
  assets: BrandingAsset[];
}

const assetFor = (assets: BrandingAsset[], slot: BrandingAsset["slot"]) =>
  assets.find((a) => a.slot === slot && a.enabled);

/**
 * Build a fully self-contained HTML string sized to A4 (210×297mm) with inline
 * styles so it renders identically inside the app, a PDF, Word and the printer.
 */
export function composeDocumentHtml({
  title,
  bodyHtml,
  page,
  assets,
}: ComposeOptions): string {
  const header = page.showLetterhead ? assetFor(assets, "header") : undefined;
  const footer = page.showLetterhead ? assetFor(assets, "footer") : undefined;
  const logo = page.showLetterhead ? assetFor(assets, "logo") : undefined;
  const watermark = page.showWatermark ? assetFor(assets, "watermark") : undefined;
  const background = page.showBackground ? assetFor(assets, "background") : undefined;
  const signature = assetFor(assets, "signature");

  const watermarkLayer = watermark
    ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;">
         <img src="${watermark.dataUrl}" style="max-width:60%;opacity:${watermark.opacity / 100};transform:scale(${watermark.scale / 100});" />
       </div>`
    : "";

  const headerLayer = header
    ? `<div style="margin-bottom:16px;text-align:center;"><img src="${header.dataUrl}" style="max-width:100%;transform:scale(${header.scale / 100});transform-origin:top center;" /></div>`
    : logo
    ? `<div style="margin-bottom:16px;"><img src="${logo.dataUrl}" style="max-height:64px;transform:scale(${logo.scale / 100});transform-origin:top left;" /></div>`
    : "";

  const footerLayer = footer
    ? `<div style="margin-top:24px;text-align:center;"><img src="${footer.dataUrl}" style="max-width:100%;transform:scale(${footer.scale / 100});transform-origin:bottom center;" /></div>`
    : "";

  const signatureLayer = signature
    ? `<div style="margin-top:20px;"><img src="${signature.dataUrl}" style="max-height:80px;transform:scale(${signature.scale / 100});transform-origin:top left;" /></div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${escapeAttr(title)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; }
  .ds-page {
    position: relative;
    width: 210mm;
    min-height: 297mm;
    padding: ${page.margin}mm;
    background: #ffffff;
    ${background ? `background-image: url(${background.dataUrl}); background-size: cover; background-position: center; background-repeat: no-repeat;` : ""}
    color: #111827;
    font-family: ${page.fontFamily};
    font-size: ${page.fontSize}pt;
    line-height: ${page.lineHeight};
  }
  .ds-body { position: relative; z-index: 1; }
  .ds-body h1 { font-size: ${page.fontSize + 8}pt; margin: 0 0 12px; }
  .ds-body h2 { font-size: ${page.fontSize + 4}pt; margin: 18px 0 8px; }
  .ds-body p { margin: 0 0 10px; }
  .ds-body table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  .ds-body td, .ds-body th { border: 1px solid #d1d5db; padding: 6px 10px; }
  .ds-body ul, .ds-body ol { margin: 0 0 10px 22px; }
  .ds-body img { max-width: 100%; }
</style></head>
<body>
  <div class="ds-page">
    ${watermarkLayer}
    <div class="ds-body">
      ${headerLayer}
      ${bodyHtml}
      ${signatureLayer}
      ${footerLayer}
    </div>
  </div>
</body></html>`;
}

function escapeAttr(v: string): string {
  return v.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** Sanitise a title into a filesystem-friendly filename stem. */
export function slugifyFileName(name: string): string {
  return (
    name
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "document"
  );
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

/** Wait until every <img> inside a document has finished loading (or errored). */
async function waitForImages(doc: Document): Promise<void> {
  const imgs = Array.from(doc.images);
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          })
    )
  );
}

/**
 * Render the exact A4 page (margins baked in) to a canvas, then place it into a
 * true A4 jsPDF - splitting across pages when the content is long. This yields
 * a download that matches the on-screen preview pixel-for-pixel, with no edge
 * clipping.
 */
export async function exportPdf(opts: ComposeOptions): Promise<void> {
  const html = composeDocumentHtml(opts);

  // Render inside an isolated, correctly-sized iframe (A4 width @96dpi ≈ 794px).
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

    const pageEl = idoc.querySelector(".ds-page") as HTMLElement;
    if (!pageEl) return;

    // Ensure the iframe is tall enough to capture the full (possibly multi-page) height.
    const fullHeight = Math.max(pageEl.scrollHeight, pageEl.offsetHeight);
    iframe.style.height = `${fullHeight + 40}px`;

    const [{ default: html2canvas }, jspdf] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const JsPDF = (jspdf as any).jsPDF || (jspdf as any).default;

    const canvas = await html2canvas(pageEl, {
      scale: 2.5, // higher sampling → crisp text in the PDF
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: pageEl.offsetWidth,
      height: fullHeight,
      windowWidth: pageEl.scrollWidth,
      windowHeight: fullHeight,
    });

    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = 210;
    const pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * pageW) / canvas.width;
    const imgData = canvas.toDataURL("image/png"); // lossless → sharp text

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgW, imgH, undefined, "FAST");
    heightLeft -= pageH;
    while (heightLeft > 0.5) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgW, imgH, undefined, "FAST");
      heightLeft -= pageH;
    }

    pdf.save(`${slugifyFileName(opts.title)}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}

/* ------------------------------------------------------------------ */
/* DOCX (Word-compatible HTML - no extra dependency)                   */
/* ------------------------------------------------------------------ */

export function exportDocx(opts: ComposeOptions): void {
  const inner = composeDocumentHtml(opts);
  // Word opens an HTML document with the .doc extension natively; wrap it with
  // the Office namespace so margins/orientation are respected.
  const wordDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    ${inner.replace(/^<!DOCTYPE html>|<\/?html[^>]*>|<\/?head>|<\/?body>/gi, "")}
    </html>`;
  const blob = new Blob(["﻿", wordDoc], {
    type: "application/msword",
  });
  triggerDownload(blob, `${slugifyFileName(opts.title)}.doc`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/* Print                                                               */
/* ------------------------------------------------------------------ */

export function printDocument(opts: ComposeOptions): void {
  const html = composeDocumentHtml(opts);
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(frame);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const done = () => {
    setTimeout(() => {
      try {
        document.body.removeChild(frame);
      } catch {
        /* already removed */
      }
    }, 500);
  };

  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return done();
    win.focus();
    win.print();
    done();
  };
}
