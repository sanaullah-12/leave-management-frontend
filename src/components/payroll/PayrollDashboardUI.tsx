/**
 * Payroll dashboard - presentational primitives.
 *
 * These carry the dashboard's visual language: flat bordered cards, headline
 * figures with muted cents, range tabs, and the segmented arc gauge. They hold
 * no payroll logic; every number is passed in already computed.
 *
 * Colours follow the app rule of one accent family plus the status trio. The
 * accent arrives as a hex because SVG cannot read the themed CSS classes.
 */
import React from "react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/solid";
import { AccentEdge, AccentGlow } from "../ui/CardAccents";
import { splitMoney, formatMoneyCompact } from "./formatters";

export { AccentEdge, AccentGlow };

/**
 * Card shell for this screen. Flatter than the app's neumorphic CARD so dense
 * figures stay readable, but it lifts on hover and clips the accent details
 * (top hairline, corner glow) that give each card its identity.
 */
export const DASH_CARD =
  "group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white " +
  "shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 " +
  "ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 " +
  "hover:border-gray-300/90 hover:shadow-[0_10px_28px_-8px_rgba(16,24,40,0.14)] " +
  "dark:border-gray-700/60 dark:bg-gray-800/70 dark:hover:border-gray-600/80 " +
  "dark:hover:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.6)]";

/* ------------------------------------------------------------------ */
/* Card ornaments                                                      */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Card header                                                         */
/* ------------------------------------------------------------------ */

/**
 * Icon chip plus title, shared by every card on the dashboard. The chip is the
 * same tinted-accent treatment the main dashboard KPI tiles use, so the two
 * screens read as one product.
 */
