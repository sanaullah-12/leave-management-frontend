import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import Select from "../../components/ui/Select";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { showSuccessToast } from "../../utils/toastHelpers";
import { usePayroll } from "../../components/payroll/PayrollProvider";
import SalaryLedgerTable from "../../components/payroll/SalaryLedgerTable";
import SalaryStructureModal from "../../components/payroll/SalaryStructureModal";
import PayrollStatCards, {
  type StatTile,
} from "../../components/payroll/PayrollStatCards";
import {
  PayrollPageHeader,
  PayrollSection,
  PayrollSearch,
  PayrollStatsSkeleton,
  PayrollTableSkeleton,
} from "../../components/payroll/PayrollUI";
import { SALARY_STATUS } from "../../components/payroll/constants";
import { formatMoneyCompact } from "../../components/payroll/formatters";
import type {
  SalaryComponent,
  SalaryRow,
  SalaryStatus,
} from "../../components/payroll/types";

type StatusFilter = SalaryStatus | "unconfigured" | "all";

/**
 * Employee Salary Management — the heart of the payroll module.
 *
 * Every employee gets a salary profile whose net pay is derived, never typed.
 * Filtering and sorting operate on the memoised rows from the provider, so
 * neither action recomputes a single salary.
 */
const SalaryManagementPage: React.FC = () => {
  const { t } = useTranslation("payroll");
  const {
    rows,
    state,
    employeesLoading,
    employeesError,
    upsertStructure,
    removeStructure,
    period,
  } = usePayroll();
  const { settings } = state;

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [department, setDepartment] = useState("all");
  const [editing, setEditing] = useState<SalaryRow | null>(null);
  const [confirmClear, setConfirmClear] = useState<SalaryRow | null>(null);

  /* ---------------- filter options ---------------- */

  const departmentOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.employee.department).filter(Boolean));
    return [
      { value: "all", label: "All departments" },
      ...[...set].sort().map((d) => ({ value: d, label: d })),
    ];
  }, [rows, t]);

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      ...(
        ["active", "draft", "inactive", "unconfigured"] as StatusFilter[]
      ).map((s) => ({
        value: s,
        label: t(`common:${SALARY_STATUS[s as keyof typeof SALARY_STATUS].labelKey}`),
        dotColor: SALARY_STATUS[s as keyof typeof SALARY_STATUS].dot,
      })),
    ],
    [t]
  );

  /* ---------------- filtering ---------------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (department !== "all" && r.employee.department !== department)
        return false;
      if (!q) return true;
      const e = r.employee;
      return (
        e.name.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status, department]);

  /* ---------------- summary ---------------- */

  const summary = useMemo(() => {
    const configured = rows.filter((r) => r.structure);
    const nets = configured.map((r) => r.computation?.netSalary ?? 0);
    const total = nets.reduce((a, b) => a + b, 0);
    return {
      configured: configured.length,
      pending: rows.length - configured.length,
      total,
      average: nets.length ? total / nets.length : 0,
      highest: nets.length ? Math.max(...nets) : 0,
    };
  }, [rows]);

  const tiles: StatTile[] = useMemo(
    () => [
      {
        label: "Employees",
        value: rows.length,
        caption: `${summary.configured} with a salary profile`,
        icon: <UserGroupIcon className="h-6 w-6" />,
        gradient: "from-blue-500 to-indigo-600",
      },
      {
        label: t("stats.monthlyNet"),
        value: formatMoneyCompact(summary.total, settings.currency),
        caption: "Across all configured employees",
        icon: <BanknotesIcon className="h-6 w-6" />,
        gradient: "from-emerald-500 to-teal-600",
      },
      {
        label: t("stats.averageNet"),
        value: formatMoneyCompact(summary.average, settings.currency),
        caption: `Highest ${formatMoneyCompact(
          summary.highest,
          settings.currency
        )}`,
        icon: <ChartBarIcon className="h-6 w-6" />,
        gradient: "from-violet-500 to-purple-600",
      },
      {
        label: t("stats.pendingSetup"),
        value: summary.pending,
        caption: summary.pending
          ? "Add a structure to include them in payroll"
          : "Everyone is configured",
        icon: <ExclamationCircleIcon className="h-6 w-6" />,
        gradient: "from-amber-500 to-orange-600",
      },
    ],
    [rows.length, summary, settings.currency, t]);

  /* ---------------- actions ---------------- */

  const handleSave = useCallback(
    (
      employeeId: string,
      patch: {
        basicSalary: number;
        components: SalaryComponent[];
        status: SalaryStatus;
      }
    ) => {
      upsertStructure(employeeId, patch);
      showSuccessToast("Salary structure saved");
    },
    [upsertStructure]
  );

  const renderActions = useCallback(
    (row: SalaryRow) => (
      <>
        <button
          onClick={() => setEditing(row)}
          title={row.structure ? "Edit salary structure" : "Set up salary"}
          className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
        >
          <PencilSquareIcon className="h-4 w-4" />
        </button>
        {row.structure && (
          <button
            onClick={() => setConfirmClear(row)}
            title="Remove salary structure"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </>
    ),
    []
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
          glyph="🧾"
          title={t("salaries.title")}
          subtitle={t("salaries.subtitle")}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        {employeesLoading ? (
          <PayrollStatsSkeleton count={4} />
        ) : (
          <PayrollStatCards tiles={tiles} columnsClassName="xl:grid-cols-4" />
        )}
      </motion.div>

      <motion.div variants={staggerItem}>
        <PayrollSection
          title="Salary Profiles"
          description={`${filtered.length} of ${rows.length} employees`}
          actions={
            <>
              <PayrollSearch
                value={query}
                onChange={setQuery}
                placeholder="Search employees"
              />
              <div className="w-40">
                <Select
                  value={status}
                  onChange={(v) => setStatus(v as StatusFilter)}
                  options={statusOptions}
                />
              </div>
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
            <PayrollTableSkeleton rows={8} cols={8} />
          ) : employeesError ? (
            <p className="py-10 text-center text-sm text-rose-500">
              Could not load employees. Check your connection and try again.
            </p>
          ) : (
            <SalaryLedgerTable
              rows={filtered}
              currency={settings.currency}
              onRowClick={setEditing}
              renderActions={renderActions}
              emptyHeadline={
                rows.length === 0
                  ? "No employees yet"
                  : "No employees match your filters"
              }
              emptySub={
                rows.length === 0
                  ? "Invite employees first — their salary profiles will appear here."
                  : "Try clearing the search or switching the status filter."
              }
            />
          )}
        </PayrollSection>
      </motion.div>

      <SalaryStructureModal
        open={!!editing}
        onClose={() => setEditing(null)}
        row={editing}
        settings={settings}
        period={period}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmClear}
        onClose={() => setConfirmClear(null)}
        onConfirm={() => {
          if (confirmClear) {
            removeStructure(confirmClear.employee.id);
            showSuccessToast("Salary structure removed");
          }
          setConfirmClear(null);
        }}
        variant="danger"
        title={`Remove ${confirmClear?.employee.name}'s salary structure?`}
        description="They will be excluded from future payroll runs until a new structure is set up."
        consequences={[
          "Payslips already issued are not affected.",
          "This action cannot be undone.",
        ]}
        confirmLabel="Remove structure"
      />
    </motion.div>
  );
};

export default SalaryManagementPage;
