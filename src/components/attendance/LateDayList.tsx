import React from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import useListRowMotion from "../../hooks/useListRowMotion";
import { CARD } from "../../lib/surfaces";
import type { LateEntry } from "../../hooks/useLateHours";
import { TimeChangeChip, useLateDayTimeChange } from "./TimeChangeAction";

/**
 * The signed-in employee's late days, each with its time change beside it.
 *
 * The time change page lists requests, but a request starts from a late day,
 * and until now those were only on the attendance page. Listing them here
 * means the whole loop - which days were late, which have been asked about,
 * what came of it - is on one screen, and a new request is one click from the
 * day it is about.
 *
 * A corrected day stays in the list with its machine time struck through, so
 * the employee can see the change took.
 */

interface Props {
  entries: LateEntry[];
  loading?: boolean;
  emptyMessage?: string;
}

const TH =
  "px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";
const ROW =
  "transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.03]";

const weekdayOf = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    timeZone: "UTC",
    weekday: "long",
  });

const asLateDay = (entry: LateEntry) => ({
  date: entry.date,
  dateDisplay: entry.dateDisplay,
  isLate: entry.isLate,
  arrival: entry.punchIn,
  lateMinutes: entry.lateMinutes,
  cutoffTime: entry.officeCutoff,
  corrected: entry.timeCorrected,
  machineCheckInDisplay: entry.machineCheckInDisplay,
});

/** The check-in as read now; on a corrected day, the machine time it replaced. */
const CheckIn: React.FC<{ entry: LateEntry }> = ({ entry }) =>
  entry.timeCorrected && entry.machineCheckInDisplay ? (
    <span className="flex items-center gap-2 tabular-nums">
      <span className="text-gray-500 line-through decoration-gray-300 dark:text-gray-400 dark:decoration-gray-600">
        {entry.machineCheckInDisplay}
      </span>
      <ArrowRightIcon className="h-3.5 w-3.5 flex-none text-gray-400" />
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {entry.punchInDisplay}
      </span>
    </span>
  ) : (
    <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
      {entry.punchInDisplay}
    </span>
  );

const LateBy: React.FC<{ entry: LateEntry }> = ({ entry }) =>
  entry.lateMinutes > 0 ? (
    <span className="font-semibold tabular-nums text-[var(--warning-text)]">
      {entry.lateDisplay}
    </span>
  ) : (
    <span className="text-gray-400 dark:text-gray-500">On time</span>
  );

/** Why the last request for a day was refused, where one was. */
const Rejection: React.FC<{ note?: string }> = ({ note }) =>
  note ? (
    <p className="mt-1 line-clamp-2 text-xs text-red-600 dark:text-red-400">
      {note}
    </p>
  ) : null;

const TableRow: React.FC<{ entry: LateEntry; motionProps: any }> = ({
  entry,
  motionProps,
}) => {
  const change = useLateDayTimeChange(asLateDay(entry));
  return (
    <motion.tr {...motionProps} className={ROW}>
      <td className="whitespace-nowrap px-5 py-4">
        <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          {entry.dateDisplay}
        </span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">
          {weekdayOf(entry.date)}
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm">
        <CheckIn entry={entry} />
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm">
        <LateBy entry={entry} />
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm tabular-nums text-gray-600 dark:text-gray-300">
        {entry.expected}
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex justify-end">
          <TimeChangeChip
            state={change.state}
            machineDisplay={entry.machineCheckInDisplay}
            requestedTime={change.request?.requestedTime}
            onRequest={change.open}
            hint={change.hint}
          />
        </div>
        {change.state === "requestable" && <Rejection note={change.hint} />}
        {change.state === null && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Past the request window
          </span>
        )}
      </td>
    </motion.tr>
  );
};

const Card: React.FC<{ entry: LateEntry }> = ({ entry }) => {
  const change = useLateDayTimeChange(asLateDay(entry));
  return (
    <div className={`overflow-hidden ${CARD}`}>
      <div className="flex items-start gap-3 px-4 pb-3 pt-3.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight text-gray-900 dark:text-white">
            {entry.dateDisplay}
          </p>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
            {weekdayOf(entry.date)}, due {entry.expected}
          </p>
          <div className="mt-2 text-sm">
            <CheckIn entry={entry} />
          </div>
        </div>
        <div className="text-right text-sm">
          <LateBy entry={entry} />
        </div>
      </div>
      {change.state && (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-white/10">
          <TimeChangeChip
            state={change.state}
            machineDisplay={entry.machineCheckInDisplay}
            requestedTime={change.request?.requestedTime}
            onRequest={change.open}
            hint={change.hint}
          />
          {change.state === "requestable" && <Rejection note={change.hint} />}
        </div>
      )}
    </div>
  );
};

const Empty: React.FC<{ message?: string }> = ({ message }) => (
  <>
    <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
      No late days.
    </p>
    <p className="mx-auto mt-1.5 max-w-[20rem] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
      {message || "Every check-in in this period was on time."}
    </p>
  </>
);

const LateDayList: React.FC<Props> = ({ entries, loading = false, emptyMessage }) => {
  const listRow = useListRowMotion(true);

  return (
    <>
      {/* ---------------- Phones and small tablets ---------------- */}
      <div className="lg:hidden">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-[120px] animate-pulse ${CARD}`} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className={`px-6 py-10 text-center ${CARD}`}>
            <Empty message={emptyMessage} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <Card key={entry.date} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* ---------------- Desktop ---------------- */}
      <div className={`hidden overflow-hidden lg:block ${CARD}`}>
        <div className="table-scroll">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                <th className={TH}>Date</th>
                <th className={TH}>Check-in</th>
                <th className={TH}>Late by</th>
                <th className={TH}>Due</th>
                <th className={`${TH} text-right`}>Time change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Empty message={emptyMessage} />
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <TableRow key={entry.date} entry={entry} motionProps={listRow(i)} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default LateDayList;
