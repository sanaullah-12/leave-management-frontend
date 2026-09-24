import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import SectionHeader from "../components/ui/SectionHeader";
import { sectionIllustration } from "../components/ui/illustrations";
import {
  ClockIcon,
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useLateHours, useLateHoursOverview } from "../hooks/useLateHours";
import type { LateEntry, LateSummary } from "../hooks/useLateHours";
import Avatar from "../components/Avatar";
import DatePicker from "../components/ui/DatePicker";
import { StatCardRow } from "../components/ui/StatCard";
import useListRowMotion from "../hooks/useListRowMotion";
import "../styles/late-console.css";

/**
 * LateTimePage
 * ------------
 * Late arrivals on their own screen, for whoever is reading.
 *
 * An employee sees their own running total and the day-by-day record behind
 * it. An admin sees the whole roster, and can open any one person to get that
 * person's own figures - the same hook over the same range, so the two roles
 * can never be shown different arithmetic for the same days.
 *
 * This is now the only place late hours are read. The attendance page keeps
 * the per-day late status on each punch, because that is attendance data, but
 * every total, daily late record and roster ranking lives here. Every figure
 * is derived from the punches on read through useLateHours - nothing is
 * stored here, nothing is editable, and none of it touches a leave balance.
 *
 * Presented as a dark console rather than in the app's usual light surfaces:
 * this screen is read at a glance to spot outliers, and the delay pills only
 * separate cleanly against a dark ground. See styles/late-console.css.
 */

/** Ranges offered above the tables, in days back from today. */
const RANGE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "This month", days: 30 },
  { label: "Quarter", days: 90 },
  { label: "Year", days: 365 },
];

/** Employees ranked in the overview. Enough to cover a whole office. */
const ROSTER_LIMIT = 100;

const todayIso = () => new Date().toISOString().split("T")[0];

const isoDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
};

/**
 * Severity of a single late arrival.
 *
 * The thresholds are about how a reader should feel, not about policy: a
 * minute or two is noise, twenty is a habit worth a word, and beyond that is
 * something to act on. Policy itself lives on the server and is what decides
 * whether a day counts as late at all.
 */
const delayTone = (minutes: number): "good" | "warn" | "bad" => {
  if (minutes <= 5) return "good";
  if (minutes <= 20) return "warn";
  return "bad";
};

/* ------------------------------------------------------------------ */
/*  Presentational pieces - visual only, all data is passed in         */
/* ------------------------------------------------------------------ */

const DelayPill: React.FC<{ minutes: number; label?: string | null }> = ({
  minutes,
  label,
}) => (
  <span className={`lc-pill lc-pill-${delayTone(minutes)}`}>
    {label || `${minutes}m`}
  </span>
);

/** The console's own empty state - a table with no rows says nothing. */
const Empty: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <span className="lc-mark">
      <ClockIcon className="h-5 w-5" />
    </span>
    <p className="lc-muted mt-1 text-sm">{message}</p>
  </div>
);

/**
 * Late arrivals as a table.
 *
 * `withEmployee` switches the first column between a person and a date, which
 * is the only difference between the roster feed an admin reads and the
 * personal record an employee reads.
 *
 * Below `lg` the same entries are rows in a list. Every cell in this table is
 * `white-space: nowrap`, so five columns are wider than a phone whatever the
 * content - and the column the screen is read for, the delay, is the last one.
 * In the list the delay leads from the right and the two clock times it is the
 * difference between share one line beneath the name.
 */
