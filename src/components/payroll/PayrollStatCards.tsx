import React from "react";
import { motion } from "framer-motion";
import AnimatedNumber from "../AnimatedNumber";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { CARD, CARD_HOVER } from "../../lib/surfaces";

/**
 * A single KPI tile. `value` is pre-formatted for money/text tiles; pass a
 * number instead to get the count-up animation used across the dashboard.
 */
export interface StatTile {
  label: string;
  value: number | string;
  caption: string;
  icon: React.ReactNode;
  gradient: string;
}

interface Props {
  tiles: StatTile[];
  /** Tailwind column count at xl. Defaults to one column per tile. */
  columnsClassName?: string;
}

/**
 * Generic KPI row for Payroll. Renders the exact dashboard tile — neumorphic
 * surface, count-up numbers, hover lift with an icon micro-tilt — so payroll
 * reads as part of the same product rather than a bolted-on module. Kept
 * presentational and memoised: it never knows what a payroll is.
 */
const PayrollStatCards: React.FC<Props> = ({ tiles, columnsClassName }) => {
  const cols =
    columnsClassName ??
    (tiles.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4");

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${cols}`}
    >
      {tiles.map((t) => (
        // `h-full` on both the grid item and the card: the motion wrapper is
        // what the grid stretches, so without it the card only grew to its own
        // content and short tiles floated in a taller row.
        <motion.div key={t.label} variants={staggerItem} className="h-full">
          <div className={`group ${CARD} ${CARD_HOVER} flex h-full flex-col p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p
                  className="text-overline truncate text-gray-400 dark:text-gray-500"
                  title={t.label}
                >
                  {t.label}
                </p>
                {/* Fixed-height value line so a text value (e.g. "August 2026")
                    and a count-up number sit on the same baseline. */}
                <p className="mt-2 flex min-h-[2rem] min-w-0 items-end sm:min-h-[2.25rem]">
                  {typeof t.value === "number" ? (
                    <span className="text-2xl font-bold tabular-nums leading-none text-gray-900 sm:text-3xl dark:text-white">
                      <AnimatedNumber value={t.value} />
                    </span>
                  ) : (
                    <span
                      className="block min-w-0 truncate text-xl font-bold tabular-nums leading-none text-gray-900 sm:text-2xl dark:text-white"
                      title={t.value}
                    >
                      {t.value}
                    </span>
                  )}
                </p>
              </div>
              <div
                className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br ${t.gradient} text-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:-rotate-3`}
              >
                {t.icon}
              </div>
            </div>
            {/* Pinned to the bottom so captions align across the whole row,
                however many lines each one wraps to. */}
            <p className="mt-auto pt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t.caption}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default React.memo(PayrollStatCards);
