import React from "react";
import AnimatedNumber from "../AnimatedNumber";

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

  return (
    <span className="relative grid flex-none place-items-center">
      <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={STROKE}
          stroke={ACCENT[accent].track}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          stroke={ACCENT[accent].stroke}
          strokeDasharray={c}
          strokeDashoffset={c - c * sweep}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <span
        className={`absolute grid place-items-center ${ACCENT[accent].text}`}
      >
        {children}
      </span>
    </span>
  );
};

export interface StatCardProps {
  label: string;
  /**
   * A number counts up; a string (money, a month) is printed as given. A node
   * is rendered as-is, which is how a caller shows a shimmer while the figure
   * is still unknown - a zero would be a claim.
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
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[13px] font-medium text-gray-500 dark:text-gray-400"
          title={label}
        >
          {label}
        </span>
        <span
          className="mt-0.5 flex items-baseline gap-1 truncate text-xl font-bold tabular-nums leading-tight text-gray-900 dark:text-white"
          title={typeof value === "string" ? value : undefined}
        >
          {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          {suffix && (
            <span className="text-[13px] font-medium text-gray-400 dark:text-gray-500">
              {suffix}
            </span>
          )}
        </span>
        {caption && (
          <span className="mt-0.5 block truncate text-[11px] text-gray-400 dark:text-gray-500">
            {caption}
          </span>
        )}
      </span>
    </>
  );

  const shell =
    "statcard flex w-full items-center gap-2.5 rounded-xl " +
    "bg-[var(--glass-fill)] backdrop-blur-[18px] backdrop-saturate-[1.8] " +
    "border border-[var(--glass-edge)] " +
    "shadow-[shadow:var(--glass-sheen),var(--glass-drop)] " +
    "px-3.5 py-4 text-left " +
    (onClick ? "transition-shadow hover:shadow-md cursor-pointer " : "");

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell + className}>
        {body}
      </button>
    );
  }
  return <div className={shell + className}>{body}</div>;
};

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
  className?: string;
}> = ({ tiles, columnsClassName, className = "" }) => {
  // auto-fit down to 11rem, then share what is left: the row always ends
  // flush with the content below it, and wraps to a second line rather than
  // squeezing tiles when there are more of them than fit.
  const cols =
    columnsClassName ?? "sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]";

  return (
    <div className={`grid grid-cols-1 gap-3 ${cols} ${className}`}>
      {tiles.map((tile, i) => (
        <StatCard
          key={tile.label}
          {...tile}
          accent={tile.accent ?? (i % 2 === 0 ? "indigo" : "teal")}
        />
      ))}
    </div>
  );
};

export default StatCard;
