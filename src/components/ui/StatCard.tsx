import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE, pressSpring } from "../../lib/motion";
import RollingNumber from "./motion/RollingNumber";

/**
 * The product's KPI tile.
 *
 * One horizontal band: a ringed icon on the left, then the metric's label
 * above its figure. Compact on purpose - these run in rows of four to six
 * across the top of a screen, so the tile has to stay short enough that a row
 * of them never pushes the real content below the fold.
 *
 * Used by every screen that opens with a figure row, so a metric looks the
 * same whether it is on the dashboard, in payroll or on a report.
 *
 * On a phone the band turns into a stack and the row goes two across. Four
 * full-width bands is 300px of figures before a screen's actual content
 * starts, which is the single biggest reason these pages read as a desktop
 * layout poured into a phone - and the band itself does not survive the
 * narrowing anyway: at 170px wide, a 40px ring beside a label leaves about
 * eighty pixels of text, so every label truncates. Stacked, the label gets
 * the full width of the tile and the row halves in height.
 */

/** The two accents the row alternates between, as in the reference design. */
export type StatAccent = "indigo" | "teal";

const ACCENT: Record<StatAccent, { stroke: string; text: string; track: string }> = {
  indigo: {
    stroke: "#5b6cf9",
    text: "text-[#5b6cf9]",
    track: "rgba(91, 108, 249, 0.18)",
  },
  teal: {
    stroke: "#2ec7d4",
    text: "text-[#2ec7d4]",
    track: "rgba(46, 199, 212, 0.18)",
  },
};

/**
 * The ring.
 *
 * `percent` draws a real proportion when the caller has one. Without it the
 * arc is a fixed three-quarter sweep - decoration, matching the reference,
 * and deliberately constant so nobody reads a value into it.
 */
const Ring: React.FC<{
  accent: StatAccent;
  percent?: number;
  children: React.ReactNode;
}> = ({ accent, percent, children }) => {
  const SIZE = 40;
  const STROKE = 2.5;
  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const sweep =
    percent == null
      ? 0.75
      : Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0)) / 100;

  const reduce = useReducedMotion();

  return (
    <span className="relative grid flex-none place-items-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-8 w-8 -rotate-90 sm:h-10 sm:w-10"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={STROKE}
          stroke={ACCENT[accent].track}
        />
        {/* The arc draws rather than appearing. A CSS transition on the offset
            cannot do this: the element is painted at its final value, so there
            is no change for the transition to run on, and the ring only ever
            animated when a tile's percentage changed while it was on screen -
            which is to say almost never. Sweeping it out from zero is also
            what ties the tile's own entrance to the figure inside it. */}
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          stroke={ACCENT[accent].stroke}
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - c * sweep }}
          transition={
            reduce
              ? { duration: 0 }
              : // Slower than the scale's ceiling on purpose: this is the one
                // thing on the tile still moving after everything else has
                // landed, and a ring that sweeps at page speed reads as a
                // loading spinner rather than as a measure.
                { duration: 0.7, ease: EASE.out, delay: 0.1 }
          }
        />
      </svg>
      <span
        className={`absolute grid place-items-center [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-5 sm:[&_svg]:w-5 ${ACCENT[accent].text}`}
      >
        {children}
      </span>
    </span>
  );
};

