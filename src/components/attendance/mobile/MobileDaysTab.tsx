import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useListRowMotion from "../../../hooks/useListRowMotion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import Select from "../../ui/Select";
import StatusBadge from "../StatusBadge";
import TimeChangeAction, { timeChangeState } from "../TimeChangeAction";
import type { DayRow } from "../DayTable";
import { CardSkeleton, EmptyNote, SHEET, WELL } from "../../mobile/primitives";

/**
 * An employee's own range, one row per day.
 *
 * The roster answers "who is in". Somebody reading their own attendance is
 * asking "how did each of my days go", and a single row about themselves
 * cannot answer that - so every day in the range gets a row, including the
 * ones with no punch, which are the days worth noticing.
 *
 * A weekend is listed but never counted as an absence: the office was shut, so
 * a missing punch there says nothing about the person.
 */

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "All", label: "All days" },
  { value: "On time", label: "On time" },
  { value: "Late", label: "Late" },
  { value: "Absent", label: "Absent" },
  { value: "Work from home", label: "Work from home" },
  { value: "On leave", label: "On leave" },
  { value: "Weekend", label: "Weekend" },
];

interface Props {
  rows: DayRow[];
  loading: boolean;
  onSelect: (row: DayRow) => void;
  statusFilter: string;
  onStatusFilterChange: (next: string) => void;
  /** Opens the whole record, unpaged. */
  onViewFull?: () => void;
  /** Offered on a late day. Omit where the viewer cannot raise a request. */
  onRequestTimeChange?: (row: DayRow) => void;
}

const MobileDaysTab: React.FC<Props> = ({
  rows,
  loading,
  onSelect,
  statusFilter,
  onStatusFilterChange,
  onViewFull,
  onRequestTimeChange,
}) => {
  const listRow = useListRowMotion();
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      statusFilter === "All"
        ? rows
        : rows.filter((row) => row.status === statusFilter),
    [rows, statusFilter]
  );

  useEffect(() => setPage(1), [statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const shown = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={STATUS_OPTIONS}
          />
        </div>
        {onViewFull && rows.length > 0 && (
          <button
            type="button"
            onClick={onViewFull}
            className={`flex-none rounded-full px-3.5 py-2.5 text-[12px] font-semibold text-gray-600 dark:text-gray-300 ${WELL}`}
          >
            View all
          </button>
        )}
      </div>

      {loading ? (
        <CardSkeleton rows={6} />
      ) : !rows.length ? (
        <div className={SHEET}>
          <EmptyNote
            icon={CalendarDaysIcon}
            title="Nothing loaded yet"
            body="Pick a range on the Trends tab and fetch it."
          />
        </div>
      ) : !filtered.length ? (
        <div className={SHEET}>
          <EmptyNote
            icon={CalendarDaysIcon}
            title="No days in this group"
            body="Choose another status to see the rest of the range."
          />
        </div>
      ) : (
        <>
          {/* A card per day, the same shape the roster lists use. */}
          <ul className="flex flex-col gap-2.5">
            {shown.map((row, i) => {
              // The time change sits under the late time it is about, on its
              // own line: inside the row it would be a button in a button.
              const change = timeChangeState(row);
              const showChange =
                change && (change !== "requestable" || onRequestTimeChange);
              return (
                <motion.li
                  key={row.date}
                  {...listRow(i)}
                  className={`${SHEET} overflow-hidden`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(row)}
                    className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold leading-tight text-gray-900 dark:text-white">
                        {row.dateDisplay}
                      </p>
                      <p className="mt-[3px] flex flex-wrap items-center gap-x-2 truncate text-[11.5px] text-gray-400 dark:text-gray-500">
                        <span>{row.weekday}</span>
                        {row.arrival && (
                          <span className="font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                            {row.arrival}
                          </span>
                        )}
                        {row.lateDisplay && (
                          <span className="font-bold tabular-nums text-amber-700 dark:text-amber-400">
                            +{row.lateDisplay}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="flex-none">
                      <StatusBadge status={row.status} compact />
                    </span>
                  </button>
                  {showChange && (
                    <div className="flex items-center justify-end border-t border-black/5 px-3.5 py-2 dark:border-white/[0.07]">
                      <TimeChangeAction row={row} onRequest={onRequestTimeChange} />
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between px-1 pt-0.5">
            <span className="text-[11.5px] tabular-nums text-gray-400 dark:text-gray-500">
              {start + 1}-{start + shown.length} of {filtered.length}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label="Previous page"
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
                className={`grid h-8 w-8 place-items-center rounded-[10px] text-gray-500 disabled:opacity-40 dark:text-gray-400 ${WELL}`}
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              <span className="text-[12px] font-semibold tabular-nums text-gray-900 dark:text-white">
                Page {current} of {pages}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={current >= pages}
                onClick={() => setPage(current + 1)}
                className={`grid h-8 w-8 place-items-center rounded-[10px] text-gray-500 disabled:opacity-40 dark:text-gray-400 ${WELL}`}
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileDaysTab;
