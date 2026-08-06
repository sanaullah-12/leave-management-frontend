/**
 * Payroll - calculation engine.
 *
 * The single place money is computed. Pure functions only: no React, no I/O, no
 * formatting. Give it a salary structure plus a context and it returns an
 * immutable {@link PayslipComputation}. Every screen - dashboard, salary table,
 * processing preview, payslip PDF - reads the *same* numbers from here, so the
 * figure an admin approves is byte-identical to the one the employee receives.
 *
 * ## Extension model
 *
 * Two registries keep the engine closed for modification but open for extension:
 *
 * 1. **Compute modes** - how a component turns into an amount.
 *    `registerComputeMode("slab", fn)` adds e.g. tax slabs without editing this
 *    file.
 * 2. **Component providers** - where extra components come from. A future
 *    attendance module calls `registerComponentProvider({ source: "attendance",
 *    produce })` and its loss-of-pay line flows into totals, tables, payslips
 *    and PDFs automatically, because everything downstream only knows
 *    "earnings" and "deductions".
 *
 * Evaluation order is fixed and documented so results are reproducible:
 *   basic → fixed & %-of-basic earnings → gross → %-of-gross earnings →
 *   taxable base → tax → deductions.
 */
import type {
  ComponentSource,
  ComputeMode,
  PayrollPeriod,
  PayrollSettings,
  PayslipComputation,
  PayslipLine,
  SalaryComponent,
  SalaryStructure,
} from "./types";

/* ------------------------------------------------------------------ */
/* Money primitives                                                    */
/* ------------------------------------------------------------------ */

/**
 * Round to 2 decimals, half-up, guarding against binary float drift
 * (`1.005 → 1.01`, not `1.00`). Every amount leaving the engine passes through
 * this so totals always reconcile with the lines above them.
 */
export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Coerce anything user- or API-supplied into a safe, non-negative amount. */
export function toAmount(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return round2(n);
}

const sum = (lines: PayslipLine[]) =>
  round2(lines.reduce((acc, l) => acc + l.amount, 0));

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

/**
 * Everything a computation needs beyond the structure itself. Passed explicitly
 * (never read from a module-level singleton) so the engine stays testable and
 * a future multi-company build can compute two companies side by side.
 */
export interface PayrollContext {
  settings: PayrollSettings;
  period: PayrollPeriod;
  /** Employee id - passed to providers that need per-employee data. */
  employeeId?: string;
}

/** Intermediate state handed to compute-mode resolvers. */
export interface ComputeBase {
  basicSalary: number;
  /** Gross known so far. Zero during the first pass, real during the second. */
  gross: number;
  context: PayrollContext;
}

/* ------------------------------------------------------------------ */
/* Registry 1 - compute modes                                          */
/* ------------------------------------------------------------------ */

export type ComputeModeResolver = (
  component: SalaryComponent,
  base: ComputeBase
) => number;

const computeModes = new Map<string, ComputeModeResolver>([
  ["fixed", (c) => toAmount(c.value)],
  ["percentOfBasic", (c, b) => round2((b.basicSalary * toAmount(c.value)) / 100)],
  ["percentOfGross", (c, b) => round2((b.gross * toAmount(c.value)) / 100)],
]);

/**
 * Register (or replace) a compute mode. Call once at module load; the engine
 * resolves lazily, so registration order relative to rendering doesn't matter.
 */
export function registerComputeMode(
  mode: string,
  resolver: ComputeModeResolver
): void {
  computeModes.set(mode, resolver);
}

/** Modes that need the gross total, so they must run in the second pass. */
const GROSS_DEPENDENT: ReadonlySet<string> = new Set(["percentOfGross"]);

function resolveAmount(component: SalaryComponent, base: ComputeBase): number {
  const resolver = computeModes.get(component.mode);
  // An unknown mode means data from a newer version of the app. Contributing
  // zero is the only safe answer - never guess at someone's pay.
  if (!resolver) return 0;
  return round2(Math.max(0, resolver(component, base)));
}

/* ------------------------------------------------------------------ */
/* Registry 2 - component providers                                    */
/* ------------------------------------------------------------------ */

/**
 * Produces additional components for a payslip from data the salary structure
 * doesn't hold. This is the seam every future payroll feature plugs into:
 * attendance LOP, leave deductions, overtime, bonuses, loan instalments,
 * reimbursements - each is a provider, none of them touches this file.
 */
