import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
import type { DayRow } from "./DayTable";

/**
 * Slide-over holding an employee's own attendance in full.
 *
 * The day-by-day table pages ten rows at a time and the day panel answers a
 * single date, so neither answers "show me everything I have". This panel
 * does: every day of the range in one list.
 *
 * It is laid out as the employee drawer an admin gets - same head, same
 * arrival section, same history table, same statistics - because it answers
 * the same question about the same person; only the reader has changed. The
 * one difference is what the table lists: every day of the range rather than
 * only the days with a punch, so an absence is visible as a row.
 *
 * Every figure is counted off the rows the list renders, so a number here can
 * never disagree with the list below it.
 */

export interface DrawerIdentity {
  employeeId?: string | number;
  name?: string;
  department?: string;
  machineId?: string | number;
  enrolledAt?: string | Date;
}

interface Props {
  /** Every day of the range, newest first - the same rows the table lists. */
  rows: DayRow[];
  /** Whose record this is. */
  employee?: DrawerIdentity;
  /** The lateTimePolicy the rows were judged under. */
  policy?: any;
  /** The range the rows cover, already formatted for reading. */
  rangeLabel?: string;
  loading?: boolean;
  /** Open one day in full. The day panel stacks above this one. */
  onSelectDay?: (row: DayRow) => void;
  /**
   * True while the single-day panel is open on top. Escape then belongs to
   * that panel, and closing both layers on one press would lose this list.
   */
  detailOpen?: boolean;
  onClose: () => void;
}

/** Days the list opens on. A working week, weekend rows included. */
const WEEK = 7;

/** Active theme accent; the amber is a status tone and stays fixed. */
const ACCENT = "rgb(var(--blue-600))";
const LATE_TONE = "#b45309";

