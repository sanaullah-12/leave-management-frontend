import React from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { StatCard, type StatAccent } from "../ui/StatCard";

/**
 * A single KPI tile. `value` is pre-formatted for money/text tiles; pass a
 * number instead to get the count-up animation used across the app.
 */
export interface StatTile {
  label: string;
  value: number | string;
  /**
   * Ignored. The shared StatCard is a two-line tile - label over figure - so
   * that every KPI row in the product is the same height. Kept in the type so
   * the four calling pages did not all have to change at once.
   */
  caption?: string;
  icon: React.ReactNode;
  /**
   * Legacy field from the previous tile design. The row now alternates the
   * two product accents instead, so this is ignored; it stays in the type so
   * the four calling pages did not all have to change at once.
   */
  gradient?: string;
  /** Draws the ring as a real proportion. Omit for the decorative sweep. */
  percent?: number;
  accent?: StatAccent;
}

interface Props {
  tiles: StatTile[];
  /** Tailwind column count at xl. Defaults to one column per tile. */
  columnsClassName?: string;
}

/**
 * Payroll's KPI row.
 *
 * Renders the product's shared StatCard, so payroll reads as part of the same
 * product rather than a bolted-on module. Kept presentational and memoised:
 * it never knows what a payroll is.
 */
const PayrollStatCards: React.FC<Props> = ({ tiles, columnsClassName }) => {
  // Same rule as StatCardRow, so a payroll KPI row matches every other.
  const cols =
    columnsClassName ?? "sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]";

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={`grid grid-cols-1 gap-3 ${cols}`}
    >
      {tiles.map((t, i) => (
        <motion.div key={t.label} variants={staggerItem}>
          <StatCard
            label={t.label}
            value={t.value}
            icon={t.icon}
            percent={t.percent}
            accent={t.accent ?? (i % 2 === 0 ? "indigo" : "teal")}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default React.memo(PayrollStatCards);