export interface ComponentProvider {
  source: ComponentSource;
  /** Lower runs first; ties broken by registration order. */
  priority?: number;
  produce: (
    structure: SalaryStructure,
    context: PayrollContext
  ) => SalaryComponent[];
}

const providers: ComponentProvider[] = [];

export function registerComponentProvider(provider: ComponentProvider): void {
  const existing = providers.findIndex((p) => p.source === provider.source);
  if (existing >= 0) providers.splice(existing, 1, provider);
  else providers.push(provider);
}

export function clearComponentProviders(): void {
  providers.length = 0;
}

function collectComponents(
  structure: SalaryStructure,
  context: PayrollContext
): SalaryComponent[] {
  const extra = [...providers]
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
    .flatMap((p) => {
      try {
        return p.produce(structure, context);
      } catch {
        // A misbehaving provider must never block payroll for everyone.
        return [];
      }
    });
  return [...structure.components, ...extra].filter((c) => c.enabled);
}

/* ------------------------------------------------------------------ */
/* Core computation                                                    */
/* ------------------------------------------------------------------ */

const toLine = (c: SalaryComponent, amount: number): PayslipLine => ({
  code: c.code,
  name: c.name,
  kind: c.kind,
  source: c.source,
  amount,
  taxable: c.kind === "earning" ? c.taxable : false,
  note: c.note,
});

const byOrder = (a: SalaryComponent, b: SalaryComponent) =>
  a.order - b.order || a.name.localeCompare(b.name);

/**
 * Compute a full payslip for one salary structure.
 *
 *   Net Salary = Basic Salary + Total Allowances − Total Deductions
 *
 * Allowances and deductions are whatever the components (own + provided)
 * resolve to, which is why new pay elements never require new arithmetic here.
 */
export function computePayslip(
  structure: SalaryStructure,
  context: PayrollContext
): PayslipComputation {
  const basicSalary = toAmount(structure.basicSalary);
  const currency = context.settings.currency;
  const all = collectComponents(structure, context).sort(byOrder);

  const earningDefs = all.filter((c) => c.kind === "earning");
  const deductionDefs = all.filter((c) => c.kind === "deduction");

  // ---- Pass 1: everything that doesn't depend on gross ----
  const firstPass: ComputeBase = { basicSalary, gross: 0, context };
  const resolved = new Map<string, number>();

  for (const c of earningDefs) {
    if (GROSS_DEPENDENT.has(c.mode)) continue;
    resolved.set(c.id, resolveAmount(c, firstPass));
  }

  // Gross of the independent lines - the base %-of-gross components apply to.
  const baseGross = round2(
    basicSalary +
      earningDefs.reduce((acc, c) => acc + (resolved.get(c.id) ?? 0), 0)
  );

  // ---- Pass 2: gross-dependent earnings ----
  const secondPass: ComputeBase = { basicSalary, gross: baseGross, context };
  for (const c of earningDefs) {
    if (!GROSS_DEPENDENT.has(c.mode)) continue;
    resolved.set(c.id, resolveAmount(c, secondPass));
  }

  const earnings = earningDefs.map((c) => toLine(c, resolved.get(c.id) ?? 0));
  const totalAllowances = sum(earnings);
  const grossEarnings = round2(basicSalary + totalAllowances);

  // ---- Deductions resolve against the final gross ----
  const deductionBase: ComputeBase = {
    basicSalary,
    gross: grossEarnings,
    context,
  };
  const deductions = deductionDefs.map((c) =>
    toLine(c, resolveAmount(c, deductionBase))
  );

  // ---- Tax ----
  // Basic is always taxable; components opt in via `taxable`.
  const taxableEarnings = round2(
    basicSalary +
      earnings.reduce((acc, l) => acc + (l.taxable ? l.amount : 0), 0)
  );
  const taxLine = resolveTax(taxableEarnings, context, deductions);
  if (taxLine) deductions.push(taxLine);

  const totalDeductions = sum(deductions);

  return {
    basicSalary,
    earnings,
    deductions,
    grossEarnings,
    totalAllowances,
    totalDeductions,
    taxableEarnings,
    netSalary: round2(grossEarnings - totalDeductions),
    currency,
  };
}

