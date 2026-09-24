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
 * Each state takes its colour from the app's status tokens rather than from a
 * hex chosen here. Those tokens are declared per mode, so one class string is
 * correct on a white card and on a dark one - which is what the hand-written
 * `dark:` half used to be doing, and why this component had accumulated its
 * own #0f7a4c / #b5650a / #1a5fb4 set that did not match the greens, ambers
 * and blues used by the leave badges it sits beside.
 *
 * `completed` is the odd one: it is not a success, a warning or a failure, it
 * is "this is over". It takes the brand, which is the app's neutral-positive
 * accent, so it follows the theme rather than pinning a blue.
 */
const TONE = (name: "success" | "warning" | "danger" | "brand") => ({
  className: `text-[var(--${name}-text)] bg-[var(--${name}-soft)] border-[var(--${name}-border)]`,
  dot: `bg-[var(--${name}-text)] text-[var(--${name}-text)]`,
});
const META: Record<
  WfhRowStatus,
  { className: string; dot: string; Icon: typeof CheckCircleIcon; label: string }
> = {
  working: { ...TONE("success"), Icon: PlayCircleIcon, label: "Working" },
  paused: { ...TONE("warning"), Icon: PauseCircleIcon, label: "Inactive" },
  completed: { ...TONE("brand"), Icon: CheckCircleIcon, label: "Completed" },
  not_started: {
    className:
      "text-[var(--text-secondary)] bg-[var(--surface-hover)] border-[var(--border-default)]",
    dot: "bg-[var(--text-muted)] text-[var(--text-muted)]",
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
