import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";

/**
 * Status pill.
 *
 * Each state ships an icon and its own word, so the meaning survives a
 * colourblind reader, a greyscale print and forced-colors mode - the tint is
 * reinforcement, never the only carrier.
 */

type Status = "On time" | "Late" | "No record" | "Present" | "On leave";

interface Props {
  status: Status | string;
  /** Tighter padding for use inside dense tables. */
  compact?: boolean;
}

const META: Record<
  string,
  { fg: string; bg: string; border: string; Icon: typeof CheckCircleIcon }
> = {
  // The good state wears the active theme accent, so it recolours with the
  // app. Late and No record keep fixed warning tones - a warning that follows
  // a colour picker stops reading as a warning.
  "On time": {
    fg: "rgb(var(--blue-700))",
    bg: "rgb(var(--blue-50))",
    border: "rgb(var(--blue-200))",
    Icon: CheckCircleIcon,
  },
  Present: {
    fg: "rgb(var(--blue-700))",
    bg: "rgb(var(--blue-50))",
    border: "rgb(var(--blue-200))",
    Icon: CheckCircleIcon,
  },
  Late: { fg: "#b5650a", bg: "#fdf0df", border: "#f5d9ae", Icon: ClockIcon },
  "No record": {
    fg: "#b42318",
    bg: "#fbeaea",
    border: "#f3c6c3",
    Icon: XCircleIcon,
  },
  "On leave": {
    fg: "#4c3fc7",
    bg: "#eeeefb",
    border: "#d3d1f5",
    Icon: CalendarDaysIcon,
  },
};

const StatusBadge: React.FC<Props> = ({ status, compact = false }) => {
  const meta = META[status] || META["No record"];
  const { Icon } = meta;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-semibold leading-tight ${
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