const LateTable: React.FC<{
  rows: Array<LateEntry & { employeeId?: string; name?: string | null }>;
  withEmployee: boolean;
  onSelect?: (employeeId: string) => void;
  emptyMessage: string;
}> = ({ rows, withEmployee, onSelect, emptyMessage }) => {
  // Declared above the empty-list return: hooks cannot sit after it.
  const phoneRow = useListRowMotion();
  const tableRow = useListRowMotion(true);

  if (rows.length === 0) return <Empty message={emptyMessage} />;
  return (
    <>
      {/* ---------------- Phones and small tablets ---------------- */}
      <ul className="lc-table-wrap divide-y divide-white/5 lg:hidden">
        {rows.map((row, i) => {
          const clickable = Boolean(onSelect && row.employeeId);
          return (
            <motion.li
              key={`m-${row.employeeId ?? "self"}-${row.date}-${i}`}
              {...phoneRow(i)}
            >
              <button
                type="button"
                disabled={!clickable}
                onClick={
                  clickable ? () => onSelect!(String(row.employeeId)) : undefined
                }
                className="press-scale flex w-full items-center gap-3 px-4 py-3 text-start disabled:cursor-default"
              >
                {withEmployee && (
                  <Avatar name={row.name || `ID ${row.employeeId}`} size="sm" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="lc-name block truncate text-[14px]">
                    {withEmployee
                      ? row.name || `ID ${row.employeeId}`
                      : row.dateDisplay}
                  </span>
                  <span className="lc-dim block truncate text-[12px]">
                    {withEmployee ? `${row.dateDisplay} - ` : ""}
                    in {row.punchInDisplay}, due {row.expected}
                  </span>
                </span>
                <DelayPill minutes={row.lateMinutes} label={row.lateDisplay} />
              </button>
            </motion.li>
          );
        })}
      </ul>

      {/* ---------------- Desktop ---------------- */}
      <div className="lc-table-wrap hidden lg:block">
      <div className="lc-scroll">
        <table className="lc-table">
          <thead>
            <tr>
              {withEmployee && <th>Employee</th>}
              <th>Date</th>
              <th>Arrived</th>
              <th>Delay</th>
              {/* The record has no free-text reason. The time the day was
                  judged against is the fact that explains the delay. */}
              <th>Expected</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={`${row.employeeId ?? "self"}-${row.date}-${i}`}
                {...tableRow(i)}
                onClick={
                  onSelect && row.employeeId
                    ? () => onSelect(String(row.employeeId))
                    : undefined
                }
                style={
                  onSelect && row.employeeId ? { cursor: "pointer" } : undefined
                }
              >
                {withEmployee && (
                  <td>
                    <span className="flex items-center gap-3">
                      <Avatar name={row.name || `ID ${row.employeeId}`} size="sm" />
                      <span>
                        <span className="lc-name block">
                          {row.name || `ID ${row.employeeId}`}
                        </span>
                        <span className="lc-dim block text-xs">
                          ID {row.employeeId}
                        </span>
                      </span>
                    </span>
                  </td>
                )}
                <td>{row.dateDisplay}</td>
                <td className="lc-name">{row.punchInDisplay}</td>
                <td>
                  <DelayPill minutes={row.lateMinutes} label={row.lateDisplay} />
                </td>
                <td>{row.expected}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
};

/** Late arrivals per weekday across the visible entries. */
const WeeklyTrend: React.FC<{ entries: LateEntry[] }> = ({ entries }) => {
  const LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const counts = useMemo(() => {
    const buckets = new Array(7).fill(0);
    entries.forEach((e) => {
      const d = new Date(`${e.date}T00:00:00`);
      if (!isNaN(d.getTime())) buckets[d.getDay()] += 1;
    });
    return buckets;
  }, [entries]);
  const max = Math.max(1, ...counts);

  return (
    <div>
      <div className="lc-trend">
        {counts.map((n, i) => (
          <div
            key={i}
            className={`lc-trend-bar${n === 0 ? " lc-trend-bar-empty" : ""}`}
            style={{ height: n === 0 ? "4px" : `${(n / max) * 100}%` }}
            title={`${LABELS[i]}: ${n} late`}
          />
        ))}
      </div>
      <div className="lc-trend-labels">
        {LABELS.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */

const LateTimePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [startDate, setStartDate] = useState(() => isoDaysAgo(30));
  const [endDate, setEndDate] = useState(todayIso);
  const [activeRangeDays, setActiveRangeDays] = useState<number | null>(30);

  /** Which employee an admin has opened. Null is the roster view. */
  const [openEmployeeId, setOpenEmployeeId] = useState<string | null>(null);

  // The console owns the page background while it is open, and hands it back
  // on the way out.
  useEffect(() => {
    document.documentElement.classList.add("late-console-page");
    return () => document.documentElement.classList.remove("late-console-page");
  }, []);

  const rangeInvalid = startDate > endDate;

  const applyPreset = (days: number) => {
    setStartDate(isoDaysAgo(days));
    setEndDate(todayIso());
    setActiveRangeDays(days);
  };

  const rangeLabel = useMemo(() => {
    const format = (iso: string) =>
      new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    return format(startDate) + " - " + format(endDate);
  }, [startDate, endDate]);

  // An employee reads their own record; an admin reads the roster. Each hook is
  // disabled for the role that must not fire it, so the admin-only roster
  // endpoint is never requested on an employee's behalf and comes back 403.
  const selfLateHours = useLateHours(user?.employeeId, {
    startDate,
    endDate,
    enabled: !isAdmin && Boolean(user?.employeeId) && !rangeInvalid,
  });

  const rosterLateHours = useLateHoursOverview({
    startDate,
    endDate,
    limit: ROSTER_LIMIT,
    enabled: isAdmin && !rangeInvalid,
  });

  // The drill-down reads the same per-employee endpoint an employee reads, so
  // an admin looking at someone sees that person's own figures rather than a
  // second calculation of them.
  const openEmployeeLateHours = useLateHours(openEmployeeId, {
    startDate,
    endDate,
    enabled: isAdmin && Boolean(openEmployeeId) && !rangeInvalid,
  });

  /** Worst offenders first - this list exists to name them. */
  const repeatOffenders = useMemo(
    () =>
      [...rosterLateHours.employees]
        .filter((row) => row.lateDays > 0)
        .sort((a, b) => b.lateDays - a.lateDays)
        .slice(0, 5),
    [rosterLateHours.employees]
  );

  const openEmployeeRow = useMemo(
    () =>
      rosterLateHours.employees.find(
        (row) => String(row.employeeId) === String(openEmployeeId)
      ) || null,
    [rosterLateHours.employees, openEmployeeId]
  );

  /* ---------------- what the current view is reading ---------------- */

  const viewingEmployee = isAdmin && openEmployeeId;

  const summary: (LateSummary & Partial<{ employeesLate: number; employeesConsidered: number }>) | null =
    viewingEmployee
      ? openEmployeeLateHours.summary
      : isAdmin
      ? rosterLateHours.summary
      : selfLateHours.summary;

  const loading = viewingEmployee
    ? openEmployeeLateHours.isLoading
    : isAdmin
    ? rosterLateHours.isLoading
    : selfLateHours.isLoading;

  const tableRows: Array<LateEntry & { employeeId?: string; name?: string | null }> =
    viewingEmployee
      ? openEmployeeLateHours.lateEntries
      : isAdmin
      ? rosterLateHours.recentLateEntries
      : selfLateHours.lateEntries;

  const policy = viewingEmployee
    ? openEmployeeLateHours.policy
    : isAdmin
    ? rosterLateHours.policy
    : selfLateHours.policy;

  const heading = viewingEmployee
    ? openEmployeeRow?.name ||
      openEmployeeLateHours.data?.employee?.name ||
      `ID ${openEmployeeId}`
    : isAdmin
    ? "Late arrivals across the roster"
    : "Your late arrivals";

  const lateDays = summary?.lateDays ?? 0;
  const daysConsidered = summary?.daysConsidered ?? 0;

  const noDeviceId = !isAdmin && !user?.employeeId;

  return (
    <div className="lateconsole space-y-6 stagger-children">
      {/* ---------------- Banner ----------------
          The same SectionHeader every other screen opens with, so Late
          arrivals is recognisably part of Attendance and not a separate
          product. The console language below it stays - the density and the
          severity pills are what make a punch table readable - but it follows
          the app's light/dark mode like every other screen. */}
      <SectionHeader
        variant="attendance"
        eyebrow={
          viewingEmployee ? (
            <button
              type="button"
              onClick={() => setOpenEmployeeId(null)}
              className="inline-flex items-center gap-1.5 uppercase tracking-[0.14em] transition-colors hover:text-white"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              All employees
            </button>
          ) : (
            "Late attendance report"
          )
        }
        title={heading}
        description={
          noDeviceId
            ? "Your account is not linked to a device ID yet, so there are no punches to judge. An admin can link it from the employee record."
            : loading
            ? "Reading the attendance record."
            : `${lateDays} late ${
                lateDays === 1 ? "arrival" : "arrivals"
              } across ${daysConsidered} tracked ${
                daysConsidered === 1 ? "day" : "days"
              }${policy ? `, judged against ${policy.cutoffTime}` : ""}.`
        }
        badge={
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25">
            <Avatar name={user?.name || "You"} src={user?.profilePicture} size="xs" />
            {rangeLabel}
          </span>
        }
        illustration={sectionIllustration("attendance")}
      />

      {/* ---------------- Range ---------------- */}
      {/* Presets and the exact dates sit on one row: they set the same thing,
          so stacking them read as two separate controls. It wraps rather than
          shrinks, so the date fields keep their width on a narrow screen. */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="lc-segment">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              aria-pressed={activeRangeDays === preset.days}
              onClick={() => applyPreset(preset.days)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {/* The range is not only the presets, so the exact dates stay.
            Same DatePicker every other screen uses, so the calendar behaves
            identically here. */}
        <div className="flex items-center gap-2">
          <DatePicker
            value={startDate}
            max={endDate}
            placeholder="From"
            className="lc-datefield w-40"
            onChange={(v) => {
              setStartDate(v);
              setActiveRangeDays(null);
            }}
          />
          <span className="lc-dim text-xs">to</span>
          <DatePicker
            value={endDate}
            min={startDate}
            placeholder="To"
            className="lc-datefield w-40"
            onChange={(v) => {
              setEndDate(v);
              setActiveRangeDays(null);
            }}
          />
        </div>
      </div>

      {rangeInvalid && (
        <div className="lc-card lc-pad">
          <p className="text-sm font-medium" style={{ color: "var(--lc-bad)" }}>
            The start date is after the end date, so nothing can be counted.
          </p>
        </div>
      )}

      {noDeviceId ? null : (
        <>
          {/* ---------------- Figures ---------------- */}
          <StatCardRow
            tiles={[
              {
                label: "Total late",
                value: lateDays,
                suffix: `/ ${daysConsidered}`,
                icon: <ClockIcon className="h-5 w-5" />,
                // A real proportion: how much of the tracked window was late.
                percent: daysConsidered
                  ? (lateDays / daysConsidered) * 100
                  : 0,
              },
              {
                label: "Avg delay",
                value: summary?.averageLateMinutes ?? 0,
                suffix: "min",
                icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
              },
              isAdmin && !viewingEmployee
                ? {
                    label: "Employees late",
                    value: rosterLateHours.summary?.employeesLate ?? 0,
                    suffix: `/ ${
                      rosterLateHours.summary?.employeesConsidered ?? 0
                    }`,
                    icon: <UsersIcon className="h-5 w-5" />,
                    percent: rosterLateHours.summary?.employeesConsidered
                      ? ((rosterLateHours.summary.employeesLate ?? 0) /
                          rosterLateHours.summary.employeesConsidered) *
                        100
                      : 0,
                  }
                : {
                    label: "On time",
                    value: summary?.onTimeDays ?? 0,
                    suffix: `/ ${daysConsidered}`,
                    icon: <CheckCircleIcon className="h-5 w-5" />,
                    percent: daysConsidered
                      ? ((summary?.onTimeDays ?? 0) / daysConsidered) * 100
                      : 0,
                  },
              {
                label: "Total late time",
                value: summary?.totalLateDisplay || "0m",
                icon: <ClockIcon className="h-5 w-5" />,
              },
            ]}
          />

          {/* ---------------- Feed + side panels ---------------- */}
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
            <div className="lc-card lc-pad xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="lc-card-title">
                  {viewingEmployee || !isAdmin
                    ? "Late arrivals"
                    : "Recent late arrivals"}
                </h2>
                <span className="lc-dim text-[13px]">Sorted by latest</span>
              </div>
              {loading ? (
                <Empty message="Reading the attendance record." />
              ) : (
                <LateTable
                  rows={tableRows}
                  withEmployee={Boolean(isAdmin && !viewingEmployee)}
                  onSelect={
                    isAdmin && !viewingEmployee ? setOpenEmployeeId : undefined
                  }
                  emptyMessage="No late arrivals in this range. Every punch was inside the arrival time."
                />
              )}
            </div>

            <div className="space-y-5">
              <div className="lc-card lc-pad">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="lc-card-title">
                    Weekly trend
                  </h2>
                  <span className="lc-dim text-[13px]">
                    {tableRows.length}{" "}
                    {tableRows.length === 1 ? "arrival" : "arrivals"}
                  </span>
                </div>
                <WeeklyTrend entries={tableRows} />
              </div>

              {isAdmin && !viewingEmployee ? (
                <div className="lc-card lc-pad">
                  <h2 className="lc-card-title mb-3">
                    Repeat offenders
                  </h2>
                  {repeatOffenders.length === 0 ? (
                    <p className="lc-muted py-4 text-sm">
                      Nobody was late more than once in this range.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {repeatOffenders.map((row) => (
                        <li key={row.employeeId}>
                          <button
                            type="button"
                            className="lc-row"
                            onClick={() =>
                              setOpenEmployeeId(String(row.employeeId))
                            }
                          >
                            <Avatar
                              name={row.name || `ID ${row.employeeId}`}
                              size="sm"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="lc-name block truncate text-sm">
                                {row.name || `ID ${row.employeeId}`}
                              </span>
                              <span className="lc-dim block truncate text-xs">
                                {row.department || `ID ${row.employeeId}`}
                              </span>
                            </span>
                            <span
                              className={`lc-pill lc-pill-${delayTone(
                                row.averageLateMinutes
                              )}`}
                            >
                              {row.lateDays}x
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="lc-card lc-pad">
                  <h2 className="lc-card-title mb-3">
                    Worst day
                  </h2>
                  {summary?.worstDay ? (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="lc-name text-sm">
                          {summary.worstDay.dateDisplay}
                        </p>
                        <p className="lc-dim mt-0.5 text-xs">
                          the longest single delay in this range
                        </p>
                      </div>
                      <DelayPill
                        minutes={summary.worstDay.lateMinutes}
                        label={summary.worstDay.lateDisplay}
                      />
                    </div>
                  ) : (
                    <p className="lc-muted py-4 text-sm">
                      No late arrivals in this range.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LateTimePage;