export const CardHead: React.FC<{
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl text-blue-600 transition-transform duration-300 group-hover:scale-105 dark:text-blue-400">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

/**
 * Styling for the small card links ("View report", "See All"). Exported as a
 * class string rather than a component so pages keep using react-router's Link
 * and never fall back to a full page load.
 */
export const CARD_LINK =
  "inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold " +
  "text-blue-600 transition-colors hover:text-blue-700 " +
  "dark:text-blue-400 dark:hover:text-blue-300";

/* ------------------------------------------------------------------ */
/* Headline money                                                      */
/* ------------------------------------------------------------------ */

/**
 * A currency figure with the cents set smaller and muted, so the eye lands on
 * the significant digits first.
 */
export const Money: React.FC<{
  amount: number;
  currency: string;
  /** Tailwind size classes for the main part. */
  size?: string;
  /** Size of the muted cents. Keep it well below `size`. */
  centsSize?: string;
  /**
   * Switch to compact notation ("PKR 4.3M") at or above this amount. Exact
   * figures with cents are unreadable at millions inside a narrow column, and
   * three of them side by side simply do not fit.
   */
  compactAbove?: number;
  className?: string;
}> = ({
  amount,
  currency,
  size = "text-3xl",
  centsSize = "text-base",
  compactAbove,
  className = "",
}) => {
  const compact =
    compactAbove !== undefined && Math.abs(amount) >= compactAbove;
  const { main, cents } = compact
    ? { main: formatMoneyCompact(amount, currency), cents: "" }
    : splitMoney(amount, currency);

  return (
    <span className={`inline-flex min-w-0 items-baseline ${className}`}>
      <span
        className={`${size} truncate font-bold tabular-nums tracking-tight text-gray-900 dark:text-white`}
      >
        {main}
      </span>
      {cents && (
        <span
          className={`${centsSize} font-semibold tabular-nums text-gray-400 dark:text-gray-400`}
        >
          {cents}
        </span>
      )}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Range tabs                                                          */
/* ------------------------------------------------------------------ */

export interface RangeOption {
  label: string;
  months: number;
}

/** Segmented control for the trend window. */
export const RangeTabs: React.FC<{
  options: readonly RangeOption[];
  value: number;
  onChange: (months: number) => void;
}> = ({ options, value, onChange }) => (
  <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-700/50">
    {options.map((o) => {
      const active = o.months === value;
      return (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(o.months)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            active
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

/* ------------------------------------------------------------------ */
/* Trend badge                                                         */
/* ------------------------------------------------------------------ */

/**
 * Period-over-period change.
 *
 * Payroll cost is not a score, so this does not paint "up" as good. Green
 * means the cost fell, amber means it rose, and a flat month stays neutral.
 */
export const TrendBadge: React.FC<{ percent: number | null; label: string }> = ({
  percent,
  label,
}) => {
  if (percent === null) return null;
  const rounded = Math.round(percent);
  const flat = rounded === 0;
  const up = rounded > 0;
  const tone = flat
    ? "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300"
    : up
    ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
  const Icon = up ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      {!flat && <Icon className="h-3.5 w-3.5" />}
      {up ? "+" : ""}
      {rounded}%
      <span className="font-medium opacity-80">{label}</span>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Summary column                                                      */
/* ------------------------------------------------------------------ */

/** One labelled figure in the summary row. Divider sits on the left edge. */
export const SummaryStat: React.FC<{
  label: string;
  amount: number;
  currency: string;
  /** Accent bar colour above the label. */
  tone: string;
}> = ({ label, amount, currency, tone }) => (
  <div
    className="min-w-0 flex-1 px-2.5 first:pl-0 last:pr-0"
    title={`${label}: ${amount}`}
  >
    <div className="flex items-center gap-1.5">
      <span
        className="h-3 w-0.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: tone }}
      />
      <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
    </div>
    {/* Three figures share a third of the dashboard width, so anything from a
        million up is rendered compactly rather than clipped. */}
    <Money
      amount={amount}
      currency={currency}
      size="text-base"
      centsSize="text-[11px]"
      compactAbove={1_000_000}
      className="mt-0.5 w-full"
    />
  </div>
);

/* ------------------------------------------------------------------ */
/* Segmented gauge                                                     */
/* ------------------------------------------------------------------ */

export interface GaugeSegment {
  value: number;
  color: string;
  label: string;
}

/**
 * Half-doughnut split into weighted segments, drawn as stroked arcs.
 *
 * `pathLength` normalises the arc to 100 units so each segment's dasharray is
 * just its percentage, independent of the radius.
 */
export const SegmentedGauge: React.FC<{
  segments: GaugeSegment[];
  /** Big number rendered in the middle, e.g. "50%". */
  centerLabel: string;
  centerCaption?: string;
}> = ({ segments, centerLabel, centerCaption }) => {
  const positive = segments.filter((s) => s.value > 0);
  const total = positive.reduce((sum, s) => sum + s.value, 0);
  const ARC = "M12 58 A 46 46 0 0 1 104 58";

  // Shares are normalised against the total, so the arc always fills exactly
  // once however the caller's numbers add up.
  let offset = 0;
  const drawn = positive.map((s) => {
    const share = total > 0 ? (s.value / total) * 100 : 0;
    const seg = { ...s, share, offset };
    offset += share;
    return seg;
  });

  return (
    <div className="relative w-full max-w-[190px]">
      <svg viewBox="0 0 116 64" className="w-full">
        {/* Butt caps, not round: rounded ends on both the track and each
            segment overlap at the joins and read as stray dots. */}
        <path
          className="stroke-gray-100 dark:stroke-gray-700/70"
          d={ARC}
          fill="none"
          strokeWidth="14"
          strokeLinecap="butt"
          pathLength={100}
        />
        {drawn.map((s) => (
          <path
            key={s.label}
            d={ARC}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeLinecap="butt"
            pathLength={100}
            strokeDasharray={`${s.share} 100`}
            strokeDashoffset={-s.offset}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          >
            <title>{s.label}</title>
          </path>
        ))}
      </svg>
      {/* Sits inside the arc's mouth rather than on the baseline, so the
          caption never collides with the stroke. */}
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
        <span className="text-lg font-bold leading-none tabular-nums text-gray-900 dark:text-white">
          {centerLabel}
        </span>
        {centerCaption && (
          <span className="mt-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-400">
            {centerCaption}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Key under the gauge. Without it the segment colours are unexplained, and it
 * fills the dead space a lone arc leaves in a tall card.
 */
export const GaugeLegend: React.FC<{ items: GaugeSegment[] }> = ({ items }) => (
  <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
    {items.map((s) => (
      <li
        key={s.label}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400"
      >
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: s.color }}
        />
        {s.label}
      </li>
    ))}
  </ul>
);

/* ------------------------------------------------------------------ */
/* Cycle card                                                          */
/* ------------------------------------------------------------------ */

/** Semantic tint for the payroll-cycle cards. */
export type CycleTone = "settled" | "due" | "idle";

const CYCLE_TONE: Record<CycleTone, { shell: string; chip: string }> = {
  settled: {
    shell:
      "border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white to-white " +
      "dark:border-emerald-500/20 dark:from-emerald-500/10 dark:via-gray-800/70 dark:to-gray-800/70",
    chip:
      "bg-emerald-500/12 text-emerald-600 ring-emerald-500/20 " +
      "dark:bg-emerald-400/12 dark:text-emerald-400 dark:ring-emerald-400/20",
  },
  due: {
    shell:
      "border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-white " +
      "dark:border-amber-500/20 dark:from-amber-500/10 dark:via-gray-800/70 dark:to-gray-800/70",
    chip:
      "bg-amber-500/12 text-amber-600 ring-amber-500/20 " +
      "dark:bg-amber-400/12 dark:text-amber-400 dark:ring-amber-400/20",
  },
  idle: {
    shell:
      "border-gray-200/80 bg-white dark:border-gray-700/60 dark:bg-gray-800/70",
    chip:
      "bg-gray-500/10 text-gray-500 ring-gray-500/15 " +
      "dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20",
  },
};

/**
 * The "Previous / Upcoming payroll" shell. Tinted by meaning rather than by
 * decoration: settled money reads green, money still owed reads amber.
 */
export const CycleCard: React.FC<{
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  meta: string;
  tone: CycleTone;
  children: React.ReactNode;
}> = ({ icon: Icon, label, meta, tone, children }) => {
  const style = CYCLE_TONE[tone];
  return (
    <section
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-8px_rgba(16,24,40,0.14)] dark:hover:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.6)] ${style.shell}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <span
            className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg ring-1 ring-inset transition-transform duration-300 group-hover:scale-105 ${style.chip}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {label}
          </span>
        </span>
        <span className="whitespace-nowrap text-xs font-medium text-gray-400 dark:text-gray-500">
          {meta}
        </span>
      </div>
      {children}
    </section>
  );
};
