/**
 * The shape an employee report is exported from.
 *
 * The page builds this once from its queries; the PDF and Excel exporters then
 * work purely from it. That's the whole point of the seam - an export can no
 * longer disagree with what's on screen, and neither exporter has to know
 * anything about React, Tailwind or the live DOM.
 */

export interface ReportEmployee {
  name: string;
  email: string;
  employeeId: string;
  position: string;
  department: string;
  status: string;
  joinDate: string;
  tenureYears: string | null;
  /** Data URL - inlined by the exporter so the PDF stays self-contained. */
  avatarDataUrl?: string;
}

export interface ReportBalanceRow {
  label: string;
  hex: string;
  allocated: number;
  used: number;
  remaining: number;
}

export interface ReportMonthlyRow {
  month: string;
  days: number;
}

export interface ReportHistoryRow {
  type: string;
  from: string;
  to: string;
  days: number;
  status: string;
  reason: string;
  appliedOn: string;
}

export interface ReportModel {
  employee: ReportEmployee;
  /** e.g. "August 2026" - the period the report covers. */
  period: string;
  generatedAt: string;
  generatedBy: string;
  balance: ReportBalanceRow[];
  monthly: ReportMonthlyRow[];
  history: ReportHistoryRow[];
  totals: {
    allocated: number;
    used: number;
    remaining: number;
  };
  /** Inlined brand mark for the document header. */
  logoDataUrl?: string;
}

/** Filesystem-friendly stem shared by both exports. */
export function reportFileName(model: ReportModel): string {
  const who =
    model.employee.name
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "employee";
  const day = new Date(model.generatedAt);
  const stamp = Number.isNaN(day.getTime())
    ? "report"
    : day.toISOString().split("T")[0];
  return `employee-report-${who}-${stamp}`;
}
