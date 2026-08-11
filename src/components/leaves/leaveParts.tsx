import React from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Pieces shared by the mobile leave list and its detail sheet.
 *
 * Both surfaces show the same request in two densities, so the tile, the
 * status pill, the month rail and the per-type colours live here rather than
 * being written twice and drifting apart.
 */

export interface LeaveAttachment {
  filename?: string;
  originalName?: string;
  mimetype?: string;
  size?: number;
  path?: string;
}

export interface LeaveRow {
  _id: string;
  employee:
    | { _id?: string; name?: string; employeeId?: string; profilePicture?: string | null }
    | string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: "pending" | "approved" | "rejected" | string;
  reason?: string;
  reviewComments?: string;
  reviewedBy?: { name?: string } | string | null;
  reviewedDate?: string;
  appliedDate?: string;
  createdAt?: string;
  attachments?: LeaveAttachment[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Per-leave-type accent for the rail ticks and the type tag. */
const TYPE_TONE: Record<string, { tick: string; tag: string }> = {
  annual: { tick: "bg-blue-500", tag: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  sick: { tick: "bg-rose-500", tag: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  casual: { tick: "bg-emerald-500", tag: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  emergency: { tick: "bg-amber-500", tag: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  maternity: { tick: "bg-violet-500", tag: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  paternity: { tick: "bg-violet-500", tag: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  unpaid: { tick: "bg-gray-400", tag: "bg-gray-500/10 text-gray-600 dark:text-gray-300" },
};

export const toneFor = (type: string) =>
  TYPE_TONE[type?.toLowerCase()] || TYPE_TONE.annual;

export const employeeOf = (leave: LeaveRow) =>
  typeof leave.employee === "object" && leave.employee
    ? leave.employee
    : { name: "Employee", employeeId: "", profilePicture: null };

/**
 * A 42px rounded-square tile of initials, not a circle.
 *
 * The squircle belongs to the same shape family as the tags and buttons on the
 * card; a circle reads as borrowed from elsewhere. Initials rather than photos
 * keep every row the same visual weight down a long list.
 */
export const InitialsTile: React.FC<{ name?: string }> = ({ name }) => {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[14px] text-[13px] font-extrabold tracking-wide text-white"
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--accent) 78%, white), var(--accent))",
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};

const STATUS_STYLE: Record<string, { pill: string; Icon: typeof ClockIcon }> = {
  pending: { pill: "bg-amber-500/12 text-amber-600 dark:text-amber-400", Icon: ClockIcon },
  approved: { pill: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400", Icon: CheckCircleIcon },
  rejected: { pill: "bg-rose-500/12 text-rose-600 dark:text-rose-400", Icon: XCircleIcon },
};

export const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold capitalize ${s.pill}`}
    >
      <s.Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
};

const startOfDay = (value: string) => {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const formatDay = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};

/**
 * The month rail: one tick per day of the request's start month, with the
 * requested run raised and tinted. The shape of a leave - how long, and where
 * in the month - reads instantly, which two formatted dates never do.
 *
 * A request spilling into the next month gets an arrow on the end date rather
 * than a second rail, which would double the height for an uncommon case.
 */
export const MonthRail: React.FC<{ leave: LeaveRow }> = ({ leave }) => {
  const start = startOfDay(leave.startDate);
  const end = startOfDay(leave.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const year = start.getFullYear();
  const month = start.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const tone = toneFor(leave.leaveType);
  const spillsOver = end.getMonth() !== month || end.getFullYear() !== year;

  // Derived from the dates, never from `totalDays`, so the number beside the
  // rail can never contradict the run of ticks below it. The stored total may
  // legitimately exclude weekends, which next to a calendar span looks wrong.
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
          {MONTHS[month]} {year}
        </span>
        <span className="text-[12px] font-bold tabular-nums text-gray-900 dark:text-gray-100">
          {spanDays}{" "}
          <span className="font-normal text-gray-400 dark:text-gray-500">
            {spanDays === 1 ? "day" : "days"}
          </span>
        </span>
      </div>

      <div className="flex h-4 items-end gap-[2px]" aria-hidden="true">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = new Date(year, month, i + 1);
          const inRange = day >= start && day <= end;
          const isToday =
            `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}` === todayKey;
          return (
            <span
              key={i}
              className={`relative flex-1 rounded-[2px] ${
                inRange ? `h-4 ${tone.tick}` : "h-2 bg-gray-200 dark:bg-white/10"
              }`}
            >
              {isToday && (
                <span className="absolute -bottom-[7px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-gray-900 dark:bg-white" />
              )}
            </span>
          );
        })}
      </div>

      <div className="mt-2.5 flex justify-between text-[12px] text-gray-500 dark:text-gray-400">
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {formatDay(leave.startDate)}
        </span>
        <span>
          {spillsOver && <span className="text-gray-400">&rarr; </span>}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {formatDay(leave.endDate)}
          </span>
        </span>
      </div>
    </div>
  );
};
