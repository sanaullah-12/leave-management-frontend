/**
 * Payroll - persistence & factory service.
 *
 * The only seam between the Payroll UI and where its data lives. Today every
 * function reads/writes `localStorage`; replacing the six I/O functions at the
 * bottom with `axios` calls moves the whole module server-side without a single
 * component changing, because nothing else imports storage directly.
 *
 * The factories above them are equally important: they are the one place a
 * record's shape is decided, so a new field gets a default in exactly one spot.
 */
import {
  COMPONENT_BLUEPRINTS,
  DEFAULT_COMPONENT_CODES,
  DEFAULT_SETTINGS,
} from "./constants";
import { payDateFor, periodKey } from "./formatters";
import { aggregate, computePayslip, type PayrollContext } from "./engine";
import type {
  ComponentBlueprint,
} from "./constants";
import type {
  EmployeeSnapshot,
  PayrollEmployee,
  PayrollPeriod,
  PayrollRun,
  PayrollSettings,
  PayrollState,
  Payslip,
  PayslipComputation,
  SalaryComponent,
  SalaryStructure,
} from "./types";

const STORAGE_KEY = "nexora.payroll.v1";
const SCHEMA_VERSION = 1;

/** Dependency-free id helper - matches the convention used by Document Studio. */
export const uid = (prefix = "id"): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;

const isoNow = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/* Factories                                                           */
/* ------------------------------------------------------------------ */

let componentOrder = 0;

/** Build a component from a blueprint (or from scratch via `overrides`). */
export function createComponent(
  blueprint: Partial<ComponentBlueprint> & { name: string; code: string },
  overrides: Partial<SalaryComponent> = {}
): SalaryComponent {
  return {
    id: uid("cmp"),
    code: blueprint.code.trim().toUpperCase(),
    name: blueprint.name,
    kind: blueprint.kind ?? "earning",
    mode: blueprint.mode ?? "fixed",
    value: blueprint.value ?? 0,
    taxable: blueprint.taxable ?? true,
    order: componentOrder++,
    enabled: true,
    source: "manual",
    ...overrides,
  };
}

const blueprintByCode = (code: string) =>
  COMPONENT_BLUEPRINTS.find((b) => b.code === code);

/** The components a brand-new structure starts with. */
export function defaultComponents(): SalaryComponent[] {
  return DEFAULT_COMPONENT_CODES.map((code) => {
    const bp = blueprintByCode(code);
    return bp
      ? createComponent(bp)
      : createComponent({ code, name: code, kind: "earning", mode: "fixed", value: 0 });
  });
}

