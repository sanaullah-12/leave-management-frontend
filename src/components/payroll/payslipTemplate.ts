/**
 * Payroll — payslip document composer.
 *
 * Builds one fully self-contained A4 HTML document from a payslip. The *same*
 * string backs the on-screen preview, the printer and the PDF, which is the
 * only way to guarantee an employee's downloaded payslip matches what HR
 * approved — a second, hand-maintained React rendering would inevitably drift.
 *
 * Styles are inlined and scoped to the document, so nothing here can be
 * affected by (or leak into) the app's Tailwind layer.
 */
import { formatDate, formatMoney, formatPeriod } from "./formatters";
import { SOURCE_LABEL } from "./constants";
import type { PayrollSettings, Payslip, PayslipLine } from "./types";

export interface PayslipRenderOptions {
  settings: PayrollSettings;
  /** Company mark as a data URL, so the document stays portable. */
  logoDataUrl?: string;
  /** Pay date ISO string — falls back to the payslip's generation date. */
  payDate?: string;
}

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const row = (label: string, value: string) => `
  <tr>
    <td class="ps-label">${esc(label)}</td>
    <td class="ps-value">${esc(value)}</td>
  </tr>`;

const lineRow = (line: PayslipLine, currency: string) => `
  <tr>
    <td>
      <span class="ps-line-name">${esc(line.name)}</span>
      ${
        line.source !== "manual"
          ? `<span class="ps-chip">${esc(SOURCE_LABEL[line.source] ?? line.source)}</span>`
          : ""
      }
      ${line.note ? `<span class="ps-note">${esc(line.note)}</span>` : ""}
    </td>
    <td class="ps-amount">${esc(formatMoney(line.amount, currency))}</td>
  </tr>`;

