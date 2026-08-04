import React from "react";
import { CARD } from "../lib/surfaces";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { leavesAPI } from "../services/api";
import EmployeeLeaveActivity from "../components/EmployeeLeaveActivity";
import Avatar from "../components/Avatar";
import {
  ClipboardDocumentListIcon,
  InformationCircleIcon,
  SunIcon,
  HeartIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";


// Per-leave-type accent + watermark icon (same language as the report page).
const LEAVE_META = {
  annual: { label: "Annual Leave", hex: "#10b981", icon: SunIcon },
  sick: { label: "Sick Leave", hex: "#f43f5e", icon: HeartIcon },
  casual: { label: "Casual Leave", hex: "#6366f1", icon: Square2StackIcon },
} as const;
type LeaveKey = keyof typeof LEAVE_META;
const LEAVE_ORDER: LeaveKey[] = ["annual", "sick", "casual"];
const POLICY_CORE: Record<LeaveKey, number> = { annual: 10, sick: 8, casual: 10 };

// Hollow accent ring (arc only) with a soft glow.
const ProgressRing: React.FC<{ percent: number; color: string }> = ({
  percent,
  color,
}) => {
  const p = Math.max(0, Math.min(100, percent));
  const ARC =
    "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";
  return (
    <div className="relative h-16 w-16 flex-shrink-0">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
        <path
          className="stroke-gray-200 dark:stroke-white/10"
          d={ARC}
          fill="none"
          strokeWidth="4"
        />
        <path
          d={ARC}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${p}, 100`}
          style={{
            transition: "stroke-dasharray 0.7s ease",
            filter: `drop-shadow(0 0 4px ${color}66)`,
          }}
        />
      </svg>
    </div>
  );
};

// Glowing leave-balance card (view-only) — matches the report/detail design.
const LeaveRingCard: React.FC<{
  leaveKey: LeaveKey;
  total: number;
  used: number;
  remaining: number;
}> = ({ leaveKey, total, used, remaining }) => {
  const meta = LEAVE_META[leaveKey];
  const Icon = meta.icon;
  const percent = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const usedPct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-[var(--card-surface)] p-6 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1"
      style={{
        border: `1px solid ${meta.hex}55`,
        boxShadow: `inset 0 1px 0 ${meta.hex}22, 0 0 0 1px ${meta.hex}1f, 0 14px 34px -14px ${meta.hex}66`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: `linear-gradient(to bottom, ${meta.hex}14, transparent)` }}
      />
      <Icon
        className="pointer-events-none absolute -bottom-5 -right-4 h-28 w-28"
        style={{ color: meta.hex, opacity: 0.1 }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            {meta.label}
          </h4>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Allocated: {total} Days
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: meta.hex }}
          >
            {percent}%
          </span>
          <ProgressRing percent={percent} color={meta.hex} />
        </div>
      </div>

      <div className="relative mt-5">
        <span
          className="text-5xl font-extrabold leading-none tabular-nums"
          style={{ color: meta.hex }}
        >
          {remaining}
        </span>
        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          Remaining Days
        </p>
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${usedPct}%`, backgroundColor: meta.hex }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            Used {used} of {total} days
          </p>
        </div>
      </div>
    </div>
  );
};

const SectionHeading: React.FC<{
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ children, action }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <span className="h-6 w-1.5 rounded-full bg-blue-500" />
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        {children}
      </h3>
    </div>
    {action}
  </div>
);

const MyLeaveActivityPage: React.FC = () => {
  const { user } = useAuth();

  const { data: leaveBalance } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => leavesAPI.getLeaveBalance(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Please login to view your leave activity.
        </p>
      </div>
    );
  }

  const balance: Record<string, { total: number; used: number; remaining: number }> =
    (leaveBalance as any)?.data?.balance || {};

  // Policy fallback so the balance always renders.
  const coreBal = (key: LeaveKey) => {
    const b = balance[key];
    if (b) return b;
    const t = POLICY_CORE[key];
    return { total: t, used: 0, remaining: t };
  };

  const totalRemaining = LEAVE_ORDER.reduce((s, k) => s + coreBal(k).remaining, 0);
  const totalAllocated = LEAVE_ORDER.reduce((s, k) => s + coreBal(k).total, 0);

  const departmentName =
    typeof user.department === "object" && (user.department as any)?.name
      ? (user.department as any).name
      : user.department;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/25">
            <ClipboardDocumentListIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              My Leave Activity
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Track your requests, approvals, and leave history.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {departmentName} • {user.position}
            </p>
          </div>
          <Avatar
            src={user.profilePicture}
            name={user.name}
            size="md"
            className="ring-2 ring-blue-500/20"
          />
        </div>
      </div>

      {/* Leave balance rings */}
      <div className="space-y-4">
        <SectionHeading
          action={
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200/70 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
              {totalRemaining} of {totalAllocated} days left
            </span>
          }
        >
          Leave Balance
        </SectionHeading>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {LEAVE_ORDER.map((key) => {
            const b = coreBal(key);
            return (
              <LeaveRingCard
                key={key}
                leaveKey={key}
                total={b.total}
                used={b.used}
                remaining={b.remaining}
              />
            );
          })}
        </div>
      </div>

      {/* Activity (existing functionality — untouched) */}
      <div className="space-y-4">
        <SectionHeading>Leave Activity</SectionHeading>
        <EmployeeLeaveActivity employeeId={user.id} isCurrentUser={true} />
      </div>

      {/* Read-only info */}
      <div className={`${CARD} p-6`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <InformationCircleIcon className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Employee view — read only
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
              <li>• View all your leave requests and their current status.</li>
              <li>• Track your leave balance and usage throughout the year.</li>
              <li>• Review approval / rejection comments from your manager.</li>
              <li>
                • To submit a new request, use the{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Apply Leave
                </span>{" "}
                page.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLeaveActivityPage;
