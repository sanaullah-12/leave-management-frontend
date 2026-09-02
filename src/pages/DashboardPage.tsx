import React from "react";
import { CARD, CARD_HOVER } from "../lib/surfaces";
import { accentFor, accentSoftFor } from "../lib/themeTokens";
import { AccentEdge } from "../components/ui/CardAccents";
import { useAuth } from "../context/AuthContext";
import AttendancePieCard from "../components/dashboard/AttendancePieCard";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useFormatters } from "../i18n/useFormatters";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { leavesAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Avatar from "../components/Avatar";
import { getUpcomingHolidays } from "../data/holidays";
import AnimatedNumber from "../components/AnimatedNumber";
import { StatCardsSkeleton } from "../components/Skeletons";
import LogoLoader from "../components/LogoLoader";
import DashboardAnnouncements from "../components/DashboardAnnouncements";
import { motion } from "framer-motion";
import MeshBackground from "../components/MeshBackground";
import EmployeeVoiceWidget from "../components/voice/EmployeeVoiceWidget";
import { staggerContainer, staggerItem } from "../lib/motion";
import {
  UsersIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon,
  GlobeAltIcon,
  PlusIcon,
  BoltIcon,
  ArrowUpRightIcon,
  ChartBarIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "../styles/design-system.css";

/*
 * Dashboard layout: 4-up KPI row, hero + gauges, chart + breakdown, then
 * activity and timeline.
 *
 * Colour rules for this screen - only two families:
 *   1. The theme accent. `blue-*` utilities recolour per theme via
 *      design-system.css; `accentFor()` gives the matching hex for SVG.
 *      Carries all data viz, icon chips, gauges and links.
 *   2. emerald / amber / red, only where the colour means something
 *      (approved / pending / rejected) and only on pills and dots.
 *
 * Everything else is neutral gray. Don't add a third decorative hue.
 */

// Status → pill classes. One source of truth so the activity list, the
// badges and any future status chip can never drift apart.
const STATUS_PILL: Record<string, string> = {
  approved:
    "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/25",
  pending:
    "bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/25",
  rejected:
    "bg-red-50 text-red-700 ring-red-200/70 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/25",
};
const NEUTRAL_PILL =
  "bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:ring-gray-600/50";

const StatusPill: React.FC<{ status?: string; label: string }> = ({
  status,
  label,
}) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ring-1 ring-inset ${
      STATUS_PILL[status ?? ""] ?? NEUTRAL_PILL
    }`}
  >
    {status === "approved" && <CheckCircleIcon className="w-3 h-3" />}
    {label}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Presentational helpers - visual only, data is passed in            */
/* ------------------------------------------------------------------ */

// Compact KPI tile: label + big value on the left, accent icon chip on
// the right, supporting caption below. Mirrors the reference top row.
const KpiCard: React.FC<{
  label: string;
  value: number | string;
  suffix?: string;
  caption: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
}> = ({ label, value, suffix, caption, icon, accent, onClick }) => (
  <div
    onClick={onClick}
    className={`group relative overflow-hidden ${CARD} ${CARD_HOVER} flex h-full flex-col p-3.5 sm:p-5 ${
      onClick ? "cursor-pointer" : ""
    }`}
  >
    <AccentEdge color={accent} />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p
          className="text-overline truncate text-gray-400 dark:text-gray-500"
          title={label}
        >
          {label}
        </p>
        {/* Fixed-height value line keeps every tile's number on the same
            baseline, with or without a suffix. */}
        <p className="mt-2 flex min-h-[2rem] items-end gap-1 sm:min-h-[2.25rem]">
          <span className="text-2xl sm:text-3xl font-bold tabular-nums leading-none text-gray-900 dark:text-white">
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </span>
          {suffix && (
            <span className="text-sm font-medium leading-none text-gray-400 dark:text-gray-500">
              {suffix}
            </span>
          )}
        </p>
      </div>
      {/* Bare icon, no plate. It scales on hover so the tile still responds. */}
      <div className="hidden sm:grid flex-shrink-0 place-items-center w-11 h-11 text-blue-600 dark:text-blue-400 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
        {icon}
      </div>
    </div>
    {/* Pinned to the bottom so captions align across the whole row. */}
    <p className="mt-auto pt-2 text-[11px] leading-snug sm:pt-3 sm:text-xs font-medium text-gray-500 dark:text-gray-400">
      {caption}
    </p>
  </div>
);

// Semicircle gauge card - replaces the reference "Satisfaction / Referral"
// gauges with a real leave metric. pathLength normalises the arc to 0..100.
const SemiGauge: React.FC<{
  label: string;
  percent: number;
  big: React.ReactNode;
  small?: string;
  accent: string;
  accentSoft: string;
  /** Unique per instance - SVG gradient ids are global. */
  gradientId: string;
}> = ({ label, percent, big, small, accent, accentSoft, gradientId }) => {
  const p = Math.max(0, Math.min(100, percent));
  const ARC = "M8 52 A 42 42 0 0 1 92 52";
  return (
    <div className={`${CARD} ${CARD_HOVER} p-5 flex flex-col`}>
      <p className="text-overline text-gray-500 dark:text-gray-400">{label}</p>
      <div className="relative mt-3 flex-1">
        <svg viewBox="0 0 100 58" className="w-full">
          <defs>
            {/* Light → full accent along the arc. Same hue at two
                brightnesses, so it reads as depth, not as a second colour. */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accentSoft} />
              <stop offset="100%" stopColor={accent} />
            </linearGradient>
          </defs>
          <path
            className="stroke-gray-200/70 dark:stroke-gray-700/70"
            d={ARC}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={100}
          />
          <path
            d={ARC}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${p} 100`}
            style={{ transition: "stroke-dasharray 0.7s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white leading-none">
            {big}
          </span>
          {small && (
            <span className="mt-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {small}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Small mini-stat tile used in the "Leave by Type" panel footer - mirrors
// the reference "Active Users" stat row.
const MiniStat: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  /** Largest value in the group - the bars are relative to it. */
  max: number;
}> = ({ label, value, icon, max }) => (
  <div>
    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
      <span className="text-blue-600 dark:text-blue-400">{icon}</span>
      <span className="text-[11px] font-medium">{label}</span>
    </div>
    <p className="mt-1 text-lg font-bold tabular-nums text-gray-900 dark:text-white">
      <AnimatedNumber value={value} />
    </p>
    {/* Width is the value's share of the largest tile in the group. */}
    <div className="mt-1.5 h-1.5 rounded-full bg-gray-200/70 dark:bg-gray-900/60 overflow-hidden shadow-[inset_1px_1px_2px_rgba(0,0,0,0.12),inset_-1px_-1px_2px_rgba(255,255,255,0.7)] dark:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]">
      <div
        className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: value <= 0 || max <= 0 ? "6%" : `${Math.max(6, (value / max) * 100)}%`,
        }}
      />
    </div>
  </div>
);

// Small card shell used by the widget panels.
const PanelCard: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  accent: string;
  className?: string;
}> = ({ title, action, children, accent, className = "" }) => (
  <div className={`relative overflow-hidden ${CARD} ${CARD_HOVER} ${className}`}>
    <AccentEdge color={accent} />
    <div className="relative flex items-center justify-between px-5 pt-5 pb-3">
      <h3 className="text-card-title text-gray-900 dark:text-gray-100">{title}</h3>
      {action}
    </div>
    <div className="px-5 pb-5">{children}</div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colorScheme, isDark } = useTheme();
  const { t } = useTranslation("dashboard");
  // Dates follow the chosen language, not the browser locale.
  const fmt = useFormatters();
  const accent = accentFor(colorScheme);
  const accentSoft = accentSoftFor(colorScheme);

  // Recharts styles tooltips inline, so they can't pick up the dark-mode
  // classes. Build the palette here and hand it to every chart on the page.
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

  /* ------------------------------------------------------------------ */
  /*  DATA WIRING - unchanged from the original dashboard                */
  /*  Same three queries, same role gating, same response shapes.        */
  /* ------------------------------------------------------------------ */

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => leavesAPI.getDashboardStats(),
    enabled: user?.role === "admin",
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: leaveBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => leavesAPI.getLeaveBalance(),
    enabled: user?.role === "employee",
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentLeaves, isLoading: leavesLoading } = useQuery({
    queryKey: ["recent-leaves"],
    queryFn: () => leavesAPI.getLeaves(1, 5),
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  if (statsLoading && user?.role === "admin") {
    return <LogoLoader label={t("loading")} />;
  }

  const adminStats: any = stats?.data || {};
  const balance: any = leaveBalance?.data?.balance || {};
  const recent: any[] = recentLeaves?.data?.leaves || [];
  const isAdmin = user?.role === "admin";

  /* ------------------------------------------------------------------ */
  /*  DERIVED VIEW DATA - computed only from the data already fetched.   */
  /*  No new network calls, no backend changes.                          */
  /* ------------------------------------------------------------------ */

  // Greeting based on local time (presentational only).
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("greeting.morning")
      : hour < 18
      ? t("greeting.afternoon")
      : t("greeting.evening");
  const today = fmt.date(new Date(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Leave-trend line, derived from the recent leaves we already have.
  // Localised month abbreviations for the trend axis.
  const MONTHS = Array.from({ length: 12 }, (_, i) => fmt.monthShort(i));
  const monthlyCounts = new Array(12).fill(0);
  recent.forEach((l) => {
    const d = l?.startDate ? new Date(l.startDate) : null;
    if (d && !isNaN(d.getTime())) monthlyCounts[d.getMonth()] += 1;
  });
  const trendData = MONTHS.map((m, i) => ({ month: m, value: monthlyCounts[i] }));

  // Status breakdown (admin) from leavesByStatus aggregate.
  const statusMap: Record<string, number> = {};
  (adminStats.leavesByStatus || []).forEach((s: any) => {
    if (s?._id) statusMap[s._id] = s.count || 0;
  });
  const approved = statusMap.approved || 0;
  const pending = statusMap.pending || adminStats.pendingLeaves || 0;
  const rejected = statusMap.rejected || 0;
  const totalReq = approved + pending + rejected;

  // Employee balance totals.
  const balTypes = ["annual", "sick", "casual"] as const;
  const usedTotal = balTypes.reduce(
    (a, t) => a + (balance[t]?.used || 0),
    0
  );
  const quotaTotal = balTypes.reduce(
    (a, t) => a + (balance[t]?.total || 0),
    0
  );
  const remainingTotal = Math.max(0, quotaTotal - usedTotal);

  // Two gauge metrics - role aware.
  // One gauge per role now: the attendance donut takes the first slot.
  const gauges = isAdmin
    ? [
        {
          label: t("gauges.pendingLoad"),
          percent: totalReq ? (pending / totalReq) * 100 : 0,
          big: pending,
          small: t("gauges.awaitingReview"),
        },
      ]
    : [
        {
          label: t("gauges.annualBalance"),
          percent: balance.annual?.total
            ? (balance.annual.remaining / balance.annual.total) * 100
            : 0,
          big: balance.annual?.remaining ?? 0,
          small: "days remaining",
        },
      ];

  // "Leave by Type" bar chart data - role aware.
  const typeData = isAdmin
    ? (adminStats.leavesByType || []).map((t: any) => ({
        name: (t?._id || "other").replace(/^\w/, (c: string) => c.toUpperCase()),
        value: t?.count || 0,
      }))
    : balTypes.map((t) => ({
        name: t.replace(/^\w/, (c) => c.toUpperCase()),
        value: balance[t]?.used || 0,
      }));

  // Mini-stat tiles under the bar chart.
  const miniStats = isAdmin
    ? [
        { label: t("kpi.approved"), value: approved, icon: <CheckCircleIcon className="w-4 h-4" /> },
        { label: t("labels.pending"), value: pending, icon: <ClockIcon className="w-4 h-4" /> },
        { label: t("kpi.thisMonth"), value: adminStats.thisMonthLeaves || 0, icon: <CalendarDaysIcon className="w-4 h-4" /> },
        { label: t("labels.employees"), value: adminStats.totalEmployees || 0, icon: <UsersIcon className="w-4 h-4" /> },
      ]
    : [
        { label: t("gauges.daysUsed"), value: usedTotal, icon: <ChartBarIcon className="w-4 h-4" /> },
        { label: t("gauges.remaining"), value: remainingTotal, icon: <CheckCircleIcon className="w-4 h-4" /> },
        { label: t("labels.requests"), value: recent.length, icon: <CalendarDaysIcon className="w-4 h-4" /> },
        { label: t("labels.pending"), value: recent.filter((l) => l?.status === "pending").length, icon: <ClockIcon className="w-4 h-4" /> },
      ];

  // Bars in the mini-stat row are drawn relative to the biggest tile.
  const miniStatMax = Math.max(...miniStats.map((m) => m.value), 1);

  // Team members for the availability widget - reuse the employees found in
  // the recent leaves payload (admin view has employee objects populated).
  const teamFromLeaves = Array.from(
    new Map(
      recent
        .filter((l) => l && typeof l.employee === "object" && l.employee?._id)
        .map((l) => [l.employee._id, l.employee])
    ).values()
  ).slice(0, 4);

  // Real upcoming public holidays, sourced from the shared holidays config.
  const publicHolidays = getUpcomingHolidays(new Date(), 4).map(
    ({ date, holiday }) => ({
      mon: fmt.monthShort(date.getMonth()).toUpperCase(),
      day: String(date.getDate()).padStart(2, "0"),
      name: holiday.name,
      sub: `${fmt.weekday(date)} • ${date.getFullYear()}`,
    })
  );

  // The four top KPI tiles - role aware.
  const kpis = isAdmin
    ? [
        {
          label: t("kpi.totalEmployees"),
          value: adminStats.totalEmployees || 0,
          caption: t("kpi.activeWorkforce"),
          icon: <UsersIcon className="w-5 h-5" />,
          onClick: () => navigate("/employees"),
        },
        {
          label: t("kpi.pendingRequests"),
          value: adminStats.pendingLeaves || 0,
          caption: t("kpi.awaitingReview"),
          icon: <ClockIcon className="w-5 h-5" />,
          onClick: () => navigate("/leaves?status=pending"),
        },
        {
          label: t("kpi.thisMonth"),
          value: adminStats.thisMonthLeaves || 0,
          caption: t("kpi.leaveRequestsLogged"),
          icon: <CalendarDaysIcon className="w-5 h-5" />,
          onClick: () => navigate("/leaves"),
        },
        {
          label: t("kpi.approved"),
          value: approved,
          caption: t("kpi.requestsGranted"),
          icon: <CheckCircleIcon className="w-5 h-5" />,
          onClick: () => navigate("/leaves?status=approved"),
        },
      ]
    : [
        {
          label: t("kpi.annualLeave"),
          value: balance.annual?.remaining ?? 0,
          suffix: `/ ${balance.annual?.total ?? 0}`,
          caption: t("kpi.daysRemaining"),
          icon: <ArrowUpRightIcon className="w-5 h-5" />,
          onClick: () => navigate("/my-leave-activity"),
        },
        {
          label: t("kpi.sickLeave"),
          value: balance.sick?.used ?? 0,
          suffix: `/ ${balance.sick?.total ?? 0}`,
          caption: t("kpi.daysUsed"),
          icon: <PlusIcon className="w-5 h-5" />,
          onClick: () => navigate("/my-leave-activity"),
        },
        {
          label: t("kpi.casualLeave"),
          value: balance.casual?.remaining ?? 0,
          suffix: `/ ${balance.casual?.total ?? 0}`,
          caption: t("kpi.daysRemaining"),
          icon: <UserIcon className="w-5 h-5" />,
          onClick: () => navigate("/my-leave-activity"),
        },
        {
          label: t("kpi.daysTaken"),
          value: usedTotal,
          caption: t("kpi.acrossAllLeaveTypes"),
          icon: <ChartBarIcon className="w-5 h-5" />,
          onClick: () => navigate("/my-leave-activity"),
        },
      ];

  const showCardsLoading = !isAdmin && balanceLoading;

  return (
    <motion.div
      className="space-y-5"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* ---------------- Top KPI row (4-up) ---------------- */}
      {showCardsLoading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <motion.div
          variants={staggerItem}
          className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
        >
          {kpis.map((c, i) => (
            <KpiCard key={i} {...c} accent={accent} />
          ))}
        </motion.div>
      )}

      {/* ---------------- Announcements highlight (fresh 24h + pinned) ---------------- */}
      <DashboardAnnouncements />

      {/* ---------------- Hero + gauges ---------------- */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-4 gap-5"
      >
        {/* Welcome hero (spans 2) */}
        <div className={`lg:col-span-2 relative overflow-hidden p-6 sm:p-7 ${CARD}`}>
          <MeshBackground />
          <div className="relative flex h-full flex-col justify-between gap-5">
            <div>
              <p className="text-overline text-blue-600 dark:text-blue-400">
                {t("greeting.welcomeBack")}
              </p>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
              >
                {greeting}, {user?.name?.split(" ")[0] || "there"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 max-w-md"
              >
                {isAdmin ? t("hero.adminSub") : t("hero.employeeSub")}
              </motion.p>
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <CalendarDaysIcon className="w-4 h-4" />
                {today}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user?.role === "employee" && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/apply-leave")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                >
                  <BoltIcon className="w-4 h-4" />
                  {t("actions.quickApply")}
                </motion.button>
              )}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(isAdmin ? "/leaves" : "/apply-leave")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                {isAdmin ? t("hero.viewRequests") : t("hero.requestLeave")}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Attendance donut, then the remaining gauge. */}
        <AttendancePieCard role={user?.role} employeeId={user?.employeeId} />

        {gauges.map((g, i) => (
          <SemiGauge
            key={i}
            {...g}
            accent={accent}
            accentSoft={accentSoft}
            gradientId={`gaugeArc${i}`}
          />
        ))}
      </motion.div>

      {/* ---------------- Employee Voice widget ---------------- */}
      <motion.div variants={staggerItem}>
        <EmployeeVoiceWidget />
      </motion.div>

      {/* ---------------- Chart + breakdown ---------------- */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Leave Trends area chart (spans 2) */}
        <div className={`${CARD} ${CARD_HOVER} lg:col-span-2 p-5`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-card-title text-gray-900 dark:text-gray-100">
                {t("sections.leaveTrends")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAdmin
                  ? t("sections.companyActivity")
                  : "Your leave activity across recent requests"}
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300">
              {new Date().getFullYear()} ({t("sections.current")})
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="leaveTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  interval={1}
                />
                <Tooltip
                  cursor={{ stroke: accentSoft, strokeWidth: 1 }}
                  contentStyle={tooltipStyle}
                  labelStyle={{
                    fontWeight: 600,
                    color: isDark ? "#f3f4f6" : "#111827",
                  }}
                  itemStyle={{ color: accent }}
                  formatter={(v: any) => [`${v} requests`, "Leaves"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={accent}
                  strokeWidth={3}
                  fill="url(#leaveTrend)"
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
          </div>
        </div>

        {/* Leave by Type - bar chart + mini stats */}
        <div className={`${CARD} ${CARD_HOVER} p-5 flex flex-col`}>
          <h3 className="text-card-title text-gray-900 dark:text-gray-100">
            {t("sections.leaveByType")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isAdmin
                ? t("sections.thisMonthByCategory")
                : t("sections.daysUsedByCategory")}
          </p>
          <div className="h-32 w-full mt-3">
            {typeData.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typeData}
                  margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="leaveTypeBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} />
                      <stop offset="100%" stopColor={accentSoft} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148,163,184,0.12)" }}
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: isDark ? "#f3f4f6" : "#111827" }}
                    itemStyle={{ color: accent }}
                  />
                  {/* One gradient for every bar: leave types aren't ranked,
                      so per-bar shading would imply an order. */}
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={26}
                    fill="url(#leaveTypeBar)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                {t("empty.noDataYet")}
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 grid grid-cols-2 gap-4">
            {miniStats.map((m, i) => (
              <MiniStat key={i} {...m} max={miniStatMax} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ---------------- Activity + timeline ---------------- */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Recent Activity (spans 2) */}
        <PanelCard
          accent={accent}
          title={t("sections.recentActivity")}
          className="lg:col-span-2"
          action={
            <button
              onClick={() => navigate("/leaves")}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t("actions.viewAll")}
            </button>
          }
        >
          {leavesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : recent.length > 0 ? (
            <ul className="space-y-4">
              {recent.map((leave: any) => {
                const empName =
                  typeof leave.employee === "object" && leave.employee?.name
                    ? leave.employee.name
                    : null;
                return (
                  <li key={leave._id} className="flex gap-3">
                    {/* Neutral marker. The status colour lives on the pill
                        below so each row carries exactly one colour. */}
                    <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gray-300 dark:bg-gray-600" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {leave.leaveType} Leave
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {leave.startDate
                            ? new Date(leave.startDate).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <StatusPill
                          status={leave.status}
                          label={
                            leave.status === "approved"
                              ? t("labels.approved")
                              : leave.status === "pending"
                              ? t("labels.pending")
                              : leave.status || "-"
                          }
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {isAdmin && empName ? `${empName} • ` : ""}
                          {leave.totalDays}{" "}
                          {leave.totalDays === 1 ? "day" : "days"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700/60 mb-3">
                <CalendarDaysIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {t("empty.noRecentActivity")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("empty.requestsWillAppear")}
              </p>
            </div>
          )}
        </PanelCard>

        {/* Right column: Holidays timeline + Team availability */}
        <div className="space-y-5">
          {/* Public Holidays */}
          <PanelCard
            accent={accent}
            title={t("sections.publicHolidays")}
            action={
              <GlobeAltIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            }
          >
            <ul className="space-y-2.5">
              {publicHolidays.map((h) => (
                <li
                  key={h.name}
                  className="flex items-center gap-3 rounded-xl p-2 -mx-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="avatar-primary flex flex-col items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 shadow-sm">
                    <span className="text-[9px] font-bold uppercase text-white/80 leading-none tracking-wide">
                      {h.mon}
                    </span>
                    <span className="text-base font-bold text-white leading-tight">
                      {h.day}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                      {h.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {h.sub}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate("/leave-calendar")}
              className="mt-4 w-full py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            >
              {t("actions.viewCompanyCalendar")}
            </button>
          </PanelCard>

          {/* Team Availability */}
          <PanelCard
            accent={accent}
            title={t("sections.teamAvailability")}
            action={<SunIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
          >
            {teamFromLeaves.length > 0 ? (
              <ul className="space-y-1">
                {teamFromLeaves.map((emp: any) => (
                  <li
                    key={emp._id}
                    className="flex items-center justify-between gap-3 rounded-xl p-2 -mx-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="relative flex-shrink-0">
                        <Avatar
                          src={emp.profilePicture}
                          name={emp.name || "Unknown"}
                          size="md"
                          className="ring-2 ring-white dark:ring-gray-800 shadow-sm"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800" />
                      </span>
                      <div className="min-w-0">
                        <button
                          onClick={() =>
                            emp._id && navigate(`/employees/${emp._id}`)
                          }
                          className="block text-left text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                        >
                          {emp.name || "Unknown"}
                        </button>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
                          {t("labels.availableToday")}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[80px] text-right">
                      {emp.department || emp.position || "Team"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                {t("empty.noTeamActivity")}
              </p>
            )}
          </PanelCard>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
