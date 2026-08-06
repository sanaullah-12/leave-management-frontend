/**
 * Payroll - static domain data.
 *
 * Default component blueprints, currency metadata and status vocabularies. All
 * of it is data, not logic: adding a statutory deduction for a new market is a
 * push into `COMPONENT_BLUEPRINTS`, not a code change.
 */
import type {
  ComponentKind,
  ComputeMode,
  PayrollSettings,
  PayslipStatus,
  PayrollRunStatus,
  SalaryStatus,
} from "./types";

/* ------------------------------------------------------------------ */
/* Settings defaults                                                   */
/* ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS: PayrollSettings = {
  companyName: "Nexora",
  currency: "PKR",
  salaryDate: 1,
  defaultTaxPercent: 0,
};

/** Currencies offered in Settings. Extend freely - nothing else depends on it. */
export const CURRENCIES: { code: string; label: string; symbol: string }[] = [
  { code: "PKR", label: "Pakistani Rupee", symbol: "₨" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", label: "Saudi Riyal", symbol: "﷼" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
];

export const currencyMeta = (code: string) =>
  CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];

/* ------------------------------------------------------------------ */
/* Component blueprints                                                */
/* ------------------------------------------------------------------ */

/**
 * A ready-made component an admin can drop onto a salary structure. These are
 * *suggestions* - the structure editor also accepts fully custom lines, so no
 * company is boxed in by this list.
 */
export interface ComponentBlueprint {
  code: string;
  name: string;
  kind: ComponentKind;
  mode: ComputeMode;
  /** Suggested starting value (amount for `fixed`, percent otherwise). */
  value: number;
  taxable: boolean;
  hint: string;
}

export const COMPONENT_BLUEPRINTS: ComponentBlueprint[] = [
  {
    code: "HRA",
    name: "House Rent Allowance",
    kind: "earning",
    mode: "percentOfBasic",
    value: 40,
    taxable: true,
    hint: "Typically 40-50% of basic salary",
  },
  {
    code: "MED",
    name: "Medical Allowance",
    kind: "earning",
    mode: "percentOfBasic",
    value: 10,
    taxable: false,
    hint: "Usually tax-exempt up to a statutory cap",
  },
  {
    code: "CONV",
    name: "Conveyance Allowance",
    kind: "earning",
    mode: "fixed",
    value: 0,
    taxable: false,
    hint: "Flat travel allowance per month",
  },
  {
    code: "SPCL",
    name: "Special Allowance",
    kind: "earning",
    mode: "fixed",
    value: 0,
    taxable: true,
    hint: "Balancing component to reach the agreed gross",
  },
  {
    code: "FUEL",
    name: "Fuel Allowance",
    kind: "earning",
    mode: "fixed",
    value: 0,
    taxable: true,
    hint: "Flat monthly fuel entitlement",
  },
  {
    code: "PF",
    name: "Provident Fund",
    kind: "deduction",
    mode: "percentOfBasic",
    value: 8.33,
    taxable: false,
    hint: "Employee contribution, a share of basic",
  },
  {
    code: "EOBI",
    name: "EOBI / Social Security",
    kind: "deduction",
    mode: "fixed",
    value: 0,
    taxable: false,
    hint: "Flat statutory contribution",
  },
  {
    code: "INSUR",
    name: "Health Insurance",
    kind: "deduction",
    mode: "fixed",
    value: 0,
    taxable: false,
    hint: "Employee share of the group policy premium",
  },
];

/**
 * Components applied to a brand-new salary structure. Kept intentionally small
 * - a fresh structure should be understandable at a glance.
 */
export const DEFAULT_COMPONENT_CODES = ["HRA", "MED"] as const;

/** Percent-mode components are entered as 0-100. */
export const MAX_PERCENT = 100;

export const COMPUTE_MODE_LABEL: Record<ComputeMode, string> = {
  fixed: "Fixed amount",
  percentOfBasic: "% of basic",
  percentOfGross: "% of gross",
};

/* ------------------------------------------------------------------ */
/* Status vocabularies                                                 */
/* ------------------------------------------------------------------ */

/**
 * Presentation for one status, shared by pills and select options.
 *
 * The visible text is a *translation key* rather than a literal. These objects
 * live at module scope, so a baked-in English string could never react to a
 * language change - the key is resolved at render time instead. Keys resolve
 * against the `common` namespace, which already ships all five languages.
 */
export interface StatusStyle {
  /** Key within the `common` namespace, e.g. "status.active". */
  labelKey: string;
  className: string;
  dot: string;
}

export const SALARY_STATUS: Record<SalaryStatus | "unconfigured", StatusStyle> = {
  active: {
    labelKey: "status.active",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "#10b981",
  },
  draft: {
    labelKey: "status.draft",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "#f59e0b",
  },
  inactive: {
    labelKey: "status.inactive",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
    dot: "#9ca3af",
  },
  unconfigured: {
    labelKey: "status.notSetUp",
    className: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    dot: "#f43f5e",
  },
};

export const RUN_STATUS: Record<PayrollRunStatus, StatusStyle> = {
  draft: {
    labelKey: "status.draft",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "#f59e0b",
  },
  processed: {
    labelKey: "status.processed",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    dot: "#3b82f6",
  },
  paid: {
    labelKey: "status.paid",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "#10b981",
  },
};

export const PAYSLIP_STATUS: Record<PayslipStatus, StatusStyle> = {
  generated: {
    labelKey: "status.generated",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    dot: "#3b82f6",
  },
  downloaded: {
    labelKey: "status.downloaded",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "#10b981",
  },
  printed: {
    labelKey: "status.printed",
    className:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    dot: "#8b5cf6",
  },
};

/** Human labels for component sources, surfaced on payslip lines. */
export const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual",
  tax: "Tax",
  attendance: "Attendance",
  leave: "Leave",
  overtime: "Overtime",
  bonus: "Bonus",
  incentive: "Incentive",
  loan: "Loan",
  advance: "Advance",
  reimbursement: "Reimbursement",
  adjustment: "Adjustment",
};
