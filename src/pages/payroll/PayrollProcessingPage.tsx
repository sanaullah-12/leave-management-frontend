import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircleIcon,
  UserGroupIcon,
  BanknotesIcon,
  ArrowTrendingDownIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Select from "../../components/ui/Select";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { showSuccessToast, showErrorToast } from "../../utils/toastHelpers";
import { usePayroll } from "../../components/payroll/PayrollProvider";
import SalaryLedgerTable from "../../components/payroll/SalaryLedgerTable";
import PayrollStatCards, {
  type StatTile,
} from "../../components/payroll/PayrollStatCards";
import {
  PayrollPageHeader,
  PayrollSection,
  PayrollSearch,
  PayrollTableSkeleton,
  PeriodPicker,
  StatusPill,
} from "../../components/payroll/PayrollUI";
import { RUN_STATUS } from "../../components/payroll/constants";
import { aggregate } from "../../components/payroll/engine";
import {
  findRunForPeriod,
  generateRun,
} from "../../components/payroll/payrollService";
import {
  formatDate,
  formatMoney,
  formatMoneyCompact,
  formatPeriod,
  currentPeriod,
  payDateFor,
} from "../../components/payroll/formatters";
import type { PayrollPeriod, SalaryRow } from "../../components/payroll/types";

/**
 * Payroll Processing — select a month, review, generate.
 *
 * The review table is computed for the *selected* period rather than the live
 * one, so the numbers an admin approves are the numbers that get frozen onto
 * the payslips. Generation itself is delegated to `generateRun`, a pure
 * function, which is what will let a future approval workflow preview a run
 * before committing it.
 */
