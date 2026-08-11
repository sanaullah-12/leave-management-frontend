import React, { useMemo, useState } from "react";
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
  differenceInCalendarDays,
} from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { InitialsTile } from "../mobile/MobileList";

/**
 * MobileLeaveCalendar
 * -------------------
 * The phone layout for Leave Calendar.
 *
 * A desktop calendar puts names inside the day cells. At 390px a cell is ~50px
 * wide, which fits neither a name nor a chip, so this splits the two jobs:
 *
 *   Month  - the grid answers "when", using coloured dots under each date.
 *            Tapping a day lists who is out below it.
 *   Agenda - a flat chronological list, which is the faster read when you want
 *            "what is coming up" rather than a shape of the month.
 *
 * Rendered only under `lg`; the desktop calendar is untouched.
 */

const TYPE_DOT: Record<string, string> = {
  annual: "bg-blue-500",
  sick: "bg-rose-500",
  casual: "bg-emerald-500",
  maternity: "bg-pink-500",
  paternity: "bg-indigo-500",
  emergency: "bg-orange-500",
  unpaid: "bg-gray-400",
};

const TYPE_TAG: Record<string, string> = {
  annual: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  sick: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  casual: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  maternity: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  paternity: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  emergency: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  unpaid: "bg-gray-500/10 text-gray-600 dark:text-gray-300",
};

