/**
 * Payroll - domain types.
 *
 * The whole module's data model lives here. These shapes are deliberately
 * transport-agnostic: today {@link payrollService} persists them locally, but
 * they map 1:1 onto a future REST/GraphQL payroll API without a single UI
 * change. Anything that would force a schema break later (extra earning kinds,
 * statutory deductions, loans, multi-currency) is expressed as *data* - a
 * salary component - rather than as a new hard-coded field.
 */

/* ------------------------------------------------------------------ */
/* Periods                                                             */
/* ------------------------------------------------------------------ */

/**
 * A payroll period. Monthly in V1, but modelled as an explicit object rather
 * than a bare string so weekly/bi-weekly cycles can be introduced by adding a
 * `kind` discriminator without rewriting call sites.
 */
export interface PayrollPeriod {
  /** Four-digit year, e.g. 2026. */
  year: number;
  /** 1-12. */
  month: number;
}

/** Canonical sortable period identifier, e.g. "2026-08". */
export type PeriodKey = string;

/* ------------------------------------------------------------------ */
/* Salary components                                                   */
/* ------------------------------------------------------------------ */

/** Whether a component adds to or subtracts from pay. */
export type ComponentKind = "earning" | "deduction";

/**
 * How a component's amount is derived.
 *
 * New modes are registered with the engine at runtime
 * (see `registerComputeMode`) - the union is widened, nothing else changes.
 */
export type ComputeMode = "fixed" | "percentOfBasic" | "percentOfGross";

/**
 * Where a component's value comes from.
 *
 * V1 only ever produces `manual` and `tax` components. The rest are declared
 * up-front so that future modules (attendance, loans, bonuses...) can emit
 * components the engine already knows how to total, present and audit -
 * without touching the engine, the tables or the payslip.
 */
export type ComponentSource =
  | "manual"
  | "tax"
  | "attendance"
  | "leave"
  | "overtime"
  | "bonus"
  | "incentive"
  | "loan"
  | "advance"
  | "reimbursement"
  | "adjustment";

/** A single line of an employee's salary structure. */
export interface SalaryComponent {
  id: string;
  /** Stable short code used in payslips and future integrations, e.g. "HRA". */
  code: string;
  name: string;
  kind: ComponentKind;
  mode: ComputeMode;
  /** Amount when `mode === "fixed"`, otherwise a percentage (0-100). */
  value: number;
  /** Counts toward taxable income. Earnings only. */
  taxable: boolean;
  /** Display/computation order within its kind. */
  order: number;
  enabled: boolean;
  /** Producer of the value. Defaults to "manual". */
  source: ComponentSource;
  /** Built-ins cannot be deleted (only disabled), so payslips stay comparable. */
  system?: boolean;
  /** Free-form provenance for generated components (e.g. "6 late days"). */
  note?: string;
}

/* ------------------------------------------------------------------ */
/* Salary structure                                                    */
/* ------------------------------------------------------------------ */

export type SalaryStatus = "active" | "draft" | "inactive";

/**
 * An employee's compensation definition. One active structure per employee in
 * V1; `revision` + `effectiveFrom` are already present so salary revisions and
 * increment history become a list query rather than a migration.
 */
export interface SalaryStructure {
  id: string;
  /** Mongo `_id` of the user this structure belongs to. */
  employeeId: string;
  basicSalary: number;
  components: SalaryComponent[];
  /** ISO date this structure takes effect. */
  effectiveFrom: string;
  status: SalaryStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Employees                                                           */
/* ------------------------------------------------------------------ */

/** The employee fields payroll cares about, projected from the users API. */
export interface PayrollEmployee {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
  designation: string;
  email?: string;
  profilePicture?: string;
}

/**
 * A frozen copy of the employee as they were when payroll ran. Payslips must
 * never change retroactively because someone was later renamed or transferred.
 */
export interface EmployeeSnapshot {
  id: string;
  employeeCode: string;
  name: string;
  department: string;
  designation: string;
  email?: string;
}

/* ------------------------------------------------------------------ */
/* Computation results                                                 */
/* ------------------------------------------------------------------ */

/** One resolved money line on a payslip. */
export interface PayslipLine {
  code: string;
  name: string;
  kind: ComponentKind;
  source: ComponentSource;
  /** Always a positive number; `kind` carries the sign. */
  amount: number;
  taxable: boolean;
  note?: string;
}

/** The full, immutable result of running the engine over one structure. */
export interface PayslipComputation {
  basicSalary: number;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  /** Basic + all enabled earnings. */
  grossEarnings: number;
  /** Gross minus basic - the "Allowances" column. */
  totalAllowances: number;
  totalDeductions: number;
  /** Portion of gross flagged taxable (drives the tax line). */
  taxableEarnings: number;
  netSalary: number;
  currency: string;
}

/* ------------------------------------------------------------------ */
/* Payroll runs & payslips                                             */
/* ------------------------------------------------------------------ */

export type PayrollRunStatus = "draft" | "processed" | "paid";
export type PayslipStatus = "generated" | "downloaded" | "printed";

/** A generated payslip - one employee, one period, frozen at generation time. */
export interface Payslip {
  id: string;
  runId: string;
  period: PayrollPeriod;
  employee: EmployeeSnapshot;
  computation: PayslipComputation;
  status: PayslipStatus;
  generatedAt: string;
}

/** A single execution of payroll for a period. */
export interface PayrollRun {
  id: string;
  period: PayrollPeriod;
  status: PayrollRunStatus;
  generatedAt: string;
  generatedBy: string;
  /** Denormalised totals so history renders without loading every payslip. */
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  currency: string;
  /** ISO date payment is/was scheduled for, derived from settings.salaryDate. */
  payDate: string;
  note?: string;
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export interface PayrollSettings {
  companyName: string;
  /** ISO-4217 code, e.g. "PKR". Single-currency in V1, per-run in the future. */
  currency: string;
  /** Day of month salaries are paid, 1-31 (clamped to the month's length). */
  salaryDate: number;
  /** Percentage applied to taxable earnings, 0 disables the tax line. */
  defaultTaxPercent: number;
}

/* ------------------------------------------------------------------ */
/* Persisted state                                                     */
/* ------------------------------------------------------------------ */

/** Everything the module owns. Mirrors what a backend would return per company. */
export interface PayrollState {
  /** Keyed by employee id for O(1) lookup across thousands of employees. */
  structures: Record<string, SalaryStructure>;
  runs: PayrollRun[];
  payslips: Payslip[];
  settings: PayrollSettings;
  /** Schema version - lets `payrollService` migrate old local data safely. */
  version: number;
}

/* ------------------------------------------------------------------ */
/* View models                                                         */
/* ------------------------------------------------------------------ */

/**
 * An employee joined with their structure and its computed totals - the row
 * shape every payroll table renders. Built once per data change and memoised,
 * so tables never recompute money while filtering or sorting.
 */
export interface SalaryRow {
  employee: PayrollEmployee;
  structure: SalaryStructure | null;
  computation: PayslipComputation | null;
  /** "active" | "draft" | "inactive" | "unconfigured". */
  status: SalaryStatus | "unconfigured";
}
