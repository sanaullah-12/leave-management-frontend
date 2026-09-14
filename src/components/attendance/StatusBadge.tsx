import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarDaysIcon,
  HomeIcon,
} from "@heroicons/react/24/solid";

/**
 * Status pill.
 *
 * Each state ships an icon and its own word, so the meaning survives a
 * colourblind reader, a greyscale print and forced-colors mode - the tint is
 * reinforcement, never the only carrier.
 */

type Status =
  | "On time"
  | "Late"
  | "No record"
  | "Absent"
  | "Weekend"
  | "Work from home"
  | "On leave"
  | "Present"
  | "On leave";

interface Props {
  status: Status | string;
  /** Tighter padding for use inside dense tables. */
  compact?: boolean;
}

const META: Record<
  string,
  { fg: string; bg: string; border: string; Icon: typeof CheckCircleIcon }
> = {
  // Green for the good state, amber for late, red for no record: the three
  // read as a scale at a glance, which a themed accent for "on time" did not.
  // Fills are deliberately pale - the pill is a quiet tint behind a saturated
  // label, so a row of them does not compete with the data in the table.
  // These stay fixed rather than following the theme picker - they carry
  // meaning, and "on time" turning pink would stop meaning anything.
  "On time": {
    fg: "#0f7a4c",
    bg: "#effaf4",
    border: "#cfeede",
    Icon: CheckCircleIcon,
  },
  Present: {
    fg: "#0f7a4c",
    bg: "#effaf4",
    border: "#cfeede",
    Icon: CheckCircleIcon,
  },
  Late: { fg: "#b5650a", bg: "#fef8ee", border: "#f9e7c7", Icon: ClockIcon },
  "No record": {
    fg: "#b42318",
    bg: "#fef3f3",
    border: "#f8d8d6",
    Icon: XCircleIcon,
  },
  // A working day with no punch. Same red as "no record" - it is the same
  // fact - but the word is the one a day-by-day list needs.
  Absent: {
    fg: "#b42318",
    bg: "#fef3f3",
    border: "#f8d8d6",
    Icon: XCircleIcon,
  },
  // Neutral on purpose: the office was shut, so nothing is being judged.
  Weekend: {
    fg: "#5c6470",
    bg: "#f8fafb",
    border: "#e8ecf1",
    Icon: CalendarDaysIcon,
  },
  "On leave": {
    fg: "#0e7490",
    bg: "#f0fafc",
    border: "#d2ebf1",
    Icon: CalendarDaysIcon,
  },
  // A working day, not an absence - so it gets its own colour rather than
  // borrowing either the present green or the absent red.
  "Work from home": {
    fg: "#4c3fc7",
    bg: "#f5f5fd",
    border: "#e2e0fa",
    Icon: HomeIcon,
  },
};

const StatusBadge: React.FC<Props> = ({ status, compact = false }) => {
  const meta = META[status] || META["No record"];
  const { Icon } = meta;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold leading-tight ${
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
      style={{ color: meta.fg, background: meta.bg, borderColor: meta.border }}
    >
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {status}
    </span>
  );
};

export default StatusBadge;