const initialsOf = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/** "HH:MM" or "HH:MM:SS" to minutes past midnight. */
const toMinutes = (value?: string | null) => {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

/** Minutes past midnight as office wall-clock time. */
const clockOf = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** A span of minutes, read as a person would say it. */
const spanOf = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const FullAttendanceDrawer: React.FC<Props> = ({
  rows,
  employee,
  policy,
  rangeLabel,
  loading = false,
  onSelectDay,
  detailOpen = false,
  onClose,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  /**
   * The list opens on the last week and expands to the whole range.
   *
   * A week is what an employee checks day to day, and it fits without
   * scrolling past the arrival section; the rest of the range is one button
   * away rather than a wall of rows nobody asked for yet.
   */
  const [showAll, setShowAll] = useState(false);

  // Mount only. Opening a day on top must not pull focus back here, and the
  // scroll lock has to remember the value from before any panel opened - a
  // re-run would capture the "hidden" this effect itself set and restore that.
  useEffect(() => {
    closeRef.current?.focus();
    // The page behind must not scroll while a modal layer is open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !detailOpen) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, detailOpen]);

  /** How the range actually went, counted off the rows themselves. */
  const totals = useMemo(() => {
    const byStatus: Record<string, number> = {};
    rows.forEach((row) => {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    });

    // A weekend is not a working day, so it is never part of the denominator.
    const workingDays = rows.filter((row) => row.status !== "Weekend").length;
    const onTime = byStatus["On time"] || 0;
    const late = byStatus["Late"] || 0;
    // An approved work from home day is a working day that was worked.
    const attended = onTime + late + (byStatus["Work from home"] || 0);

    return {
      workingDays,
      present: onTime + late,
      late,
      absent: byStatus["Absent"] || 0,
      rate: workingDays ? Math.round((attended / workingDays) * 100) : 0,
    };
  }, [rows]);

  /**
   * The average arrival across every punch in the range.
   *
   * One bad morning is a bad morning; where the average sits is the habit, and
   * the habit is what a whole-range panel is opened to see. The verdict on each
   * individual day stays the server's and is untouched here.
   */
  const average = useMemo(() => {
    const minutes = rows
      .map((row) => toMinutes(row.record?.time))
      .filter((value): value is number => value != null);
    if (!minutes.length) return null;

    const mean = Math.round(
      minutes.reduce((sum, value) => sum + value, 0) / minutes.length
    );
    const cutoff = toMinutes(policy?.cutoffTime);
    return {
      minutes: mean,
      display: clockOf(mean),
      isLate: cutoff != null && mean > cutoff,
      margin: cutoff == null ? null : spanOf(Math.abs(mean - cutoff)),
    };
  }, [rows, policy?.cutoffTime]);

  /** Where the average sits either side of the cutoff. */
  const timeline = useMemo(() => {
    const cutoff = toMinutes(policy?.cutoffTime);
    if (cutoff == null || !average) return null;

    // A two-hour window either side of the cutoff reads better than a full day,
    // where every office arrival would bunch into a few pixels.
    const from = cutoff - 120;
    const to = cutoff + 120;
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      arrivalPct: clamp(((average.minutes - from) / (to - from)) * 100),
      cutoffPct: clamp(((cutoff - from) / (to - from)) * 100),
      fromLabel: `${pad(Math.floor(from / 60))}:${pad(from % 60)}`,
      toLabel: `${pad(Math.floor(to / 60))}:${pad(to % 60)}`,
    };
  }, [average, policy?.cutoffTime]);

  /** The rows the table lists: the last week, or the range and its search. */
  const historyRows = useMemo(() => {
    if (!showAll) return rows.slice(0, WEEK);
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      `${row.dateDisplay} ${row.weekday} ${row.status} ${row.arrival || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [rows, showAll, query]);

  return createPortal(
    // Below the single-day panel z-[60] on purpose: a day opened from this
    // list has to land on top of it.
    <div
      className="fixed inset-0 z-[55] flex justify-end bg-gray-900/60 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="full-attendance-title"
        className="flex h-full w-[440px] max-w-[92vw] flex-col bg-white shadow-2xl dark:bg-gray-800"
      >
        {/* Head */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {initialsOf(employee?.name)}
            </span>
            <div className="min-w-0">
              <p
                id="full-attendance-title"
                className="truncate text-[15px] font-semibold text-gray-900 dark:text-gray-100"
              >
                {employee?.name || "My attendance"}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {employee?.department || "Employee"}
                {employee?.employeeId ? ` · ID ${employee.employeeId}` : ""}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {/* Identity */}
          <section className="space-y-2 border-b border-gray-100 py-4 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <BuildingOffice2Icon className="h-4 w-4 shrink-0 text-gray-400" />
              <span>{employee?.department || "Employee"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <IdentificationIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <span>
                Device slot {employee?.machineId ?? "-"} · User ID{" "}
                {employee?.employeeId ?? "-"}
              </span>
            </div>
            {employee?.enrolledAt ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CalendarDaysIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  Enrolled {new Date(employee.enrolledAt).toLocaleDateString()}
                </span>
              </div>
            ) : rangeLabel ? (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CalendarDaysIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{rangeLabel}</span>
              </div>
            ) : null}
          </section>

          {loading ? (
            <div className="space-y-3 py-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700"
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-sm text-gray-500 dark:text-gray-400">
              No attendance loaded for this range.
            </p>
          ) : (
            <>
              {/* Average arrival */}
              <section className="border-b border-gray-100 py-4 dark:border-gray-700">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Average arrival
                  </h3>
                  {average && (
                    <StatusBadge status={average.isLate ? "Late" : "On time"} />
                  )}
                </div>

                {average ? (
                  <>
                    {timeline && (
                      <div className="mb-4">
                        {/* The bar carries the average on its own; a knob on
                            the end of it only repeated the reading. */}
                        <div className="relative mb-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600">
                          <div
                            className="absolute top-0 h-full rounded-full"
                            style={{
                              left: 0,
                              width: `${timeline.arrivalPct}%`,
                              background: average.isLate ? LATE_TONE : ACCENT,
                            }}
                          />
                          {/* The rule the verdict was made against. */}
                          <div
                            className="absolute -top-1 h-3.5 w-0.5 bg-gray-400"
                            style={{ left: `${timeline.cutoffPct}%` }}
                            title={`Cutoff ${policy?.cutoffTime}`}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span>{timeline.fromLabel}</span>
                          <span>cutoff {policy?.cutoffTime}</span>
                          <span>{timeline.toLabel}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-700/40">
                        <ArrowRightOnRectangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Average
                          </p>
                          <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                            {average.display}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-700/40">
                        <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Cutoff
                          </p>
                          <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                            {policy?.cutoffTime || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-700/40">
                        <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {average.isLate ? "Late by" : "Margin"}
                          </p>
                          <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                            {average.margin || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No punches in the selected range.
                  </p>
                )}
              </section>

              {/* History: every day of the range, newest first */}
              <section className="border-b border-gray-100 py-4 dark:border-gray-700">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {showAll ? "All attendance" : "This week"}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {showAll
                        ? query
                          ? `${historyRows.length} of ${rows.length}`
                          : `${rows.length} day${rows.length === 1 ? "" : "s"}`
                        : `${historyRows.length} day${
                            historyRows.length === 1 ? "" : "s"
                          }`}
                    </span>
                  </h3>
                  {rows.length > WEEK && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAll((v) => !v);
                        setQuery("");
                      }}
                      className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-gray-600 dark:text-blue-400 dark:hover:bg-blue-500/10"
                    >
                      {showAll ? "Show this week" : "View full"}
                    </button>
                  )}
                </div>

                {showAll && (
                  <div className="relative mb-2">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Find a date or status"
                      aria-label="Search attendance days"
                      className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                )}

                {historyRows.length ? (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white text-gray-400 dark:bg-gray-800">
                        <th className="border-b border-gray-100 py-1.5 font-medium dark:border-gray-700">
                          Date
                        </th>
                        <th className="border-b border-gray-100 py-1.5 font-medium dark:border-gray-700">
                          Arrived
                        </th>
                        <th className="border-b border-gray-100 py-1.5 font-medium dark:border-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((row) => (
                        <tr
                          key={row.date}
                          onClick={() => onSelectDay?.(row)}
                          tabIndex={onSelectDay ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onSelectDay?.(row);
                          }}
                          className={
                            onSelectDay
                              ? "cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                              : undefined
                          }
                        >
                          <td className="border-b border-gray-100 py-2 text-gray-700 dark:border-gray-700 dark:text-gray-200">
                            {row.dateDisplay}
                          </td>
                          <td className="border-b border-gray-100 py-2 font-mono text-gray-700 dark:border-gray-700 dark:text-gray-200">
                            {row.arrival || "-"}
                          </td>
                          <td className="border-b border-gray-100 py-2 dark:border-gray-700">
                            <StatusBadge status={row.status} compact />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No day matches that search.
                  </p>
                )}
              </section>

              {/* Statistics */}
              <section className="py-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Statistics
                  {rangeLabel && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {rangeLabel}
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Present", value: totals.present, tone: ACCENT },
                    { label: "Late", value: totals.late, tone: "#b5650a" },
                    { label: "Absent", value: totals.absent, tone: "#b42318" },
                  ].map((chip) => (
                    <div
                      key={chip.label}
                      className="rounded-lg border border-gray-200 p-2.5 dark:border-gray-600"
                    >
                      <span
                        className="mb-1.5 block h-1.5 w-1.5 rounded-full"
                        style={{ background: chip.tone }}
                      />
                      <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {chip.value}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {chip.label}
                      </div>
                    </div>
                  ))}
                  <div className="col-span-3 flex items-center justify-between rounded-lg border border-gray-200 p-2.5 dark:border-gray-600">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Attendance rate over {totals.workingDays} working days
                    </span>
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {totals.rate}%
                    </span>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FullAttendanceDrawer;
