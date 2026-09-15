import React from "react";
import {
  PlayCircleIcon,
  PauseCircleIcon,
  CheckCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/solid";
import type { WfhRowStatus } from "../../hooks/useWfhSession";

/**
 * Status pill for a work-from-home working day.
 *
 * Icon plus word, never colour alone - the same rule WfhStatusBadge and the
 * attendance badges follow, so a page carrying request statuses and session
 * statuses at once reads as one system rather than two.
 *
 * The palette is deliberately the one already in use: the same greens, ambers
 * and greys as the request badges, so "Working" and "Approved" do not compete
 * for the same meaning on screen.
 */

const META: Record<
  WfhRowStatus,
  {
    fg: string;
    bg: string;
    border: string;
    Icon: typeof CheckCircleIcon;
    label: string;
  }
> = {
  working: {
    fg: "#0f7a4c",
    bg: "#e4f5ec",
    border: "#bfe6d3",
    Icon: PlayCircleIcon,
    label: "Working",
  },
  paused: {
    fg: "#b5650a",
    bg: "#fdf0df",
    border: "#f5d9ae",
    Icon: PauseCircleIcon,
    label: "Inactive",
  },
  completed: {
    fg: "#1a5fb4",
    bg: "#e8f0fb",
    border: "#c5d9f3",
    Icon: CheckCircleIcon,
    label: "Completed",
  },
  not_started: {
    fg: "#5c6470",
    bg: "#f1f3f6",
    border: "#dde1e7",
    Icon: MinusCircleIcon,
    label: "Not Started",
  },
};

interface Props {
  status: WfhRowStatus;
  compact?: boolean;
  /** Overrides the word, for the one case where "Inactive" is too blunt. */
  label?: string;
}

const WfhSessionStatusBadge: React.FC<Props> = ({
  status,
  compact = false,
  label,
}) => {
  const meta = META[status] || META.not_started;
  const { Icon } = meta;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold leading-tight ${
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
      style={{ color: meta.fg, background: meta.bg, borderColor: meta.border }}
    >
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label || meta.label}
    </span>
  );
};

export default WfhSessionStatusBadge;