/* ------------------------------------------------------------------ */
/* Tax policy                                                          */
/* ------------------------------------------------------------------ */

export type TaxPolicy = (
  taxableEarnings: number,
  context: PayrollContext
) => number;

/**
 * V1 tax: a flat percentage from settings. Swapping in a slab-based statutory
 * engine later means calling {@link setTaxPolicy} - the payslip, the totals and
 * every table already understand a tax deduction line.
 */
let taxPolicy: TaxPolicy = (taxable, ctx) =>
  round2((taxable * Math.max(0, ctx.settings.defaultTaxPercent || 0)) / 100);

export function setTaxPolicy(policy: TaxPolicy): void {
  taxPolicy = policy;
}

function resolveTax(
  taxableEarnings: number,
  context: PayrollContext,
  deductions: PayslipLine[]
): PayslipLine | null {
  // An explicit tax component on the structure always wins over the default.
  if (deductions.some((d) => d.source === "tax")) return null;
  const amount = taxPolicy(taxableEarnings, context);
  if (amount <= 0) return null;
  return {
    code: "TAX",
    name: "Income Tax",
    kind: "deduction",
    source: "tax",
    amount,
    taxable: false,
    note: `${context.settings.defaultTaxPercent}% of taxable earnings`,
  };
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

export interface PayrollTotals {
  employeeCount: number;
  totalGross: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNet: number;
  averageNet: number;
}

/** Roll a set of computations into run/dashboard totals in a single pass. */
export function aggregate(computations: PayslipComputation[]): PayrollTotals {
  const totals = computations.reduce(
    (acc, c) => {
      acc.totalGross += c.grossEarnings;
      acc.totalAllowances += c.totalAllowances;
      acc.totalDeductions += c.totalDeductions;
      acc.totalNet += c.netSalary;
      return acc;
    },
    { totalGross: 0, totalAllowances: 0, totalDeductions: 0, totalNet: 0 }
  );
  const employeeCount = computations.length;
  return {
    employeeCount,
    totalGross: round2(totals.totalGross),
    totalAllowances: round2(totals.totalAllowances),
    totalDeductions: round2(totals.totalDeductions),
    totalNet: round2(totals.totalNet),
    averageNet: employeeCount ? round2(totals.totalNet / employeeCount) : 0,
  };
}

/** Empty totals - used by loading and empty states so the UI never branches. */
export const EMPTY_TOTALS: PayrollTotals = {
  employeeCount: 0,
  totalGross: 0,
  totalAllowances: 0,
  totalDeductions: 0,
  totalNet: 0,
  averageNet: 0,
};

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export interface ValidationIssue {
  field: string;
  message: string;
}

/**
 * Structural validation for the salary editor. Returns issues rather than
 * throwing, so the form can show all of them at once.
 */
export function validateStructure(
  basicSalary: number,
  components: SalaryComponent[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!(basicSalary > 0)) {
    issues.push({ field: "basicSalary", message: "Basic salary must be greater than zero." });
  }

  const seen = new Set<string>();
  for (const c of components) {
    const code = c.code.trim().toUpperCase();
    if (!c.name.trim()) {
      issues.push({ field: c.id, message: "Every component needs a name." });
    }
    if (!code) {
      issues.push({ field: c.id, message: `“${c.name}” needs a short code.` });
    } else if (seen.has(code)) {
      issues.push({ field: c.id, message: `Duplicate component code “${code}”.` });
    }
    seen.add(code);
    if (c.mode !== "fixed" && (c.value < 0 || c.value > 100)) {
      issues.push({
        field: c.id,
        message: `“${c.name}” percentage must be between 0 and 100.`,
      });
    }
    if (c.mode === "fixed" && c.value < 0) {
      issues.push({ field: c.id, message: `“${c.name}” cannot be negative.` });
    }
  }
  return issues;
}

/**
 * Guard against a structure whose deductions exceed its earnings. Not a hard
 * error (advances legitimately do this) but the UI warns before processing.
 */
export const isNegativeNet = (c: PayslipComputation) => c.netSalary < 0;

/** Human list of the compute modes currently registered. */
export const availableComputeModes = (): ComputeMode[] =>
  [...computeModes.keys()] as ComputeMode[];
