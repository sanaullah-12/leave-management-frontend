import React from "react";
import { CARD, CARD_HOVER } from "../lib/surfaces";
import { accentFor, accentSoftFor } from "../lib/themeTokens";
import { AccentEdge } from "../components/ui/CardAccents";
import { StatCard, type StatAccent } from "../components/ui/StatCard";
import SectionHeader from "../components/ui/SectionHeader";
import { sectionIllustration } from "../components/ui/illustrations";
import { useAuth } from "../context/AuthContext";
import AttendancePieCard from "../components/dashboard/AttendancePieCard";
import AttendanceBoard from "../components/attendance/AttendanceBoard";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useFormatters } from "../i18n/useFormatters";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { attendanceAPI, leavesAPI, usersAPI } from "../services/api";
import { isoDay } from "../lib/attendancePeriod";
import useMediaQuery from "../hooks/useMediaQuery";
import MobileDashboard from "../components/dashboard/mobile/MobileDashboard";

/**
 * How a reported day reads in the Team Availability panel.
 *
 * `available` answers "can I reach this person today", which is why Late sits
 * with On time and Work from home rather than with the absences - a late
 * arrival is still an arrival, and the panel is not where the arrival rule is
 * enforced. `rank` sorts the states that need attention to the top, because
 * the panel is read to find out who is missing and the collapsed preview only
 * shows the first few rows.
 *
 * Keys are the server's own status words, so nothing here has to restate how
 * a day was judged.
 */
const AVAILABILITY: Record<
  string,
  { labelKey: string; available: boolean; rank: number; dot: string; text: string }
