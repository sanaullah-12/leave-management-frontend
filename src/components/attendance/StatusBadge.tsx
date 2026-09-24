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
  /**
   * A dot in place of the icon, for a roster column.
   *
   * At 12px a tick, a clock and a cross are three shapes competing with the
   * word beside them, and a column of them reads as noise. The dot carries the
   * colour, the word carries the meaning, and the pair still survives
   * greyscale - which is the rule the icon was there for. Anywhere a badge
   * stands alone the icon still earns its place, so it stays the default.
   */
  dot?: boolean;
}

/** Dot fills, one per state, matched to each pill's own label colour. */
const DOT: Record<string, string> = {
  "On time": "bg-[var(--success)]",
  Present: "bg-[var(--success)]",
  Late: "bg-[var(--warning)]",
  "No record": "bg-[var(--danger)]",
  Absent: "bg-[var(--danger)]",
  Weekend: "bg-[var(--text-muted)]",
  "On leave": "bg-cyan-600 dark:bg-cyan-400",
  "Work from home": "bg-indigo-600 dark:bg-indigo-400",
};

/* The three semantic states are one string each, because the status tokens
   are declared per mode - the same class is correct on a white card and on a
   dark one. The two categorical states still need a `dark:` half, since they
   borrow a raw Tailwind hue rather than a token. */
const SEMANTIC = (name: "success" | "warning" | "danger") =>
  `text-[var(--${name}-text)] bg-[var(--${name}-soft)] border-[var(--${name}-border)]`;

const META: Record<string, { className: string; Icon: typeof CheckCircleIcon }> = {
  // Green for the good state, amber for late, red for no record: the three
  // read as a scale at a glance, which a themed accent for "on time" did not.
  // These stay fixed rather than following the theme picker - they carry
  // meaning, and "on time" turning pink would stop meaning anything.
  //
  // They come from the app's status tokens rather than from hexes chosen here.
  // This component used to carry its own #0f7a4c / #b5650a / #b42318 set, which
  // meant an "On time" pill on Attendance and an "Approved" pill on Leaves were
  // two different greens for the same idea. The tokens are declared per mode,
  // so a soft tint on a white card and a low-alpha wash on a dark one both fall
  // out of one class - which is what the hand-written dark half below used to
  // be for.
  "On time": { className: SEMANTIC("success"), Icon: CheckCircleIcon },
  Present: { className: SEMANTIC("success"), Icon: CheckCircleIcon },
  Late: { className: SEMANTIC("warning"), Icon: ClockIcon },
  "No record": { className: SEMANTIC("danger"), Icon: XCircleIcon },
  // A working day with no punch. Same red as "no record" - it is the same
  // fact - but the word is the one a day-by-day list needs.
  Absent: { className: SEMANTIC("danger"), Icon: XCircleIcon },
  // Neutral on purpose: the office was shut, so nothing is being judged.
  Weekend: {
    className:
      "text-[var(--text-secondary)] bg-[var(--surface-hover)] border-[var(--border-default)]",
    Icon: CalendarDaysIcon,
  },
  // The last two are categorical, not semantic - they are neither good nor
  // bad, they are a different kind of day. So they keep a hue of their own
  // rather than taking a status token or the brand, which would make "on
  // leave" turn green on the Mint theme and stop meaning anything.
  "On leave": {
    className:
      "text-cyan-700 bg-cyan-500/10 border-cyan-500/25 dark:text-cyan-300 dark:bg-cyan-400/15 dark:border-cyan-400/25",
    Icon: CalendarDaysIcon,
  },
  "Work from home": {
    className:
      "text-indigo-700 bg-indigo-500/10 border-indigo-500/25 dark:text-indigo-300 dark:bg-indigo-400/15 dark:border-indigo-400/25",
    Icon: HomeIcon,
  },
};

const StatusBadge: React.FC<Props> = ({
  status,
  compact = false,
  dot = false,
}) => {
  const meta = META[status] || META["No record"];
  const { Icon } = meta;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold leading-tight ${
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${meta.className}`}
    >
      {dot ? (
        <span
          className={`h-1.5 w-1.5 rounded-full ${DOT[status] || DOT["No record"]}`}
        />
      ) : (
        <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      )}
      {status}
    </span>
  );
};

export default StatusBadge;
