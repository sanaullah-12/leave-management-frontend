import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  ArrowPathIcon,
  ChartBarIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "../../ui/DatePicker";
import type { DayBar } from "../AttendanceOverview";
import { EmptyNote, GroupLabel, PrimaryButton, SHEET, WELL } from "../../mobile/primitives";

/**
 * The range, its headline figures and its two charts.
 *
 * Loading a range is one request per employee, so it stays something the
 * reader asks for rather than something a date change sets off. That is why
 * the controls read as a sentence from top to bottom - which days, how wide,
 * then load them - and why changing a date says the figures are stale instead
 * of silently replacing them.
 *
 * Two charts, because they answer different questions. The area chart is the
 * shape of the range: did lateness climb through the fortnight. The donut is
 * the range as one figure: what share of it went which way.
 */

export interface MobileStat {
  label: string;
  value: number | null;
  /** Ring and glyph colour. */
  tone: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface MobileSlice {
  label: string;
  count: number;
  tone: string;
}

/** The donut's geometry. 14px stroke on r=42 inside a 104 box. */
const RING_RADIUS = 42;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const RANGE_PRESETS = [
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
];

const ChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as DayBar;
  return (
    <div className="rounded-xl border border-gray-200 bg-[var(--card-surface)] px-3 py-2 text-[11.5px] shadow-lg dark:border-white/10">
      <p className="mb-1 font-semibold text-gray-900 dark:text-white">
        {row.full}
      </p>
      <p className="text-gray-500 dark:text-gray-400">On time: {row.onTime}</p>
      <p className="text-gray-500 dark:text-gray-400">Late: {row.late}</p>
      {row.firstTime && (
        <p className="mt-1 border-t border-gray-100 pt-1 text-gray-400 dark:border-white/10 dark:text-gray-500">
          {row.lastTime && row.lastTime !== row.firstTime
            ? `Arrivals ${row.firstTime} - ${row.lastTime}`
            : `Arrival ${row.firstTime}`}
        </p>
      )}
    </div>
  );
};

interface Props {
  startDate: string;
  endDate: string;
  onStartDate: (iso: string) => void;
  onEndDate: (iso: string) => void;
  /** Which preset chip is lit, or null when the dates were set by hand. */
  activeRangeDays: number | null;
  onPreset: (days: number) => void;

  onFetch: () => void;
  canFetch: boolean;
  loading: boolean;
  progress: { done: number; total: number };
  fetched: boolean;
  /** The range moved since the figures on screen were loaded. */
  stale: boolean;

  stats: MobileStat[];
  days: DayBar[];
  slices: MobileSlice[];
  /** What the donut is a share of. */
  sliceTotalLabel: string;
  rangeLabel: string;
  accent: string;
}

