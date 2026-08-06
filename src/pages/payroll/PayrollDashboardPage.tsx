import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  BanknotesIcon,
  ArrowUpRightIcon,
  PlusIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartPieIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { accentFor, accentSoftFor } from "../../lib/themeTokens";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { relativeTime } from "../../lib/surfaces";
import Avatar from "../../components/Avatar";
import { usePayroll } from "../../components/payroll/PayrollProvider";
import {
  PayrollPageHeader,
  PayrollEmptyState,
  PayrollStatsSkeleton,
  StatusPill,
} from "../../components/payroll/PayrollUI";
import {
  DASH_CARD,
  CARD_LINK,
  AccentEdge,
  AccentGlow,
  CardHead,
  Money,
  RangeTabs,
  TrendBadge,
  SummaryStat,
  SegmentedGauge,
  GaugeLegend,
  CycleCard,
  type RangeOption,
} from "../../components/payroll/PayrollDashboardUI";
import { RUN_STATUS } from "../../components/payroll/constants";
import {
  formatMoney,
  formatPeriod,
  formatPeriodShort,
  formatDate,
  payDateFor,
  periodKey,
  recentPeriods,
} from "../../components/payroll/formatters";
import { findRunForPeriod } from "../../components/payroll/payrollService";

/** Trend windows offered above the cost chart. */
const RANGES: readonly RangeOption[] = [
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
];

/** Rows in the transaction list before it defers to the payslips screen. */
const RECENT_PAYSLIPS = 5;

/**
 * Payroll Dashboard - the health check.
 *
 * Answers four questions at a glance: what payroll costs and how that is
 * trending, how much of this month is paid, who was paid recently, and what
 * is due next. Every figure comes from the shared provider, so it can never
 * disagree with the salary table or the payslips.
 */
