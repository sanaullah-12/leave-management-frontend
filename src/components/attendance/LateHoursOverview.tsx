import React, { useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import LateHoursSummary from "./LateHoursSummary";
import type { LateEntry, LateSummary } from "../../hooks/useLateHours";
import { CARD } from "../../lib/surfaces";

/**
 * LateHoursOverview
 * -----------------
 * Late hours across the roster, for an admin.
 *
 * Two questions get asked of this screen and they need different lists: "how
 * is each person doing" is answered by per-employee totals, and "what
 * happened lately" by the most recent late arrivals across everyone. So both
 * are here rather than one list pretending to answer both.
 *
 * The order of `employees` is the caller's decision, not this component's.
 *
 * Every figure is derived from the attendance records on read. Nothing is
 * stored, nothing is editable, and none of it touches a leave balance.
 */

interface EmployeeRow extends LateSummary {
  employeeId: string;
  name: string | null;
  department: string | null;
}

interface Props {
  summary:
    | (LateSummary & { employeesLate: number; employeesConsidered: number })
    | null;
  employees: EmployeeRow[];
  recentLateEntries: Array<LateEntry & { employeeId: string; name: string | null }>;
  loading?: boolean;
  policy?: { cutoffTime: string; policy: string; graceMinutes?: number } | null;
  rangeLabel?: string;
  /** Opens that employee's own record. Rows are inert without it. */
  onSelectEmployee?: (employeeId: string) => void;
}

const PREVIEW_ROWS = 6;

const LateHoursOverview: React.FC<Props> = ({
  summary,
  employees,
  recentLateEntries,
  loading = false,
  policy,
  rangeLabel,
  onSelectEmployee,
}) => {
  const [showAllEmployees, setShowAllEmployees] = useState(false);

  const rows = showAllEmployees ? employees : employees.slice(0, PREVIEW_ROWS);

  const head =
    "whitespace-nowrap border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300";
  const cell = "border-b border-gray-100 px-4 py-2.5 dark:border-gray-700";

  /**
   * What to call the person a device ID belongs to.
   *
   * The device records a numeric enrolment ID; the name comes from the
   * Nexora account carrying that same employeeId. Where no account has been
   * linked there is genuinely no name to show, so the ID is shown as the
   * identity rather than dressed up as "Employee 22" - which reads like a
   * person's name and hides the fact that somebody has to link the account.
   */
  const nameOf = (row: { name: string | null; employeeId: string }) =>
    row.name || `ID ${row.employeeId}`;

  const subtitleOf = (row: {
    name: string | null;
    employeeId: string;
    department?: string | null;
  }) => {
    if (!row.name) return "Not linked to an employee account";
    // The ID stays visible even for a named person: the list is ordered by
    // it, and an order you cannot see is an order you cannot trust.
    return row.department
      ? `${row.department} - ID ${row.employeeId}`
      : `ID ${row.employeeId}`;
  };

  return (
    <div className={`overflow-hidden ${CARD}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Late Hours
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {policy
                ? `Counted from ${policy.cutoffTime}${
                    policy.graceMinutes
                      ? ` plus ${policy.graceMinutes}m grace`
                      : ""
                  }${rangeLabel ? ` - ${rangeLabel}` : ""}`
                : rangeLabel || "Added up from attendance records"}
            </p>
          </div>
        </div>
        {!loading && summary && (
          <span className="text-xs text-gray-400">
            {summary.employeesLate} of {summary.employeesConsidered} employees
            late in this range
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        <LateHoursSummary summary={summary} loading={loading} showNote />
      </div>

      {loading ? (
        <div className="space-y-2 px-4 pb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded bg-gray-100 dark:bg-gray-700"
            />
          ))}
        </div>
      ) : employees.length === 0 ? (
        <p className="px-4 pb-5 text-sm text-gray-500 dark:text-gray-400">
          No attendance was judged in this range.
        </p>
      ) : (
        <>
          {/* Who. The caller decides the order - the Late Time page sorts by
              employee ID so a supervisor can look somebody up. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] border-collapse">
              <thead>
                <tr>
                  <th className={head}>Employee</th>
                  <th className={head}>Late days</th>
                  <th className={head}>Average</th>
                  <th className={`${head} text-right`}>Total late</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.employeeId}
                    onClick={() => onSelectEmployee?.(row.employeeId)}
                    tabIndex={onSelectEmployee ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSelectEmployee?.(row.employeeId);
                    }}
                    className={
                      onSelectEmployee
                        ? "cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        : undefined
                    }
                  >
                    <td className={cell}>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {nameOf(row)}
                      </p>
                      <p
                        className={
                          row.name
                            ? "text-xs text-gray-500 dark:text-gray-400"
                            : "text-xs italic text-amber-600 dark:text-amber-500"
                        }
                      >
                        {subtitleOf(row)}
                      </p>
                    </td>
                    <td
                      className={`${cell} text-sm text-gray-700 dark:text-gray-200`}
                    >
                      {row.lateDays}
                    </td>
                    <td
                      className={`${cell} text-sm text-gray-600 dark:text-gray-300`}
                    >
                      {row.lateDays ? row.averageLateDisplay : "-"}
                    </td>
                    <td
                      className={`${cell} text-right text-sm font-semibold ${
                        row.totalLateMinutes
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {row.totalLateDisplay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {employees.length > PREVIEW_ROWS && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-right dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowAllEmployees((v) => !v)}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-gray-600 dark:text-blue-400 dark:hover:bg-blue-500/10"
              >
                {showAllEmployees
                  ? `Show top ${PREVIEW_ROWS}`
                  : `View all ${employees.length} employees`}
              </button>
            </div>
          )}

          {/* What happened lately */}
          {recentLateEntries.length > 0 && (
            <section className="border-t border-gray-200/70 dark:border-gray-700">
              <p className="px-4 pb-2 pt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Recent late entries
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse">
                  <thead>
                    <tr>
                      <th className={head}>Date</th>
                      <th className={head}>Employee</th>
                      <th className={head}>Expected</th>
                      <th className={head}>Punch in</th>
                      <th className={`${head} text-right`}>Late</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLateEntries.map((entry) => (
                      <tr key={`${entry.employeeId}-${entry.date}`}>
                        <td
                          className={`${cell} text-sm text-gray-700 dark:text-gray-200`}
                        >
                          {entry.dateDisplay}
                        </td>
                        <td
                          className={`${cell} text-sm text-gray-700 dark:text-gray-200`}
                        >
                          {nameOf(entry)}
                        </td>
                        <td
                          className={`${cell} font-mono text-sm text-gray-600 dark:text-gray-300`}
                        >
                          {entry.expected}
                        </td>
                        <td
                          className={`${cell} font-mono text-sm text-gray-700 dark:text-gray-200`}
                        >
                          {entry.punchInDisplay || entry.punchIn}
                        </td>
                        <td
                          className={`${cell} text-right text-sm font-semibold text-amber-700 dark:text-amber-400`}
                        >
                          {entry.lateDisplay}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default LateHoursOverview;
