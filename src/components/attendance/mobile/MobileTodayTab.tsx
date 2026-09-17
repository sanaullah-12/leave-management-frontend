import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import useListRowMotion from "../../../hooks/useListRowMotion";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import StatusBadge from "../StatusBadge";
import type { RosterDayRow, RosterTotals } from "../RosterTables";
import { byArrival, groupByStatus } from "../rosterGrouping";
import {
  ABSENT_INK,
  CardSkeleton,
  EmptyNote,
  GroupLabel,
  LATE_INK,
  LEAVE_INK,
  SHEET,
  Tile,
  WFH_INK,
} from "../../mobile/primitives";

/**
 * Who is in today, for a phone.
 *
 * The desktop answer is a five-column table, and a phone has room for two of
 * those columns. This is the same day read as a list, and three decisions
 * carry it:
 *
 *   1. Rows are grouped by status rather than sorted into one flat run. "Three
 *      people are late" is a fact an admin wants without counting, and a group
 *      heading states it for free. Inside a group the order is still arrival
 *      order, so the headings fall in the order the day happened.
 *   2. The arrival time takes the status colour, so the status can be read
 *      without reading the pill - which is the narrowest thing on the row.
 *   3. Hours worked sit in a column of their own on the right. They are the
 *      only figures on the screen worth comparing down the list.
 *
 * The counts above the list are also its filter. A count is more useful when it
 * is the way to see what it is counting, and the rail scrolls rather than wraps
 * so the list itself still starts above the fold.
 */

/**
 * Per-status ink for text drawn straight onto the card.
 *
 * Class pairs rather than the hex values StatusBadge uses: the badge paints its
 * own pale ground under its label, and that same #0f7a4c on a dark card is
 * about 2:1. Each pair is the same hue a step either side of the divide.
 */
const TONE: Record<string, string> = {
  "On time": "text-emerald-700 dark:text-emerald-400",
  Present: "text-emerald-700 dark:text-emerald-400",
  Late: "text-amber-700 dark:text-amber-400",
  Absent: "text-red-700 dark:text-red-400",
  "No record": "text-red-700 dark:text-red-400",
  "On leave": "text-cyan-700 dark:text-cyan-400",
  "Work from home": "text-indigo-700 dark:text-indigo-400",
  Weekend: "text-gray-500 dark:text-gray-400",
};

const toneOf = (status: string) =>
  TONE[status] || "text-gray-500 dark:text-gray-400";

interface Chip {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Which row statuses this chip stands for. */
  statuses: string[];
}

