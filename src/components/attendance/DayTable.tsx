import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
import { CARD } from "../../lib/surfaces";

/**
 * One row per day of the selected range, newest first.
 *
 * The roster table answers "who is in". An employee looking at their own page
 * is asking "how did each of my days go", and a single row about themselves
 * cannot answer that. So every day in the range gets a row - including the
 * ones with no punch, which are the days worth noticing.
 *
 * A weekend is listed but never counted as absent: the office was shut, so a
 * missing punch there says nothing about the person.
 *
 * Below `lg` the same days render as rows in a list rather than as a table.
 * Five columns need 620px; on a phone that put Status - the column the whole
 * table is scanned for - off the right edge, so the answer to "how did my week
 * go" required a sideways scroll on every row. The list keeps the date on the
 * left and the status on the right, which is the comparison being made, and
 * folds arrival and lateness into one line between them.
 */

export interface DayRow {
  /** YYYY-MM-DD. Also the row identity. */
  date: string;
  dateDisplay: string;
  weekday: string;
  isWeekend: boolean;
  /** Arrival as office wall-clock time, or null on a day with no punch. */
  arrival: string | null;
  lateDisplay: string | null;
  status: string;
  /** "work_from_home" | "on_leave" when the day was approved as such. */
  workMode?: string | null;
  /** The punch behind the row, or null when there is none. */
  record: any | null;
}

interface Props {
  rows: DayRow[];
  loading?: boolean;
  onSelect: (row: DayRow) => void;
  /** Shown in the body when there is nothing to list. */
  emptyMessage?: string;
  /** Show only days with this status. Set by clicking the breakdown panel. */
  statusFilter?: string | null;
  onClearFilter?: () => void;
  /**
   * Open the whole record in the side panel. This table pages ten days at a
   * time, which answers "how was last week" but not "show me everything", so
   * the full record needs a way in that is not paging to it.
   */
  onViewFull?: () => void;
}

const PAGE_SIZE = 10;

const DayTable: React.FC<Props> = ({
  rows: allRows,
  loading = false,
  onSelect,
  emptyMessage,
  statusFilter = null,
  onClearFilter,
  onViewFull,
}) => {
  const [page, setPage] = useState(1);

  // A new range or filter is a new list; page 4 of a shorter one shows nothing.
  useEffect(() => setPage(1), [allRows, statusFilter]);

  const rows = useMemo(
    () =>
      statusFilter
        ? allRows.filter((r) => r.status === statusFilter)
        : allRows,
    [allRows, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const head =
    "whitespace-nowrap border-b border-gray-100 bg-gray-50/70 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300";
  const cell = "border-b border-gray-100 px-4 py-3 dark:border-gray-700";

  return (
    <div className={`overflow-hidden ${CARD}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 px-4 py-3 dark:border-gray-700">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {statusFilter ? `${statusFilter} days` : "Day by day"}
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Open a day to see everything recorded for it
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!loading && rows.length > 0 && (
            <span className="text-xs text-gray-400">
              {rows.length} day{rows.length === 1 ? "" : "s"}
            </span>
          )}
          {statusFilter && onClearFilter && (
            <button
              type="button"
              onClick={onClearFilter}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-gray-600 dark:text-blue-400 dark:hover:bg-blue-500/10"
            >
              Show all days
            </button>
          )}
          {onViewFull && (
            <button
              type="button"
              onClick={onViewFull}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              View full attendance
            </button>
          )}
        </div>
      </div>

      {/* ---------------- Phones and small tablets ---------------- */}
      <div className="lg:hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3.5">
                <div className="h-9 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
              {statusFilter
                ? `No ${statusFilter.toLowerCase()} days in this range.`
                : "No days to show."}
            </p>
            <p className="mx-auto mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
              {statusFilter
                ? "Clear the filter to see every day."
                : emptyMessage || "Press Fetch attendance to load your record."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {pageRows.map((row) => (
              <li key={row.date}>
                <button
                  type="button"
                  onClick={() => onSelect(row)}
                  className={`press-scale flex w-full items-center gap-3 px-4 py-3 text-start ${
                    row.isWeekend ? "bg-gray-50/60 dark:bg-white/[0.02]" : ""
                  }`}
                >
                  {/* The date as a calendar tile: on a list of twenty days the
                      day number is what the eye lands on, and a tile gives it
                      a fixed position every row rather than a position that
                      moves with the length of the month name. */}
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gray-200 bg-black/[0.02] leading-none dark:border-white/10 dark:bg-white/[0.04]">
                    <span className="text-[15px] font-bold tabular-nums text-gray-900 dark:text-white">
                      {row.dateDisplay.match(/\d+/)?.[0] ?? ""}
                    </span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                      {row.weekday.slice(0, 3)}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                      {row.dateDisplay}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-gray-500 dark:text-gray-400">
                      {row.arrival ? `In ${row.arrival}` : "No punch"}
                      {row.lateDisplay ? ` - ${row.lateDisplay} late` : ""}
                    </span>
                  </span>

                  <StatusBadge status={row.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------------- Desktop ---------------- */}
      <div className="hidden table-scroll lg:block">
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr>
              <th className={head}>Date</th>
              <th className={head}>Arrival</th>
              <th className={head}>Late by</th>
              <th className={head}>Status</th>
              <th className={`${head} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className={cell}>
                      <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {statusFilter
                      ? `No ${statusFilter.toLowerCase()} days in this range.`
                      : "No days to show."}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {statusFilter
                      ? "Clear the filter to see every day."
                      : emptyMessage ||
                        "Press Fetch attendance to load your record."}
                  </p>
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={row.date}
                  onClick={() => onSelect(row)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelect(row);
                  }}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                    row.isWeekend ? "bg-gray-50/40 dark:bg-gray-700/20" : ""
                  }`}
                >
                  <td className={cell}>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {row.dateDisplay}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {row.weekday}
                    </p>
                  </td>
                  <td
                    className={`${cell} font-mono text-sm text-gray-700 dark:text-gray-200`}
                  >
                    {row.arrival || "-"}
                  </td>
                  <td
                    className={`${cell} text-sm text-gray-600 dark:text-gray-300`}
                  >
                    {row.lateDisplay || "-"}
                  </td>
                  <td className={cell}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className={`${cell} text-right`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(row);
                      }}
                      aria-label={`View ${row.dateDisplay}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-2.5 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {(safePage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length} days
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              aria-label="Previous page"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform active:scale-90 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 sm:h-8 sm:w-8"
            >
              <ChevronLeftIcon className="h-4 w-4 rtl:-scale-x-100" />
            </button>
            <span className="px-1.5 text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Next page"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform active:scale-90 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 sm:h-8 sm:w-8"
            >
              <ChevronRightIcon className="h-4 w-4 rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayTable;
