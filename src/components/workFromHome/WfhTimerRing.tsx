import React, { useId } from "react";
import { statusColor } from "../../lib/themeTokens";

/**
 * The work timer, drawn as a ring.
 *
 * One reading, from across the room: how far through the planned day the
 * employee is, what they are working on, and whether the clock is running. The
 * arc carries the progress, the colour carries the state - a moving accent
 * ring while work is counted, amber the moment it stops - so neither has to be
 * read as a word to be understood.
 *
 * Presentational and nothing else. It is handed a number of milliseconds
 * already formatted and a fraction already computed; it owns no timer, no
 * session and no rule. What it shows is whatever WfhTodayCard passes, which in
 * turn is the server's figure - see hooks/useWfhSession.
 */

export type RingTone = "working" | "paused" | "idle" | "done";

interface Props {
  /** 0 to 1, or null when there is no planned day to measure against. */
  progress: number | null;
  /** The stopwatch, pre-formatted. */
  time: string;
  /** The word under the clock: FOCUS, PAUSED, and so on. */
  label: string;
  /** What is being worked on right now, if anything. */
  task?: string | null;
  tone: RingTone;
  /** The theme accent, used while the clock is running. */
  accent: string;
  accentSoft: string;
  /** The one control that belongs inside the ring: pause, or resume. */
  children?: React.ReactNode;
}

const SIZE = 240;
const STROKE = 13;
/** Inset by the stroke so the round cap is never clipped by the viewBox. */
const RADIUS = (SIZE - STROKE) / 2 - 4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Amber for a stopped clock, matching WfhSessionStatusBadge's "Inactive". */
const PAUSED = { from: "#f59e0b", to: statusColor("warning") };

const WfhTimerRing: React.FC<Props> = ({
  progress,
  time,
  label,
  task,
  tone,
  accent,
  accentSoft,
  children,
}) => {
  // Unique per instance: two rings on one page sharing a gradient id would
  // both paint whichever definition the document happened to hold last.
  const gradientId = `wfh-ring-${useId().replace(/:/g, "")}`;

  const stops =
    tone === "paused"
      ? PAUSED
      : tone === "done"
      ? // A finished clock is the accent too, read the other way round: the
        // arc runs from the solid end to the soft one, so "done" is the same
        // colour as "running" without being the same sweep.
        { from: accent, to: accentSoft }
      : { from: accentSoft, to: accent };

  // A day with no planned hours has nothing to be a fraction of. A token arc
  // is drawn instead of an empty circle, so the ring still reads as a timer
  // rather than as a border somebody forgot to fill in.
  const fraction =
    progress === null ? (tone === "idle" ? 0 : 0.04) : Math.min(1, Math.max(0, progress));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[260px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={stops.from} />
            <stop offset="100%" stopColor={stops.to} />
          </linearGradient>
        </defs>

        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-gray-200/80 dark:stroke-white/10"
        />

        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      {/*
        The centre.

        Inset to 68% of the ring on every side, which is the largest square that
        fits inside a circle with room to spare (a circle of diameter D holds a
        square of D/sqrt(2), about 0.71D). Everything inside is laid out against
        that box rather than against the ring, so nothing can drift under the
        stroke however long a task name is or however wide the clock gets.

        Every row is a fixed height and one line. A task that appeared and
        wrapped to two lines would push the clock off centre, and a clock that
        moves when somebody switches task is worse than a truncated title.
      */}
      <div className="absolute inset-[16%] flex flex-col items-center justify-center text-center">
        {/* A block rather than a flex row: `text-overflow` only applies to a
            block box, so an over-long title ends in an ellipsis here and in a
            hard cut there. */}
        <p
          className={`h-4 w-full truncate px-1 text-[10px] font-semibold uppercase leading-4 tracking-wide ${
            task
              ? "text-gray-500 dark:text-gray-400"
              : "font-normal normal-case tracking-normal text-gray-300 dark:text-gray-600"
          }`}
          title={task || undefined}
        >
          {task || "No task selected"}
        </p>

        <p className="mt-1.5 whitespace-nowrap font-mono text-[1.7rem] font-semibold leading-none tabular-nums text-gray-900 sm:text-[2rem] dark:text-gray-100">
          {time}
        </p>

        <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
          {label}
        </p>

        {children && <div className="mt-2.5">{children}</div>}
      </div>
    </div>
  );
};

export default WfhTimerRing;
