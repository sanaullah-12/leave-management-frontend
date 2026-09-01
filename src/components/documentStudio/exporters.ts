/**
 * Document Studio - output pipeline.
 *
 * Composes the final, standalone A4 page (letterhead + body + footer) and
 * ships it to PDF / DOCX / the printer. The page is assembled from the same
 * stationery and stylesheet modules the canvas uses, so the export is not a
 * second rendering of the document - it is the same one. All heavy libraries
 * are imported lazily so they never weigh down the initial Studio bundle.
 */
import { documentCss } from "./documentStyles";
import {
  assetFor,
  injectSignature,
  renderFooter,
  renderFrame,
  renderLetterhead,
  renderWatermark,
} from "./letterhead";
import type {
  BrandSettings,
  BrandingAsset,
  CompanyProfile,
  PageSettings,
  TemplateVariant,
} from "./types";

export interface ComposeOptions {
  title: string;
  bodyHtml: string;
  page: PageSettings;
  assets: BrandingAsset[];
  company: CompanyProfile;
  brand: BrandSettings;
  variant?: TemplateVariant;
}

/**
 * Build a fully self-contained HTML string sized to A4 (210 x 297mm) so it
 * renders identically inside the app, a PDF, Word and the printer.
 */
export function composeDocumentHtml(opts: ComposeOptions): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${escapeAttr(opts.title)}</title>
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  ${documentCss({ page: opts.page, brand: opts.brand })}
</style></head>
<body>${composePageMarkup(opts)}</body></html>`;
}

/**
 * The page element on its own, without a document wrapper. The canvas mounts
 * this markup directly, which is what keeps the editor and the export honest
 * about looking the same.
 */
export function composePageMarkup({
  bodyHtml,
  page,
  assets,
  company,
  brand,
  variant,
}: ComposeOptions): string {
  const background = page.showBackground ? assetFor(assets, "background") : undefined;
  const stationery = { company, brand, assets, page };
  const body = injectSignature(bodyHtml, assetFor(assets, "signature"));

  const backgroundStyle = background
    ? `background-image:url(${background.dataUrl});background-size:cover;background-position:center;background-repeat:no-repeat;`
    : "";

  return `<div class="ds-page ds-doc ds-doc--${variant ?? "letter"}" style="position:relative;width:210mm;min-height:297mm;padding:${
    page.margin
  }mm;background:#ffffff;${backgroundStyle}display:flex;flex-direction:column;">
  ${renderWatermark({ assets, page })}
  ${renderFrame(variant, brand)}
  <div class="ds-header" style="position:relative;z-index:1;">${renderLetterhead(
    stationery
  )}</div>
  <div class="ds-body" style="position:relative;z-index:1;flex:1 1 auto;">${body}</div>
  <div class="ds-footer" style="position:relative;z-index:1;margin-top:18px;">${renderFooter(
    stationery
  )}</div>
</div>`;
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
 * a download that matches the on-screen preview, with no edge clipping.
 */
export async function exportPdf(opts: ComposeOptions): Promise<void> {
  const html = composeDocumentHtml(opts);

  // Render inside an isolated, correctly-sized iframe (A4 width at 96dpi).
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
      scale: 2.5, // higher sampling keeps text crisp in the PDF
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
    const imgData = canvas.toDataURL("image/png"); // lossless, so text stays sharp

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

    // Page numbers are stamped by jsPDF rather than drawn in CSS: browsers do
    // not expose paged-media counters to a captured canvas.
    if (opts.page.showPageNumbers) {
      const total = pdf.getNumberOfPages();
      for (let i = 1; i <= total; i += 1) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        pdf.text(`Page ${i} of ${total}`, pageW / 2, pageH - 8, {
          align: "center",
        });
      }
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
