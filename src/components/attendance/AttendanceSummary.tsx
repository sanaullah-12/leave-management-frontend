import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { StatCard, type StatAccent } from "../ui/StatCard";

/**
 * The attendance summary row.
 *
 * Renders the product's shared StatCard, so a figure here is the same tile as
 * one on the dashboard, in payroll or on a report.
 *
 * During a load the value is a shimmer rather than a zero: a zero is a claim,
 * and "not known yet" is not the same as "nobody".
 */

export interface SummaryItem {
  label: string;
  value: number | string | null;
  caption?: string;
  /**
   * Ignored. The row alternates the two product accents; a per-item colour
   * would break that rhythm. Kept so callers did not all have to change.
   */
  accent?: string;
  icon?: React.ReactNode;
}

interface Props {
  items: SummaryItem[];
  loading?: boolean;
}

/** Stands in for the figure until it is known. */
const Shimmer: React.FC = () => (
  <span className="inline-block h-5 w-12 animate-pulse rounded bg-gray-200 align-middle dark:bg-gray-700" />
);

const AttendanceSummary: React.FC<Props> = ({ items, loading = false }) => (
  <section
    aria-label="Attendance summary"
    // Same rule as StatCardRow: auto-fit from 11rem, then share what is left,
    // so the row ends flush with the content below it.
    className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]"
  >
    {items.map((item, i) => (
      <StatCard
        key={item.label}
        label={item.label}
        value={loading ? <Shimmer /> : (item.value ?? "-")}
        icon={item.icon ?? <ChartBarIcon className="h-5 w-5" />}
        accent={(i % 2 === 0 ? "indigo" : "teal") as StatAccent}
      />
    ))}
  </section>
);

export default AttendanceSummary;
