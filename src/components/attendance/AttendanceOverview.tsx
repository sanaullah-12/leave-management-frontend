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
  /** Earliest arrival recorded that day, as office wall-clock time. */
  firstTime?: string | null;
  /** Latest arrival recorded that day. Equals firstTime for a single person. */
  lastTime?: string | null;
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
  /** What the breakdown percentages are a share of. */
  breakdownCaption?: string;
  /** The breakdown label the list below the chart is filtered to, if any. */
  selected?: string | null;
  /**
   * Called with a breakdown label when its bar or row is clicked. Supplying it
   * is what makes the breakdown interactive; without it the panel is a
   * read-only summary as before.
   */
  onSelect?: (label: string) => void;
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
      {row.firstTime && (
        <div className="mt-1 border-t border-gray-100 pt-1 text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {row.lastTime && row.lastTime !== row.firstTime
            ? `Arrivals ${row.firstTime} - ${row.lastTime}`
            : `Arrival ${row.firstTime}`}
        </div>
      )}
    </div>
  );
};

const AttendanceOverview: React.FC<Props> = ({
  days,
  breakdown,
  breakdownTotal,
  chartCaption,
  breakdownCaption = "Share of the enrolled workforce",
  selected = null,
  onSelect,
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
          {breakdownCaption}
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
          if (pct <= 0) return null;
          const title = `${row.label}: ${row.count}`;
          return onSelect ? (
            <button
              key={row.label}
              type="button"
              onClick={() => onSelect(row.label)}
              aria-pressed={selected === row.label}
              aria-label={`Show ${row.label}`}
              title={title}
              className="transition-opacity hover:opacity-80"
              style={{
                width: `${pct}%`,
                background: row.tone,
                // The unselected slices dim so the chosen one reads as chosen
                // without moving or resizing anything.
                opacity: selected && selected !== row.label ? 0.35 : 1,
              }}
            />
          ) : (
            <div
              key={row.label}
              style={{ width: `${pct}%`, background: row.tone }}
              title={title}
            />
          );
        })}
      </div>

      {breakdown.map((row) => {
        const pct = breakdownTotal
          ? Math.round((row.count / breakdownTotal) * 100)
          : 0;
        const active = selected === row.label;
        const body = (
          <>
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
          </>
        );
        const shell =
          "flex items-center justify-between border-b border-gray-100 py-2.5 last:border-b-0 dark:border-gray-700";

        return onSelect ? (
          <button
            key={row.label}
            type="button"
            onClick={() => onSelect(row.label)}
            aria-pressed={active}
            className={`${shell} w-full px-2 -mx-2 text-left rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
              active ? "bg-gray-50 dark:bg-gray-700/40" : ""
            }`}
          >
            {body}
          </button>
        ) : (
          <div key={row.label} className={shell}>
            {body}
          </div>
        );
        })}

        {onSelect && (
          <p className="pt-3 text-xs text-gray-400 dark:text-gray-500">
            {selected
              ? `Showing ${selected} below. Click again to clear.`
              : "Click a segment to list them below."}
          </p>
        )}
        </>
      )}
      </div>
    </section>
  );
};

export default AttendanceOverview;
