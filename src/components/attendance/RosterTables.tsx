import React, { useMemo, useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
import { formatIsoDate } from "../../lib/attendancePeriod";

/**
 * The three readings of one attendance range.
 *
 * A single day is a list of people. A week is those same rows grouped under the
 * day they belong to, because a person only means something next to the date
 * they arrived on. A month or a quarter is neither: it is a count per day and a
 * count per person, which is what the server sends instead of a row per
 * employee-day nobody could read.
 *
 * Every figure here arrives already judged by the server, under the office
 * arrival rule. Nothing on this page decides whether an arrival was late.
 */

export interface RosterDayRow {
  employeeId: string;
  name: string;
  department: string | null;
  date: string;
  dateDisplay: string;
  status: string;
  checkIn: string | null;
  checkInAt: string | null;
  checkOut: string | null;
  workedMinutes: number | null;
  workedDisplay: string | null;
  lateMinutes: number;
  lateDisplay: string | null;
}

export interface RosterEmployeeTotals {
  employeeId: string;
  name: string;
  department: string | null;
  onTime: number;
  late: number;
  absent: number;
  workFromHome: number;
  onLeave: number;
  lateMinutes: number;
  lateDisplay: string | null;
  workedMinutes: number;
  workedDisplay: string | null;
  daysWorked: number;
  averageWorkedMinutes: number;
  lastCheckIn: string | null;
}

export interface RosterDateTotals {
  date: string;
  dateDisplay: string;
  onTime: number;
  late: number;
  absent: number;
  workFromHome: number;
  onLeave: number;
  firstCheckIn: string | null;
  lastCheckIn: string | null;
}

const TH =
  "whitespace-nowrap border-b border-gray-100 bg-gray-50/70 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300";
const TD =
  "border-b border-gray-100 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200";
const NUM = `${TD} text-right tabular-nums`;
const NUM_TH = `${TH} text-right`;

const initialsOf = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/** Arrivals first and in order, then everyone the device did not see. */
const byArrival = (a: RosterDayRow, b: RosterDayRow) => {
  if (a.checkInAt && b.checkInAt) return a.checkInAt.localeCompare(b.checkInAt);
  if (a.checkInAt) return -1;
  if (b.checkInAt) return 1;
  return a.name.localeCompare(b.name);
};

const EmployeeCell: React.FC<{ name: string; department: string | null }> = ({
  name,
  department,
}) => (
  <div className="flex items-center gap-3">
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      {initialsOf(name)}
    </span>
    <span className="min-w-0">
      <span className="block truncate font-medium text-gray-900 dark:text-gray-100">
        {name}
      </span>
      {department && (
        <span className="block truncate text-xs text-gray-400">
          {department}
        </span>
      )}
    </span>
  </div>
);

const SkeletonRows: React.FC<{ columns: number; rows?: number }> = ({
  columns,
  rows = 5,
}) => (
  <>
    {Array.from({ length: rows }).map((_, row) => (
      <tr key={row}>
        {Array.from({ length: columns }).map((__, cell) => (
          <td key={cell} className={TD}>
            <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const EmptyRow: React.FC<{ columns: number; message: string }> = ({
  columns,
  message,
}) => (
  <tr>
    <td colSpan={columns} className="px-4 py-12 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </td>
  </tr>
);

/* ------------------------------------------------------------------ */
/* One day: the roster as a list of people                             */
/* ------------------------------------------------------------------ */

export const DayRosterTable: React.FC<{
  rows: RosterDayRow[];
  loading?: boolean;
  /** Trim the list, for the dashboard where the section is a summary. */
  maxRows?: number;
  emptyMessage?: string;
}> = ({ rows, loading = false, maxRows, emptyMessage }) => {
  const ordered = useMemo(() => [...rows].sort(byArrival), [rows]);
  const shown = maxRows ? ordered.slice(0, maxRows) : ordered;
  const hidden = ordered.length - shown.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr>
            <th className={TH}>Employee</th>
            <th className={TH}>Check-in</th>
            <th className={TH}>Status</th>
            <th className={`${NUM_TH} hidden sm:table-cell`}>Hours</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows columns={4} />
          ) : !shown.length ? (
            <EmptyRow
              columns={4}
              message={emptyMessage || "No attendance recorded for this day."}
            />
          ) : (
            shown.map((row) => (
              <tr
                key={`${row.employeeId}-${row.date}`}
                className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-700/30"
              >
                <td className={TD}>
                  <EmployeeCell name={row.name} department={row.department} />
                </td>
                <td className={`${TD} whitespace-nowrap tabular-nums`}>
                  {row.checkIn || <span className="text-gray-400">-</span>}
                  {row.lateDisplay && (
                    <span className="ml-2 text-xs text-[#b5650a]">
                      +{row.lateDisplay}
                    </span>
                  )}
                </td>
                <td className={TD}>
                  <StatusBadge status={row.status} compact />
                </td>
                <td className={`${NUM} hidden sm:table-cell`}>
                  {row.workedDisplay || <span className="text-gray-400">-</span>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {hidden > 0 && (
        <p className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
          Showing {shown.length} of {ordered.length} employees.
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Several days: a count per day, opened to reveal that day's people   */
/* ------------------------------------------------------------------ */

export const ByDateTable: React.FC<{
  dates: RosterDateTotals[];
  /** The rows behind each date, when the server sent them. */
  rowsByDate?: Record<string, RosterDayRow[]>;
  loading?: boolean;
  emptyMessage?: string;
}> = ({ dates, rowsByDate, loading = false, emptyMessage }) => {
  const [open, setOpen] = useState<string | null>(null);
  // Newest first: the day being asked about is nearly always the recent one.
  const ordered = useMemo(
    () => [...dates].sort((a, b) => b.date.localeCompare(a.date)),
    [dates]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr>
            <th className={TH}>Date</th>
            <th className={NUM_TH}>On time</th>
            <th className={NUM_TH}>Late</th>
            <th className={NUM_TH}>Absent</th>
            <th className={`${NUM_TH} hidden sm:table-cell`}>Leave</th>
            <th className={`${NUM_TH} hidden sm:table-cell`}>WFH</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows columns={6} />
          ) : !ordered.length ? (
            <EmptyRow
              columns={6}
              message={emptyMessage || "No attendance recorded in this period."}
            />
          ) : (
            ordered.map((day) => {
              const rows = rowsByDate?.[day.date];
              const expandable = !!rows?.length;
              const isOpen = open === day.date;

              return (
                <React.Fragment key={day.date}>
                  <tr
                    className={`transition-colors ${
                      expandable
                        ? "cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-700/30"
                        : ""
                    }`}
                    onClick={
                      expandable
                        ? () => setOpen(isOpen ? null : day.date)
                        : undefined
                    }
                    tabIndex={expandable ? 0 : undefined}
                    onKeyDown={
                      expandable
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setOpen(isOpen ? null : day.date);
                            }
                          }
                        : undefined
                    }
                    aria-expanded={expandable ? isOpen : undefined}
                  >
                    <td className={TD}>
                      <span className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                        {expandable && (
                          <ChevronRightIcon
                            className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${
                              isOpen ? "rotate-90" : ""
                            }`}
                          />
                        )}
                        {formatIsoDate(day.date, true)}
                      </span>
                    </td>
                    <td className={NUM}>{day.onTime}</td>
                    <td className={`${NUM} ${day.late ? "text-[#b5650a]" : ""}`}>
                      {day.late}
                    </td>
                    <td
                      className={`${NUM} ${day.absent ? "text-[#b42318]" : ""}`}
                    >
                      {day.absent}
                    </td>
                    <td className={`${NUM} hidden sm:table-cell`}>
                      {day.onLeave}
                    </td>
                    <td className={`${NUM} hidden sm:table-cell`}>
                      {day.workFromHome}
                    </td>
                  </tr>

                  {isOpen && expandable && (
                    <tr>
                      <td
                        colSpan={6}
                        className="border-b border-gray-100 bg-gray-50/40 p-0 dark:border-gray-700 dark:bg-gray-700/20"
                      >
                        <DayRosterTable rows={rows} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Several days: a count per person                                    */
/* ------------------------------------------------------------------ */

export const ByEmployeeTable: React.FC<{
  employees: RosterEmployeeTotals[];
  loading?: boolean;
  maxRows?: number;
  emptyMessage?: string;
}> = ({ employees, loading = false, maxRows, emptyMessage }) => {
  // Most days missed first: a roster is read to find who needs attention.
  const ordered = useMemo(
    () =>
      [...employees].sort(
        (a, b) =>
          b.absent - a.absent ||
          b.late - a.late ||
          a.name.localeCompare(b.name)
      ),
    [employees]
  );
  const shown = maxRows ? ordered.slice(0, maxRows) : ordered;
  const hidden = ordered.length - shown.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr>
            <th className={TH}>Employee</th>
            <th className={NUM_TH}>On time</th>
            <th className={NUM_TH}>Late</th>
            <th className={NUM_TH}>Absent</th>
            <th className={`${NUM_TH} hidden sm:table-cell`}>Leave</th>
            <th className={`${NUM_TH} hidden sm:table-cell`}>WFH</th>
            <th className={`${NUM_TH} hidden md:table-cell`}>Late total</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows columns={7} />
          ) : !shown.length ? (
            <EmptyRow
              columns={7}
              message={emptyMessage || "No employees to report on."}
            />
          ) : (
            shown.map((person) => (
              <tr
                key={person.employeeId}
                className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-700/30"
              >
                <td className={TD}>
                  <EmployeeCell
                    name={person.name}
                    department={person.department}
                  />
                </td>
                <td className={NUM}>{person.onTime}</td>
                <td
                  className={`${NUM} ${person.late ? "text-[#b5650a]" : ""}`}
                >
                  {person.late}
                </td>
                <td
                  className={`${NUM} ${person.absent ? "text-[#b42318]" : ""}`}
                >
                  {person.absent}
                </td>
                <td className={`${NUM} hidden sm:table-cell`}>
                  {person.onLeave}
                </td>
                <td className={`${NUM} hidden sm:table-cell`}>
                  {person.workFromHome}
                </td>
                <td className={`${NUM} hidden md:table-cell`}>
                  {person.lateDisplay || <span className="text-gray-400">-</span>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {hidden > 0 && (
        <p className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
          Showing {shown.length} of {ordered.length} employees.
        </p>
      )}
    </div>
  );
};
