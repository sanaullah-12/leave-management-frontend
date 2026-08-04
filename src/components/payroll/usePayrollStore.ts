/**
 * Payroll — durable state hook.
 *
 * A thin, self-persisting wrapper around {@link payrollService}. It owns the
 * data (structures / runs / payslips / settings) and exposes stable mutators;
 * it deliberately owns *no* derived money figures — those come from the engine
 * via `PayrollProvider`, so there is exactly one source of arithmetic truth.
 *
 * Every mutator is `useCallback`-stable and updates via the functional form of
 * `setState`, so consumers never re-render because a handler identity changed.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createStructure,
  loadState,
  reviseStructure,
  saveState,
} from "./payrollService";
import type {
  PayrollRun,
  PayrollRunStatus,
  PayrollSettings,
  PayrollState,
  Payslip,
  PayslipStatus,
  SalaryStructure,
} from "./types";

export function usePayrollStore() {
  const [state, setState] = useState<PayrollState>(() => loadState());
  const hydrated = useRef(false);

  // Persist after every change (skipping the initial hydrate).
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    saveState(state);
  }, [state]);

  /* ---------------- salary structures ---------------- */

  /** Insert or replace a structure, bumping its revision when it already exists. */
  const upsertStructure = useCallback(
    (employeeId: string, patch: Partial<SalaryStructure>) => {
      setState((s) => {
        const existing = s.structures[employeeId];
        const next = existing
          ? reviseStructure(existing, patch)
          : createStructure(employeeId, patch);
        return { ...s, structures: { ...s.structures, [employeeId]: next } };
      });
    },
    []
  );

  const setStructureStatus = useCallback(
    (employeeId: string, status: SalaryStructure["status"]) => {
      upsertStructure(employeeId, { status });
    },
    [upsertStructure]
  );

  const removeStructure = useCallback((employeeId: string) => {
    setState((s) => {
      if (!s.structures[employeeId]) return s;
      const next = { ...s.structures };
      delete next[employeeId];
      return { ...s, structures: next };
    });
  }, []);

  /* ---------------- runs & payslips ---------------- */

  /**
   * Commit a generated run. Any previous run for the same period — and its
   * payslips — is replaced, so re-processing a month can never double-count.
   */
  const commitRun = useCallback((run: PayrollRun, payslips: Payslip[]) => {
    setState((s) => {
      const supersededIds = new Set(
        s.runs
          .filter(
            (r) =>
              r.period.year === run.period.year &&
              r.period.month === run.period.month
          )
          .map((r) => r.id)
      );
      return {
        ...s,
        runs: [run, ...s.runs.filter((r) => !supersededIds.has(r.id))],
        payslips: [
          ...payslips,
          ...s.payslips.filter((p) => !supersededIds.has(p.runId)),
        ],
      };
    });
  }, []);

  const setRunStatus = useCallback((runId: string, status: PayrollRunStatus) => {
    setState((s) => ({
      ...s,
      runs: s.runs.map((r) => (r.id === runId ? { ...r, status } : r)),
    }));
  }, []);

  const deleteRun = useCallback((runId: string) => {
    setState((s) => ({
      ...s,
      runs: s.runs.filter((r) => r.id !== runId),
      payslips: s.payslips.filter((p) => p.runId !== runId),
    }));
  }, []);

  const setPayslipStatus = useCallback(
    (payslipId: string, status: PayslipStatus) => {
      setState((s) => ({
        ...s,
        payslips: s.payslips.map((p) =>
          p.id === payslipId ? { ...p, status } : p
        ),
      }));
    },
    []
  );

  /* ---------------- settings ---------------- */

  const updateSettings = useCallback((patch: Partial<PayrollSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  /* ---------------- indexes ---------------- */

  /** Payslips grouped by run — built once per change instead of per render. */
  const payslipsByRun = useMemo(() => {
    const map = new Map<string, Payslip[]>();
    for (const p of state.payslips) {
      const bucket = map.get(p.runId);
      if (bucket) bucket.push(p);
      else map.set(p.runId, [p]);
    }
    return map;
  }, [state.payslips]);

  return {
    state,
    payslipsByRun,
    // structures
    upsertStructure,
    setStructureStatus,
    removeStructure,
    // runs
    commitRun,
    setRunStatus,
    deleteRun,
    setPayslipStatus,
    // settings
    updateSettings,
  };
}

export type PayrollStore = ReturnType<typeof usePayrollStore>;
