import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { RosterTotals } from "./RosterTables";
import { attendanceRate, daySlices } from "./rosterTone";
import { DUR, EASE } from "../../lib/motion";

/**
 * A day's counts, as one figure and five tiles.
 *
 * The section used to open with a row of five inline chips. Five numbers at
 * body size, all the same weight, is a legend rather than a summary - nothing
 * in it says which one to read first, and the question the screen is opened
 * with ("is the office in today?") had to be answered by doing arithmetic on
 * the chips.
 *
 * So the rate leads, at a size that can be read from across a desk, and the
 * bar beside it is the same day again as proportion: it is how the three
 * absences and the one approved day off are seen as a shape rather than as
 * two numbers to compare. The tiles below carry the counts themselves, each
 * in its own box so a count belongs to a label instead of floating between
 * two of them.
 *
 * Every colour is a status token, so the five states keep the meaning they
 * have everywhere else in the product and none of them follow the accent.
 */

interface Props {
  totals: RosterTotals;
  loading?: boolean;
  /** An employee reads their own day, so "Present" becomes "On time". */
  isSelfView?: boolean;
  /**
   * The status a tile is filtering on, and the way to set it. Optional: a
   * caller with no list to filter gets plain tiles.
   */
  activeStatus?: string | null;
  onStatusChange?: (status: string | null) => void;
}

const TodaySummary: React.FC<Props> = ({
  totals,
  loading = false,
  isSelfView = false,
  activeStatus = null,
  onStatusChange,
}) => {
  const reduce = useReducedMotion();
  const slices = useMemo(
    () => daySlices(totals, isSelfView),
    [totals, isSelfView]
  );

  const rate = attendanceRate(totals);
  const counted = slices.reduce((sum, slice) => sum + slice.value, 0);
  const filterable = !!onStatusChange;

  return (
    <div className="border-b border-gray-200/70 px-4 pb-5 dark:border-gray-700 sm:px-5">
      {/* ---- Rate, and the day as a proportion ---- */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold leading-none tracking-tight tabular-nums text-gray-900 dark:text-gray-100">
            {loading || rate === null ? "-" : `${rate}%`}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            attendance rate
          </span>
        </p>

        {/* Segments in the tiles' own order, so the bar and the row below it
            are one reading. Gapped rather than butted together: two adjacent
            reds at different counts need an edge to be two segments. */}
        <div
          className="flex h-2 min-w-[12rem] flex-1 items-stretch gap-0.5 overflow-hidden rounded-full"
          style={{ background: "var(--surface-hover)" }}
          role="img"
          aria-label={
            counted
              ? slices
                  .filter((slice) => slice.value)
                  .map((slice) => `${slice.label} ${slice.value}`)
                  .join(", ")
              : "No attendance recorded"
          }
        >
          {counted > 0 &&
            !loading &&
            slices
              .filter((slice) => slice.value > 0)
              .map((slice) => (
                <motion.span
                  key={slice.status}
                  initial={reduce ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: DUR.slow, ease: EASE.out }}
                  className="origin-left rounded-full"
                  style={{
                    width: `${(slice.value / counted) * 100}%`,
                    background: slice.ink,
                  }}
                />
              ))}
        </div>
      </div>

      {/* ---- The counts themselves ---- */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {slices.map((slice) => {
          const active = activeStatus === slice.status;

          const body = (
            <>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: slice.ink }}
                />
                <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                  {slice.label}
                </span>
              </span>
              <span className="mt-1 block text-2xl font-semibold leading-none tabular-nums text-gray-900 dark:text-gray-100">
                {loading ? "-" : slice.value}
              </span>
            </>
          );

          const shell = `rounded-xl border px-3 py-2.5 text-left transition-colors ${
            active
              ? "border-transparent"
              : "border-[var(--border-default)]"
          }`;
          // The selected tile is ringed in its own colour, which is what
          // separates "filtering on absent" from "absent happens to be red".
          const style: React.CSSProperties = {
            background: "var(--surface-raised)",
            ...(active ? { boxShadow: `inset 0 0 0 1.5px ${slice.ink}` } : {}),
          };

          if (!filterable) {
            return (
              <div key={slice.status} className={shell} style={style}>
                {body}
              </div>
            );
          }

          return (
            <motion.button
              key={slice.status}
              type="button"
              onClick={() => onStatusChange?.(active ? null : slice.status)}
              aria-pressed={active}
              title={
                active ? "Show everyone" : `Show only ${slice.label.toLowerCase()}`
              }
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className={`${shell} hover:border-[var(--border-strong)]`}
              style={style}
            >
              {body}
            </motion.button>
          );
        })}
      </div>

    </div>
  );
};

export default TodaySummary;
