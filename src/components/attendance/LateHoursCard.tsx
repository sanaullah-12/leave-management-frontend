import React, { useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import LateHoursSummary from "./LateHoursSummary";
import type { LateEntry, LateSummary } from "../../hooks/useLateHours";
import { CARD } from "../../lib/surfaces";

/**
 * LateHoursCard
 * -------------
 * One employee's late hours: the running total, and the daily record it was
 * added up from.
 *
 * The daily rows are the point. A total on its own is an accusation nobody can
 * check, so every minute in it is traceable to a date, the start time that day
 * was judged against and the punch that missed it - which is also what makes
 * the total impossible to dispute or to quietly edit.
 *
 * Only late days are listed. An on-time day contributes nothing to the total,
 * and listing every day again would just be the attendance table.
 */

interface Props {
  summary: LateSummary | null;
  entries: LateEntry[];
  loading?: boolean;
  /** The rule the days were judged under, shown so the total is explainable. */
  policy?: { cutoffTime: string; policy: string; graceMinutes?: number } | null;
  rangeLabel?: string;
  /** "Late Hours" for an employee, or their name when an admin is reading. */
  title?: string;
  /** Rows shown before the list has to be expanded. */
  previewRows?: number;
  emptyMessage?: string;
}

const LateHoursCard: React.FC<Props> = ({
  summary,
  entries,
  loading = false,
  policy,
  rangeLabel,
  title = "Late Hours",
  previewRows = 8,
  emptyMessage,
}) => {
  const [showAll, setShowAll] = useState(false);

  const rows = showAll ? entries : entries.slice(0, previewRows);

  const head =
    "whitespace-nowrap border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300";
  const cell = "border-b border-gray-100 px-4 py-2.5 dark:border-gray-700";

  return (
    <div className={`overflow-hidden ${CARD}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {policy
                ? `Counted from ${policy.cutoffTime}${
                    policy.graceMinutes
                      ? ` plus ${policy.graceMinutes}m grace`
                      : ""
                  }${rangeLabel ? ` - ${rangeLabel}` : ""}`
                : rangeLabel || "Added up from your attendance records"}
            </p>
          </div>
        </div>
        {!loading && summary && summary.daysConsidered > 0 && (
          <span className="text-xs text-gray-400">
            {summary.onTimeDays} on time of {summary.daysConsidered} day
            {summary.daysConsidered === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        <LateHoursSummary summary={summary} loading={loading} showNote />
      </div>

      {loading ? (
        <div className="space-y-2 px-4 pb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded bg-gray-100 dark:bg-gray-700"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="px-4 pb-5 text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage || "No late arrivals in this range."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] border-collapse">
              <thead>
                <tr>
                  <th className={head}>Date</th>
                  <th className={head}>Expected</th>
                  <th className={head}>Punch in</th>
                  <th className={`${head} text-right`}>Late</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.date}>
                    <td
                      className={`${cell} text-sm text-gray-700 dark:text-gray-200`}
                    >
                      {entry.dateDisplay}
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
              <tfoot>
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100"
                  >
                    Total late
                    {!showAll && entries.length > rows.length && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        across all {entries.length} late days
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {summary?.totalLateDisplay || "0m"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {entries.length > previewRows && (
            <div className="border-t border-gray-100 px-4 py-2.5 text-right dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-gray-600 dark:text-blue-400 dark:hover:bg-blue-500/10"
              >
                {showAll
                  ? `Show latest ${previewRows}`
                  : `View all ${entries.length} late days`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LateHoursCard;
