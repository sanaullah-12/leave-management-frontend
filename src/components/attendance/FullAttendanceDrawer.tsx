import React, { useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
import type { DayRow } from "./DayTable";
import {
  CardAction,
  CardHead,
  DetailBody,
  DetailCard,
  DetailHeader,
  DetailShell,
  HistoryRow,
  InfoRow,
  MiniStat,
  RangeTrack,
  RateRow,
  StatBox,
} from "../mobile/DetailSheet";
import { ABSENT_INK, LATE_INK } from "../mobile/primitives";

import Input from "../ui/Input";
/**
 * An employee's own attendance, in full.
 *
 * The day-by-day table pages ten rows at a time and the day sheet answers a
 * single date, so neither answers "show me everything I have". This one does:
 * every day of the range in one list.
 *
 * It is laid out as the employee sheet an admin gets - same chrome, same
 * arrival card, same history, same statistics - because it answers the same
 * question about the same person; only the reader has changed. The one
 * difference is what the list holds: every day of the range rather than only
 * the days with a punch, so an absence is visible as a row.
 *
 * Every figure is counted off the rows the list renders, so a number here can
 * never disagree with the list below it.
 */

export interface DrawerIdentity {
  employeeId?: string | number;
  name?: string;
  department?: string;
  machineId?: string | number;
  enrolledAt?: string | Date;
}

interface Props {
  /** Every day of the range, newest first - the same rows the table lists. */
  rows: DayRow[];
  /** Whose record this is. */
  employee?: DrawerIdentity;
  /** The lateTimePolicy the rows were judged under. */
  policy?: any;
  /** The range the rows cover, already formatted for reading. */
  rangeLabel?: string;
  loading?: boolean;
  /** Open one day in full. The day sheet stacks above this one. */
  onSelectDay?: (row: DayRow) => void;
  /**
   * True while the single-day sheet is open on top. Escape then belongs to
   * that sheet, and closing both layers on one press would lose this list.
   */
  detailOpen?: boolean;
  onClose: () => void;
}

/** Days the list opens on. A working week, weekend rows included. */
const WEEK = 7;

/** Present follows the theme accent; late and absent carry meaning and do not. */
const PRESENT_INK = "var(--accent)";

/** "HH:MM" or "HH:MM:SS" to minutes past midnight. */
const toMinutes = (value?: string | null) => {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

/** Minutes past midnight as office wall-clock time. */
const clockOf = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** A span of minutes, read as a person would say it. */
const spanOf = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const FullAttendanceDrawer: React.FC<Props> = ({
  rows,
  employee,
  policy,
  rangeLabel,
  loading = false,
  onSelectDay,
  detailOpen = false,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  /**
   * The list opens on the last week and expands to the whole range.
   *
   * A week is what an employee checks day to day, and it fits without
   * scrolling past the arrival card; the rest of the range is one button away
   * rather than a wall of rows nobody asked for yet.
   */
  const [showAll, setShowAll] = useState(false);

  /** How the range actually went, counted off the rows themselves. */
  const totals = useMemo(() => {
    const byStatus: Record<string, number> = {};
    rows.forEach((row) => {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    });

    // A weekend is not a working day, so it is never part of the denominator.
    const workingDays = rows.filter((row) => row.status !== "Weekend").length;
    const onTime = byStatus["On time"] || 0;
    const late = byStatus["Late"] || 0;
    // An approved work from home day is a working day that was worked.
    const attended = onTime + late + (byStatus["Work from home"] || 0);

    return {
      workingDays,
      present: onTime + late,
      late,
      absent: byStatus["Absent"] || 0,
      rate: workingDays ? Math.round((attended / workingDays) * 100) : 0,
    };
  }, [rows]);

  /**
   * The average arrival across every punch in the range.
   *
   * One bad morning is a bad morning; where the average sits is the habit, and
   * the habit is what a whole-range sheet is opened to see. The verdict on each
   * individual day stays the server's and is untouched here.
   */
  const average = useMemo(() => {
    const minutes = rows
      .map((row) => toMinutes(row.record?.time))
      .filter((value): value is number => value != null);
    if (!minutes.length) return null;

    const mean = Math.round(
      minutes.reduce((sum, value) => sum + value, 0) / minutes.length
    );
    const cutoff = toMinutes(policy?.cutoffTime);
    return {
      minutes: mean,
      display: clockOf(mean),
      isLate: cutoff != null && mean > cutoff,
      margin: cutoff == null ? null : spanOf(Math.abs(mean - cutoff)),
    };
  }, [rows, policy?.cutoffTime]);

  /** Where the average sits either side of the cutoff. */
  const timeline = useMemo(() => {
    const cutoff = toMinutes(policy?.cutoffTime);
    if (cutoff == null || !average) return null;

    // A two-hour window either side of the cutoff reads better than a full day,
    // where every office arrival would bunch into a few pixels.
    const from = cutoff - 120;
    const to = cutoff + 120;
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      arrivalPct: clamp(((average.minutes - from) / (to - from)) * 100),
      cutoffPct: clamp(((cutoff - from) / (to - from)) * 100),
      fromLabel: `${pad(Math.floor(from / 60))}:${pad(from % 60)}`,
      toLabel: `${pad(Math.floor(to / 60))}:${pad(to % 60)}`,
    };
  }, [average, policy?.cutoffTime]);

  /** The rows the list holds: the last week, or the range and its search. */
  const historyRows = useMemo(() => {
    if (!showAll) return rows.slice(0, WEEK);
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      `${row.dateDisplay} ${row.weekday} ${row.status} ${row.arrival || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [rows, showAll, query]);

  return (
    // Below the single-day sheet's z on purpose: a day opened from this list
    // has to land on top of it.
    <DetailShell
      onClose={onClose}
      labelledBy="full-attendance-title"
      z={55}
      escapeEnabled={!detailOpen}
    >
      <DetailHeader
        title="Attendance Detail"
        onBack={onClose}
        titleId="full-attendance-title"
        subject={{
          name: employee?.name || "My attendance",
          meta: `${employee?.department || "Employee"}${
            employee?.employeeId ? ` · ID ${employee.employeeId}` : ""
          }`,
        }}
      />

      <DetailBody>
        {/* Identity. Unbordered rows rather than a card: this is the caption
            to the name above it, not a section of its own. */}
        <div className="-mt-1">
          <InfoRow icon={BuildingOffice2Icon}>
            {employee?.department || "Employee"}
          </InfoRow>
          <InfoRow icon={IdentificationIcon}>
            Device slot {employee?.machineId ?? "-"} {"·"} User ID{" "}
            {employee?.employeeId ?? "-"}
          </InfoRow>
          {employee?.enrolledAt ? (
            <InfoRow icon={CalendarDaysIcon}>
              Enrolled {new Date(employee.enrolledAt).toLocaleDateString()}
            </InfoRow>
          ) : rangeLabel ? (
            <InfoRow icon={CalendarDaysIcon}>{rangeLabel}</InfoRow>
          ) : null}
        </div>

        {loading ? (
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[20px] bg-black/[0.05] dark:bg-white/[0.06]"
            />
          ))
        ) : rows.length === 0 ? (
          <DetailCard>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              No attendance loaded for this range.
            </p>
          </DetailCard>
        ) : (
          <>
            {/* Average arrival */}
            <DetailCard>
              <CardHead
                title="Average arrival"
                action={
                  average && (
                    <StatusBadge status={average.isLate ? "Late" : "On time"} />
                  )
                }
              />

              {average ? (
                <>
                  {timeline && (
                    <RangeTrack
                      fillPct={timeline.arrivalPct}
                      markPct={timeline.cutoffPct}
                      from={timeline.fromLabel}
                      to={timeline.toLabel}
                      mark={`cutoff ${policy?.cutoffTime}`}
                      late={average.isLate}
                    />
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniStat
                      icon={ArrowRightOnRectangleIcon}
                      label="Average"
                      value={average.display}
                    />
                    <MiniStat
                      icon={ClockIcon}
                      label="Cutoff"
                      value={policy?.cutoffTime || "-"}
                    />
                    <MiniStat
                      icon={CalendarDaysIcon}
                      label={average.isLate ? "Late by" : "Margin"}
                      value={average.margin || "-"}
                    />
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                  No punches in the selected range.
                </p>
              )}
            </DetailCard>

            {/* History: every day of the range, newest first */}
            <DetailCard>
              <CardHead
                className="mb-2.5"
                title={showAll ? "All attendance" : "This week"}
                sub={
                  showAll
                    ? query
                      ? `${historyRows.length} of ${rows.length}`
                      : `${rows.length} day${rows.length === 1 ? "" : "s"}`
                    : `${historyRows.length} day${
                        historyRows.length === 1 ? "" : "s"
                      }`
                }
                action={
                  rows.length > WEEK && (
                    <CardAction
                      onClick={() => {
                        setShowAll((v) => !v);
                        setQuery("");
                      }}
                    >
                      {showAll ? "This week" : "View all"}
                    </CardAction>
                  )
                }
              />

              {showAll && (
                <Input
                  icon={MagnifyingGlassIcon}
                  inputSize="sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClear={() => setQuery("")}
                  clearable
                  placeholder="Find a date or status"
                  aria-label="Search attendance days"
                  className="mb-2"
                  inputClassName="text-xs"
                />
              )}

              {historyRows.length ? (
                <div className={showAll ? "max-h-72 overflow-y-auto" : undefined}>
                  {historyRows.map((row) => (
                    <HistoryRow
                      key={row.date}
                      date={row.dateDisplay}
                      detail={row.arrival || "-"}
                      badge={<StatusBadge status={row.status} compact />}
                      onClick={
                        onSelectDay ? () => onSelectDay(row) : undefined
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="py-2 text-[13px] text-gray-500 dark:text-gray-400">
                  No day matches that search.
                </p>
              )}
            </DetailCard>

            {/* Statistics */}
            <DetailCard>
              <CardHead title="Statistics" sub={rangeLabel} className="mb-3" />
              <div className="grid grid-cols-3 gap-2">
                <StatBox
                  tone={PRESENT_INK}
                  value={totals.present}
                  label="Present"
                />
                <StatBox tone={LATE_INK} value={totals.late} label="Late" />
                <StatBox
                  tone={ABSENT_INK}
                  value={totals.absent}
                  label="Absent"
                />
              </div>
              <div className="mt-2">
                <RateRow
                  label={`Attendance rate over ${totals.workingDays} working days`}
                  value={`${totals.rate}%`}
                />
              </div>
            </DetailCard>
          </>
        )}
      </DetailBody>
    </DetailShell>
  );
};

export default FullAttendanceDrawer;
