import React, { useMemo, useState } from "react";
import { ClockIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useLateHours, useLateHoursOverview } from "../hooks/useLateHours";
import LateHoursCard from "../components/attendance/LateHoursCard";
import LateHoursOverview from "../components/attendance/LateHoursOverview";
import { CARD } from "../lib/surfaces";
import "../styles/design-system.css";

/**
 * LateTimePage
 * ------------
 * Late arrivals on their own screen, for whoever is reading.
 *
 * An employee sees their own running total and the day-by-day record behind
 * it. An admin sees the whole roster ordered by employee ID, and can open any
 * one person to get exactly the card that person sees - the same component
 * over the same range, so the two roles can never be shown different
 * arithmetic for the same days.
 *
 * This is now the only place late hours are read. The attendance page keeps
 * the per-day late status on each punch, because that is attendance data, but
 * every total, daily late record and roster ranking lives here. Every figure
 * is derived from the punches on read through useLateHours - nothing is
 * stored here, nothing is editable, and none of it touches a leave balance.
 */

/** Ranges offered above the tables, in days back from today. */
const RANGE_PRESETS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
];

/** Employees ranked in the overview. Enough to cover a whole office. */
const ROSTER_LIMIT = 100;

const todayIso = () => new Date().toISOString().split("T")[0];

const isoDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
};

const LateTimePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [startDate, setStartDate] = useState(() => isoDaysAgo(30));
  const [endDate, setEndDate] = useState(todayIso);
  const [activeRangeDays, setActiveRangeDays] = useState<number | null>(30);

  /** Which employee an admin has opened. Null is the roster view. */
  const [openEmployeeId, setOpenEmployeeId] = useState<string | null>(null);

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

  /**
   * The roster in employee-ID order.
   *
   * Not worst-first. A supervisor reading this screen is usually looking one
   * person up, and they know that person by the ID the device knows them by;
   * a list whose order changes every time the range changes has to be
   * searched from scratch on every visit. The totals still say who is worst.
   *
   * Numeric where both IDs are numeric, so 9 sorts before 10 rather than
   * after it, and numeric-aware string comparison otherwise so a mixed
   * roster (EMP0007 alongside 15) still lands somewhere predictable.
   */
  const employeesById = useMemo(() => {
    return [...rosterLateHours.employees].sort((a, b) => {
      const left = Number(a.employeeId);
      const right = Number(b.employeeId);
      if (Number.isFinite(left) && Number.isFinite(right)) return left - right;
      return String(a.employeeId).localeCompare(String(b.employeeId), undefined, {
        numeric: true,
      });
    });
  }, [rosterLateHours.employees]);

  const openEmployeeRow = useMemo(
    () =>
      rosterLateHours.employees.find(
        (row) => String(row.employeeId) === String(openEmployeeId)
      ) || null,
    [rosterLateHours.employees, openEmployeeId]
  );

  const presetButton = (active: boolean) =>
    "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
    (active
      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
      : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/40");

  const dateInput =
    "rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <ClockIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Late Time
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? "Late arrivals across the roster, added up from attendance records."
              : "Your late arrivals, added up from your attendance records."}
          </p>
        </div>
      </header>

      {/* The range every figure below answers for. */}
      <div className={"px-4 py-3 " + CARD}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.days)}
                className={presetButton(activeRangeDays === preset.days)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              From
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveRangeDays(null);
              }}
              className={dateInput}
            />
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              To
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveRangeDays(null);
              }}
              className={dateInput}
            />
          </div>
        </div>

        {rangeInvalid && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            The start date is after the end date, so nothing can be counted.
          </p>
        )}
      </div>

      {isAdmin ? (
        openEmployeeId ? (
          <>
            <button
              type="button"
              onClick={() => setOpenEmployeeId(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/40"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              All employees
            </button>

            <LateHoursCard
              summary={openEmployeeLateHours.summary}
              entries={openEmployeeLateHours.lateEntries}
              loading={openEmployeeLateHours.isLoading}
              policy={openEmployeeLateHours.policy}
              rangeLabel={rangeLabel}
              title={
                openEmployeeRow?.name ||
                openEmployeeLateHours.data?.employee?.name ||
                "ID " + openEmployeeId
              }
              previewRows={20}
              emptyMessage="No late arrivals in this range. Every punch was inside the arrival time."
            />
          </>
        ) : (
          <LateHoursOverview
            summary={rosterLateHours.summary}
            employees={employeesById}
            recentLateEntries={rosterLateHours.recentLateEntries}
            loading={rosterLateHours.isLoading}
            policy={rosterLateHours.policy}
            rangeLabel={rangeLabel}
            onSelectEmployee={(employeeId) =>
              setOpenEmployeeId(String(employeeId))
            }
          />
        )
      ) : !user?.employeeId ? (
        <div className={"px-4 py-6 " + CARD}>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your account is not linked to a device ID yet, so there are no
            punches to judge. An admin can link it from the employee record.
          </p>
        </div>
      ) : (
        <LateHoursCard
          summary={selfLateHours.summary}
          entries={selfLateHours.lateEntries}
          loading={selfLateHours.isLoading}
          policy={selfLateHours.policy}
          rangeLabel={rangeLabel}
          previewRows={20}
          emptyMessage="No late arrivals in this range. Every punch was inside the arrival time."
        />
      )}
    </div>
  );
};

export default LateTimePage;