const LEGEND = [
  "annual", "sick", "casual", "maternity", "paternity", "emergency",
];

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export interface CalendarLeave {
  _id: string;
  employee: { name?: string } | string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Props {
  leaves: CalendarLeave[];
  cursor: Date;
  onCursorChange: (d: Date) => void;
}

const nameOf = (lv: CalendarLeave) =>
  typeof lv.employee === "object" && lv.employee?.name
    ? lv.employee.name
    : "Employee";

const dayStart = (v: string) => {
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Which day of the overall request a given date is, e.g. "Day 5 of 9". */
const progressOf = (lv: CalendarLeave, day: Date) => {
  const s = dayStart(lv.startDate);
  const e = dayStart(lv.endDate);
  const total = differenceInCalendarDays(e, s) + 1;
  if (total <= 1) return null;
  return { index: differenceInCalendarDays(day, s) + 1, total };
};

const MobileLeaveCalendar: React.FC<Props> = ({
  leaves,
  cursor,
  onCursorChange,
}) => {
  const [view, setView] = useState<"month" | "agenda">("month");
  const [selected, setSelected] = useState<Date>(() => new Date());

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  // Rejected requests are not absences, so they never appear on the calendar.
  const active = useMemo(
    () => leaves.filter((lv) => lv.status !== "rejected"),
    [leaves]
  );

  const leavesOnDay = (day: Date) =>
    active.filter((lv) => day >= dayStart(lv.startDate) && day <= dayStart(lv.endDate));

  /** Every day of the visible month that has at least one absence. */
  const agenda = useMemo(() => {
    const monthDays = days.filter((d) => isSameMonth(d, cursor));
    return monthDays
      .map((d) => ({ day: d, items: leavesOnDay(d) }))
      .filter((row) => row.items.length > 0);
  }, [days, cursor, active]);

  const selectedItems = leavesOnDay(selected);
  const awayCount = selectedItems.length;

  const relativeLabel = (() => {
    const diff = differenceInCalendarDays(selected, today);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    return diff > 0 ? `In ${diff} days` : `${Math.abs(diff)} days ago`;
  })();

  const CARD =
    "rounded-[18px] border border-gray-200 bg-[var(--card-surface)] dark:border-white/10";

  return (
    <div className="lg:hidden">
      {/* Title + filter affordance */}
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-gray-900 dark:text-white">
          Leave calendar
        </h2>
        <button
          type="button"
          onClick={() => setView(view === "month" ? "agenda" : "month")}
          aria-label="Switch view"
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl border border-gray-200 bg-[var(--card-surface)] text-gray-500 active:bg-black/5 dark:border-white/10 dark:text-gray-400 dark:active:bg-white/10"
        >
          <FunnelIcon className="h-[17px] w-[17px]" />
        </button>
      </div>

      {/* Month stepper */}
      <div className="mb-3.5 flex items-center gap-2">
        <button
          onClick={() => onCursorChange(subMonths(cursor, 1))}
          aria-label="Previous month"
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl border border-gray-200 bg-[var(--card-surface)] text-gray-500 active:bg-black/5 dark:border-white/10 dark:text-gray-400 dark:active:bg-white/10"
        >
          <ChevronLeftIcon className="h-[18px] w-[18px]" />
        </button>

        <div className="min-w-0 flex-1 text-[17px] font-bold tracking-tight text-gray-900 dark:text-white">
          {format(cursor, "MMMM")}{" "}
          <span className="font-medium text-gray-400 dark:text-gray-500">
            {format(cursor, "yyyy")}
          </span>
        </div>

        <button
          onClick={() => onCursorChange(addMonths(cursor, 1))}
          aria-label="Next month"
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl border border-gray-200 bg-[var(--card-surface)] text-gray-500 active:bg-black/5 dark:border-white/10 dark:text-gray-400 dark:active:bg-white/10"
        >
          <ChevronRightIcon className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={() => {
            onCursorChange(new Date());
            setSelected(today);
          }}
          className="h-[38px] shrink-0 rounded-xl border px-3.5 text-[13px] font-bold active:opacity-80"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          Today
        </button>
      </div>

      {/* View toggle */}
      <div className="mb-3.5 flex rounded-[14px] border border-gray-200 bg-[var(--card-surface)] p-1 dark:border-white/10">
        {(["month", "agenda"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`flex-1 rounded-[10px] py-2 text-[13px] font-bold capitalize transition-colors ${
              view === v ? "text-white" : "text-gray-500 dark:text-gray-400"
            }`}
            style={view === v ? { backgroundColor: "var(--accent)" } : undefined}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Legend - scrolls rather than wrapping, so it stays one line */}
      <div className="-mx-3 mb-3.5 flex gap-3.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LEGEND.map((t) => (
          <span
            key={t}
            className="flex shrink-0 items-center gap-1.5 text-[12px] capitalize text-gray-500 dark:text-gray-400"
          >
            <span className={`h-[7px] w-[7px] rounded-full ${TYPE_DOT[t]}`} />
            {t}
          </span>
        ))}
      </div>

      {view === "month" ? (
        <>
          <div className={`${CARD} p-2.5`}>
            <div className="grid grid-cols-7">
              {WEEKDAY_INITIALS.map((d, i) => (
                <div
                  key={i}
                  className="py-1.5 text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {days.map((day) => {
                const inMonth = isSameMonth(day, cursor);
                const isToday = isSameDay(day, today);
                const isSelected = isSameDay(day, selected);
                const items = leavesOnDay(day);
                // At most three dots: past that they stop being countable and
                // the cell just looks noisy.
                const dots = items.slice(0, 3);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelected(day)}
                    className="flex h-[46px] flex-col items-center justify-center gap-1 rounded-xl transition-colors"
                    style={
                      isSelected && !isToday
                        ? { backgroundColor: "var(--accent-soft)" }
                        : undefined
                    }
                  >
                    <span
                      className={`grid h-[26px] w-[26px] place-items-center rounded-full text-[13px] tabular-nums ${
                        isToday
                          ? "font-extrabold text-white"
                          : inMonth
                            ? "font-semibold text-gray-900 dark:text-gray-100"
                            : "font-medium text-gray-300 dark:text-gray-600"
                      }`}
                      style={
                        isToday ? { backgroundColor: "var(--accent)" } : undefined
                      }
                    >
                      {format(day, "d")}
                    </span>
                    <span className="flex h-[5px] items-center gap-[3px]">
                      {dots.map((lv, i) => (
                        <span
                          key={i}
                          className={`h-[5px] w-[5px] rounded-full ${
                            TYPE_DOT[lv.leaveType] || TYPE_DOT.unpaid
                          } ${inMonth ? "" : "opacity-40"}`}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day */}
          <div className={`mt-3.5 ${CARD} p-4`}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                {format(selected, "EEE, d MMMM")}
              </h3>
              <span className="shrink-0 text-[12px] text-gray-400 dark:text-gray-500">
                {awayCount > 0 ? `${awayCount} away` : relativeLabel}
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <p className="mt-3 text-[13px] text-gray-500 dark:text-gray-400">
                Nobody is on leave this day.
              </p>
            ) : (
              <div className="mt-3.5 flex flex-col gap-3">
                {selectedItems.map((lv) => {
                  const progress = progressOf(lv, selected);
                  return (
                    <div key={lv._id} className="flex items-center gap-3">
                      <InitialsTile name={nameOf(lv)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-gray-900 dark:text-white">
                          {nameOf(lv)}
                        </p>
                        <p className="mt-0.5 text-[12px] text-gray-400 dark:text-gray-500">
                          {progress
                            ? `Day ${progress.index} of ${progress.total}`
                            : "Single day"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-[5px] text-[11px] font-bold capitalize ${
                          TYPE_TAG[lv.leaveType] || TYPE_TAG.unpaid
                        }`}
                      >
                        {lv.leaveType}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Agenda: date gutter on the left, that day's absences on the right. */
        <div className={`${CARD} divide-y divide-gray-100 dark:divide-white/10`}>
          {agenda.length === 0 ? (
            <p className="p-6 text-center text-[13px] text-gray-500 dark:text-gray-400">
              No leave booked in {format(cursor, "MMMM")}.
            </p>
          ) : (
            agenda.map(({ day, items }) => {
              const isToday = isSameDay(day, today);
              return (
                <div key={day.toISOString()} className="flex gap-3 p-3.5">
                  <div className="w-9 shrink-0 text-center">
                    <div
                      className={`text-[19px] font-extrabold tabular-nums leading-none ${
                        isToday ? "" : "text-gray-900 dark:text-white"
                      }`}
                      style={isToday ? { color: "var(--accent)" } : undefined}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {format(day, "EEE")}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {items.map((lv) => {
                      const progress = progressOf(lv, day);
                      return (
                        <div
                          key={lv._id}
                          className="flex items-center gap-2.5 rounded-xl bg-black/[0.03] px-3 py-2.5 dark:bg-white/[0.04]"
                        >
                          <span
                            className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                              TYPE_DOT[lv.leaveType] || TYPE_DOT.unpaid
                            }`}
                          />
                          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                            {nameOf(lv)}
                          </span>
                          <span className="shrink-0 text-[11px] capitalize tabular-nums text-gray-400 dark:text-gray-500">
                            {progress
                              ? `${progress.index}/${progress.total}`
                              : lv.leaveType}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MobileLeaveCalendar;
