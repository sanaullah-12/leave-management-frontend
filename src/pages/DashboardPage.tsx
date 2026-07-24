import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { leavesAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import Avatar from "../components/Avatar";
import { getUpcomingHolidays } from "../data/holidays";
import AnimatedNumber from "../components/AnimatedNumber";
import { DashboardSkeleton, StatCardsSkeleton } from "../components/Skeletons";
import ApplyLeaveModal from "../components/ApplyLeaveModal";
import { motion } from "framer-motion";
import MeshBackground from "../components/MeshBackground";
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
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "../styles/design-system.css";

/* ------------------------------------------------------------------ */
/*  Presentational helpers — visual only, data is passed in            */
/* ------------------------------------------------------------------ */

type RingColor = "blue" | "amber" | "slate";

// Primary accent hex per color theme — used for the parts that can't be
// styled with CSS classes (SVG chart stroke/gradient, progress-ring stroke).
// Keep these in sync with tailwind.config.js *-600 values.
const THEME_ACCENT: Record<string, string> = {
  blue: "#2563eb",
  indigo: "#4f46e5",
  purple: "#9c5fd1",
  green: "#16a34a",
  custom: "#0284c7",
};

const RING_STYLES: Record<
  RingColor,
  { stroke: string; text: string; iconBg: string; iconText: string }
> = {
  blue: {
    // stroke is overridden at runtime with the active theme accent
    stroke: "#2563eb",
    text: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    stroke: "#ea580c",
    text: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-50 dark:bg-orange-500/10",
    iconText: "text-orange-600 dark:text-orange-400",
  },
  slate: {
    stroke: "#64748b",
    text: "text-slate-600 dark:text-slate-300",
    iconBg: "bg-slate-100 dark:bg-slate-500/10",
    iconText: "text-slate-500 dark:text-slate-300",
  },
};

// A leave-balance / stat card with a progress ring, matching the design.
const RingStatCard: React.FC<{
  label: string;
  value: number | string;
  total?: number | string;
  caption: string;
  percent: number; // 0..100 filled portion of the ring
  color: RingColor;
  icon: React.ReactNode;
  onClick?: () => void;
  strokeOverride?: string; // theme accent, used only for the "blue" ring
}> = ({
  label,
  value,
  total,
  caption,
  percent,
  color,
  icon,
  onClick,
  strokeOverride,
}) => {
  const s = RING_STYLES[color];
  const strokeColor =
    color === "blue" && strokeOverride ? strokeOverride : s.stroke;
  const dash = Math.max(0, Math.min(100, percent));
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br from-white to-slate-50/80 dark:from-gray-800/90 dark:to-gray-800/50 rounded-2xl p-5 shadow-[0_2px_8px_-2px_rgba(16,24,40,0.06),0_4px_16px_-4px_rgba(16,24,40,0.05)] ring-1 ring-gray-200/70 dark:ring-gray-700/60 transition-all duration-300 hover:shadow-[0_8px_24px_-6px_rgba(16,24,40,0.12)] ${
        onClick ? "cursor-pointer hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {label}
          </p>
          <p className="mt-2 flex items-baseline gap-1">
            <span className={`text-3xl font-bold tabular-nums ${s.text}`}>
              {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
            </span>
            {total !== undefined && (
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                / {total}
              </span>
            )}
          </p>
          <p className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            {caption}
          </p>
        </div>

        {/* Progress ring with centered icon */}
        <div className="relative flex-shrink-0 w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <path
              className="stroke-gray-100 dark:stroke-gray-700"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${dash}, 100`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <div
            className={`absolute inset-0 flex items-center justify-center ${s.iconText}`}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

// Small card shell used by the right-column widgets.
const PanelCard: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, action, children, className = "" }) => (
  <div
    className={`bg-gradient-to-br from-white to-slate-50/80 dark:from-gray-800/90 dark:to-gray-800/50 rounded-2xl shadow-[0_2px_8px_-2px_rgba(16,24,40,0.06),0_4px_16px_-4px_rgba(16,24,40,0.05)] ring-1 ring-gray-200/70 dark:ring-gray-700/60 ${className}`}
  >
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {action}
    </div>
    <div className="px-5 pb-5">{children}</div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { colorScheme } = useTheme();
  const accent = THEME_ACCENT[colorScheme] || THEME_ACCENT.blue;
  const [applyOpen, setApplyOpen] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  DATA WIRING — unchanged from the original dashboard                */
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
    return <DashboardSkeleton />;
  }

  const adminStats: any = stats?.data || {};
  const balance: any = leaveBalance?.data?.balance || {};
  const recent: any[] = recentLeaves?.data?.leaves || [];
  const isAdmin = user?.role === "admin";

  /* ------------------------------------------------------------------ */
  /*  DERIVED VIEW DATA — computed only from the data already fetched.   */
  /*  No new network calls, no backend changes.                          */
  /* ------------------------------------------------------------------ */

  // Greeting based on local time (presentational only).
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Leave-trend line, derived from the recent leaves we already have.
  // Buckets recent leaves by month so the chart reflects real data.
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthlyCounts = new Array(12).fill(0);
  recent.forEach((l) => {
    const d = l?.startDate ? new Date(l.startDate) : null;
    if (d && !isNaN(d.getTime())) monthlyCounts[d.getMonth()] += 1;
  });
  const trendData = MONTHS.map((m, i) => ({ month: m, value: monthlyCounts[i] }));

  // Team members for the availability widget — reuse the employees found in
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
      mon: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      day: String(date.getDate()).padStart(2, "0"),
      name: holiday.name,
      sub: `${date.toLocaleString("en-US", { weekday: "long" })} • ${date.getFullYear()}`,
    })
  );

  // The three top ring cards — role aware.
  const ringCards = isAdmin
    ? [
        {
          label: "Total Employees",
          value: adminStats.totalEmployees || 0,
          caption: "Active workforce",
          percent: 100,
          color: "blue" as RingColor,
          icon: <UsersIcon className="w-5 h-5" />,
          onClick: () => navigate("/employees"),
        },
        {
          label: "Pending Requests",
          value: adminStats.pendingLeaves || 0,
          caption: "Awaiting review",
          percent: Math.min(
            ((adminStats.pendingLeaves || 0) /
              Math.max(adminStats.thisMonthLeaves || 1, 1)) *
              100,
            100
          ),
          color: "amber" as RingColor,
          icon: <ClockIcon className="w-5 h-5" />,
          onClick: () => navigate("/leaves?status=pending"),
        },
        {
          label: "This Month",
          value: adminStats.thisMonthLeaves || 0,
          caption: "Leave requests",
          percent: 100,
          color: "slate" as RingColor,
          icon: <CalendarDaysIcon className="w-5 h-5" />,
          onClick: () => navigate("/leaves"),
        },
      ]
    : [
        {
          label: "Annual Leave",
          value: balance.annual?.remaining ?? 0,
          total: balance.annual?.total ?? 0,
          caption: "Days remaining",
          percent: balance.annual?.total
            ? (balance.annual.remaining / balance.annual.total) * 100
            : 0,
          color: "blue" as RingColor,
          icon: <ArrowUpRightIcon className="w-5 h-5" />,
          onClick: () => navigate("/my-leave-activity"),
        },
        {
          label: "Sick Leave",
          value: balance.sick?.used ?? 0,
          total: balance.sick?.total ?? 0,
          caption: "Days used",
          percent: balance.sick?.total
            ? (balance.sick.used / balance.sick.total) * 100
            : 0,
          color: "amber" as RingColor,
          icon: <PlusIcon className="w-5 h-5" />,
          onClick: () => navigate("/my-leave-activity"),
        },
        {
          label: "Casual Leave",
          value: balance.casual?.remaining ?? 0,
          total: balance.casual?.total ?? 0,
          caption: "Days remaining",
          percent: balance.casual?.total
            ? (balance.casual.remaining / balance.casual.total) * 100
            : 0,
          color: "slate" as RingColor,
          icon: <UserIcon className="w-5 h-5" />,
          onClick: () => navigate("/my-leave-activity"),
        },
      ];

  const showCardsLoading = !isAdmin && balanceLoading;

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* ---------------- Hero ---------------- */}
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-gradient-to-br from-white to-slate-50/80 dark:from-gray-800/90 dark:to-gray-800/40 p-6 sm:p-7 shadow-[0_2px_8px_-2px_rgba(16,24,40,0.06),0_4px_16px_-4px_rgba(16,24,40,0.05)]"
      >
        <MeshBackground />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
            >
              {greeting}, {user?.name?.split(" ")[0] || "there"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.13, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-1.5 text-sm text-gray-600 dark:text-gray-300"
            >
              {isAdmin
                ? "Ready to manage your team's leave today?"
                : "Ready to plan your time off?"}
            </motion.p>
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <CalendarDaysIcon className="w-4 h-4" />
              {today}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "employee" && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setApplyOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
              >
                <BoltIcon className="w-4 h-4" />
                Quick Apply
              </motion.button>
            )}
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => (isAdmin ? navigate("/leaves") : setApplyOpen(true))}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {isAdmin ? "View Requests" : "Request Leave"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ---------------- Top ring cards ---------------- */}
      {showCardsLoading ? (
        <StatCardsSkeleton count={3} />
      ) : (
        <motion.div
          variants={staggerItem}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {ringCards.map((c, i) => (
            <RingStatCard key={i} {...c} strokeOverride={accent} />
          ))}
        </motion.div>
      )}

      {/* ---------------- Main two-column grid ---------------- */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Left column (spans 2) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Leave Trends chart */}
          <div className="bg-gradient-to-br from-white to-slate-50/80 dark:from-gray-800/90 dark:to-gray-800/50 rounded-2xl shadow-[0_2px_8px_-2px_rgba(16,24,40,0.06),0_4px_16px_-4px_rgba(16,24,40,0.05)] ring-1 ring-gray-200/70 dark:ring-gray-700/60 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Leave Trends
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isAdmin
                    ? "Company leave activity across recent requests"
                    : "Your leave activity across recent requests"}
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300">
                {new Date().getFullYear()} (Current)
              </span>
            </div>
            <div className="h-56 w-full">
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
                    cursor={{ stroke: "#c7d2fe", strokeWidth: 1 }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(v: any) => [`${v} requests`, "Leaves"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={accent}
                    strokeWidth={3}
                    fill="url(#leaveTrend)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <PanelCard
            title="Recent Activity"
            action={
              <button
                onClick={() => navigate("/leaves")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
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
                  const dotColor =
                    leave.status === "approved"
                      ? "bg-emerald-500"
                      : leave.status === "rejected"
                      ? "bg-red-500"
                      : leave.status === "pending"
                      ? "bg-amber-500"
                      : "bg-blue-500";
                  const empName =
                    typeof leave.employee === "object" && leave.employee?.name
                      ? leave.employee.name
                      : null;
                  return (
                    <li key={leave._id} className="flex gap-3">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}
                      />
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {isAdmin && empName ? `${empName} • ` : ""}
                          {leave.totalDays}{" "}
                          {leave.totalDays === 1 ? "day" : "days"}
                          {" • "}
                          <span className="capitalize">{leave.status}</span>
                        </p>
                        {leave.status === "approved" && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200/60 dark:ring-emerald-500/20">
                            <CheckCircleIcon className="w-3 h-3" />
                            Approved
                          </span>
                        )}
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
                  No recent activity
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Requests will appear here as they come in.
                </p>
              </div>
            )}
          </PanelCard>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Public Holidays */}
          <PanelCard
            title="Public Holidays"
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
              View Company Calendar
            </button>
          </PanelCard>

          {/* Team Availability */}
          <PanelCard title="Team Availability">
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
                          Available Today
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
                No team activity to show yet.
              </p>
            )}
          </PanelCard>
        </div>
      </motion.div>

      <ApplyLeaveModal open={applyOpen} onClose={() => setApplyOpen(false)} />
    </motion.div>
  );
};

export default DashboardPage;
