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

/**
 * Each state is a class pair, not a fixed fill. The light half is the original
 * palette; the dark half is a low-alpha wash of the same hue with the label a
 * step lighter, because a #e4f5ec fill on a #1b1e27 card is not a pale tint of
 * green - it is a white chip.
 */
const META: Record<
  WfhRowStatus,
  { className: string; dot: string; Icon: typeof CheckCircleIcon; label: string }
> = {
  working: {
    className:
      "text-[#0f7a4c] bg-[#e4f5ec] border-[#bfe6d3] dark:text-emerald-300 dark:bg-emerald-400/15 dark:border-emerald-400/25",
    dot: "bg-[#0f7a4c] text-[#0f7a4c] dark:bg-emerald-300 dark:text-emerald-300",
    Icon: PlayCircleIcon,
    label: "Working",
  },
  paused: {
    className:
      "text-[#b5650a] bg-[#fdf0df] border-[#f5d9ae] dark:text-amber-300 dark:bg-amber-400/15 dark:border-amber-400/25",
    dot: "bg-[#b5650a] text-[#b5650a] dark:bg-amber-300 dark:text-amber-300",
    Icon: PauseCircleIcon,
    label: "Inactive",
  },
  completed: {
    className:
      "text-[#1a5fb4] bg-[#e8f0fb] border-[#c5d9f3] dark:text-blue-300 dark:bg-blue-400/15 dark:border-blue-400/25",
    dot: "bg-[#1a5fb4] text-[#1a5fb4] dark:bg-blue-300 dark:text-blue-300",
    Icon: CheckCircleIcon,
    label: "Completed",
  },
  not_started: {
    className:
      "text-[#5c6470] bg-[#f1f3f6] border-[#dde1e7] dark:text-gray-300 dark:bg-white/10 dark:border-white/15",
    dot: "bg-[#5c6470] text-[#5c6470] dark:bg-gray-300 dark:text-gray-300",
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
      } ${meta.className}`}
    >
      {/* A running session gets a pulsing dot in place of the static glyph.
          On a phone the badge is often the only part of the card in view
          while the page is scrolled, and a timer that is counting should look
          different from one that has stopped without having to be read. */}
      {status === "working" ? (
        <span
          className={`status-live relative h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
          aria-hidden="true"
        />
      ) : (
        <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      )}
      {label || meta.label}
    </span>
  );
};

export default WfhSessionStatusBadge;