const MobileTrendsTab: React.FC<Props> = ({
  startDate,
  endDate,
  onStartDate,
  onEndDate,
  activeRangeDays,
  onPreset,
  onFetch,
  canFetch,
  loading,
  progress,
  fetched,
  stale,
  stats,
  days,
  slices,
  sliceTotalLabel,
  rangeLabel,
  accent,
}) => {
  const drawn = slices.filter((slice) => slice.count > 0);
  const marked = drawn.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <div className="space-y-3">
      {/* Which days, how wide, then load them. */}
      <div className={`${SHEET} p-3.5`}>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <DatePicker
              value={startDate}
              max={endDate}
              onChange={(next) => next && onStartDate(next)}
              placeholder="Start"
            />
          </div>
          <ArrowLongRightIcon className="h-4 w-4 flex-none text-gray-400 dark:text-gray-500" />
          <div className="min-w-0 flex-1">
            <DatePicker
              value={endDate}
              min={startDate}
              onChange={(next) => next && onEndDate(next)}
              placeholder="End"
            />
          </div>
        </div>

        <div className="mt-2.5 flex gap-1.5">
          {RANGE_PRESETS.map((preset) => {
            const on = activeRangeDays === preset.days;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={on}
                onClick={() => onPreset(preset.days)}
                className={`min-h-[36px] flex-1 rounded-[11px] border text-[11.5px] font-semibold transition-colors ${
                  on
                    ? "text-white"
                    : `text-gray-500 dark:text-gray-400 ${WELL}`
                }`}
                style={
                  on
                    ? { backgroundColor: accent, borderColor: accent }
                    : undefined
                }
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="mt-2.5">
          <PrimaryButton
            onClick={onFetch}
            disabled={loading || !canFetch}
            icon={ArrowPathIcon}
            busy={loading}
          >
            {loading
              ? `Fetching ${progress.done} of ${progress.total}`
              : fetched
              ? "Fetch again"
              : "Fetch attendance"}
          </PrimaryButton>
        </div>

        {!canFetch && !loading && (
          <p className="mt-2 text-center text-[11.5px] text-gray-400 dark:text-gray-500">
            Connect to the device to load the roster first.
          </p>
        )}

        {stale && !loading && (
          <p className="mt-2 rounded-[11px] bg-amber-50 px-3 py-2 text-center text-[11.5px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            Range changed - fetch to update
          </p>
        )}
      </div>

      {/* Headline figures. Two across: four tiles in a row on a phone are four
          columns of 80px, and a two-digit count in 80px is all the tile is. */}
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((stat) => (
          <div key={stat.label} className={`${SHEET} p-3`}>
            <span
              className="mb-2.5 grid h-[26px] w-[26px] place-items-center rounded-[8px]"
              style={{ backgroundColor: `${stat.tone}1f`, color: stat.tone }}
            >
              <stat.icon className="h-[14px] w-[14px]" />
            </span>
            <p className="text-[18px] font-bold leading-none tabular-nums text-gray-900 dark:text-white">
              {stat.value === null ? "-" : stat.value}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* The shape of the range */}
      <div className={`${SHEET} p-4`}>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
            Attendance overview
          </p>
          <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
            {rangeLabel}
          </p>
        </div>

        {days.length ? (
          <>
            <div className="h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={days}
                  margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                >
                  <defs>
                    <linearGradient id="mobOnTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "currentColor" }}
                    className="text-gray-400 dark:text-gray-500"
                    interval="preserveStartEnd"
                    minTickGap={12}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Area
                    type="monotone"
                    dataKey="onTime"
                    stroke={accent}
                    strokeWidth={2.2}
                    fill="url(#mobOnTime)"
                  />
                  <Area
                    type="monotone"
                    dataKey="late"
                    stroke="#b5650a"
                    strokeWidth={2.2}
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex gap-4">
              {[
                { label: "On time", tone: accent },
                { label: "Late", tone: "#b5650a" },
              ].map((entry) => (
                <span
                  key={entry.label}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400"
                >
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ backgroundColor: entry.tone }}
                  />
                  {entry.label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <EmptyNote
            icon={ChartBarIcon}
            title={loading ? "Loading the range" : "Nothing to chart yet"}
            body={
              loading
                ? undefined
                : "Fetch attendance above to draw the range."
            }
          />
        )}
      </div>

      {/* The range as one figure */}
      {drawn.length > 0 && (
        <div className={`${SHEET} p-4`}>
          <GroupLabel className="mb-3">{sliceTotalLabel}</GroupLabel>
          <div className="flex items-center gap-4">
            {/* Drawn as arcs of one circle rather than through a charting
                library. At 104px the ring is a graphic, not a chart - there is
                nothing to hover, nothing to resize to - and a measured
                container this small is a layout that can go wrong for no
                benefit. */}
            <div className="relative h-[104px] w-[104px] flex-none">
              <svg
                viewBox="0 0 104 104"
                className="h-full w-full -rotate-90"
                role="img"
                aria-label={drawn
                  .map((slice) => `${slice.label}: ${slice.count}`)
                  .join(", ")}
              >
                <circle
                  cx="52"
                  cy="52"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="14"
                  className="stroke-black/[0.06] dark:stroke-white/[0.08]"
                />
                {(() => {
                  let offset = 0;
                  return drawn.map((slice) => {
                    const length = (slice.count / marked) * RING_LENGTH;
                    const dash = offset;
                    offset += length;
                    return (
                      <circle
                        key={slice.label}
                        cx="52"
                        cy="52"
                        r={RING_RADIUS}
                        fill="none"
                        stroke={slice.tone}
                        strokeWidth="14"
                        strokeDasharray={`${length} ${RING_LENGTH - length}`}
                        strokeDashoffset={-dash}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-[20px] font-bold leading-none tabular-nums text-gray-900 dark:text-white">
                    {marked}
                  </p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                    Marked
                  </p>
                </div>
              </div>
            </div>

            <ul className="min-w-0 flex-1 space-y-2.5">
              {drawn.map((slice) => (
                <li
                  key={slice.label}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-[7px] w-[7px] flex-none rounded-full"
                      style={{ backgroundColor: slice.tone }}
                    />
                    <span className="truncate text-[12px] text-gray-500 dark:text-gray-400">
                      {slice.label}
                    </span>
                  </span>
                  <span className="text-[12.5px] font-bold tabular-nums text-gray-900 dark:text-white">
                    {slice.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTrendsTab;
