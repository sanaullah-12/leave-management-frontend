/**
 * Payroll - module context.
 *
 * Wraps every `/payroll/*` route so the six screens share one store instance,
 * one employee fetch and one set of derived figures. Without this each page
 * would hold a divergent copy of payroll state and re-run the engine on its
 * own; with it, the expensive joins happen once and every screen reads the same
 * memoised result.
 *
 * The context deliberately exposes *derived* data (rows, totals) rather than
 * raw state plus helpers, so no screen can accidentally compute money its own
 * way.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { usePayrollStore, type PayrollStore } from "./usePayrollStore";
import { computePayslip, aggregate, type PayrollContext, type PayrollTotals } from "./engine";
import { toPayrollEmployee } from "./payrollService";
import { currentPeriod } from "./formatters";
import type {
  PayrollEmployee,
  PayrollPeriod,
  PayslipComputation,
  SalaryRow,
} from "./types";

/** How many employees to pull for payroll. Payroll needs the whole roster. */
const EMPLOYEE_PAGE_SIZE = 500;

interface PayrollContextValue extends PayrollStore {
  /** The company roster, projected onto payroll's shape. */
  employees: PayrollEmployee[];
  employeesLoading: boolean;
  employeesError: boolean;
  /** Every employee joined with their structure and computed totals. */
  rows: SalaryRow[];
  /** Rows that are ready to be paid (active structure, positive basic). */
  payableRows: SalaryRow[];
  /** Totals across `payableRows` - the "current payroll cost" figure. */
  totals: PayrollTotals;
  /** The period payroll is currently working on. */
  period: PayrollPeriod;
  /** Build an engine context for an arbitrary period. */
  contextFor: (period: PayrollPeriod) => PayrollContext;
  /** Recompute one row against a specific period (used by the run preview). */
  computeFor: (row: SalaryRow, period: PayrollPeriod) => PayslipComputation | null;
  /** Display name of the signed-in admin - stamped onto runs. */
  actorName: string;
}

const Ctx = createContext<PayrollContextValue | null>(null);

export const PayrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const store = usePayrollStore();
  const { settings } = store.state;

  // Shared across all payroll screens thanks to the common query key.
  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
  } = useQuery({
    queryKey: ["payroll-employees"],
    queryFn: async () => {
      const res = await usersAPI.getEmployees(1, EMPLOYEE_PAGE_SIZE);
      const raw =
        (res.data as any)?.employees ??
        (res.data as any)?.data?.employees ??
        [];
      return (raw as any[]).map(toPayrollEmployee).filter((e) => e.id);
    },
    staleTime: 5 * 60 * 1000,
  });

  // The live period is "now"; history screens pass their own explicitly.
  const period = useMemo(currentPeriod, []);

  const contextFor = useCallback(
    (p: PayrollPeriod): PayrollContext => ({ settings, period: p }),
    [settings]
  );

  /**
   * The join every screen renders from. Recomputed only when the roster,
   * structures or settings change - not when a filter or sort changes, which
   * is what keeps large rosters responsive.
   */
  const rows: SalaryRow[] = useMemo(() => {
    const ctx: PayrollContext = { settings, period };
    return employees.map((employee) => {
      const structure = store.state.structures[employee.id] ?? null;
      return {
        employee,
        structure,
        computation: structure
          ? computePayslip(structure, { ...ctx, employeeId: employee.id })
          : null,
        status: structure ? structure.status : "unconfigured",
      };
    });
  }, [employees, store.state.structures, settings, period]);

  const payableRows = useMemo(
    () =>
      rows.filter(
        (r) => r.status === "active" && (r.structure?.basicSalary ?? 0) > 0
      ),
    [rows]
  );

  const totals = useMemo(
    () => aggregate(payableRows.map((r) => r.computation!).filter(Boolean)),
    [payableRows]
  );

  const computeFor = useCallback(
    (row: SalaryRow, p: PayrollPeriod) =>
      row.structure
        ? computePayslip(row.structure, {
            settings,
            period: p,
            employeeId: row.employee.id,
          })
        : null,
    [settings]
  );

  const value = useMemo<PayrollContextValue>(
    () => ({
      ...store,
      employees,
      employeesLoading,
      employeesError,
      rows,
      payableRows,
      totals,
      period,
      contextFor,
      computeFor,
      actorName: user?.name ?? "Administrator",
    }),
    [
      store,
      employees,
      employeesLoading,
      employeesError,
      rows,
      payableRows,
      totals,
      period,
      contextFor,
      computeFor,
      user?.name,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

/** Access the payroll module context. Throws outside `<PayrollProvider>`. */
export function usePayroll(): PayrollContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePayroll must be used within a PayrollProvider");
  return ctx;
}
