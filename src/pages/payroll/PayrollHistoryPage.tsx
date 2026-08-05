import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrashIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Select from "../../components/ui/Select";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { relativeTime } from "../../lib/surfaces";
import { showSuccessToast } from "../../utils/toastHelpers";
import { usePayroll } from "../../components/payroll/PayrollProvider";
import PayrollStatCards, {
  type StatTile,
} from "../../components/payroll/PayrollStatCards";
import {
  PayrollPageHeader,
  PayrollSection,
  PayrollSearch,
  PayrollEmptyState,
  StatusPill,
} from "../../components/payroll/PayrollUI";
import { RUN_STATUS } from "../../components/payroll/constants";
import { exportPayslipsCsv } from "../../components/payroll/exporters";
import {
  formatDate,
  formatMoney,
  formatMoneyCompact,
  formatPeriod,
  periodKey,
} from "../../components/payroll/formatters";
import type { PayrollRun } from "../../components/payroll/types";

/**
 * Payroll History — the permanent record.
 *
 * Every run ever generated, with its denormalised totals so the table renders
 * without touching a single payslip. Marking a run paid and exporting its
 * payslips both happen here, because this is where finance works.
 */
const PayrollHistoryPage: React.FC = () => {
  const { t } = useTranslation("payroll");
  const navigate = useNavigate();
  const { state, payslipsByRun, setRunStatus, deleteRun } = usePayroll();
  const { runs, settings } = state;

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<PayrollRun | null>(null);

  /* ---------------- filters ---------------- */

  const yearOptions = useMemo(() => {
    const years = [...new Set(runs.map((r) => r.period.year))].sort(
      (a, b) => b - a
    );
    return [
      { value: "all", label: "All years" },
      ...years.map((y) => ({ value: String(y), label: String(y) })),
    ];
  }, [runs, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => year === "all" || String(r.period.year) === year)
      .filter(
        (r) =>
          !q ||
          formatPeriod(r.period).toLowerCase().includes(q) ||
          r.generatedBy.toLowerCase().includes(q)
      )
      .sort((a, b) => periodKey(b.period).localeCompare(periodKey(a.period)));
  }, [runs, query, status, year, t]);

  /* ---------------- summary ---------------- */

  const summary = useMemo(() => {
    const paid = runs.filter((r) => r.status === "paid");
    const lifetime = runs.reduce((acc, r) => acc + r.totalNet, 0);
    const employees = runs.reduce((acc, r) => acc + r.employeeCount, 0);
    return {
      runs: runs.length,
      paid: paid.length,
      lifetime,
      employees,
      latest: runs[0] ?? null,
    };
  }, [runs]);

  const tiles: StatTile[] = useMemo(
    () => [
      {
        label: t("stats.payrollRuns"),
        value: summary.runs,
        caption: `${summary.paid} marked as paid`,
        icon: <CalendarDaysIcon className="h-6 w-6" />,
        gradient: "from-blue-500 to-indigo-600",
      },
      {
        label: t("stats.lifetimePayout"),
        value: formatMoneyCompact(summary.lifetime, settings.currency),
        caption: "Net across every recorded run",
        icon: <BanknotesIcon className="h-6 w-6" />,
        gradient: "from-emerald-500 to-teal-600",
      },
      {
        label: t("stats.payslipsIssued"),
        value: summary.employees,
        caption: "Cumulative employee payslips",
        icon: <UserGroupIcon className="h-6 w-6" />,
        gradient: "from-violet-500 to-purple-600",
      },
      {
        label: t("stats.lastRun"),
        value: summary.latest ? formatPeriod(summary.latest.period) : "—",
        caption: summary.latest
          ? `Generated ${relativeTime(summary.latest.generatedAt)}`
          : "No payroll processed yet",
        icon: <ClockIcon className="h-6 w-6" />,
        gradient: "from-amber-500 to-orange-600",
      },
    ],
    [summary, settings.currency, t]);

  /* ---------------- actions ---------------- */

  const handleExport = useCallback(
    (run: PayrollRun) => {
      const slips = payslipsByRun.get(run.id) ?? [];
      if (slips.length === 0) return;
      exportPayslipsCsv(slips, `payroll-${periodKey(run.period)}`);
      showSuccessToast(`${formatPeriod(run.period)} exported`);
    },
    [payslipsByRun]
  );

  const handleMarkPaid = useCallback(
    (run: PayrollRun) => {
      setRunStatus(run.id, "paid");
      showSuccessToast(`${formatPeriod(run.period)} marked as paid`);
    },
    [setRunStatus]
  );

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <PayrollPageHeader
          glyph="🗂️"
          title={t("history.title")}
          subtitle={t("history.subtitle")}
        />
      </motion.div>

      {runs.length > 0 && (
        <motion.div variants={staggerItem}>
          <PayrollStatCards tiles={tiles} columnsClassName="xl:grid-cols-4" />
        </motion.div>
      )}

      <motion.div variants={staggerItem}>
        <PayrollSection
          title="Run Records"
          description={
            runs.length
              ? `${filtered.length} of ${runs.length} runs`
              : "Nothing processed yet"
          }
          actions={
            runs.length > 0 && (
              <>
                <PayrollSearch
                  value={query}
                  onChange={setQuery}
                  placeholder="Search month or author"
                />
                <div className="w-40">
                  <Select
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: "all", label: "All statuses" },
                      ...(
                        Object.keys(RUN_STATUS) as (keyof typeof RUN_STATUS)[]
                      ).map((s) => ({
                        value: s,
                        label: t(`common:${RUN_STATUS[s].labelKey}`),
                        dotColor: RUN_STATUS[s].dot,
                      })),
                    ]}
                  />
                </div>
                <div className="w-32">
                  <Select value={year} onChange={setYear} options={yearOptions} />
                </div>
              </>
            )
          }
        >
          {runs.length === 0 ? (
            <PayrollEmptyState
              headline="No payroll history yet"
              sub="Every payroll you generate is recorded here — the month, who ran it, how many employees were paid and the total cost."
              ctaLabel="Run payroll"
              onAction={() => navigate("/payroll/run")}
            />
          ) : filtered.length === 0 ? (
            <PayrollEmptyState
              compact
              headline="No runs match your filters"
              sub="Try a different year or clear the search."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200/70 text-left dark:border-gray-700/50">
                    {[
                      "Payroll Month",
                      "Generated",
                      "Employees",
                      "Gross",
                      "Deductions",
                      "Total Net",
                      "Status",
                      "",
                    ].map((h, i) => (
                      <th
                        key={h || i}
                        className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 ${
                          ["Employees", "Gross", "Deductions", "Total Net"].includes(h)
                            ? "text-right"
                            : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((run) => (
                      <RunRow
                        key={run.id}
                        run={run}
                        payslipCount={payslipsByRun.get(run.id)?.length ?? 0}
                        onExport={handleExport}
                        onMarkPaid={handleMarkPaid}
                        onDelete={setConfirmDelete}
                        onOpenPayslips={() => navigate("/payroll/payslips")}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </PayrollSection>
      </motion.div>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteRun(confirmDelete.id);
            showSuccessToast("Payroll run deleted");
          }
          setConfirmDelete(null);
        }}
        variant="danger"
        title={`Delete the ${
          confirmDelete ? formatPeriod(confirmDelete.period) : ""
        } payroll run?`}
        description="The run and all payslips issued with it will be removed from history."
        consequences={[
          `${confirmDelete?.employeeCount ?? 0} payslips will be deleted.`,
          "This action cannot be undone.",
        ]}
        confirmLabel="Delete run"
      />
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

interface RowProps {
  run: PayrollRun;
  payslipCount: number;
  onExport: (run: PayrollRun) => void;
  onMarkPaid: (run: PayrollRun) => void;
  onDelete: (run: PayrollRun) => void;
  onOpenPayslips: () => void;
}

const RunRow: React.FC<RowProps> = React.memo(
  ({ run, payslipCount, onExport, onMarkPaid, onDelete, onOpenPayslips }) => (
    <motion.tr
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="group border-b border-gray-100 transition-colors hover:bg-black/[0.02] dark:border-gray-800 dark:hover:bg-white/[0.03]"
    >
      <td className="px-3 py-3">
        <p className="font-semibold text-gray-900 dark:text-white">
          {formatPeriod(run.period)}
        </p>
        <p className="text-xs text-gray-400">
          Pay date {formatDate(run.payDate)}
        </p>
      </td>
      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
        <span className="block">{formatDate(run.generatedAt)}</span>
        <span className="block text-xs text-gray-400">by {run.generatedBy}</span>
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
        {run.employeeCount}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
        {formatMoney(run.totalGross, run.currency)}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-rose-600 dark:text-rose-400">
        {run.totalDeductions > 0
          ? `−${formatMoney(run.totalDeductions, run.currency)}`
          : formatMoney(0, run.currency)}
      </td>
      <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
        {formatMoney(run.totalNet, run.currency)}
      </td>
      <td className="px-3 py-3">
        <StatusPill status={RUN_STATUS[run.status]} />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {run.status !== "paid" && (
            <button
              onClick={() => onMarkPaid(run)}
              title="Mark as paid"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10"
            >
              <CheckCircleIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onOpenPayslips}
            title={`View ${payslipCount} payslips`}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <DocumentTextIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onExport(run)}
            title="Export as CSV"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <TableCellsIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(run)}
            title="Delete run"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  )
);
RunRow.displayName = "RunRow";

export default PayrollHistoryPage;
