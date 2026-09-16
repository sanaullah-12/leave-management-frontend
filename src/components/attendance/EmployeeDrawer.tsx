import React, { useEffect, useMemo } from "react";
import {
  BuildingOffice2Icon,
  IdentificationIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
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
 * One employee's attendance, in full.
 *
 * Everything shown comes from the record set the page already fetched for this
 * person, so opening the sheet never re-derives or re-judges anything - the
 * lateness here is the same lateness the table shows, under the same rule.
 *
 * The chrome and every card come from `mobile/DetailSheet`, which is what
 * keeps this screen and the other detail sheets one design.
 */

export interface DrawerEmployee {
  employeeId: string | number;
  name?: string;
  department?: string;
  machineId?: string | number;
  role?: number;
  enrolledAt?: string | Date;
}

interface Props {
  employee: DrawerEmployee;
  /** The response from the attendance endpoint, or null while it loads. */
  data: any;
  loading?: boolean;
  onClose: () => void;
}

/** Present follows the theme accent; late and absent carry meaning and do not. */
const PRESENT_INK = "var(--accent)";

/** "HH:MM" or "HH:MM:SS" to minutes past midnight. */
const toMinutes = (value?: string) => {
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

const EmployeeDrawer: React.FC<Props> = ({
  employee,
  data,
  loading = false,
  onClose,
}) => {
  const [showAllDays, setShowAllDays] = React.useState(false);
  const [dayQuery, setDayQuery] = React.useState("");

  const summary = data?.summary;
  const records: any[] = data?.records || [];
  const policy = data?.lateTimePolicy || {};

  /** Reopening on a different person must not inherit the last one's search. */
  useEffect(() => {
    setShowAllDays(false);
    setDayQuery("");
  }, [employee.employeeId]);

  /**
   * The average arrival across every punch in the range.
   *
   * One bad morning is a bad morning; where the average sits is the habit, and
   * the habit is what this sheet is opened to judge. The verdict on each
   * individual day stays the server's and is untouched here.
   */
  const average = useMemo(() => {
    const minutes = records
      .map((record: any) => toMinutes(record.time))
      .filter((value: number | null): value is number => value != null);
    if (!minutes.length) return null;

    const mean = Math.round(
      minutes.reduce((sum: number, value: number) => sum + value, 0) /
        minutes.length
    );
    const cutoff = toMinutes(policy.cutoffTime);
    return {
      minutes: mean,
      display: clockOf(mean),
      days: minutes.length,
      isLate: cutoff != null && mean > cutoff,
      margin: cutoff == null ? null : spanOf(Math.abs(mean - cutoff)),
    };
  }, [records, policy.cutoffTime]);

  /** Rows for the history card: the recent slice, or everything when opened. */
  const historyRows = useMemo(() => {
    if (!showAllDays) return records.slice(0, 5);
    const q = dayQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r: any) =>
      `${r.dateDisplay || r.date} ${r.timeDisplay || r.time}`
        .toLowerCase()
        .includes(q)
    );
  }, [records, showAllDays, dayQuery]);

  /**
   * Where the average arrival sits between the start of the working window and
   * the cutoff. Purely for the bar; the late verdict is the server's.
   */
  const timeline = useMemo(() => {
    const cutoff = toMinutes(policy.cutoffTime);
    const arrival = average?.minutes ?? null;
    if (cutoff == null || arrival == null) return null;

    // A two-hour window either side of the cutoff reads better than a full day,
    // where every office arrival would bunch into a few pixels.
    const from = cutoff - 120;
    const to = cutoff + 120;
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      arrivalPct: clamp(((arrival - from) / (to - from)) * 100),
      cutoffPct: clamp(((cutoff - from) / (to - from)) * 100),
      fromLabel: `${pad(Math.floor(from / 60))}:${pad(from % 60)}`,
      toLabel: `${pad(Math.floor(to / 60))}:${pad(to % 60)}`,
      isLate: !!average?.isLate,
    };
  }, [average, policy.cutoffTime]);

  return (
    <DetailShell onClose={onClose} labelledBy="employee-drawer-title">
      <DetailHeader
        title="Attendance Detail"
        onBack={onClose}
        titleId="employee-drawer-title"
        subject={{
          name: employee.name || `Employee ${employee.employeeId}`,
          meta: `${employee.department || "Employee"} · ID ${
            employee.employeeId
          }`,
        }}
      />

      <DetailBody>
        {/* Identity. Unbordered rows rather than a card: this is the caption
            to the name above it, not a section of its own. */}
        <div className="-mt-1">
          <InfoRow icon={BuildingOffice2Icon}>
            {employee.department || "Department not set"}
          </InfoRow>
          <InfoRow icon={IdentificationIcon}>
            Device slot {employee.machineId ?? "-"} {"·"} User ID{" "}
            {employee.employeeId}
          </InfoRow>
          {employee.enrolledAt && (
            <InfoRow icon={CalendarDaysIcon}>
              Enrolled {new Date(employee.enrolledAt).toLocaleDateString()}
            </InfoRow>
          )}
        </div>

        {loading ? (
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[20px] bg-black/[0.05] dark:bg-white/[0.06]"
            />
          ))
        ) : !summary ? (
          <DetailCard>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              No attendance loaded for this employee.
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
                      mark={`cutoff ${policy.cutoffTime}`}
                      late={timeline.isLate}
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
                      value={policy.cutoffTime || "-"}
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

            {/* History */}
            <DetailCard>
              <CardHead
                className="mb-2.5"
                title={showAllDays ? "All attendance" : "Recent attendance"}
                sub={
                  showAllDays
                    ? `${historyRows.length} of ${records.length}`
                    : `${records.length} day${records.length === 1 ? "" : "s"}`
                }
                action={
                  records.length > 5 && (
                    <CardAction
                      onClick={() => {
                        setShowAllDays((v) => !v);
                        setDayQuery("");
                      }}
                    >
                      {showAllDays ? "Show recent" : "View all"}
                    </CardAction>
                  )
                }
              />

              {showAllDays && (
                <Input
                  icon={MagnifyingGlassIcon}
                  inputSize="sm"
                  value={dayQuery}
                  onChange={(e) => setDayQuery(e.target.value)}
                  onClear={() => setDayQuery("")}
                  clearable
                  placeholder="Find a date or time"
                  aria-label="Search attendance days"
                  className="mb-2"
                  inputClassName="text-xs"
                />
              )}

              {historyRows.length ? (
                <div className={showAllDays ? "max-h-72 overflow-y-auto" : undefined}>
                  {historyRows.map((r: any) => (
                    <HistoryRow
                      key={r.recordId || `${r.date}-${r.time}`}
                      date={r.dateDisplay || r.date}
                      detail={r.timeDisplay || r.time}
                      badge={
                        <StatusBadge
                          status={r.isLate ? "Late" : "On time"}
                          compact
                        />
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="py-2 text-[13px] text-gray-500 dark:text-gray-400">
                  {dayQuery
                    ? "No day matches that search."
                    : "Nothing recorded in this range."}
                </p>
              )}
            </DetailCard>

            {/* Statistics */}
            <DetailCard>
              <CardHead
                title="Statistics"
                sub={
                  data.dateRange
                    ? `${data.dateRange.from} to ${data.dateRange.to}`
                    : undefined
                }
                className="mb-3"
              />
              <div className="grid grid-cols-3 gap-2">
                <StatBox
                  tone={PRESENT_INK}
                  value={summary.presentDays ?? 0}
                  label="Present"
                />
                <StatBox
                  tone={LATE_INK}
                  value={summary.lateDays ?? 0}
                  label="Late"
                />
                <StatBox
                  tone={ABSENT_INK}
                  value={summary.absentDays ?? 0}
                  label="Absent"
                />
              </div>
              <div className="mt-2">
                <RateRow
                  label={`Attendance rate over ${summary.totalDays} working days`}
                  value={`${summary.attendanceRate}%`}
                />
              </div>
            </DetailCard>
          </>
        )}
      </DetailBody>
    </DetailShell>
  );
};

export default EmployeeDrawer;
