import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUpRightIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { CARD, relativeTime } from "../../lib/surfaces";
import { usePayroll } from "../../components/payroll/PayrollProvider";
import PayrollStatCards, {
  type StatTile,
} from "../../components/payroll/PayrollStatCards";
import {
  PayrollPageHeader,
  PayrollSection,
  PayrollEmptyState,
  PayrollStatsSkeleton,
  StatusPill,
} from "../../components/payroll/PayrollUI";
import { RUN_STATUS } from "../../components/payroll/constants";
import {
  formatMoney,
  formatMoneyCompact,
  formatPeriod,
  formatPeriodShort,
  ordinal,
  periodKey,
  recentPeriods,
} from "../../components/payroll/formatters";
import { findRunForPeriod } from "../../components/payroll/payrollService";

/** Theme accent hex — charts are SVG and can't use the themed CSS classes. */
const THEME_ACCENT: Record<string, string> = {
  black: "#374151",
  purple: "#9c5fd1",
  blue: "#2563eb",
  pink: "#db2777",
  violet: "#7c3aed",
  indigo: "#4f46e5",
  orange: "#ea580c",
  teal: "#0d9488",
  bronze: "#b45309",
  mint: "#10b981",
};

/** How many months of history the trend chart shows. */
const TREND_MONTHS = 6;

/**
 * Payroll Dashboard — the health check.
 *
 * Answers four questions at a glance: who is on payroll, what this month costs,
 * whether it has been processed, and what still needs attention. Every figure
 * comes from the shared provider, so it can never disagree with the salary
 * table or the payslips.
 */
