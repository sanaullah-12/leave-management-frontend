import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  EyeIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import Avatar from "../../components/Avatar";
import Select from "../../components/ui/Select";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { showSuccessToast, showErrorToast } from "../../utils/toastHelpers";
import { usePayroll } from "../../components/payroll/PayrollProvider";
import PayslipPreviewModal from "../../components/payroll/PayslipPreviewModal";
import {
  PayrollPageHeader,
  PayrollSection,
  PayrollSearch,
  PayrollEmptyState,
  StatusPill,
} from "../../components/payroll/PayrollUI";
import { PAYSLIP_STATUS } from "../../components/payroll/constants";
import {
  exportPayslipPdf,
  exportPayslipsCsv,
  printPayslip,
} from "../../components/payroll/exporters";
import {
  formatDate,
  formatMoney,
  formatPeriod,
  payDateFor,
  periodKey,
} from "../../components/payroll/formatters";
import type { Payslip } from "../../components/payroll/types";

/**
 * Payslips — every issued payslip, viewable, printable and downloadable.
 *
 * Rows render from the frozen computation stored on each payslip, never from
 * the employee's *current* structure: a payslip must show what was actually
 * paid, even after a raise.
 */
const PayslipsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, setPayslipStatus } = usePayroll();
  const { settings, payslips } = state;

  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");
  const [preview, setPreview] = useState<Payslip | null>(null);

  /* ---------------- filters ---------------- */

  const periodOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of payslips) {
      seen.set(periodKey(p.period), formatPeriod(p.period));
    }
    return [
      { value: "all", label: "All periods" },
      ...[...seen.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [payslips]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payslips
      .filter((p) => period === "all" || periodKey(p.period) === period)
      .filter((p) => status === "all" || p.status === status)
      .filter(
        (p) =>
          !q ||
          p.employee.name.toLowerCase().includes(q) ||
          p.employee.employeeCode.toLowerCase().includes(q) ||
          p.employee.department.toLowerCase().includes(q)
      )
      .sort(
        (a, b) =>
          periodKey(b.period).localeCompare(periodKey(a.period)) ||
          a.employee.name.localeCompare(b.employee.name)
      );
  }, [payslips, query, period, status]);

  const totalNet = useMemo(
    () => filtered.reduce((acc, p) => acc + p.computation.netSalary, 0),
    [filtered]
  );

  /* ---------------- actions ---------------- */

  const payDateOf = useCallback(
    (p: Payslip) => payDateFor(p.period, settings.salaryDate),
    [settings.salaryDate]
  );

  const handleDownload = useCallback(
    async (p: Payslip) => {
      try {
        await exportPayslipPdf(p, { settings, payDate: payDateOf(p) });
        setPayslipStatus(p.id, "downloaded");
        showSuccessToast("Payslip downloaded");
      } catch {
        showErrorToast("Could not generate the PDF");
      }
    },
    [settings, payDateOf, setPayslipStatus]
  );

  const handlePrint = useCallback(
    async (p: Payslip) => {
      try {
        await printPayslip(p, { settings, payDate: payDateOf(p) });
        setPayslipStatus(p.id, "printed");
      } catch {
        showErrorToast("Could not open the print dialog");
      }
    },
    [settings, payDateOf, setPayslipStatus]
  );

  const handleCsv = useCallback(() => {
    if (filtered.length === 0) return;
    const label = period === "all" ? "all-periods" : period;
    exportPayslipsCsv(filtered, `payroll-${label}`);
    showSuccessToast("CSV exported");
  }, [filtered, period]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <PayrollPageHeader
          glyph="📄"
          title="Payslips"
          subtitle="View, print or download an employee's payslip for any processed month."
          actions={
            payslips.length > 0 && (
              <button
                onClick={handleCsv}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <TableCellsIcon className="h-5 w-5" />
                Export CSV
              </button>
            )
          }
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <PayrollSection
          title="Issued Payslips"
          description={
            filtered.length
              ? `${filtered.length} payslips • ${formatMoney(
                  totalNet,
                  settings.currency
                )} total net`
              : "Nothing issued for this filter"
          }
          actions={
            payslips.length > 0 && (
              <>
                <PayrollSearch
                  value={query}
                  onChange={setQuery}
                  placeholder="Search employees"
                />
                <div className="w-40">
                  <Select
                    value={period}
                    onChange={setPeriod}
                    options={periodOptions}
                  />
                </div>
                <div className="w-40">
                  <Select
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: "all", label: "All statuses" },
                      ...(
                        Object.keys(PAYSLIP_STATUS) as (keyof typeof PAYSLIP_STATUS)[]
                      ).map((s) => ({
                        value: s,
                        label: PAYSLIP_STATUS[s].label,
                        dotColor: PAYSLIP_STATUS[s].dot,
                      })),
                    ]}
                  />
                </div>
              </>
            )
          }
        >
          {payslips.length === 0 ? (
            <PayrollEmptyState
              headline="No payslips yet"
              sub="Once you process a payroll month, every employee's payslip appears here — ready to view, print or download as a PDF."
              ctaLabel="Run payroll"
              onAction={() => navigate("/payroll/run")}
            />
          ) : filtered.length === 0 ? (
            <PayrollEmptyState
              compact
              headline="No payslips match your filters"
              sub="Try a different month or clear the search."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200/70 text-left dark:border-gray-700/50">
                    {[
                      "Employee",
                      "Department",
                      "Period",
                      "Gross",
                      "Deductions",
                      "Net Salary",
                      "Status",
                      "",
                    ].map((h, i) => (
                      <th
                        key={h || i}
                        className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 ${
                          ["Gross", "Deductions", "Net Salary"].includes(h)
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
                    {filtered.map((p) => (
                      <PayslipRow
                        key={p.id}
                        payslip={p}
                        onView={setPreview}
                        onPrint={handlePrint}
                        onDownload={handleDownload}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </PayrollSection>
      </motion.div>

      <PayslipPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        payslip={preview}
        settings={settings}
        payDate={preview ? payDateOf(preview) : undefined}
        onDownload={handleDownload}
        onPrint={handlePrint}
      />
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

interface RowProps {
  payslip: Payslip;
  onView: (p: Payslip) => void;
  onPrint: (p: Payslip) => void;
  onDownload: (p: Payslip) => void;
}

/** Memoised so downloading one payslip doesn't re-render the whole list. */
const PayslipRow: React.FC<RowProps> = React.memo(
  ({ payslip: p, onView, onPrint, onDownload }) => {
    const c = p.computation;
    return (
      <motion.tr
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onView(p)}
        className="group cursor-pointer border-b border-gray-100 transition-colors hover:bg-black/[0.02] dark:border-gray-800 dark:hover:bg-white/[0.03]"
      >
        <td className="px-3 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={p.employee.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900 dark:text-white">
                {p.employee.name}
              </p>
              <p className="truncate text-xs text-gray-400">
                {p.employee.employeeCode} • {p.employee.designation}
              </p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
          {p.employee.department}
        </td>
        <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
          <span className="block">{formatPeriod(p.period)}</span>
          <span className="block text-xs text-gray-400">
            issued {formatDate(p.generatedAt)}
          </span>
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
          {formatMoney(c.grossEarnings, c.currency)}
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-rose-600 dark:text-rose-400">
          {c.totalDeductions > 0
            ? `−${formatMoney(c.totalDeductions, c.currency)}`
            : formatMoney(0, c.currency)}
        </td>
        <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
          {formatMoney(c.netSalary, c.currency)}
        </td>
        <td className="px-3 py-3">
          <StatusPill status={PAYSLIP_STATUS[p.status]} />
        </td>
        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={() => onView(p)}
              title="View payslip"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPrint(p)}
              title="Print"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <PrinterIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDownload(p)}
              title="Download PDF"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
          </div>
        </td>
      </motion.tr>
    );
  }
);
PayslipRow.displayName = "PayslipRow";

export default PayslipsPage;
