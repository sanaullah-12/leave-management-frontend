import React from "react";
import type { LateSummary } from "../../hooks/useLateHours";

/**
 * LateHoursSummary
 * ----------------
 * The three figures a late total comes down to: how long, how many minutes,
 * how many days.
 *
 * Hours and minutes are both shown because they answer different questions -
 * "9h 28m" is what a person reports, "568" is what a spreadsheet adds up - and
 * showing only one meant someone converting by hand.
 *
 * The same block is used on the employee's own page, in the admin's employee
 * record and beside a leave request, so a late total reads identically to
 * whoever opens it.
 */

interface Props {
  summary: LateSummary | null;
  loading?: boolean;
  /** Dense variant for embedding beside other data, e.g. a leave request. */
  compact?: boolean;
  /** Late hours are never charged against leave; say so where it could be assumed. */
  showNote?: boolean;
}

/** Late is amber wherever it appears in this app; the tone is fixed, not themed. */
const LATE_TONE = "#b5650a";
const NEUTRAL_TONE = "#5c6470";

const LateHoursSummary: React.FC<Props> = ({
  summary,
  loading = false,
  compact = false,
  showNote = false,
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-3 gap-2 ${compact ? "" : "sm:gap-3"}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700 ${
              compact ? "h-14" : "h-20"
            }`}
          />
        ))}
      </div>
    );
  }

  const total = summary?.totalLateMinutes ?? 0;

  const tiles = [
    {
      label: "Total late hours",
      value: summary?.totalLateDisplay || "0m",
      tone: total > 0 ? LATE_TONE : NEUTRAL_TONE,
    },
    {
      label: "Total late minutes",
      value: String(total),
      tone: total > 0 ? LATE_TONE : NEUTRAL_TONE,
    },
    {
      label: "Late days",
      value: String(summary?.lateDays ?? 0),
      tone: (summary?.lateDays ?? 0) > 0 ? LATE_TONE : NEUTRAL_TONE,
    },
  ];

  return (
    <div>
      <div className={`grid grid-cols-3 gap-2 ${compact ? "" : "sm:gap-3"}`}>
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={`rounded-lg border border-gray-200 dark:border-gray-600 ${
              compact ? "p-2.5" : "p-3 sm:p-4"
            }`}
          >
            <span
              className="mb-1.5 block h-1.5 w-1.5 rounded-full"
              style={{ background: tile.tone }}
            />
            <div
              className={`font-semibold tabular-nums text-gray-900 dark:text-gray-100 ${
                compact ? "text-base" : "text-xl sm:text-2xl"
              }`}
            >
              {tile.value}
            </div>
            <div
              className={`text-gray-500 dark:text-gray-400 ${
                compact ? "text-[11px]" : "text-xs"
              }`}
            >
              {tile.label}
            </div>
          </div>
        ))}
      </div>

      {showNote && (
        <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
          An attendance figure only. Late minutes are never deducted from a
          leave balance.
        </p>
      )}
    </div>
  );
};

export default LateHoursSummary;
