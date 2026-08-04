/**
 * Payroll — output pipeline.
 *
 * Ships the composed payslip HTML to the printer, a PDF or a CSV extract. The
 * heavy PDF libraries are imported lazily so they never weigh down the payroll
 * bundle for admins who only ever look at the dashboard.
 *
 * The PDF path renders the real A4 page and slices it across pages, matching
 * the approach already proven in Document Studio — same fidelity, same
 * behaviour, no second rendering engine to reason about.
 */
import logoUrl from "../../assets/nexora-logo.png";
import { composePayslipHtml, payslipFileName } from "./payslipTemplate";
import { formatPeriod } from "./formatters";
import type { PayrollSettings, Payslip } from "./types";

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */

let logoPromise: Promise<string | undefined> | null = null;

/**
 * The brand mark as a data URL. Inlining it keeps the exported document
 * self-contained (and keeps html2canvas from tainting the canvas). Cached for
 * the session — the fetch happens at most once.
 */
export function getLogoDataUrl(): Promise<string | undefined> {
  if (logoPromise) return logoPromise;
  logoPromise = (async () => {
    try {
      const res = await fetch(logoUrl);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      // A missing logo must never block a payslip.
      return undefined;
    }
  })();
  return logoPromise;
}

/* ------------------------------------------------------------------ */
/* Document assembly                                                   */
/* ------------------------------------------------------------------ */

export interface PayslipExportOptions {
  settings: PayrollSettings;
  payDate?: string;
}

/** Compose the payslip with the brand mark already inlined. */
export async function buildPayslipHtml(
  payslip: Payslip,
  opts: PayslipExportOptions
): Promise<string> {
  const logoDataUrl = await getLogoDataUrl();
  return composePayslipHtml(payslip, { ...opts, logoDataUrl });
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

/**
 * Render the payslip to a true A4 PDF. Captured at 2.5× sampling so the text
 * stays crisp, then split across pages when the content runs long.
 */
export async function exportPayslipPdf(
  payslip: Payslip,
  opts: PayslipExportOptions
): Promise<void> {
  const html = await buildPayslipHtml(payslip, opts);

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

    const pageEl = idoc.querySelector(".ps-page") as HTMLElement | null;
    if (!pageEl) return;

    const fullHeight = Math.max(pageEl.scrollHeight, pageEl.offsetHeight);
    iframe.style.height = `${fullHeight + 40}px`;

    const [{ default: html2canvas }, jspdf] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const JsPDF = (jspdf as any).jsPDF || (jspdf as any).default;

    const canvas = await html2canvas(pageEl, {
      scale: 2.5,
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
    const imgH = (canvas.height * pageW) / canvas.width;
    const imgData = canvas.toDataURL("image/png");

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, pageW, imgH, undefined, "FAST");
    heightLeft -= pageH;
    while (heightLeft > 0.5) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageW, imgH, undefined, "FAST");
      heightLeft -= pageH;
    }

    pdf.save(`${payslipFileName(payslip)}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}

/* ------------------------------------------------------------------ */
/* Print                                                               */
/* ------------------------------------------------------------------ */

export async function printPayslip(
  payslip: Payslip,
  opts: PayslipExportOptions
): Promise<void> {
  const html = await buildPayslipHtml(payslip, opts);

  const frame = document.createElement("iframe");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);

  const doc = frame.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(frame);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () =>
    setTimeout(() => {
      try {
        document.body.removeChild(frame);
      } catch {
        /* already removed */
      }
    }, 500);

  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return cleanup();
    win.focus();
    win.print();
    cleanup();
  };
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

const csvCell = (v: unknown): string => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Export a set of payslips as a bank/accounting-friendly CSV. Deliberately flat
 * and boring — this is the file a finance team opens in Excel.
 */
export function exportPayslipsCsv(payslips: Payslip[], filename: string): void {
  const headers = [
    "Employee ID",
    "Employee Name",
    "Department",
    "Designation",
    "Period",
    "Currency",
    "Basic Salary",
    "Allowances",
    "Gross Earnings",
    "Deductions",
    "Net Salary",
  ];
  const rows = payslips.map((p) => [
    p.employee.employeeCode,
    p.employee.name,
    p.employee.department,
    p.employee.designation,
    formatPeriod(p.period),
    p.computation.currency,
    p.computation.basicSalary,
    p.computation.totalAllowances,
    p.computation.grossEarnings,
    p.computation.totalDeductions,
    p.computation.netSalary,
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map(csvCell).join(","))
    .join("\r\n");

  // BOM so Excel reads UTF-8 (and currency symbols) correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
