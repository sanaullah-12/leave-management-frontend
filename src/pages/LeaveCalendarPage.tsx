import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { leavesAPI } from "../services/api";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import LogoLoader from "../components/LogoLoader";
import MobileLeaveCalendar from "../components/calendar/MobileLeaveCalendar";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { getHoliday } from "../data/holidays";
import "../styles/design-system.css";

const TYPE_DOT: Record<string, string> = {
  annual: "bg-blue-500",
  sick: "bg-red-500",
  casual: "bg-emerald-500",
  maternity: "bg-pink-500",
  paternity: "bg-indigo-500",
  emergency: "bg-orange-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LeaveCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => new Date());

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-leaves"],
    queryFn: () => leavesAPI.getLeaves(1, 200),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const leaves: any[] = (data as any)?.data?.leaves || [];

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  // Public holidays that fall within the currently-viewed month.
  const monthHolidays = useMemo(
    () =>
      days
        .filter((d) => isSameMonth(d, cursor))
        .map((d) => ({ date: d, holiday: getHoliday(d) }))
        .filter((x): x is { date: Date; holiday: NonNullable<ReturnType<typeof getHoliday>> } =>
          x.holiday !== null
        ),
    [days, cursor]
  );

  // Return the leaves that cover a given day (approved or pending only)
  const leavesOnDay = (day: Date) =>
    leaves.filter((lv) => {
      if (lv.status === "rejected") return false;
      const s = new Date(lv.startDate);
      const e = new Date(lv.endDate);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return day >= s && day <= e;
    });

  const nameOf = (lv: any) =>
    typeof lv.employee === "object" && lv.employee?.name
      ? lv.employee.name.split(" ")[0]
      : lv.leaveType;

  if (isLoading) {
    return <LogoLoader label="Loading calendar..." />;
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Mobile: month grid + agenda, in the Leave Requests design language. */}
      <MobileLeaveCalendar
        leaves={leaves as any}
        cursor={cursor}
        onCursorChange={setCursor}
      />

      {/* Header (desktop) */}
      <div className="hidden flex-col gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Leave Calendar
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {user?.role === "admin"
              ? "Team leave across the month"
              : "Your scheduled leave across the month"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="btn-secondary !px-2.5"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <span className="min-w-[10rem] text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
            {format(cursor, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="btn-secondary !px-2.5"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <button onClick={() => setCursor(new Date())} className="btn-secondary ml-1">
            Today
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="hidden flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400 lg:flex">
        {Object.keys(TYPE_DOT).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 capitalize">
            <span className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT[t]}`} />
            {t}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Public holiday
        </span>
      </div>

      {/* Calendar grid (desktop) */}
      <div className="hidden surface-card overflow-hidden lg:block">
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700/60">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());
            const dayLeaves = leavesOnDay(day);
            const holiday = getHoliday(day);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[6.5rem] border-b border-r border-gray-100 dark:border-gray-700/50 p-2 ${
                  holiday && inMonth
                    ? "bg-rose-50/70 dark:bg-rose-500/5"
                    : inMonth
                    ? "bg-white dark:bg-gray-800/40"
                    : "bg-gray-50/60 dark:bg-gray-900/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${
                      isToday
                        ? "bg-blue-600 font-semibold text-white"
                        : holiday && inMonth
                        ? "font-semibold text-rose-600 dark:text-rose-400"
                        : inMonth
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {holiday && inMonth && (
                  <div
                    title={holiday.name}
                    className="mt-1 truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-rose-700 bg-rose-100/70 dark:bg-rose-500/10 dark:text-rose-300"
                  >
                    {holiday.name}
                  </div>
                )}

                <div className="mt-1 space-y-1">
                  {dayLeaves.slice(0, 3).map((lv) => (
                    <div
                      key={lv._id}
                      title={`${nameOf(lv)} - ${lv.leaveType} (${lv.status})`}
                      className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] ${
                        lv.status === "pending"
                          ? "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300"
                          : "bg-gray-50 dark:bg-gray-700/40 text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 flex-shrink-0 rounded-full ${
                          TYPE_DOT[lv.leaveType] || "bg-gray-400"
                        } ${lv.status === "pending" ? "opacity-50" : ""}`}
                      />
                      <span className="truncate">{nameOf(lv)}</span>
                    </div>
                  ))}
                  {dayLeaves.length > 3 && (
                    <div className="px-1.5 text-[11px] text-gray-400">
                      +{dayLeaves.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Public holidays this month */}
      {monthHolidays.length > 0 && (
        <div className="surface-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <SparklesIcon className="h-4 w-4 text-rose-500" />
            Public holidays in {format(cursor, "MMMM yyyy")}
          </h2>
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-700/50">
            {monthHolidays.map(({ date, holiday }) => (
              <li
                key={date.toISOString()}
                className="flex items-center justify-between py-2"
              >
                <span className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  {holiday.name}
                </span>
                <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                  {format(date, "EEE, d MMM")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LeaveCalendarPage;
