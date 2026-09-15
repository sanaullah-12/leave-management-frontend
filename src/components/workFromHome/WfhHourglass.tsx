import React, { useId } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * A work-from-home day, drawn as an hourglass.
 *
 * The sand is the planned day: the upper chamber empties and the lower one
 * fills as the hours worked approach the hours planned, and the figure sits
 * inside the glass rather than beside it. One object, not a picture with a
 * caption - a full glass and an almost-empty one are different at a glance in a
 * way that 02:14:08 and 07:41:22 are not, and the number is there for when the
 * glance is not enough.
 *
 * The grain only falls while the timer is running, which makes the animation
 * carry meaning rather than decoration: a still glass on a monitor of moving
 * ones is somebody who has stopped. It is also the only thing here that moves,
 * so a page of forty rows animates forty small circles and nothing else.
 *
 * Presentational. It is handed a fraction and a label that the caller computed
 * from the server's numbers, and it owns no timer of its own.
 */

export type HourglassTone = "working" | "paused" | "done" | "idle";

interface Props {
  /**
   * How much of the planned day has been worked, 0 to 1. Null when no hours
   * were planned - there is nothing to be a fraction of, so the glass stays
   * full and only the falling grain says the clock is running.
   */
  progress: number | null;
  tone: HourglassTone;
  /** The time so far, short enough to sit inside the glass: "3h 24m". */
  label?: string;
  className?: string;
}

const SAND: Record<HourglassTone, string> = {
  working: "#10b981",
  paused: "#f59e0b",
  done: "#3b82f6",
  idle: "#94a3b8",
};

/** The chamber outlines, in the 28x36 viewBox. */
const TOP = "M4 4.2 H24 L14 18 Z";
const BOTTOM = "M14 19 L24 31.8 H4 Z";
/** The vertical run of one chamber, which is how far the sand travels. */
const DEPTH = 13.8;

const WfhHourglass: React.FC<Props> = ({
  progress,
  tone,
  label,
  className = "",
}) => {
  // Unique per instance: forty rows sharing a clip-path id would all be
  // clipped by whichever definition the document happened to hold last.
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();

  const colour = SAND[tone];
  const drained = progress === null ? 0 : Math.min(1, Math.max(0, progress));
  const running = tone === "working" && !reduce;

  return (
    <svg
      viewBox="0 0 28 36"
      className={`h-11 w-[34px] shrink-0 ${className}`}
      role="img"
      aria-label={
        label
          ? `${label} worked`
          : progress === null
          ? "Work timer"
          : `${Math.round(drained * 100)} percent of the planned day worked`
      }
    >
      <defs>
        <clipPath id={`top-${uid}`}>
          <path d={TOP} />
        </clipPath>
        <clipPath id={`bottom-${uid}`}>
          <path d={BOTTOM} />
        </clipPath>
      </defs>

      {/* The frame: two caps and the glass itself, in the sand's own colour at
          low opacity, so the whole thing recolours with the state. */}
      <rect x="2.6" y="1.4" width="22.8" height="2.8" rx="1.4" fill={colour} opacity="0.4" />
      <rect x="2.6" y="31.8" width="22.8" height="2.8" rx="1.4" fill={colour} opacity="0.4" />
      <path d={TOP} fill={colour} opacity="0.14" />
      <path d={BOTTOM} fill={colour} opacity="0.14" />

      {/* The sand. Each chamber is a full-width bar slid into place and clipped
          to the chamber's shape, so the surface is always level - which is what
          an hourglass does and what a scaled triangle would not. */}
      <rect
        clipPath={`url(#top-${uid})`}
        x="0"
        y={4.2 + DEPTH * drained}
        width="28"
        height={DEPTH}
        fill={colour}
        className="transition-[y] duration-700 ease-out"
      />
      <rect
        clipPath={`url(#bottom-${uid})`}
        x="0"
        y={31.8 - DEPTH * drained}
        width="28"
        height={DEPTH}
        fill={colour}
        className="transition-[y] duration-700 ease-out"
      />

      {running && (
        <circle cx="14" r="1" fill={colour}>
          <animate
            attributeName="cy"
            values="18.2;30.8"
            dur="1.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* The figure, over the widest part of the lower chamber. Drawn after the
          sand so it stays legible once the glass fills up under it. */}
      {label && (
        <text
          x="14"
          y="29.4"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          letterSpacing="-0.3"
          fill={colour}
          // The sand behind it is the same colour, so the text needs a gap
          // around it rather than a shade: a thick stroke in the page's own
          // background, painted under the glyphs.
          stroke="var(--card-surface, #ffffff)"
          strokeWidth="1.8"
          paintOrder="stroke"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          {label}
        </text>
      )}
    </svg>
  );
};

export default WfhHourglass;