const PayrollProcessingPage: React.FC = () => {
  const { t } = useTranslation("payroll");
  const navigate = useNavigate();
  const {
    state,
    rows,
    payableRows,
    employeesLoading,
    computeFor,
    contextFor,
    commitRun,
    actorName,
  } = usePayroll();
  const { settings, runs } = state;

  const [period, setPeriod] = useState<PayrollPeriod>(currentPeriod);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const existingRun = useMemo(
    () => findRunForPeriod(runs, period),
    [runs, period]
  );

  /* ---------------- candidates for this period ---------------- */

  // Recompute every payable employee against the selected period. Memoised on
  // the period so changing a filter costs nothing.
  const candidates: SalaryRow[] = useMemo(
    () =>
      payableRows.map((row) => ({
        ...row,
        computation: computeFor(row, period),
      })),
    [payableRows, computeFor, period]
  );

  const included = useMemo(
    () => candidates.filter((r) => !excluded.has(r.employee.id)),
    [candidates, excluded]
  );

  const totals = useMemo(
    () => aggregate(included.map((r) => r.computation!).filter(Boolean)),
    [included]
  );

  /** Structures whose deductions exceed their earnings — worth a warning. */
  const negativeRows = useMemo(
    () => included.filter((r) => (r.computation?.netSalary ?? 0) < 0),
    [included]
  );

  const notReadyCount = rows.length - payableRows.length;

  /* ---------------- filtering ---------------- */

  const departmentOptions = useMemo(() => {
    const set = new Set(candidates.map((r) => r.employee.department));
    return [
      { value: "all", label: "All departments" },
      ...[...set].sort().map((d) => ({ value: d, label: d })),
    ];
  }, [candidates, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((r) => {
      if (department !== "all" && r.employee.department !== department)
        return false;
      if (!q) return true;
      const e = r.employee;
      return (
        e.name.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
      );
    });
  }, [candidates, query, department]);

  /* ---------------- selection ---------------- */

  // Selection is stored as *exclusions* so newly-added employees are included
  // by default — the safe direction for payroll.
  const selectedIds = useMemo(
    () =>
      new Set(
        candidates.filter((r) => !excluded.has(r.employee.id)).map((r) => r.employee.id)
      ),
    [candidates, excluded]
  );

  const toggleOne = useCallback((employeeId: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (selectAll: boolean) => {
      setExcluded(
        selectAll ? new Set() : new Set(filtered.map((r) => r.employee.id))
      );
    },
    [filtered]
  );

  /* ---------------- generation ---------------- */

  const handleGenerate = useCallback(() => {
    if (included.length === 0) {
      showErrorToast("Select at least one employee to process.");
      return;
    }
    setProcessing(true);
    try {
      const { run, payslips } = generateRun(
        period,
        included.map((r) => ({ employee: r.employee, structure: r.structure! })),
        contextFor(period),
        actorName
      );
      commitRun(run, payslips);
      showSuccessToast(
        `${formatPeriod(period)} payroll generated for ${run.employeeCount} employees`
      );
      navigate("/payroll/payslips");
    } catch {
      showErrorToast("Payroll could not be generated. Please try again.");
    } finally {
      setProcessing(false);
      setConfirmOpen(false);
    }
  }, [included, period, contextFor, actorName, commitRun, navigate]);

  /* ---------------- tiles ---------------- */

  const tiles: StatTile[] = useMemo(
    () => [
      {
        label: "Employees Selected",
        value: included.length,
        caption: `${candidates.length} eligible${
          notReadyCount ? ` • ${notReadyCount} not set up` : ""
        }`,
        icon: <UserGroupIcon className="h-6 w-6" />,
        gradient: "from-blue-500 to-indigo-600",
      },
      {
        label: t("fields.grossEarnings"),
        value: formatMoneyCompact(totals.totalGross, settings.currency),
        caption: "Basic plus all allowances",
        icon: <BanknotesIcon className="h-6 w-6" />,
        gradient: "from-cyan-500 to-blue-600",
      },
      {
        label: t("fields.totalDeductions"),
        value: formatMoneyCompact(totals.totalDeductions, settings.currency),
        caption: settings.defaultTaxPercent
          ? `Includes ${settings.defaultTaxPercent}% income tax`
          : "No default tax configured",
        icon: <ArrowTrendingDownIcon className="h-6 w-6" />,
        gradient: "from-rose-500 to-red-600",
      },
      {
        label: t("stats.netPayout"),
        value: formatMoneyCompact(totals.totalNet, settings.currency),
        caption: `Payable on ${formatDate(
          payDateFor(period, settings.salaryDate)
        )}`,
        icon: <CheckBadgeIcon className="h-6 w-6" />,
        gradient: "from-emerald-500 to-teal-600",
      },
    ],
    [included.length,
      candidates.length,
      notReadyCount,
      totals,
      settings,
      period, t]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <PayrollPageHeader
          glyph="⚙️"
          title={t("run.title")}
          subtitle={t("run.subtitle")}
          actions={
            <>
              <PeriodPicker value={period} onChange={setPeriod} />
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={included.length === 0 || processing}
                className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {existingRun ? (
                  <ArrowPathIcon className="h-5 w-5" />
                ) : (
                  <PlayCircleIcon className="h-5 w-5" />
                )}
                {existingRun ? t("run.reprocess") : t("run.generate")}
              </button>
            </>
          }
        />
      </motion.div>

      {/* ---- Period notices ---- */}
      <AnimatePresence>
        {existingRun && (
          <motion.div
            key="existing"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm dark:bg-amber-500/10"
          >
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <p className="flex-1 text-amber-800 dark:text-amber-200">
              {formatPeriod(period)} was already processed on{" "}
              {formatDate(existingRun.generatedAt)} for{" "}
              {existingRun.employeeCount} employees. Generating again replaces
              that run and its payslips.
            </p>
            <StatusPill status={RUN_STATUS[existingRun.status]} />
          </motion.div>
        )}

        {negativeRows.length > 0 && (
          <motion.div
            key="negative"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm dark:bg-rose-500/10"
          >
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-rose-500" />
            <p className="flex-1 text-rose-800 dark:text-rose-200">
              {negativeRows.length} employee
              {negativeRows.length === 1 ? " has" : "s have"} deductions greater
              than earnings, producing a negative net salary. Review their
              structures before processing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={staggerItem}>
        <PayrollStatCards tiles={tiles} columnsClassName="xl:grid-cols-4" />
      </motion.div>

      <motion.div variants={staggerItem}>
        <PayrollSection
          title={`Review — ${formatPeriod(period)}`}
          description={`${included.length} of ${candidates.length} employees will be processed`}
          actions={
            <>
              <PayrollSearch
                value={query}
                onChange={setQuery}
                placeholder="Search employees"
              />
              <div className="w-44">
                <Select
                  value={department}
                  onChange={setDepartment}
                  options={departmentOptions}
                />
              </div>
            </>
          }
        >
          {employeesLoading ? (
            <PayrollTableSkeleton rows={8} cols={9} />
          ) : (
            <>
              <SalaryLedgerTable
                rows={filtered}
                currency={settings.currency}
                selectable
                selectedIds={selectedIds}
                onToggle={toggleOne}
                onToggleAll={toggleAll}
                emptyHeadline={
                  candidates.length === 0
                    ? "No employees are ready for payroll"
                    : "No employees match your filters"
                }
                emptySub={
                  candidates.length === 0
                    ? "Set up an active salary structure with a basic salary first."
                    : "Try clearing the search or department filter."
                }
                emptyCta={
                  candidates.length === 0 ? "Set up salaries" : undefined
                }
                onEmptyAction={
                  candidates.length === 0
                    ? () => navigate("/payroll/salaries")
                    : undefined
                }
              />

              {included.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {included.length} employee
                    {included.length === 1 ? "" : "s"} • average net{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {formatMoney(totals.averageNet, settings.currency)}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Total net payout
                    </span>
                    <span className="ml-2 text-base font-bold tabular-nums text-gray-900 dark:text-white">
                      {formatMoney(totals.totalNet, settings.currency)}
                    </span>
                  </p>
                </div>
              )}
            </>
          )}
        </PayrollSection>
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleGenerate}
        loading={processing}
        variant={existingRun ? "warning" : "info"}
        title={`Generate ${formatPeriod(period)} payroll?`}
        description={`${included.length} employees • ${formatMoney(
          totals.totalNet,
          settings.currency
        )} net payout, payable on ${formatDate(
          payDateFor(period, settings.salaryDate)
        )}.`}
        consequences={
          existingRun
            ? [
                `The existing ${formatPeriod(period)} run and its ${
                  existingRun.employeeCount
                } payslips will be replaced.`,
                "Payslips are frozen at the figures shown above.",
              ]
            : [
                "Payslips are frozen at the figures shown above.",
                "The run is recorded in payroll history.",
              ]
        }
        confirmLabel={existingRun ? "Replace run" : "Generate payroll"}
      />
    </motion.div>
  );
};

export default PayrollProcessingPage;