> = {
  Absent: {
    labelKey: "labels.absentToday",
    available: false,
    rank: 0,
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
  "On leave": {
    labelKey: "labels.onLeaveToday",
    available: false,
    rank: 1,
    dot: "bg-cyan-600",
    text: "text-cyan-700 dark:text-cyan-400",
  },
  Late: {
    labelKey: "labels.lateToday",
    available: true,
    rank: 2,
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  "Work from home": {
    labelKey: "labels.remoteToday",
    available: true,
    rank: 3,
    dot: "bg-indigo-500",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  "On time": {
    labelKey: "labels.presentToday",
    available: true,
    rank: 4,
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
};

/**
 * The reading for somebody the day has nothing to say about - a weekend, a day
 * the device has not reported yet, or an account with no device code. It keeps
 * the roster listed under the old wording rather than inventing an absence out
 * of missing data.
 */
const AVAILABILITY_UNKNOWN = {
  labelKey: "labels.availableToday",
  available: true,
  rank: 4,
  dot: "bg-emerald-500",
  text: "text-emerald-600 dark:text-emerald-400",
};
import LoadingSpinner from "../components/LoadingSpinner";
import Avatar from "../components/Avatar";
import { getUpcomingHolidays } from "../data/holidays";
import AnimatedNumber from "../components/AnimatedNumber";
import { StatCardsSkeleton } from "../components/Skeletons";
import LogoLoader from "../components/LogoLoader";
import DashboardAnnouncements from "../components/DashboardAnnouncements";
import PushNotificationToggle from "../components/notifications/PushNotificationToggle";
import { motion } from "framer-motion";
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
import useChartMotion from "../hooks/useChartMotion";
import { LoadSwap } from "../components/ui/motion";

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

/** A heroicon, before anything has decided how big to draw it. */
type IconComponent = React.ComponentType<{ className?: string }>;

// Compact KPI tile: label + big value on the left, accent icon chip on
// the right, supporting caption below. Mirrors the reference top row.
/**
 * The dashboard's KPI tiles, on the product's shared StatCard.
 *
 * `caption` is accepted but not shown: the shared tile is two lines - label
 * over figure - so a KPI row is the same height on every screen.
 */
const KpiCard: React.FC<{
  label: string;
  value: number | string;
  suffix?: string;
  caption?: string;
  /* The icon arrives as a component, not a node: the phone layout draws the
     same list at 14px, and a node sized by whoever built the list can only be
     one of those two sizes. */
  icon: IconComponent;
  accent?: StatAccent;
  onClick?: () => void;
}> = ({ label, value, suffix, icon: Icon, accent, onClick }) => (
  <StatCard
    label={label}
    value={value}
    suffix={suffix}
    icon={<Icon className="w-5 h-5" />}
    accent={accent}
    onClick={onClick}
  />
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
  icon: IconComponent;
  /** Largest value in the group - the bars are relative to it. */
  max: number;
}> = ({ label, value, icon: Icon, max }) => (
  <div>
    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
      <span className="text-blue-600 dark:text-blue-400">
        <Icon className="w-4 h-4" />
      </span>
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
  /* Recharts animates by default, to its own timing. See useChartMotion. */
  const chartMotion = useChartMotion();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colorScheme, isDark } = useTheme();
  /* The same breakpoint the attendance page switches on, so the two never
     disagree about what counts as a phone. */
  const isPhoneLayout = useMediaQuery("(max-width: 1023px)");
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

  /**
   * The workforce, for the availability panel.
   *
   * Shares its key with the team page so the roster is fetched once per
   * session. Admin only - the endpoint is, and an employee has no roster to
   * read anyway.
   */
  const { data: employeeList } = useQuery({
    queryKey: ["employees"],
    queryFn: () => usersAPI.getEmployees(1, 100),
    enabled: user?.role === "admin",
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Approved leave, so the panel can say who is actually away.
   *
   * Availability was previously asserted rather than checked: everybody listed
   * was labelled available regardless of whether they were on leave that day.
   */
  const { data: approvedLeaves } = useQuery({
    queryKey: ["approved-leaves"],
    queryFn: () => leavesAPI.getLeaves(1, 100, "approved"),
    enabled: user?.role === "admin",
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  /**
   * Today's attendance, so the availability panel can read who is actually in
   * rather than assume it. Same endpoint and day the attendance board further
   * up the page already loads, so the two never disagree.
   */
  const todayIso = React.useMemo(() => isoDay(new Date()), []);

  const { data: rosterToday } = useQuery({
    queryKey: ["roster-day", todayIso],
    queryFn: () => attendanceAPI.getRosterDay(todayIso, todayIso, "day"),
    enabled: user?.role === "admin",
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  /** Expands the availability panel past its first few rows. */
  const [showAllTeam, setShowAllTeam] = React.useState(false);

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

  /*
   * Each month split by how its requests were decided, as well as totalled.
   *
   * `value` is every request in the month and is what the desktop chart draws.
   * The split beside it is what lets the phone draw the same two-series chart
   * the attendance screen uses - granted against still-waiting - without
   * asking the server for anything it has not already sent. Rejected is
   * counted here so the tooltip can report it; see the mobile charts screen
   * for why it is not a third line.
   */
  const monthly = MONTHS.map(() => ({
    value: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  }));
  recent.forEach((l) => {
    const d = l?.startDate ? new Date(l.startDate) : null;
    if (!d || isNaN(d.getTime())) return;
    const bucket = monthly[d.getMonth()];
    bucket.value += 1;
    if (l?.status === "approved") bucket.approved += 1;
    else if (l?.status === "pending") bucket.pending += 1;
    else if (l?.status === "rejected") bucket.rejected += 1;
  });
  const trendData = MONTHS.map((m, i) => ({ month: m, ...monthly[i] }));

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
          // Every quota type together, not just annual - the number an
          // employee actually plans against is what is left of the whole
          // allowance.
          label: t("gauges.totalBalance"),
          percent: quotaTotal ? (remainingTotal / quotaTotal) * 100 : 0,
          big: remainingTotal,
          small: `of ${quotaTotal} days remaining`,
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
        { label: t("kpi.approved"), value: approved, icon: CheckCircleIcon },
        { label: t("labels.pending"), value: pending, icon: ClockIcon },
        { label: t("kpi.thisMonth"), value: adminStats.thisMonthLeaves || 0, icon: CalendarDaysIcon },
        { label: t("labels.employees"), value: adminStats.totalEmployees || 0, icon: UsersIcon },
      ]
    : [
        { label: t("gauges.daysUsed"), value: usedTotal, icon: ChartBarIcon },
        { label: t("gauges.remaining"), value: remainingTotal, icon: CheckCircleIcon },
        { label: t("labels.requests"), value: recent.length, icon: CalendarDaysIcon },
        { label: t("labels.pending"), value: recent.filter((l) => l?.status === "pending").length, icon: ClockIcon },
      ];

  // Bars in the mini-stat row are drawn relative to the biggest tile.
  const miniStatMax = Math.max(...miniStats.map((m) => m.value), 1);

  /**
   * Who is in today.
   *
   * An admin gets the workforce. It used to be built from whoever appeared in
   * the last five leave requests, which is not a team: when one person filed
   * the five most recent requests, the panel listed that one person and called
   * it the company's availability.
   *
   * An employee has no roster to read, so they keep the people their own
   * recent requests name.
   *
   * The state beside each name comes from today's punches, not from the
   * roster: every name without an approved leave used to be labelled
   * "available today", which said the same thing about somebody at their desk
   * and somebody who never arrived.
   */
  const dayOf = (value: any) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : isoDay(date);
  };

  const onLeaveToday = new Set<string>(
    ((approvedLeaves as any)?.data?.leaves || [])
      .filter((l: any) => {
        const id = l?.employee?._id;
        const from = dayOf(l?.startDate);
        const to = dayOf(l?.endDate);
        return id && from && to && from <= todayIso && todayIso <= to;
      })
      .map((l: any) => String(l.employee._id))
  );

  const rosterEmployees: any[] = ((employeeList as any)?.data?.employees || [])
    .filter((emp: any) => emp?.isActive !== false && emp?.status !== "inactive");

  const teamFromLeaves = Array.from(
    new Map(
      recent
        .filter((l) => l && typeof l.employee === "object" && l.employee?._id)
        .map((l) => [l.employee._id, l.employee])
    ).values()
  );

  /**
   * How today counted for each person the roster read covers, keyed by the
   * device code - `rows[].employeeId` is the code the machine punches under,
   * not the account id the rest of this page joins on.
   */
  const attendanceToday = new Map<string, string>(
    (((rosterToday as any)?.data?.rows || []) as any[])
      .filter((row) => row?.employeeId && row?.date === todayIso)
      .map((row) => [String(row.employeeId), String(row.status)])
  );

  /**
   * Availability is only read off attendance when there is attendance to read.
   * A weekend, a day the device has not reported yet and a company with no
   * device at all all send no rows, and calling the entire workforce absent on
   * that silence would be a worse answer than the one this replaces.
   */
  const dayWasReported = attendanceToday.size > 0;

  /**
   * The workforce that read covers. It is narrower than the roster listed
   * here: the attendance workforce is accounts that are active and carry a
   * device code, so an invite nobody has accepted yet is in this panel but not
   * in that read - and reporting it missing every morning would be a fact
   * about the invite, not about the day.
   */
  const attendanceCovers = new Set<string>(
    (((rosterToday as any)?.data?.byEmployee || []) as any[])
      .filter((entry) => entry?.employeeId)
      .map((entry) => String(entry.employeeId))
  );

  const availabilityOf = (emp: any) => {
    const code = emp?.employeeId ? String(emp.employeeId) : null;
    const reported = code && dayWasReported ? attendanceToday.get(code) : undefined;

    // A punch decides its own day, so the device reading outranks an approved
    // leave the person came in through anyway - the precedence the attendance
    // page already applies.
    if (reported) return AVAILABILITY[reported] ?? AVAILABILITY_UNKNOWN;
    if (onLeaveToday.has(String(emp?._id))) return AVAILABILITY["On leave"];

    // Absent is a claim about a day that was read, about somebody that read
    // was looking for.
    return code && dayWasReported && attendanceCovers.has(code)
      ? AVAILABILITY.Absent
      : AVAILABILITY_UNKNOWN;
  };

  // Unavailable first: the panel is read to find out who is missing today.
  const teamMembers = (isAdmin && rosterEmployees.length
    ? rosterEmployees
    : teamFromLeaves
  )
    .map((emp: any) => ({ ...emp, availability: availabilityOf(emp) }))
    .sort(
      (a: any, b: any) =>
        a.availability.rank - b.availability.rank ||
        (a.name || "").localeCompare(b.name || "")
    );

  const TEAM_PREVIEW = 3;
  const visibleTeam = showAllTeam
    ? teamMembers
    : teamMembers.slice(0, TEAM_PREVIEW);

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
          // The other three tiles all count leave requests, so a headcount in
          // the first slot was the odd one out: it made the row read as four
          // measures of the same thing when it was three plus a total.
          // Requests raised is the figure the rest of the row is a split of.
          label: t("kpi.totalRequests"),
          value: totalReq,
          caption: t("kpi.allLeaveRequests"),
          icon: ChartBarIcon,
          onClick: () => navigate("/leaves"),
        },
        {
          label: t("kpi.pendingRequests"),
          value: adminStats.pendingLeaves || 0,
          caption: t("kpi.awaitingReview"),
          icon: ClockIcon,
          onClick: () => navigate("/leaves?status=pending"),
        },
        {
          label: t("kpi.thisMonth"),
          value: adminStats.thisMonthLeaves || 0,
          caption: t("kpi.leaveRequestsLogged"),
          icon: CalendarDaysIcon,
          onClick: () => navigate("/leaves"),
        },
        {
          label: t("kpi.approved"),
          value: approved,
          caption: t("kpi.requestsGranted"),
          icon: CheckCircleIcon,
          onClick: () => navigate("/leaves?status=approved"),
        },
      ]
    : [
        {
          label: t("kpi.annualLeave"),
          value: balance.annual?.remaining ?? 0,
          suffix: `/ ${balance.annual?.total ?? 0}`,
          caption: t("kpi.daysRemaining"),
          icon: ArrowUpRightIcon,
          onClick: () => navigate("/my-leave-activity"),
        },
        {
          label: t("kpi.sickLeave"),
          value: balance.sick?.used ?? 0,
          suffix: `/ ${balance.sick?.total ?? 0}`,
          caption: t("kpi.daysUsed"),
          icon: PlusIcon,
          onClick: () => navigate("/my-leave-activity"),
        },
        {
          label: t("kpi.casualLeave"),
          value: balance.casual?.remaining ?? 0,
          suffix: `/ ${balance.casual?.total ?? 0}`,
          caption: t("kpi.daysRemaining"),
          icon: UserIcon,
          onClick: () => navigate("/my-leave-activity"),
        },
        {
          label: t("kpi.daysTaken"),
          value: usedTotal,
          caption: t("kpi.acrossAllLeaveTypes"),
          icon: ChartBarIcon,
          onClick: () => navigate("/my-leave-activity"),
        },
      ];

  const showCardsLoading = !isAdmin && balanceLoading;

  /**
   * The phone reading of everything above.
   *
   * Placed here rather than at the top of the component on purpose: the two
   * layouts are the same dashboard, so they have to be built from the same
   * figures. Branching before the derivations would have let a count drift
   * between them one edit at a time - see components/dashboard/mobile.
   */
  if (isPhoneLayout) {
    return (
      <MobileDashboard
        isAdmin={isAdmin}
        role={user?.role}
        employeeId={user?.employeeId}
        eyebrow={t("greeting.welcomeBack")}
        greeting={`${greeting}, ${user?.name?.split(" ")[0] || "there"}`}
        today={today}
        primaryAction={{
          label: isAdmin ? t("hero.viewRequests") : t("hero.requestLeave"),
          onClick: () => navigate(isAdmin ? "/leaves" : "/apply-leave"),
        }}
        kpis={kpis}
        gauges={gauges}
        trend={trendData}
        types={typeData}
        miniStats={miniStats}
        trendCaption={
          isAdmin ? t("sections.companyActivity") : t("sections.yourActivity")
        }
        typesCaption={
          isAdmin
            ? t("sections.thisMonthByCategory")
            : t("sections.daysUsedByCategory")
        }
        /* An admin's bars count requests raised; an employee's count days
           they have used. Same chart, two different things being measured. */
        typesUnit={isAdmin ? "requests" : "days"}
        recent={recent}
        recentLoading={leavesLoading}
        holidays={publicHolidays}
        team={teamMembers}
        statusLabel={(status) =>
          status === "approved"
            ? t("labels.approved")
            : status === "pending"
            ? t("labels.pending")
            : status || "-"
        }
        availabilityLabel={(key) => t(key)}
        onOpenLeaves={() => navigate("/leaves")}
        onOpenCalendar={() => navigate("/leave-calendar")}
        onOpenAttendance={() => navigate("/attendance")}
        onOpenEmployee={(id) => navigate(`/employees/${id}`)}
        tabLabels={{
          overview: t("tabs.overview"),
          charts: t("tabs.charts"),
          review: t("tabs.review"),
          activity: t("tabs.activity"),
        }}
        listLabels={{
          recentActivity: t("sections.recentActivity"),
          viewAll: t("actions.viewAll"),
          publicHolidays: t("sections.publicHolidays"),
          viewCalendar: t("actions.viewCompanyCalendar"),
          teamAvailability: t("sections.teamAvailability"),
          seeMore: t("actions.seeMore"),
          seeLess: t("actions.seeLess"),
          noRecentActivity: t("empty.noRecentActivity"),
          requestsWillAppear: t("empty.requestsWillAppear"),
          noTeamActivity: t("empty.noTeamActivity"),
        }}
        accent={accent}
        accentSoft={accentSoft}
        isDark={isDark}
      />
    );
  }

  return (
    <motion.div
      className="space-y-5"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* ---------------- Banner ---------------- */}
      <motion.div variants={staggerItem}>
        <SectionHeader
          variant="dashboard"
          eyebrow={t("greeting.welcomeBack")}
          title={`${greeting}, ${user?.name?.split(" ")[0] || "there"}`}
          description={isAdmin ? t("hero.adminSub") : t("hero.employeeSub")}
          badge={
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              {today}
            </span>
          }
          illustration={sectionIllustration("dashboard")}
          action={
            <>
              {user?.role === "employee" && (
                <button
                  type="button"
                  onClick={() => navigate("/apply-leave")}
                  className="sh-action"
                >
                  <BoltIcon className="h-4 w-4" />
                  {t("actions.quickApply")}
                </button>
              )}

              {/* Browser/OS alerts for this device. Renders nothing when the
                  browser has no Push API or the server has no VAPID keys. */}
              <PushNotificationToggle />

              <button
                type="button"
                onClick={() => navigate(isAdmin ? "/leaves" : "/apply-leave")}
                className="sh-action-primary"
              >
                <PlusIcon className="h-4 w-4" />
                {isAdmin ? t("hero.viewRequests") : t("hero.requestLeave")}
              </button>
            </>
          }
        />
      </motion.div>

      {/* ---------------- Top KPI row (4-up) ---------------- */}
      {/* The figures cross over their own placeholders. The skeleton is
          already the right shape, so nothing moves - only the shimmer gives
          way to the numbers, which then roll up from zero on their own. */}
      <LoadSwap
        loading={showCardsLoading}
        skeleton={<StatCardsSkeleton count={4} />}
      >
        <motion.div
          variants={staggerItem}
          className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
        >
          {kpis.map((c, i) => (
            <KpiCard key={i} {...c} accent={i % 2 === 0 ? "indigo" : "teal"} />
          ))}
        </motion.div>
      </LoadSwap>

      {/* ---------------- Announcements highlight (fresh 24h + pinned) ---------------- */}
      <DashboardAnnouncements />

      {/* ---------------- Today's attendance ---------------- */}
      {/* Opens on today, which is the question this section exists to answer.
          The period filter widens it without leaving the dashboard. */}
      <motion.div variants={staggerItem}>
        <AttendanceBoard
          variant="dashboard"
          role={user?.role}
          footer={
            <button
              type="button"
              onClick={() => navigate("/attendance")}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Open the attendance page
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </button>
          }
        />
      </motion.div>

      {/* ---------------- Attendance + gauges ---------------- */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
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
                  {...chartMotion}
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
                    {...chartMotion}
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
      {/* `items-start` so each column keeps its own height. Stretched, the
          activity card grew to match the holidays + availability stack beside
          it, which left most of it empty whenever there were only a few
          recent requests - and there are at most five. */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 items-start lg:grid-cols-3 gap-5"
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
              className="mt-4 w-full py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
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
            {teamMembers.length > 0 ? (
              <>
                {/* Expanded, the list scrolls rather than pushing the column
                    past the card beside it. */}
                <ul
                  className={`space-y-1 ${
                    showAllTeam ? "max-h-80 overflow-y-auto pr-1" : ""
                  }`}
                >
                  {visibleTeam.map((emp: any) => (
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
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-800 ${emp.availability.dot}`}
                          />
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
                          <p
                            className={`text-xs font-medium truncate ${emp.availability.text}`}
                          >
                            {t(emp.availability.labelKey)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[80px] text-right">
                        {emp.department?.name ||
                          emp.department ||
                          emp.position ||
                          "Team"}
                      </span>
                    </li>
                  ))}
                </ul>

                {teamMembers.length > TEAM_PREVIEW && (
                  <button
                    type="button"
                    onClick={() => setShowAllTeam((open) => !open)}
                    className="mt-2 w-full rounded-xl py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                  >
                    {showAllTeam
                      ? t("actions.seeLess")
                      : `${t("actions.seeMore")} (${
                          teamMembers.length - TEAM_PREVIEW
                        })`}
                  </button>
                )}
              </>
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
