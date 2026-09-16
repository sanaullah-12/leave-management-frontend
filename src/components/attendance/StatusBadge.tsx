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

const META: Record<string, { className: string; Icon: typeof CheckCircleIcon }> = {
  // Green for the good state, amber for late, red for no record: the three
  // read as a scale at a glance, which a themed accent for "on time" did not.
  // These stay fixed rather than following the theme picker - they carry
  // meaning, and "on time" turning pink would stop meaning anything.
  //
  // Each state is a pair. The light half is the original palette: a pale fill
  // behind a saturated label, quiet enough that a column of pills does not
  // compete with the data beside it. The dark half cannot be the same fill -
  // #effaf4 on a #1b1e27 card is not a pale tint of anything, it is a white
  // chip, which is what these looked like on every dark screen. Dark uses a
  // low-alpha wash of the state's own hue with the label a step lighter, so
  // the pill reads as tinted glass on the card rather than a sticker on it.
  "On time": {
    className:
      "text-[#0f7a4c] bg-[#effaf4] border-[#cfeede] dark:text-emerald-300 dark:bg-emerald-400/15 dark:border-emerald-400/25",
    Icon: CheckCircleIcon,
  },
  Present: {
    className:
      "text-[#0f7a4c] bg-[#effaf4] border-[#cfeede] dark:text-emerald-300 dark:bg-emerald-400/15 dark:border-emerald-400/25",
    Icon: CheckCircleIcon,
  },
  Late: {
    className:
      "text-[#b5650a] bg-[#fef8ee] border-[#f9e7c7] dark:text-amber-300 dark:bg-amber-400/15 dark:border-amber-400/25",
    Icon: ClockIcon,
  },
  "No record": {
    className:
      "text-[#b42318] bg-[#fef3f3] border-[#f8d8d6] dark:text-red-300 dark:bg-red-400/15 dark:border-red-400/25",
    Icon: XCircleIcon,
  },
  // A working day with no punch. Same red as "no record" - it is the same
  // fact - but the word is the one a day-by-day list needs.
  Absent: {
    className:
      "text-[#b42318] bg-[#fef3f3] border-[#f8d8d6] dark:text-red-300 dark:bg-red-400/15 dark:border-red-400/25",
    Icon: XCircleIcon,
  },
  // Neutral on purpose: the office was shut, so nothing is being judged.
  Weekend: {
    className:
      "text-[#5c6470] bg-[#f8fafb] border-[#e8ecf1] dark:text-gray-300 dark:bg-white/10 dark:border-white/15",
    Icon: CalendarDaysIcon,
  },
  "On leave": {
    className:
      "text-[#0e7490] bg-[#f0fafc] border-[#d2ebf1] dark:text-cyan-300 dark:bg-cyan-400/15 dark:border-cyan-400/25",
    Icon: CalendarDaysIcon,
  },
  // A working day, not an absence - so it gets its own colour rather than
  // borrowing either the present green or the absent red.
  "Work from home": {
    className:
      "text-[#4c3fc7] bg-[#f5f5fd] border-[#e2e0fa] dark:text-indigo-300 dark:bg-indigo-400/15 dark:border-indigo-400/25",
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
      } ${meta.className}`}
    >
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {status}
    </span>
  );
};

export default StatusBadge;