const PayrollDashboardPage: React.FC = () => {
  const { t } = useTranslation("payroll");
  const navigate = useNavigate();
  const { colorScheme } = useTheme();
  const accent = THEME_ACCENT[colorScheme] ?? THEME_ACCENT.blue;

  const {
    state,
    rows,
    payableRows,
    totals,
    period,
    employees,
    employeesLoading,
  } = usePayroll();
  const { settings, runs } = state;

  const currentRun = useMemo(
    () => findRunForPeriod(runs, period),
    [runs, period]
  );

  const pendingCount = rows.length - payableRows.length;

  /* ---------------- KPI tiles ---------------- */

  const tiles: StatTile[] = useMemo(
    () => [
      {
        label: t("stats.totalEmployees"),
        value: employees.length,
        caption: `${payableRows.length} ready for payroll`,
        icon: <UserGroupIcon className="h-6 w-6" />,
        gradient: "from-blue-500 to-indigo-600",
      },
      {
        label: "Payroll Month",
        value: formatPeriod(period),
        caption: currentRun
          ? `Processed ${relativeTime(currentRun.generatedAt)}`
          : "Not processed yet",
        icon: <CalendarDaysIcon className="h-6 w-6" />,
        gradient: "from-violet-500 to-purple-600",
      },
      {
        label: t("stats.totalPayroll"),
        value: formatMoneyCompact(totals.totalNet, settings.currency),
        caption: `Gross ${formatMoneyCompact(
          totals.totalGross,
          settings.currency
        )} • across ${payableRows.length} employees`,
        icon: <BanknotesIcon className="h-6 w-6" />,
        gradient: "from-emerald-500 to-teal-600",
      },
      {
        label: t("stats.processed"),
        value: currentRun?.employeeCount ?? 0,
        caption: currentRun
          ? `Payslips issued for ${formatPeriod(period)}`
          : "Run payroll to issue payslips",
        icon: <CheckCircleIcon className="h-6 w-6" />,
        gradient: "from-cyan-500 to-blue-600",
      },
      {
        label: t("stats.pendingSetup"),
        value: pendingCount,
        caption: pendingCount
          ? "Employees without an active salary"
          : "Every employee is configured",
        icon: <ExclamationCircleIcon className="h-6 w-6" />,
        gradient: "from-amber-500 to-orange-600",
      },
    ],
    [employees.length,
      payableRows.length,
      period,
      currentRun,
      totals,
      settings.currency,
      pendingCount, t]);

  /* ---------------- Trend ---------------- */

  // Net payroll cost per month, oldest first. Months with no run plot as zero
  // so the gap is visible rather than silently skipped.
  const trend = useMemo(() => {
    const byPeriod = new Map(runs.map((r) => [periodKey(r.period), r]));
    return recentPeriods(TREND_MONTHS, period)
      .reverse()
      .map((p) => ({
        month: formatPeriodShort(p),
        amount: byPeriod.get(periodKey(p))?.totalNet ?? 0,
      }));
  }, [runs, period, t]);

  const hasTrend = trend.some((t) => t.amount > 0);
  const recentRuns = useMemo(() => runs.slice(0, 5), [runs]);

  /* ---------------- Quick actions ---------------- */

  const quickActions = [
    {
      label: "Run Payroll",
      description: `Process ${formatPeriod(period)}`,
      icon: PlayCircleIcon,
      to: "/payroll/run",
      tint: "from-emerald-500 to-teal-600",
    },
    {
      label: "Salary Setup",
      description: `${pendingCount} employee${pendingCount === 1 ? "" : "s"} pending`,
      icon: AdjustmentsHorizontalIcon,
      to: "/payroll/salaries",
      tint: "from-blue-500 to-indigo-600",
    },
    {
      label: "Payslips",
      description: `${state.payslips.length} issued`,
      icon: DocumentTextIcon,
      to: "/payroll/payslips",
      tint: "from-violet-500 to-purple-600",
    },
    {
      label: "Settings",
      description: `${settings.currency} • pays on the ${ordinal(
        settings.salaryDate
      )}`,
      icon: Cog6ToothIcon,
      to: "/payroll/settings",
      tint: "from-slate-500 to-gray-600",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <PayrollPageHeader
          title={t("dashboard.title")}
          subtitle={t("dashboard.subtitle")}
          actions={
            <button
              onClick={() => navigate("/payroll/run")}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlayCircleIcon className="h-5 w-5" />
              Run Payroll
            </button>
          }
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        {employeesLoading ? (
          <PayrollStatsSkeleton />
        ) : (
          <PayrollStatCards tiles={tiles} />
        )}
      </motion.div>

      {/* ---- Trend + quick actions ---- */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <PayrollSection
            title="Payroll Cost Trend"
            description={`Net payroll over the last ${TREND_MONTHS} months`}
            actions={
              <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                {formatMoney(totals.totalNet, settings.currency)}
                <span className="ml-1.5 text-xs font-medium text-gray-400">
                  this month
                </span>
              </span>
            }
          >
            {hasTrend ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trend}
                    margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="payrollTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                    />
                    <Tooltip
                      cursor={{ stroke: accent, strokeWidth: 1, strokeOpacity: 0.4 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                      labelStyle={{ fontWeight: 600 }}
                      formatter={(v: any) => [
                        formatMoney(Number(v), settings.currency),
                        "Net payroll",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke={accent}
                      strokeWidth={2.5}
                      fill="url(#payrollTrend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <PayrollEmptyState
                compact
                headline="No payroll history yet"
                sub="Process your first month and the cost trend will appear here."
                ctaLabel="Run payroll"
                onAction={() => navigate("/payroll/run")}
              />
            )}
          </PayrollSection>
        </div>

        <div className={`${CARD} p-5`}>
          <h3 className="text-card-title text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Jump straight to what needs doing.
          </p>
          <div className="mt-4 space-y-2">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                <span
                  className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br ${a.tint} text-white shadow-sm transition-transform duration-300 group-hover:scale-105`}
                >
                  <a.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {a.label}
                  </span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                    {a.description}
                  </span>
                </span>
                <ArrowUpRightIcon className="h-4 w-4 flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-gray-600" />
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ---- Recent activity ---- */}
      <motion.div variants={staggerItem}>
        <PayrollSection
          title="Recent Payroll Activity"
          description="The latest runs and what they cost."
          actions={
            runs.length > 0 && (
              <Link
                to="/payroll/history"
                className="btn-secondary inline-flex items-center gap-1.5 text-sm"
              >
                View history
                <ArrowUpRightIcon className="h-4 w-4" />
              </Link>
            )
          }
        >
          {recentRuns.length === 0 ? (
            <PayrollEmptyState
              headline="No payroll has been run yet"
              sub="Set up salary structures, then process your first payroll month. Every run is recorded here with its full breakdown."
              ctaLabel="Set up salaries"
              onAction={() => navigate("/payroll/salaries")}
            />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentRuns.map((run) => (
                <li key={run.id}>
                  <Link
                    to="/payroll/history"
                    className="group flex flex-wrap items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                      <BanknotesIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                        {formatPeriod(run.period)} payroll
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {run.employeeCount} employees • by {run.generatedBy} •{" "}
                        {relativeTime(run.generatedAt)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                        {formatMoney(run.totalNet, run.currency)}
                      </span>
                      <span className="block text-[11px] text-gray-400">
                        net payout
                      </span>
                    </span>
                    <StatusPill status={RUN_STATUS[run.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PayrollSection>
      </motion.div>
    </motion.div>
  );
};

export default PayrollDashboardPage;