const PersonRow: React.FC<{
  row: RosterDayRow;
  onClick?: () => void;
  /** Position within its status group, which staggers the entrance. */
  index?: number;
}> = ({ row, onClick, index = 0 }) => {
  const listRow = useListRowMotion();
  const tone = toneOf(row.status);
  /* Whether the device saw this person. It decides the shape of the row, not
     just one line of it - see the two branches below. */
  const hasArrival = Boolean(row.checkIn);

  return (
    <motion.button
      {...listRow(index)}
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`${SHEET} flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.03]`}
    >
      <Tile name={row.name} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold leading-tight tracking-[-0.01em] text-gray-900 dark:text-white">
          {row.name}
        </p>
        {row.department && (
          <p className="mt-[3px] truncate text-[11.5px] text-gray-400 dark:text-gray-500">
            {row.department}
          </p>
        )}

        {/* Arrival, the delta that made it late, and the pill - one line.

            A day with no punch has no time and no hours, so that row carries
            the pill alone: there is nothing else about it to report, and the
            hours column beside it says so with a dash. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {hasArrival && (
            <>
              <span className={`text-[11.5px] font-semibold tabular-nums ${tone}`}>
                {row.checkIn}
              </span>
              {row.lateDisplay && (
                <span className="text-[10.5px] font-bold tabular-nums text-amber-700 dark:text-amber-400">
                  +{row.lateDisplay}
                </span>
              )}
            </>
          )}
          <StatusBadge status={row.status} compact />
        </div>
      </div>

      <div className="w-[58px] flex-none text-right">
        {hasArrival && row.workedDisplay ? (
          <>
            <p className="text-[12.5px] font-bold leading-tight tabular-nums text-gray-900 dark:text-white">
              {row.workedDisplay}
            </p>
            <p className="mt-[3px] text-[10px] text-gray-400 dark:text-gray-500">
              logged
            </p>
          </>
        ) : (
          <p className="text-[12.5px] font-bold text-gray-300 dark:text-gray-600">
            -
          </p>
        )}
      </div>
    </motion.button>
  );
};

interface Props {
  rows: RosterDayRow[];
  totals: RosterTotals;
  loading: boolean;
  error?: string;
  /** Empty-state wording the server supplied, e.g. no device ID on file. */
  message?: string;
  accent: string;
  /** An employee sees their own day, so the first chip is "On time". */
  isSelfView: boolean;
  onSelectRow?: (row: RosterDayRow) => void;
}

const MobileTodayTab: React.FC<Props> = ({
  rows,
  totals,
  loading,
  error,
  message,
  accent,
  isSelfView,
  onSelectRow,
}) => {
  const [filter, setFilter] = useState<string | null>(null);

  const chips: Chip[] = useMemo(
    () => [
      {
        key: "present",
        label: isSelfView ? "On time" : "Present",
        value: totals.onTime,
        color: accent,
        statuses: ["On time", "Present"],
      },
      {
        key: "late",
        label: "Late",
        value: totals.late,
        color: LATE_INK,
        statuses: ["Late"],
      },
      {
        key: "absent",
        label: "Absent",
        value: totals.absent,
        color: ABSENT_INK,
        statuses: ["Absent", "No record"],
      },
      {
        key: "leave",
        label: "Leave",
        value: totals.onLeave,
        color: LEAVE_INK,
        statuses: ["On leave"],
      },
      {
        key: "wfh",
        label: "WFH",
        value: totals.workFromHome,
        color: WFH_INK,
        statuses: ["Work from home"],
      },
    ],
    [totals, accent, isSelfView]
  );

  /** Rows in arrival order, narrowed to the active chip. */
  const visible = useMemo(() => {
    const wanted = filter ? chips.find((c) => c.key === filter)?.statuses : null;
    const kept = wanted
      ? rows.filter((row) => wanted.includes(row.status))
      : rows;
    return [...kept].sort(byArrival);
  }, [rows, filter, chips]);

  const groups = useMemo(() => groupByStatus(visible), [visible]);

  return (
    <div className="space-y-3">
      {/* Counts, which are also the filter. The rail scrolls past the edge of
          the screen on purpose: five chips do not fit on a 360px phone, and
          wrapping them costs a second line that pushes the list below the
          fold - which is the one thing this screen is opened to read. */}
      <div
        role="group"
        aria-label="Filter by status"
        className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chips.map((chip) => {
          const on = filter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setFilter((prev) => (prev === chip.key ? null : chip.key))
              }
              className={`flex min-h-[38px] flex-none items-center gap-2 whitespace-nowrap rounded-[13px] border px-3 text-[11.5px] font-semibold transition-[background-color,border-color,transform] active:scale-95 ${
                on
                  ? "border-transparent text-white"
                  : "border-gray-200 bg-[var(--card-surface)] text-gray-500 dark:border-white/10 dark:text-gray-400"
              }`}
              style={on ? { backgroundColor: chip.color } : undefined}
            >
              <span
                className="h-[7px] w-[7px] flex-none rounded-full"
                style={{ backgroundColor: on ? "#fff" : chip.color }}
              />
              {chip.label}
              <span
                className={`text-[13px] font-bold tabular-nums ${
                  on ? "text-white" : "text-gray-900 dark:text-white"
                }`}
              >
                {loading ? "-" : chip.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* One card per person, not one card holding every row.

          A single sheet of fifteen people reads as a table without its lines:
          the eye has to find where one person ends and the next begins, which
          on the screen that answers "who is late" is work it should not be
          doing. A card per person makes each row its own object, and the gap
          between them does the separating that a divider was standing in for. */}
      {loading ? (
        <CardSkeleton />
      ) : error ? (
        <div className={SHEET}>
          <EmptyNote
            icon={CalendarDaysIcon}
            title="Could not load today"
            body={error}
          />
        </div>
      ) : !rows.length ? (
        <div className={SHEET}>
          <EmptyNote
            icon={CalendarDaysIcon}
            title={message || "Nothing recorded yet today"}
            body={
              message
                ? undefined
                : "Punches appear here as they arrive from the device."
            }
          />
        </div>
      ) : !visible.length ? (
        <div className={SHEET}>
          <EmptyNote
            icon={CalendarDaysIcon}
            title="Nothing in this group"
            body="Tap the chip again to see the whole day."
          />
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.status}>
            <GroupLabel className="px-1 pb-2 pt-1.5">{group.status}</GroupLabel>
            <div className="flex flex-col gap-2.5">
              {group.rows.map((row, i) => (
                <PersonRow
                  key={`${row.employeeId}-${row.date}`}
                  row={row}
                  index={i}
                  onClick={onSelectRow ? () => onSelectRow(row) : undefined}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default MobileTodayTab;