export interface StatCardProps {
  label: string;
  /**
   * A number rolls into place; a string (money, a month) is printed as given.
   * A node is rendered as-is, which is how a caller shows a shimmer while the
   * figure is still unknown - a zero would be a claim.
   */
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: StatAccent;
  /** Draws the ring as a real proportion. Omit for the decorative sweep. */
  percent?: number;
  /**
   * Trails the figure in muted text, on the same line - "12 / 30". Keeps a
   * balance readable without adding the third line that would make this tile
   * taller than the rest of the row.
   */
  suffix?: string;
  /** Optional second line under the figure. */
  caption?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accent = "indigo",
  percent,
  suffix,
  caption,
  onClick,
  className = "",
}) => {
  const body = (
    <>
      <Ring accent={accent} percent={percent}>
        {icon}
      </Ring>
      <span className="min-w-0 w-full flex-1">
        <span
          className="block truncate text-[11.5px] font-medium text-gray-500 dark:text-gray-400 sm:text-[13px]"
          title={label}
        >
          {label}
        </span>
        <span
          className="mt-0.5 flex items-baseline gap-1 truncate text-[19px] font-bold tabular-nums leading-tight text-gray-900 dark:text-white sm:text-xl"
          title={typeof value === "string" ? value : undefined}
        >
          {/* A number rolls; anything else is printed as given. The roll, not a
              count-up: these are counts of people and days, and counting up to
              eleven pending requests through every number below it claims a
              sequence that did not happen. See RollingNumber. */}
          {typeof value === "number" ? <RollingNumber value={value} /> : value}
          {suffix && (
            <span className="text-[13px] font-medium text-gray-400 dark:text-gray-500">
              {suffix}
            </span>
          )}
        </span>
        {/* A third line does not fit a half-width tile, and it is always a
            gloss on the label rather than a second fact. */}
        {caption && (
          <span className="mt-0.5 hidden truncate text-[11px] text-gray-400 dark:text-gray-500 sm:block">
            {caption}
          </span>
        )}
      </span>
    </>
  );

  const shell =
    "statcard flex w-full flex-col items-start gap-1.5 rounded-xl " +
    "sm:flex-row sm:items-center sm:gap-2.5 " +
    "bg-[var(--glass-fill)] backdrop-blur-[18px] backdrop-saturate-[1.8] " +
    "border border-[var(--glass-edge)] " +
    "shadow-[shadow:var(--glass-sheen),var(--glass-drop)] " +
    "px-3 py-3 text-left sm:px-3.5 sm:py-4 " +
    (onClick ? "press-scale transition-shadow hover:shadow-md cursor-pointer " : "");

  if (onClick) {
    /* A tile that navigates gets both halves of the feedback: it lifts under a
       mouse, where there is a cursor to answer, and shrinks under a finger,
       where there is not. `.press-scale` stays on the class list because it
       covers the touch case with no JavaScript at all, and it is harmless
       alongside this - it only applies on a coarse pointer, where `whileHover`
       never fires. */
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985, y: 0 }}
        transition={pressSpring}
        className={shell + className}
      >
        {body}
      </motion.button>
    );
  }
  return <div className={shell + className}>{body}</div>;
};

/**
 * The column rule for a row of exactly four metrics.
 *
 * `auto-fit` is right for a row whose length varies: it fits as many tiles as
 * the room allows. With exactly four that is the problem - on any width where
 * three fit and four do not, it gives three and orphans the fourth on a line
 * of its own, and that band is a 1024-1280px laptop with the sidebar open.
 *
 * This rule is four or two, never three. It is a container query rather than a
 * breakpoint because the sidebar is 19rem expanded and 4rem collapsed, so one
 * viewport width gives two row widths 15rem apart; the row has to ask its own
 * width. See `.kpi-four-up` in design-system.css.
 *
 * Pass it to `columnsClassName` and wrap the row in {@link KPI_MEASURE}, or use
 * {@link StatCardRow} with `fourUp`, which does both.
 */
export const FOUR_UP_COLUMNS = "kpi-four-up";

/** The wrapper a `kpi-four-up` row measures itself against. */
export const KPI_MEASURE = "kpi-measure";

/**
 * A row of tiles.
 *
 * The accent alternates down the row unless a tile names its own, which is
 * what gives the row its indigo/teal rhythm in the reference.
 */
export const StatCardRow: React.FC<{
  tiles: Array<Omit<StatCardProps, "accent"> & { accent?: StatAccent }>;
  /** Column count from `lg` up. Defaults to one per tile, capped at six. */
  columnsClassName?: string;
  /**
   * Four across wherever four fit, two where they do not - for a row whose
   * length is known to be four. See {@link FOUR_UP_COLUMNS}.
   */
  fourUp?: boolean;
  className?: string;
}> = ({ tiles, columnsClassName, fourUp = false, className = "" }) => {
  // auto-fit down to 11rem, then share what is left: the row always ends
  // flush with the content below it, and wraps to a second line rather than
  // squeezing tiles when there are more of them than fit.
  const cols =
    columnsClassName ??
    (fourUp
      ? FOUR_UP_COLUMNS
      : "sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]");

  const fourUpRow = cols.includes(FOUR_UP_COLUMNS);

  const row = (
    /* `grid-cols-2` is dropped for a four-up row: `kpi-four-up` carries both
       the two-column base and the four-column container rule, and a Tailwind
       utility would win the cascade over the container rule and pin the row
       at two. */
    <div
      className={`grid gap-2.5 sm:gap-3 ${
        fourUpRow ? "" : "grid-cols-2"
      } ${cols} ${className}`}
    >
      {tiles.map((tile, i) => (
        <StatCard
          key={tile.label}
          {...tile}
          accent={tile.accent ?? (i % 2 === 0 ? "indigo" : "teal")}
        />
      ))}
    </div>
  );

  // A container query measures the nearest container ancestor, so a row that
  // asks its own width needs one wrapped around it.
  return fourUpRow ? <div className={KPI_MEASURE}>{row}</div> : row;
};

export default StatCard;
