import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { ArrowTrendingUpIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { EmptyNote, SHEET } from "../../mobile/primitives";
import LeaveTrendChart, {
  ChartHead,
  TooltipCard,
} from "../../mobile/LeaveTrendChart";
import type { DashboardMiniStat, TrendPoint, TypePoint } from "./types";
import useChartMotion from "../../../hooks/useChartMotion";

/**
 * The two charts, on a screen of their own.
 *
 * On the desktop page these sit side by side in a three-column row. Stacked
 * on a phone they are two full screens of chart, which is why they are a tab
 * rather than something you scroll to: a chart nobody scrolled to is a chart
 * that was not read, and a chart that pushes the roster off the first screen
 * has cost more than it gave.
 *
 * They take different marks because they answer different questions. The trend
 * is a shape over twelve months, so it is drawn the way the attendance screen
 * draws its overview: a filled area for the settled state, a line over it for
 * the state that still needs somebody. The split by type is three separate
 * categories with nothing between them, so it is bars - there is no slope from
 * Annual to Sick to read.
 *
 * Both are drawn at around 120px. A chart is a shape at this size, not a table
 * to read values off - the figures that need reading are the tiles underneath
 * and in the card's badge.
 */

interface Props {
  trend: TrendPoint[];
  types: TypePoint[];
  miniStats: DashboardMiniStat[];
  /** Caption under the trend heading - it differs for an admin and an employee. */
  trendCaption: string;
  typesCaption: string;
  /**
   * What the bars in "Leave by type" count, for the card's badge and tooltip.
   * An admin's are requests and an employee's are days, and a total says
   * nothing without which.
   */
  typesUnit: string;
  accent: string;
  accentSoft: string;
  isDark: boolean;
}

/** The pill in a chart card's top corner: one figure for the whole chart. */
const ChartBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex flex-none items-center gap-1.5 rounded-full border border-gray-200 bg-black/[0.03] px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-300">
    <ArrowTrendingUpIcon
      className="h-[13px] w-[13px] flex-none"
      style={{ color: "var(--accent)" }}
    />
    {children}
  </span>
);

/** One leave type. */
const TypeTooltip = ({ active, payload, unit }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as TypePoint;
  return (
    <TooltipCard title={row.name}>
      <p className="text-gray-500 dark:text-gray-400">
        {row.value} {unit}
      </p>
    </TooltipCard>
  );
};

const MobileChartsTab: React.FC<Props> = ({
  trend,
  types,
  miniStats,
  trendCaption,
  typesCaption,
  typesUnit,
  accent,
}) => {
  /* Recharts animates by default, to its own timing. See useChartMotion. */
  const chartMotion = useChartMotion();
  const hasTypes = types.some((entry) => entry.value > 0);
  const miniStatMax = Math.max(...miniStats.map((stat) => stat.value), 1);
  /* What the bars add up to - the badge's figure. */
  const typesTotal = types.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="space-y-3">
      {/* ---------------- Leave trends ---------------- */}
      {/* The attendance screen's overview chart, reading leave instead of
          arrivals: the settled state as a filled area, the state that still
          needs somebody as a line over it, and a key underneath. */}
      <div className={`${SHEET} p-4`}>
        <ChartHead title="Leave trends" caption={trendCaption} />
        <LeaveTrendChart data={trend} accent={accent} />
      </div>

      {/* ---------------- Leave by type ---------------- */}
      <div className={`${SHEET} p-4`}>
        <ChartHead
          title="Leave by type"
          caption={typesCaption}
          badge={
            <ChartBadge>
              {typesTotal} {typesUnit}
            </ChartBadge>
          }
        />
        <div className="h-[130px]">
          {hasTypes ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={types}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                barCategoryGap="34%"
              >
                {/* Horizontal rules only. Vertical ones would box each type
                    in, and the types are already named along the axis. */}
                <CartesianGrid
                  vertical={false}
                  stroke="currentColor"
                  className="text-black/[0.07] dark:text-white/[0.09]"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-gray-400 dark:text-gray-500"
                />
                <Tooltip
                  content={<TypeTooltip unit={typesUnit} />}
                  cursor={{ fill: "rgba(148,163,184,0.12)" }}
                />
                {/* One colour for every bar, rounded to a pill.

                    A hue per type would read as a code to learn, and the chart
                    directly above this one already spends amber on "pending" -
                    the same amber on "sick leave" here would be two meanings
                    for one colour on a single screen. Each type is named on the
                    axis under its own bar, which is where a name belongs. */}
                <Bar
                  {...chartMotion}
                  dataKey="value"
                  fill={accent}
                  radius={6}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyNote icon={ChartBarIcon} title="No data yet" />
          )}
        </div>

        {/* The figures worth reading exactly, under the shape that is not. */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/5 pt-4 dark:border-white/10">
          {miniStats.map((stat) => (
            <div key={stat.label}>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <span className="flex-none" style={{ color: "var(--accent)" }}>
                  <stat.icon className="h-[13px] w-[13px]" />
                </span>
                <span className="truncate text-[10.5px] font-semibold">
                  {stat.label}
                </span>
              </div>
              <p className="mt-1 text-[17px] font-bold leading-none tabular-nums text-gray-900 dark:text-white">
                {stat.value}
              </p>
              {/* Width is this tile's share of the largest in the group, so the
                  four can be compared without reading all four numbers. */}
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    backgroundColor: "var(--accent)",
                    width:
                      stat.value <= 0
                        ? "6%"
                        : `${Math.max(6, (stat.value / miniStatMax) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileChartsTab;
