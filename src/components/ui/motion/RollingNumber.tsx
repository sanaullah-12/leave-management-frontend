import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE } from "../../../lib/motion";

/**
 * A figure whose digits roll to their new value.
 *
 * The app already has {@link AnimatedNumber}, which counts from the old figure
 * to the new one through every value in between. That is the right treatment
 * for a quantity the reader is meant to watch accumulate - a balance being
 * tallied - and the wrong one for a figure that simply changed, because a
 * count-up asserts that 47 passed through 23 on its way to becoming 47.
 *
 * This rolls instead: each digit column slides to its own new glyph, so only
 * the digits that actually changed move. Switching a filter from "this month"
 * to "last month" moves the two digits that differ and leaves the rest still,
 * which is both quieter and more informative than the whole figure spinning.
 *
 * Columns settle left to right. The leading digit carries the magnitude, so it
 * arriving first means the figure is readable before the animation finishes.
 *
 * Layout note: the visible digits are painted over an invisible copy of the
 * formatted string, which is what sizes the element and sets its baseline.
 * Rolling text otherwise has to reproduce the font's metrics by hand, and gets
 * them slightly wrong at every size but the one it was tuned at.
 */

export interface RollingNumberProps {
  value: number;
  /** Decimal places. Also fixes the column count, so the width never jitters. */
  decimals?: number;
  /** Thousands separators. Off for years, counts and ids. */
  grouping?: boolean;
  /** Printed before the first column - a currency mark, a sign. */
  prefix?: string;
  /** Printed after the last column - a unit, a percent sign. */
  suffix?: string;
  className?: string;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Seconds added per column, left to right.
 *
 * Small enough that a six-digit figure still finishes inside the `slow` step -
 * a stagger that outruns its own duration reads as a fault rather than as a
 * sweep.
 */
const COLUMN_STAGGER = 0.035;

/**
 * One digit column.
 *
 * The strip holds all ten glyphs stacked, and the column shows one of them
 * through a window the height of the line box. Percentages rather than `em`
 * throughout, so the strip tracks the window whatever the caller's type size.
 */
const Column: React.FC<{ digit: number; index: number; still: boolean }> = ({
  digit,
  index,
  still,
}) => (
  <span className="relative inline-block overflow-hidden align-top">
    {/* Sizer. `tabular-nums` on the wrapper makes every digit this wide. */}
    <span className="invisible" aria-hidden="true">
      0
    </span>
    <motion.span
      className="absolute inset-x-0 top-0 flex flex-col"
      style={{ height: "1000%" }}
      /* Every column starts on its zero, so the figure rolls up out of nothing
         the first time it is painted as well as on every change after. A KPI
         tile that simply appears with its number already printed is the one
         place a dashboard has to tell you something was computed. */
      initial={still ? false : { y: "0%" }}
      animate={{ y: `${-digit * 10}%` }}
      transition={
        still
          ? { duration: 0 }
          : {
              duration: DUR.slow,
              ease: EASE.out,
              delay: index * COLUMN_STAGGER,
            }
      }
    >
      {DIGITS.map((d) => (
        <span
          key={d}
          className="flex items-center justify-center"
          style={{ height: "10%" }}
        >
          {d}
        </span>
      ))}
    </motion.span>
  </span>
);

export const RollingNumber: React.FC<RollingNumberProps> = ({
  value,
  decimals = 0,
  grouping = true,
  prefix,
  suffix,
  className = "",
}) => {
  const reduce = useReducedMotion();

  const formatted = React.useMemo(
    () =>
      (Number.isFinite(value) ? value : 0).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouping,
      }),
    [value, decimals, grouping]
  );

  const still = Boolean(reduce);

  const text = `${prefix ?? ""}${formatted}${suffix ?? ""}`;

  /* Column index counts digits only, so a separator does not spend one of the
     stagger's steps and leave a visible gap in the sweep. */
  let digitIndex = -1;

  return (
    <span className={`relative inline-block tabular-nums ${className}`}>
      {/* Reserves the exact box and baseline of the real string. */}
      <span aria-hidden="true" className="invisible whitespace-pre">
        {text}
      </span>

      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-stretch justify-start whitespace-pre"
      >
        {prefix && <span className="flex items-center">{prefix}</span>}
        {formatted.split("").map((ch, i) => {
          if (ch < "0" || ch > "9") {
            return (
              <span key={`${i}-${ch}`} className="flex items-center">
                {ch}
              </span>
            );
          }
          digitIndex += 1;
          return (
            <Column
              key={i}
              digit={Number(ch)}
              index={digitIndex}
              still={still}
            />
          );
        })}
        {suffix && <span className="flex items-center">{suffix}</span>}
      </span>

      {/* The columns are decoration; this is what is actually announced. */}
      <span className="sr-only">{text}</span>
    </span>
  );
};

export default RollingNumber;
