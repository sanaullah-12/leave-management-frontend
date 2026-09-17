import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { LATE_INK } from "./primitives";
import useChartMotion from "../../hooks/useChartMotion";

/**
 * Leave over twelve months, as a phone chart.
 *
 * Lives here rather than inside one screen because two screens draw it: the
 * dashboard's chart tab reads the whole company or the signed-in employee, and
 * an employee's record reads that one person. They are the same chart asking
 * the same question of a different set of rows, so they are one component - a
 * second copy would be two charts that look alike until the next edit.
 *
 * Settled work is a filled area and work that still needs somebody is a line
 * drawn over it, which is the same pair of marks the attendance overview uses.
 * Rejected is reported in the tooltip rather than drawn: it is a decision
 * already made, so it behaves like approved, not like the pending work the
 * second series exists to surface.
 *
 * Around 110px on purpose. A chart this size is a shape, not a table to read
 * values off; the figures that need reading exactly belong in tiles beside it.
 */

/** One month of the trend. `value` is the three outcomes added together. */
export interface LeaveTrendPoint {
  month: string;
  value: number;
  approved: number;
  pending: number;
  rejected: number;
}

/** What one unit of the trend is. An admin counts requests, a record counts days. */
export interface TrendUnit {
  one: string;
  many: string;
}

/**
 * A tooltip in the card material.
 *
 * Recharts styles its own tooltip inline and so cannot pick up the theme - on
 * a dark card its white default is a torch shining out of the plot.
 */
export const TooltipCard: React.FC<{
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, children, footer }) => (
  <div className="rounded-xl border border-gray-200 bg-[var(--card-surface)] px-3 py-2 text-[11.5px] shadow-lg dark:border-white/10">
    <p className="mb-1 font-semibold text-gray-900 dark:text-white">{title}</p>
    {children}
    {footer && (
      <p className="mt-1 border-t border-gray-100 pt-1 text-gray-400 dark:border-white/10 dark:text-gray-500">
        {footer}
      </p>
    )}
  </div>
);

/**
 * One card heading: what the chart is, what it covers, and optionally one
 * figure for the whole of it.
 *
 * The caption sits under the title rather than opposite it. These captions are
 * sentences - "Company leave activity across recent requests" - and beside a
 * title on a 360px card there is no width left for one.
 */
export const ChartHead: React.FC<{
  title: string;
  caption: string;
  /** A headline figure for the whole chart, set to the right of the title. */
  badge?: React.ReactNode;
}> = ({ title, caption, badge }) => (
  <div className="mb-3 flex items-start gap-2">
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
        {title}
      </p>
      {/* Wraps rather than truncating. These captions carry the caveat on what
          the chart is built from - "across recent requests" - and cut to one
          line beside the badge that is exactly the half that is lost. */}
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-400 dark:text-gray-500">
        {caption}
      </p>
    </div>
    {badge}
  </div>
);

/** The key under a chart: one dot and one word per series drawn. */
export const ChartLegend: React.FC<{
  entries: { label: string; tone: string }[];
}> = ({ entries }) => (
  <div className="mt-3 flex gap-4">
    {entries.map((entry) => (
      <span
        key={entry.label}
        className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400"
      >
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] rounded-full"
          style={{ backgroundColor: entry.tone }}
        />
        {entry.label}
      </span>
    ))}
  </div>
);

/**
 * One month, named in full.
 *
 * All three outcomes are named even when a month has none of one: a month flat
 * because nothing was refused and a month flat because the tooltip skipped the
 * line look identical otherwise.
 */
const TrendTooltip = ({ active, payload, unit }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as LeaveTrendPoint;
  return (
    <TooltipCard
      title={row.month}
      footer={`${row.value} ${
        row.value === 1 ? unit.one : unit.many
      } in total`}
    >
      <p className="text-gray-500 dark:text-gray-400">Approved: {row.approved}</p>
      <p className="text-gray-500 dark:text-gray-400">Pending: {row.pending}</p>
      <p className="text-gray-500 dark:text-gray-400">Rejected: {row.rejected}</p>
    </TooltipCard>
  );
};

interface Props {
  data: LeaveTrendPoint[];
  /** Theme accent, for the settled series. */
  accent: string;
  /** What one unit is. Requests on the dashboard, days on an employee record. */
  unit?: TrendUnit;
}

const LeaveTrendChart: React.FC<Props> = ({
  data,
  accent,
  unit = { one: "request", many: "requests" },
}) => {
  /* Recharts animates by default, to its own timing. See useChartMotion. */
  const chartMotion = useChartMotion();
  // Two of these on one page would otherwise share a <defs> id and the second
  // would paint with the first one's gradient. The colons React puts in an id
  // are not safe inside url(), so they come out.
  const gradientId = `leaveTrend${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <>
      <div className="h-[110px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 12 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* Drop the middle labels rather than every third one: twelve
                months at 360px overlap into a grey smear, and the two that
                anchor the range are the ends. */}
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "currentColor" }}
              className="text-gray-400 dark:text-gray-500"
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <Tooltip content={<TrendTooltip unit={unit} />} cursor={false} />
            <Area
              {...chartMotion}
              type="monotone"
              dataKey="approved"
              stroke={accent}
              strokeWidth={2.2}
              fill={`url(#${gradientId})`}
            />
            <Area
              {...chartMotion}
              type="monotone"
              dataKey="pending"
              stroke={LATE_INK}
              strokeWidth={2.2}
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        entries={[
          { label: "Approved", tone: accent },
          { label: "Pending", tone: LATE_INK },
        ]}
      />
    </>
  );
};

export default LeaveTrendChart;
