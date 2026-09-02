import React from "react";
import { CARD } from "../../lib/surfaces";
import { AccentEdge } from "../ui/CardAccents";
import { useThemeAccent } from "../../hooks/useThemeAccent";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * The overview pair: a stacked bar chart of the last days beside the current
 * split by status.
 *
 * Two series, so a legend is always present and each is named in the tooltip -
 * identity never rests on the fill colour alone.
 */

export interface DayBar {
  /** Axis label, e.g. "Mon". */
  label: string;
  /** Full date for the tooltip heading. */
  full: string;
  onTime: number;
  late: number;
}

export interface BreakdownRow {
  label: string;
  count: number;
  tone: string;
}

interface Props {
  days: DayBar[];
  breakdown: BreakdownRow[];
  breakdownTotal: number;
  chartCaption: string;
  loading?: boolean;
  /** Shown in place of the chart and breakdown before anything is loaded. */
  emptyMessage?: string;
}

const ON_TIME = "rgb(var(--blue-600))";
const LATE = "#b45309";

const TooltipCard = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as DayBar;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-600 dark:bg-gray-800">
      <div className="mb-1 font-medium text-gray-900 dark:text-gray-100">
        {row.full}
      </div>
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <span
          className="h-2 w-2 rounded-sm"
          style={{ background: ON_TIME }}
        />
        On time: {row.onTime}
      </div>
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <span className="h-2 w-2 rounded-sm" style={{ background: LATE }} />
        Late: {row.late}
      </div>
    </div>
  );
};

const AttendanceOverview: React.FC<Props> = ({
  days,
  breakdown,
  breakdownTotal,
  chartCaption,
  loading = false,
  emptyMessage,
}) => {
  const accent = useThemeAccent(600);

  return (
  <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
    {/* Chart */}
    <div className={`relative overflow-hidden ${CARD} p-5`}>
      <AccentEdge color={accent} />
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Attendance overview
        </p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          {chartCaption}
        </p>
      </div>

      <div style={{ width: "100%", height: 220 }}>
        {loading || !days.length ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-400 dark:border-gray-700">
            {loading
              ? "Loading attendance..."
              : emptyMessage || "No attendance in this range."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={days}
              barGap={4}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="rgb(var(--line, 229 232 237))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#9098a6" }}
                axisLine={{ stroke: "#e5e8ed" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9098a6" }}
                axisLine={false}
                tickLine={false}
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgb(var(--blue-600) / 0.06)" }}
                content={<TooltipCard />}
              />
              <Bar dataKey="onTime" stackId="a" fill={ON_TIME} name="On time" />
              <Bar
                dataKey="late"
                stackId="a"
                fill={LATE}
                name="Late"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-4">
        <span className="flex items-center gap-1.5 text-[12.5px] text-gray-600 dark:text-gray-300">
          <span
            className="h-2 w-2 rounded-sm"
            style={{ background: ON_TIME }}
          />
          On time
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px] text-gray-600 dark:text-gray-300">
          <span className="h-2 w-2 rounded-sm" style={{ background: LATE }} />
          Late
        </span>
      </div>
    </div>

    {/* Breakdown */}
    <div className={`relative overflow-hidden ${CARD} p-5`}>
      <AccentEdge color={accent} />
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Current breakdown
        </p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          Share of the enrolled workforce
        </p>
      </div>

      {emptyMessage ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          {emptyMessage}
        </p>
      ) : (
        <>
      <div className="mb-3.5 flex h-2 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
        {breakdown.map((row) => {
          const pct = breakdownTotal
            ? (row.count / breakdownTotal) * 100
            : 0;
          return pct > 0 ? (
            <div
              key={row.label}
              style={{ width: `${pct}%`, background: row.tone }}
              title={`${row.label}: ${row.count}`}
            />
          ) : null;
        })}
      </div>

      {breakdown.map((row) => {
        const pct = breakdownTotal
          ? Math.round((row.count / breakdownTotal) * 100)
          : 0;
        return (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-gray-100 py-2.5 last:border-b-0 dark:border-gray-700"
          >
            <div className="flex items-center gap-2.5 text-[13px] text-gray-900 dark:text-gray-100">
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ background: row.tone }}
              />
              {row.label}
            </div>
            <div className="flex items-center gap-2">
              <span className="min-w-[22px] text-right text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                {row.count}
              </span>
              <span className="min-w-[34px] text-right text-xs text-gray-400">
                {pct}%
              </span>
            </div>
          </div>
        );
        })}
        </>
      )}
      </div>
    </section>
  );
};

export default AttendanceOverview;