/** Build the standalone payslip document. */
export function composePayslipHtml(
  payslip: Payslip,
  { settings, logoDataUrl, payDate }: PayslipRenderOptions
): string {
  const { employee, computation, period } = payslip;
  const currency = computation.currency;

  // Basic is presented as the first earning line so the breakdown sums visibly
  // to gross — the engine keeps it separate, the document reunites them.
  const earningRows = [
    lineRow(
      {
        code: "BASIC",
        name: "Basic Salary",
        kind: "earning",
        source: "manual",
        amount: computation.basicSalary,
        taxable: true,
      },
      currency
    ),
    ...computation.earnings.map((l) => lineRow(l, currency)),
  ].join("");

  const deductionRows = computation.deductions.length
    ? computation.deductions.map((l) => lineRow(l, currency)).join("")
    : `<tr><td class="ps-empty">No deductions</td><td class="ps-amount">${esc(
        formatMoney(0, currency)
      )}</td></tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${esc(
    `Payslip — ${employee.name} — ${formatPeriod(period)}`
  )}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ffffff; }
  .ps-page {
    position: relative;
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 15mm;
    background: #ffffff;
    color: #111827;
    font-family: "Inter", "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* ---- Header ---- */
  .ps-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 14px;
    border-bottom: 2px solid #111827;
  }
  .ps-brand { display: flex; align-items: center; gap: 12px; }
  .ps-logo { width: 46px; height: 46px; object-fit: contain; }
  .ps-company { font-size: 16pt; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
  .ps-tagline {
    margin: 2px 0 0;
    font-size: 7.5pt;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #9ca3af;
  }
  .ps-doc-title { text-align: right; }
  .ps-doc-title h2 {
    margin: 0;
    font-size: 13pt;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ps-period { margin: 2px 0 0; font-size: 10pt; color: #4b5563; font-weight: 600; }
  .ps-ref { margin: 2px 0 0; font-size: 8pt; color: #9ca3af; }

  /* ---- Meta grid ---- */
  .ps-meta {
    display: flex;
    gap: 24px;
    margin-top: 16px;
    padding: 12px 14px;
    background: #f9fafb;
    border-radius: 8px;
  }
  .ps-meta table { width: 100%; border-collapse: collapse; }
  .ps-meta td { padding: 3px 0; vertical-align: top; font-size: 9.5pt; }
  .ps-label { color: #6b7280; width: 42%; }
  .ps-value { color: #111827; font-weight: 600; }

  /* ---- Breakdown ---- */
  .ps-columns { display: flex; gap: 16px; margin-top: 18px; }
  .ps-col { flex: 1; }
  .ps-col h3 {
    margin: 0 0 6px;
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6b7280;
  }
  .ps-table { width: 100%; border-collapse: collapse; }
  .ps-table td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; font-size: 9.5pt; }
  .ps-table tr:first-child td { border-top: 1px solid #e5e7eb; }
  .ps-line-name { font-weight: 500; }
  .ps-chip {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 5px;
    border-radius: 999px;
    background: #eef2ff;
    color: #4f46e5;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .ps-note { display: block; font-size: 7.5pt; color: #9ca3af; }
  .ps-empty { color: #9ca3af; font-style: italic; }
  .ps-amount { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ps-subtotal td {
    border-top: 1.5px solid #d1d5db;
    border-bottom: none;
    padding-top: 8px;
    font-weight: 700;
  }

  /* ---- Net ---- */
  .ps-net {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 20px;
    padding: 14px 18px;
    background: #111827;
    color: #ffffff;
    border-radius: 10px;
  }
  .ps-net-label { font-size: 9pt; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.75; }
  .ps-net-sub { margin: 2px 0 0; font-size: 8pt; opacity: 0.6; }
  .ps-net-amount { font-size: 19pt; font-weight: 700; font-variant-numeric: tabular-nums; }

  /* ---- Footer ---- */
  .ps-sign {
    display: flex;
    justify-content: space-between;
    margin-top: 42px;
    gap: 40px;
  }
  .ps-sign div { flex: 1; text-align: center; }
  .ps-sign span {
    display: block;
    padding-top: 6px;
    border-top: 1px solid #d1d5db;
    font-size: 8.5pt;
    color: #6b7280;
  }
  .ps-footer {
    position: absolute;
    left: 15mm;
    right: 15mm;
    bottom: 12mm;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 7.5pt;
    color: #9ca3af;
  }
</style></head>
<body>
  <div class="ps-page">
    <div class="ps-header">
      <div class="ps-brand">
        ${logoDataUrl ? `<img class="ps-logo" src="${logoDataUrl}" alt="" />` : ""}
        <div>
          <p class="ps-company">${esc(settings.companyName)}</p>
          <p class="ps-tagline">Payroll Statement</p>
        </div>
      </div>
      <div class="ps-doc-title">
        <h2>Payslip</h2>
        <p class="ps-period">${esc(formatPeriod(period))}</p>
        <p class="ps-ref">Ref ${esc(payslip.id.toUpperCase())}</p>
      </div>
    </div>

    <div class="ps-meta">
      <table>
        ${row("Employee Name", employee.name)}
        ${row("Employee ID", employee.employeeCode)}
        ${row("Department", employee.department)}
      </table>
      <table>
        ${row("Designation", employee.designation)}
        ${row("Pay Period", formatPeriod(period))}
        ${row("Pay Date", formatDate(payDate ?? payslip.generatedAt))}
      </table>
    </div>

    <div class="ps-columns">
      <div class="ps-col">
        <h3>Earnings</h3>
        <table class="ps-table">
          ${earningRows}
          <tr class="ps-subtotal">
            <td>Gross Earnings</td>
            <td class="ps-amount">${esc(
              formatMoney(computation.grossEarnings, currency)
            )}</td>
          </tr>
        </table>
      </div>
      <div class="ps-col">
        <h3>Deductions</h3>
        <table class="ps-table">
          ${deductionRows}
          <tr class="ps-subtotal">
            <td>Total Deductions</td>
            <td class="ps-amount">${esc(
              formatMoney(computation.totalDeductions, currency)
            )}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="ps-net">
      <div>
        <p class="ps-net-label">Net Salary</p>
        <p class="ps-net-sub">Gross ${esc(
          formatMoney(computation.grossEarnings, currency)
        )} − Deductions ${esc(
    formatMoney(computation.totalDeductions, currency)
  )}</p>
      </div>
      <p class="ps-net-amount">${esc(
        formatMoney(computation.netSalary, currency)
      )}</p>
    </div>

    <div class="ps-sign">
      <div><span>Employee Signature</span></div>
      <div><span>Authorised Signatory</span></div>
    </div>

    <div class="ps-footer">
      This is a computer-generated payslip issued by ${esc(
        settings.companyName
      )} and does not require a physical signature.
      Generated on ${esc(formatDate(payslip.generatedAt))}.
    </div>
  </div>
</body></html>`;
}

/** Filesystem-safe stem for a payslip download. */
export const payslipFileName = (payslip: Payslip): string => {
  const stem = `payslip-${payslip.employee.employeeCode}-${payslip.period.year}-${String(
    payslip.period.month
  ).padStart(2, "0")}`;
  return stem.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
};