const PayrollDashboardPage: React.FC = () => {
  const { t } = useTranslation("payroll");
  const navigate = useNavigate();
  const { colorScheme, isDark } = useTheme();
  const accent = accentFor(colorScheme);
  const accentSoft = accentSoftFor(colorScheme);

  const { state, rows, payableRows, totals, period, employees, employeesLoading } =
    usePayroll();
  const { settings, runs, payslips } = state;

  const [months, setMonths] = useState(6);

  const currentRun = useMemo(
    () => findRunForPeriod(runs, period),
    [runs, period]
  );

  /* ---------------- Cost trend ---------------- */

  // Net payroll per month, oldest first. Months with no run plot as zero so a
  // skipped month is visible rather than silently closing the gap.
  const trend = useMemo(() => {
    const byPeriod = new Map(runs.map((r) => [periodKey(r.period), r]));
    return recentPeriods(months, period)
      .reverse()
      .map((p) => ({
        month: formatPeriodShort(p),
        amount: byPeriod.get(periodKey(p))?.totalNet ?? 0,
      }));
  }, [runs, period, months]);

  const hasTrend = trend.some((p) => p.amount > 0);

  // Change against the previous month. Null when there is no prior figure to
  // compare against, so the badge hides instead of showing a fake 100%.
  const delta = useMemo(() => {
    if (trend.length < 2) return null;
    const prev = trend[trend.length - 2].amount;
    const curr = trend[trend.length - 1].amount;
    if (prev <= 0 || curr <= 0) return null;
    return ((curr - prev) / prev) * 100;
  }, [trend]);

  // The headline is the latest month that actually has a figure, falling back
  // to what this month is projected to cost.
  const headlineCost = useMemo(() => {
    const latest = [...trend].reverse().find((p) => p.amount > 0);
    return latest?.amount ?? totals.totalNet;
  }, [trend, totals.totalNet]);

  /* ---------------- This month's summary ---------------- */

  const summary = useMemo(() => {
    const expected = totals.totalNet;
    const paid = currentRun?.status === "paid" ? currentRun.totalNet : 0;
    const awaiting =
      currentRun && currentRun.status !== "paid" ? currentRun.totalNet : 0;
    const unprocessed = Math.max(0, expected - paid - awaiting);
    const percentPaid =
      expected > 0 ? Math.min(100, Math.round((paid / expected) * 100)) : 0;
    return { expected, paid, awaiting, unprocessed, percentPaid };
  }, [totals.totalNet, currentRun]);

  const monthLabel = useMemo(() => {
    const lastDay = new Date(period.year, period.month, 0).getDate();
    const name = new Date(period.year, period.month - 1, 1).toLocaleDateString(
      undefined,
      { month: "long" }
    );
    return `From 1-${lastDay} ${name}, ${period.year}`;
  }, [period]);

  /* ---------------- Recent payslips ---------------- */

  // Payslips freeze an employee snapshot without the avatar, so pull the
  // current picture from the live employee list by id.
  const pictureById = useMemo(
    () => new Map(employees.map((e) => [e.id, e.profilePicture])),
    [employees]
  );

  const recentPayslips = useMemo(
    () => payslips.slice(0, RECENT_PAYSLIPS),
    [payslips]
  );

  /* ---------------- Previous / upcoming ---------------- */

  const gaugeSegments = useMemo(
    () => [
      { value: summary.paid, color: "#10b981", label: "Paid" },
      { value: summary.awaiting, color: accent, label: "Processed" },
      { value: summary.unprocessed, color: accentSoft, label: "Not processed" },
    ],
    [summary, accent, accentSoft]
  );

  const previousRun = runs[0] ?? null;
  const upcomingPayDate = payDateFor(period, settings.salaryDate);
  const pendingCount = rows.length - payableRows.length;

  const tooltipStyle: React.CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
    background: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f3f4f6" : "#111827",
    fontSize: 12,
    boxShadow: isDark
      ? "0 4px 14px rgba(0,0,0,0.45)"
      : "0 4px 12px rgba(0,0,0,0.08)",
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-4"
    >
      <motion.div variants={staggerItem}>
        <PayrollPageHeader
          title={t("dashboard.title")}
          subtitle={t("dashboard.subtitle")}
          actions={
            <>
              <Link
                to="/payroll/settings"
                aria-label="Payroll settings"
                className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/50"
              >
                <Cog6ToothIcon className="h-4 w-4" />
              </Link>
              <button
                onClick={() => navigate("/payroll/run")}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 py-1.5 pl-4 pr-1.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
              >
                Run Payroll
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-white">
                  <PlusIcon className="h-4 w-4" />
                </span>
              </button>
            </>
          }
        />
      </motion.div>

      {employeesLoading ? (
        <PayrollStatsSkeleton count={2} />
      ) : (
        <>
          {/* ---- Cost trend + this month's summary ---- */}
          <motion.div
            variants={staggerItem}
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
          >
            <section className={`${DASH_CARD} p-5 lg:col-span-2`}>
              <AccentEdge color={accent} />
              <AccentGlow color={accent} />

              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <CardHead
                  icon={BanknotesIcon}
                  title="Total Payroll Cost"
                  subtitle={`Net payout, last ${months} months`}
                />
                <RangeTabs
                  options={RANGES}
                  value={months}
                  onChange={setMonths}
                />
              </div>

              <div className="relative mt-3 flex flex-wrap items-center gap-3">
                <Money amount={headlineCost} currency={settings.currency} />
                <TrendBadge percent={delta} label="vs last month" />
              </div>

              <div className="relative mt-4 h-52">
                {hasTrend ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trend}
                      margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="payrollCost"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={accent}
                            stopOpacity={0.30}
                          />
                          <stop
                            offset="100%"
                            stopColor={accent}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke={isDark ? "#374151" : "#eef2f6"}
                        strokeDasharray="4 4"
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                      />
                      <Tooltip
                        cursor={{
                          stroke: accentSoft,
                          strokeWidth: 1,
                        }}
                        contentStyle={tooltipStyle}
                        labelStyle={{
                          fontWeight: 600,
                          color: isDark ? "#f3f4f6" : "#111827",
                        }}
                        itemStyle={{ color: accent }}
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
                        fill="url(#payrollCost)"
                        dot={false}
                        activeDot={{
                          r: 5,
                          strokeWidth: 2,
                          stroke: isDark ? "#1f2937" : "#fff",
                          fill: accent,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <PayrollEmptyState
                    compact
                    headline="No payroll history yet"
                    sub="Process your first month and the cost trend will appear here."
                    ctaLabel="Run payroll"
                    onAction={() => navigate("/payroll/run")}
                  />
                )}
              </div>
            </section>

            <section className={`${DASH_CARD} flex flex-col p-5`}>
              <AccentEdge color={accent} />
              <AccentGlow
                color={accent}
                className="-left-20 -bottom-24 h-52 w-52"
              />

              <div className="relative">
                <CardHead
                  icon={ChartPieIcon}
                  title="Payroll Summary"
                  subtitle={monthLabel}
                  action={
                    <Link to="/payroll/history" className={CARD_LINK}>
                      View report
                      <ArrowUpRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  }
                />
              </div>

              <div className="relative mt-4 flex items-start divide-x divide-gray-200 dark:divide-gray-700">
                <SummaryStat
                  label="Payment"
                  amount={summary.expected}
                  currency={settings.currency}
                  tone={accent}
                />
                <SummaryStat
                  label="Pending"
                  amount={summary.awaiting + summary.unprocessed}
                  currency={settings.currency}
                  tone="#f59e0b"
                />
                <SummaryStat
                  label="Paid"
                  amount={summary.paid}
                  currency={settings.currency}
                  tone="#10b981"
                />
              </div>

              <div className="relative flex flex-1 flex-col items-center justify-center pt-5">
                <SegmentedGauge
                  segments={gaugeSegments}
                  centerLabel={`${summary.percentPaid}%`}
                  centerCaption="paid"
                />
                <GaugeLegend items={gaugeSegments} />
              </div>
            </section>
          </motion.div>

          {/* ---- Transaction history + payroll cycle ---- */}
          <motion.div
            variants={staggerItem}
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
          >
            <section className={`${DASH_CARD} p-5 lg:col-span-2`}>
              <AccentEdge color={accent} />
              <CardHead
                icon={ReceiptPercentIcon}
                title="Transaction History"
                subtitle={`${payslips.length} payslip${
                  payslips.length === 1 ? "" : "s"
                } issued to date`}
                action={
                  <Link to="/payroll/payslips" className={CARD_LINK}>
                    See All
                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </Link>
                }
              />

              {recentPayslips.length === 0 ? (
                <PayrollEmptyState
                  headline="No payslips issued yet"
                  sub="Run payroll for this month and every payslip will be listed here with its net payout."
                  ctaLabel="Run payroll"
                  onAction={() => navigate("/payroll/run")}
                />
              ) : (
                <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-700/60">
                  {recentPayslips.map((slip) => (
                    <li
                      key={slip.id}
                      className="group/row -mx-2 flex flex-wrap items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.04]"
                    >
                      <span className="relative flex-shrink-0">
                        <Avatar
                          src={pictureById.get(slip.employee.id)}
                          name={slip.employee.name}
                          size="md"
                          className="ring-2 ring-white shadow-sm dark:ring-gray-800"
                        />
                        {/* Every listed payslip has been issued, so the marker
                            is a settled tick rather than a status colour. */}
                        <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full text-blue-600 dark:text-blue-400">
                          <CheckIcon className="h-2 w-2 text-white" />
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {slip.employee.name}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {slip.employee.designation ||
                            slip.employee.department ||
                            "Employee"}
                        </p>
                      </div>
                      <div className="hidden w-32 sm:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(slip.generatedAt)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatPeriod(slip.period)}
                        </p>
                      </div>
                      <Money
                        amount={slip.computation.netSalary}
                        currency={slip.computation.currency}
                        size="text-sm"
                        className="w-28 justify-end"
                      />
                      <button
                        onClick={() => navigate("/payroll/payslips")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:border-blue-600/40 hover:bg-blue-600/[0.06] hover:text-blue-700 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:border-blue-400/40 dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        View payslip
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="space-y-4">
              {/* Previous payroll */}
              <CycleCard
                icon={BanknotesIcon}
                label="Previous Payroll"
                meta={previousRun ? formatDate(previousRun.payDate) : "-"}
                tone={previousRun ? "settled" : "idle"}
              >
                {previousRun ? (
                  <>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <Money
                        amount={previousRun.totalNet}
                        currency={previousRun.currency}
                        size="text-2xl"
                        compactAbove={100_000_000}
                      />
                      <StatusPill status={RUN_STATUS[previousRun.status]} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {previousRun.employeeCount} employees, processed{" "}
                      {relativeTime(previousRun.generatedAt)}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Nothing processed yet.
                  </p>
                )}
              </CycleCard>

              {/* Upcoming payroll */}
              <CycleCard
                icon={ClockIcon}
                label="Upcoming Payroll"
                meta={formatDate(upcomingPayDate)}
                tone={currentRun?.status === "paid" ? "settled" : "due"}
              >
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Money
                    amount={totals.totalNet}
                    currency={settings.currency}
                    size="text-2xl"
                    compactAbove={100_000_000}
                  />
                  <StatusPill
                    status={
                      currentRun ? RUN_STATUS[currentRun.status] : RUN_STATUS.draft
                    }
                  />
                </div>

                {/* Readiness strip. Sits on its own surface so the call to
                    action reads as the next step, not as more figures. */}
                <div className="mt-4 rounded-xl border border-gray-200/70 bg-white/70 p-3 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/30">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Ready to pay
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {payableRows.length} of {rows.length} employees
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {pendingCount > 0
                          ? `${pendingCount} still need a salary structure`
                          : "Every employee is configured"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          pendingCount > 0 ? "/payroll/salaries" : "/payroll/run"
                        )
                      }
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      {pendingCount > 0 ? "Set up" : "Run now"}
                      <ArrowUpRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CycleCard>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default PayrollDashboardPage;
