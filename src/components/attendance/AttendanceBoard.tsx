import React, { useCallback, useMemo, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Select from "../ui/Select";
import { CARD } from "../../lib/surfaces";
import { AccentEdge } from "../ui/CardAccents";
import { useThemeAccent } from "../../hooks/useThemeAccent";
import {
  PERIOD_OPTIONS,
  periodRange,
  type PeriodKey,
  type PeriodRange,
} from "../../lib/attendancePeriod";
import {
  ByDateTable,
  ByEmployeeTable,
  type RosterDayRow,
} from "./RosterTables";
import { EMPTY_ROSTER_TOTALS, useRosterDay } from "../../hooks/useRosterDay";
import MobileAttendanceToday from "./MobileAttendanceToday";
import TodayRoster from "./TodayRoster";
import TodaySummary from "./TodaySummary";
import { statusColor } from "../../lib/themeTokens";
import useTimeAgo from "../../hooks/useTimeAgo";

/**
 * Attendance for a chosen period, as one section.
 *
 * Today by default, because "who is in today" is the question the screen is
 * opened to answer. The other three windows are the same read over a wider
 * range, served by the same endpoint in a single request.
 *
 * Everything shown is the server's own judgement of the punches, under the
 * office arrival rule an admin configured. Nothing is recalculated here, and
 * nothing is invented for a day with no data - a period with no records says
 * so rather than drawing an empty grid that reads as a roster of absences.
 */

interface Props {
  /** Which window the section opens on. */
  defaultPeriod?: PeriodKey;
  /** Told whenever the window changes, so a host page can follow it. */
  onRangeChange?: (range: PeriodRange) => void;
  /** The dashboard trims the table; the attendance page shows all of it. */
  variant?: "dashboard" | "page";
  /** An employee sees their own days, so the wording changes. */
  role?: string;
  title?: string;
  /** Rendered under the table, e.g. a link through to the full page. */
  footer?: React.ReactNode;
}

const AttendanceBoard: React.FC<Props> = ({
  defaultPeriod = "today",
  onRangeChange,
  variant = "page",
  role,
  title,
  footer,
}) => {
  const accent = useThemeAccent(600);
  const isSelfView = role === "employee";

  const [period, setPeriod] = useState<PeriodKey>(defaultPeriod);
  const range = useMemo(() => periodRange(period), [period]);

  const { data, loading, refreshing, error, refresh, fetchedAt } = useRosterDay(
    range.from,
    range.to,
    range.detail
  );

  const updatedAgo = useTimeAgo(fetchedAt);

  // "By date" or "By employee", once the period covers more than one day.
  const [grouping, setGrouping] = useState<"date" | "employee">("date");

  // Which state the day is narrowed to, set by the summary tiles. Cleared on
  // a period change: "absent" is a filter on a day, not on a quarter, and
  // carrying it across would hide rows the new period never filtered.
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const changePeriod = useCallback(
    (next: string) => {
      const key = next as PeriodKey;
      setPeriod(key);
      setStatusFilter(null);
      onRangeChange?.(periodRange(key));
    },
    [onRangeChange]
  );

  const totals = data?.totals || EMPTY_ROSTER_TOTALS;
  const singleDay = (data?.days?.length ?? 0) <= 1 && period === "today";

  /** The day rows the server sent, filed under the date they belong to. */
  const rowsByDate = useMemo(() => {
    const grouped: Record<string, RosterDayRow[]> = {};
    for (const row of data?.rows || []) {
      (grouped[row.date] ||= []).push(row);
    }
    return grouped;
  }, [data]);

  const chips = [
    {
      label: isSelfView ? "On time" : "Present",
      value: totals.onTime,
      color: accent,
    },
    { label: "Late", value: totals.late, color: statusColor("warning") },
    { label: "Absent", value: totals.absent, color: statusColor("danger") },
    { label: "Leave", value: totals.onLeave, color: statusColor("leave") },
    { label: "Work from home", value: totals.workFromHome, color: statusColor("remote") },
  ];

  const hasRecords =
    !!data &&
    (data.days.length > 0 ||
      data.rows.length > 0 ||
      data.byDate.length > 0);

  const caption = () => {
    if (loading) return "Loading attendance...";
    if (!hasRecords) return range.label;
    if (period === "today") return range.label;
    const days = totals.days === 1 ? "1 working day" : `${totals.days} working days`;
    return `${range.label} - ${days}`;
  };

  return (
    <section
      className={`relative overflow-hidden ${CARD}`}
      aria-label="Attendance"
    >
      <AccentEdge color={accent} />

      {/* Heading, period filter */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 pb-3 sm:p-5 sm:pb-4">
        <div className="min-w-0">
          {/* The section title carries the whole card, so it is set at the
              size a card title is set at elsewhere rather than at row size. */}
          <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {title ||
              (isSelfView
                ? "My attendance"
                : period === "today"
                ? "Today's attendance"
                : "Attendance")}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-gray-500 dark:text-gray-400">
            {caption()}
            {data?.cutoffTime && hasRecords && !loading && (
              <>
                {" - measured against "}
                {/* The arrival rule every verdict below was decided under.
                    Set apart from the date because it is the one part of the
                    caption an admin changes, and the one that explains why a
                    row says "Late". */}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {data.cutoffTime}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh attendance"
            title="Refresh"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          <Select
            value={period}
            onChange={changePeriod}
            options={PERIOD_OPTIONS}
            className="w-[136px] sm:w-[150px]"
          />
        </div>
      </div>

      {/* Counts for the period on screen.
          A single day gets the rate and the five tiles, which is the reading
          the screen is opened for. A multi-day period keeps the chip strip:
          there is no "rate" for a quarter that is not already the report the
          tables below draw, and a 4xl percentage over three months would be
          the loudest thing on the page for the least useful fact on it.

          The tiles are desktop-only: below `lg` the mobile list carries its
          own chip rail, which also filters it, and two rows of the same five
          numbers is one row too many on a phone. The chip strip has no such
          list under it, so it shows at every width. */}
      {singleDay ? (
        <div className="hidden lg:block">
          <TodaySummary
            totals={totals}
            loading={loading}
            isSelfView={isSelfView}
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-gray-200/70 px-5 pb-4 dark:border-gray-700">
          {chips.map((chip) => (
            <span key={chip.label} className="flex items-center gap-1.5 text-sm">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: chip.color }}
              />
              <span className="text-gray-500 dark:text-gray-400">
                {chip.label}
              </span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {loading ? "-" : chip.value}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* How a multi-day period is grouped */}
      {!singleDay && hasRecords && !error && (
        <div className="flex items-center gap-2 px-5 py-3">
          <div className="flex gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-700/50">
            {[
              { key: "date" as const, label: "By date" },
              { key: "employee" as const, label: "By employee" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setGrouping(option.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  grouping === option.key
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {data?.detail === "day" && grouping === "date" && (
            <span className="text-xs text-gray-400">
              Open a date to see who was in.
            </span>
          )}
        </div>
      )}

      {error ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-[var(--danger-text)]">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Try again
          </button>
        </div>
      ) : !loading && !hasRecords ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {/* The server says when the reason is something other than a quiet
                day - an account with no device ID has no record to be empty. */}
            {data?.message ||
              (period === "today"
                ? "Nothing recorded yet today."
                : "No attendance recorded in this period.")}
          </p>
          {!data?.message && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {period === "today"
                ? "Punches appear here as they arrive from the device."
                : "Try a wider period."}
            </p>
          )}
        </div>
      ) : singleDay ? (
        <>
          {/* Same rows, two readings. The table is a grid of five columns and
              a phone has room for two of them; the list is the same day with
              the status carried by grouping and colour instead. */}
          <MobileAttendanceToday
            rows={data?.rows || []}
            totals={totals}
            loading={loading}
            isSelfView={isSelfView}
            maxRows={variant === "dashboard" ? 8 : undefined}
          />
          <div className="hidden lg:block">
            <TodayRoster
              rows={data?.rows || []}
              loading={loading}
              maxRows={variant === "dashboard" ? 8 : undefined}
              emptyMessage="Nothing recorded yet today."
              statusFilter={statusFilter}
            />
          </div>
        </>
      ) : grouping === "date" ? (
        <ByDateTable
          dates={data?.byDate || []}
          rowsByDate={data?.detail === "day" ? rowsByDate : undefined}
          loading={loading}
        />
      ) : (
        <ByEmployeeTable
          employees={data?.byEmployee || []}
          loading={loading}
          maxRows={variant === "dashboard" ? 8 : undefined}
        />
      )}

      {data?.detailTruncated && !loading && !error && (
        <p className="px-5 pb-4 text-xs text-gray-400">
          This range is too wide to list every day for every employee, so it is
          shown as counts.
        </p>
      )}

      {(footer || fetchedAt) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/70 px-5 py-3 dark:border-gray-700">
          {footer}
          {/* How old the figures are. A roster reads as live whether or not
              it is, so a section that fetched once on mount has to say when
              - otherwise a stale morning count looks like the current one.
              Pushed right on its own when there is no footer beside it. */}
          {fetchedAt && (
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
              Updated {updatedAgo}
            </span>
          )}
        </div>
      )}
    </section>
  );
};

export default AttendanceBoard;