export function createStructure(
  employeeId: string,
  partial: Partial<SalaryStructure> = {}
): SalaryStructure {
  const ts = isoNow();
  return {
    id: uid("sal"),
    employeeId,
    basicSalary: 0,
    components: defaultComponents(),
    effectiveFrom: ts,
    status: "draft",
    revision: 1,
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

/**
 * Produce the next revision of a structure. V1 replaces in place, but bumping
 * `revision` here means "Salary Revisions" later becomes a matter of *keeping*
 * the previous object instead of reworking the update path.
 */
export function reviseStructure(
  current: SalaryStructure,
  patch: Partial<SalaryStructure>
): SalaryStructure {
  return {
    ...current,
    ...patch,
    revision: current.revision + 1,
    updatedAt: isoNow(),
  };
}

/** Freeze the employee as they are right now, for an immutable payslip. */
export const snapshotEmployee = (e: PayrollEmployee): EmployeeSnapshot => ({
  id: e.id,
  employeeCode: e.employeeCode,
  name: e.name,
  department: e.department,
  designation: e.designation,
  email: e.email,
});

export function createPayslip(
  runId: string,
  period: PayrollPeriod,
  employee: PayrollEmployee,
  computation: PayslipComputation
): Payslip {
  return {
    id: uid("slip"),
    runId,
    period,
    employee: snapshotEmployee(employee),
    computation,
    status: "generated",
    generatedAt: isoNow(),
  };
}

/* ------------------------------------------------------------------ */
/* Payroll run assembly                                                */
/* ------------------------------------------------------------------ */

export interface RunCandidate {
  employee: PayrollEmployee;
  structure: SalaryStructure;
}

export interface GeneratedRun {
  run: PayrollRun;
  payslips: Payslip[];
}

/**
 * Turn a set of (employee, structure) pairs into a run plus its payslips.
 *
 * Pure and side-effect free - the store decides whether to persist the result.
 * That separation is what will let a future approval workflow preview a run,
 * route it for sign-off, and only then commit it.
 */
export function generateRun(
  period: PayrollPeriod,
  candidates: RunCandidate[],
  context: PayrollContext,
  generatedBy: string
): GeneratedRun {
  const runId = uid("run");
  const computations: PayslipComputation[] = [];
  const payslips: Payslip[] = [];

  for (const { employee, structure } of candidates) {
    const computation = computePayslip(structure, {
      ...context,
      employeeId: employee.id,
    });
    computations.push(computation);
    payslips.push(createPayslip(runId, period, employee, computation));
  }

  const totals = aggregate(computations);
  const run: PayrollRun = {
    id: runId,
    period,
    status: "processed",
    generatedAt: isoNow(),
    generatedBy,
    employeeCount: totals.employeeCount,
    totalGross: totals.totalGross,
    totalDeductions: totals.totalDeductions,
    totalNet: totals.totalNet,
    currency: context.settings.currency,
    payDate: payDateFor(period, context.settings.salaryDate),
  };

  return { run, payslips };
}

/** Has payroll already been generated for this period? */
export const findRunForPeriod = (
  runs: PayrollRun[],
  period: PayrollPeriod
): PayrollRun | undefined =>
  runs.find((r) => periodKey(r.period) === periodKey(period));

/* ------------------------------------------------------------------ */
/* Employee projection                                                 */
/* ------------------------------------------------------------------ */

/**
 * Project a raw users-API record onto the narrow shape payroll needs. Isolating
 * this means an upstream field rename touches one function, not ten components.
 */
export function toPayrollEmployee(raw: any): PayrollEmployee {
  const department =
    typeof raw?.department === "object" && raw?.department
      ? raw.department.name ?? "-"
      : raw?.department ?? "-";
  return {
    id: String(raw?._id ?? raw?.id ?? ""),
    employeeCode: raw?.employeeId ?? "-",
    name: raw?.name ?? "Unknown",
    department: department || "-",
    designation: raw?.position ?? "-",
    email: raw?.email,
    profilePicture: raw?.profilePicture,
  };
}

/* ------------------------------------------------------------------ */
/* Persistence (the swappable seam)                                    */
/* ------------------------------------------------------------------ */

function seed(): PayrollState {
  return {
    structures: {},
    runs: [],
    payslips: [],
    settings: { ...DEFAULT_SETTINGS },
    version: SCHEMA_VERSION,
  };
}

/**
 * Bring a persisted blob up to the current schema. Runs on every load, so a
 * user who hasn't opened Payroll since an older release never sees a crash -
 * they see defaults for anything new.
 */
function migrate(parsed: Partial<PayrollState>): PayrollState {
  const base = seed();
  return {
    structures: parsed.structures ?? base.structures,
    runs: parsed.runs ?? base.runs,
    payslips: parsed.payslips ?? base.payslips,
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    version: SCHEMA_VERSION,
  };
}

export function loadState(): PayrollState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    return migrate(JSON.parse(raw) as Partial<PayrollState>);
  } catch {
    return seed();
  }
}

export function saveState(state: PayrollState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode - payroll still works for the session in memory */
  }
}

export function resetState(): PayrollState {
  const fresh = seed();
  saveState(fresh);
  return fresh;
}

export function updateSettings(
  current: PayrollSettings,
  patch: Partial<PayrollSettings>
): PayrollSettings {
  return { ...current, ...patch };
}
