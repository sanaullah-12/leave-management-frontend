import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  XMarkIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";

/**
 * Slide-over panel for one employee's attendance.
 *
 * Everything shown comes from the record set the page already fetched for this
 * person, so opening the panel never re-derives or re-judges anything - the
 * lateness here is the same lateness the table shows, under the same rule.
 */

export interface DrawerEmployee {
  employeeId: string | number;
  name?: string;
  department?: string;
  machineId?: string | number;
  role?: number;
  enrolledAt?: string | Date;
}

interface Props {
  employee: DrawerEmployee;
  /** The response from the attendance endpoint, or null while it loads. */
  data: any;
  loading?: boolean;
  onClose: () => void;
}

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
const toMinutes = (value?: string) => {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

const EmployeeDrawer: React.FC<Props> = ({
  employee,
  data,
  loading = false,
  onClose,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [showAllDays, setShowAllDays] = React.useState(false);
  const [dayQuery, setDayQuery] = React.useState("");

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // The page behind must not scroll while a modal layer is open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const summary = data?.summary;
  const records: any[] = data?.records || [];
  const policy = data?.lateTimePolicy || {};

  const latest = records.length ? records[0] : null;

  /** Rows for the history table: the recent slice, or everything when opened. */
  const historyRows = React.useMemo(() => {
    if (!showAllDays) return records.slice(0, 10);
    const q = dayQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r: any) =>
      `${r.dateDisplay || r.date} ${r.timeDisplay || r.time}`
        .toLowerCase()
        .includes(q)
    );
  }, [records, showAllDays, dayQuery]);

  /**
   * Where the arrival sits between the start of the working window and the
   * cutoff. Purely for the bar; the late/on-time verdict is the server's.
   */
  const timeline = useMemo(() => {
    const cutoff = toMinutes(policy.cutoffTime);
    const arrival = toMinutes(latest?.time);
    if (cutoff == null || arrival == null) return null;

    // A two-hour window either side of the cutoff reads better than a full day,
    // where every office arrival would bunch into a few pixels.
    const from = cutoff - 120;
    const to = cutoff + 120;
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    return {
      arrivalPct: clamp(((arrival - from) / (to - from)) * 100),
      cutoffPct: clamp(((cutoff - from) / (to - from)) * 100),
      fromLabel: `${String(Math.floor(from / 60)).padStart(2, "0")}:${String(
        from % 60
      ).padStart(2, "0")}`,
      toLabel: `${String(Math.floor(to / 60)).padStart(2, "0")}:${String(
        to % 60
      ).padStart(2, "0")}`,
      isLate: !!latest?.isLate,
    };
  }, [latest, policy.cutoffTime]);

  /**
   * Rendered into document.body.
   *
   * Left in place it sits inside the page's own stacking context, so its
   * z-index is only compared against its siblings there - the app sidebar,
   * a sibling of that whole context, stayed above the scrim and undimmed.
   * A portal puts the layer at the top level, where it covers the entire app.
   */
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-gray-900/60 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-drawer-title"
        className="flex h-full w-[440px] max-w-[92vw] flex-col bg-white shadow-2xl dark:bg-gray-800"
      >
        {/* Head */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {initialsOf(employee.name)}
            </span>
            <div className="min-w-0">
              <p
                id="employee-drawer-title"
                className="truncate text-[15px] font-semibold text-gray-900 dark:text-gray-100"
              >
                {employee.name || `Employee ${employee.employeeId}`}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {employee.department || "Employee"} · ID {employee.employeeId}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {/* Identity */}
          <section className="space-y-2 border-b border-gray-100 py-4 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <BuildingOffice2Icon className="h-4 w-4 shrink-0 text-gray-400" />
              <span>{employee.department || "Department not set"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <IdentificationIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <span>
                Device slot {employee.machineId ?? "-"} · User ID{" "}
                {employee.employeeId}
              </span>
            </div>
            {employee.enrolledAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CalendarDaysIcon className="h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  Enrolled {new Date(employee.enrolledAt).toLocaleDateString()}
                </span>
              </div>
            )}
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
          ) : !summary ? (
            <p className="py-6 text-sm text-gray-500 dark:text-gray-400">
              No attendance loaded for this employee.
            </p>
          ) : (
            <>
              {/* Latest arrival */}
              <section className="border-b border-gray-100 py-4 dark:border-gray-700">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Latest arrival
                  </h3>
                  {latest && (
                    <StatusBadge status={latest.isLate ? "Late" : "On time"} />
                  )}
                </div>

                {latest ? (
                  <>
                    {timeline && (
                      <div className="mb-4">
                        <div className="relative mb-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600">
                          <div
                            className="absolute top-0 h-full rounded-full"
                            style={{
                              left: 0,
                              width: `${timeline.arrivalPct}%`,
                              background: timeline.isLate
                                ? LATE_TONE
                                : ACCENT,
                            }}
                          />
                          {/* The rule the verdict was made against. */}
                          <div
                            className="absolute -top-1 h-3.5 w-0.5 bg-gray-400"
                            style={{ left: `${timeline.cutoffPct}%` }}
                            title={`Cutoff ${policy.cutoffTime}`}
                          />
                          <div
                            className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 bg-white dark:bg-gray-800"
                            style={{
                              left: `${timeline.arrivalPct}%`,
                              borderColor: timeline.isLate
                                ? LATE_TONE
                                : ACCENT,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span>{timeline.fromLabel}</span>
                          <span>cutoff {policy.cutoffTime}</span>
                          <span>{timeline.toLabel}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-700/40">
                        <ArrowRightOnRectangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Arrived
                          </p>
                          <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                            {latest.timeDisplay || latest.time}
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
                            {policy.cutoffTime || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-700/40">
                        <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {latest.isLate ? "Late by" : "Margin"}
                          </p>
                          <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                            {latest.isLate ? latest.lateDisplay || "-" : "On time"}
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

              {/* History */}
              <section className="border-b border-gray-100 py-4 dark:border-gray-700">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {showAllDays ? "All attendance" : "Recent attendance"}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {showAllDays
                        ? `${historyRows.length} of ${records.length}`
                        : `${records.length} day${
                            records.length === 1 ? "" : "s"
                          }`}
                    </span>
                  </h3>
                  {records.length > 10 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAllDays((v) => !v);
                        setDayQuery("");
                      }}
                      className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-gray-600 dark:text-blue-400 dark:hover:bg-blue-500/10"
                    >
                      {showAllDays ? "Show recent" : `View all ${records.length} days`}
                    </button>
                  )}
                </div>

                {showAllDays && (
                  <div className="relative mb-2">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                      value={dayQuery}
                      onChange={(e) => setDayQuery(e.target.value)}
                      placeholder="Find a date or time"
                      aria-label="Search attendance days"
                      className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-2 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                )}
                {historyRows.length ? (
                  <div
                    className={
                      showAllDays ? "max-h-72 overflow-y-auto pr-1" : undefined
                    }
                  >
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
                      {historyRows.map((r: any) => (
                        <tr key={r.recordId || `${r.date}-${r.time}`}>
                          <td className="border-b border-gray-100 py-2 text-gray-700 dark:border-gray-700 dark:text-gray-200">
                            {r.dateDisplay || r.date}
                          </td>
                          <td className="border-b border-gray-100 py-2 font-mono text-gray-700 dark:border-gray-700 dark:text-gray-200">
                            {r.timeDisplay || r.time}
                          </td>
                          <td className="border-b border-gray-100 py-2 dark:border-gray-700">
                            <StatusBadge
                              status={r.isLate ? "Late" : "On time"}
                              compact
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dayQuery
                      ? "No day matches that search."
                      : "Nothing recorded in this range."}
                  </p>
                )}
              </section>

              {/* Statistics */}
              <section className="py-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Statistics
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {data.dateRange?.from} to {data.dateRange?.to}
                  </span>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Present", value: summary.presentDays, tone: ACCENT },
                    { label: "Late", value: summary.lateDays, tone: "#b5650a" },
                    { label: "Absent", value: summary.absentDays, tone: "#b42318" },
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
                        {chip.value ?? 0}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {chip.label}
                      </div>
                    </div>
                  ))}
                  <div className="col-span-3 flex items-center justify-between rounded-lg border border-gray-200 p-2.5 dark:border-gray-600">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      Attendance rate over {summary.totalDays} working days
                    </span>
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {summary.attendanceRate}%
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

export default EmployeeDrawer;
