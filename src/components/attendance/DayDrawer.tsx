import React, { useMemo } from "react";
import {
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
import TimeChangeAction, { timeChangeState } from "./TimeChangeAction";
import { formatTimeLabel } from "../ui/TimePicker";
import type { DayRow } from "./DayTable";
import {
  CardHead,
  DetailBody,
  DetailCard,
  DetailHeader,
  DetailShell,
  FieldRow,
  MiniStat,
  RangeTrack,
} from "../mobile/DetailSheet";

/**
 * A single day, in full.
 *
 * Everything here comes from the punch the page already fetched, so the
 * verdict in the sheet is the same verdict the row shows, judged by the same
 * rule. Nothing is recalculated on the way in.
 */

interface Props {
  row: DayRow;
  /** The lateTimePolicy the records were judged under. */
  policy: any;
  /** Where the punch came from, for the provenance line. */
  source?: string;
  onClose: () => void;
  /** Offered on a late day. Omit where the viewer cannot raise a request. */
  onRequestTimeChange?: (row: DayRow) => void;
}

/** "HH:MM" or "HH:MM:SS" to minutes past midnight. */
const toMinutes = (value?: string) => {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

const DayDrawer: React.FC<Props> = ({
  row,
  policy,
  source,
  onClose,
  onRequestTimeChange,
}) => {
  const record = row.record;
  const changeState = timeChangeState(row);
  const rejected =
    record?.timeChange?.status === "rejected" ? record.timeChange : null;

  /**
   * Where the arrival sits either side of the cutoff. Purely for the bar - the
   * late verdict itself is the server's.
   */
  const timeline = useMemo(() => {
    const cutoff = toMinutes(policy?.cutoffTime);
    const arrival = toMinutes(record?.time);
    if (cutoff == null || arrival == null) return null;

    const from = cutoff - 120;
    const to = cutoff + 120;
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      arrivalPct: clamp(((arrival - from) / (to - from)) * 100),
      cutoffPct: clamp(((cutoff - from) / (to - from)) * 100),
      fromLabel: `${pad(Math.floor(from / 60))}:${pad(from % 60)}`,
      toLabel: `${pad(Math.floor(to / 60))}:${pad(to % 60)}`,
      isLate: !!record?.isLate,
    };
  }, [record, policy?.cutoffTime]);

  const detail: { label: string; value: string }[] = record
    ? [
        { label: "Punch type", value: record.status || record.type || "-" },
        {
          label: "Recorded",
          value: `${record.dateDisplay || record.date} ${
            record.timeDisplay || record.time || ""
          }`.trim(),
        },
        { label: "Device state", value: String(record.rawState ?? "-") },
        { label: "Record", value: String(record.recordId || record.id || "-") },
      ]
    : [];

  return (
    <DetailShell onClose={onClose} labelledBy="day-drawer-title">
      <DetailHeader
        title="Day Detail"
        onBack={onClose}
        titleId="day-drawer-title"
        action={<StatusBadge status={row.status} />}
        subject={{
          name: row.dateDisplay,
          meta: row.weekday,
          /* A date has no initials to show, so the disc carries the day of the
             month instead - the one thing about this screen worth a glance. */
          avatar: (
            <span
              aria-hidden="true"
              className="grid h-[52px] w-[52px] flex-none place-items-center rounded-full text-[19px] font-bold text-white"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent) 72%, white) 0%, var(--accent) 100%)",
              }}
            >
              {new Date(row.date).getDate() || <CalendarDaysIcon className="h-6 w-6" />}
            </span>
          ),
        }}
      />

      <DetailBody>
        {/* Arrival */}
        <DetailCard>
          <CardHead title="Arrival" className={record ? "mb-4" : "mb-2"} />

          {record ? (
            <>
              {timeline && (
                <RangeTrack
                  fillPct={timeline.arrivalPct}
                  markPct={timeline.cutoffPct}
                  from={timeline.fromLabel}
                  to={timeline.toLabel}
                  mark={`cutoff ${policy?.cutoffTime}`}
                  late={timeline.isLate}
                />
              )}

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat
                  icon={ArrowRightOnRectangleIcon}
                  label="Arrived"
                  value={row.arrival || "-"}
                />
                <MiniStat
                  icon={ClockIcon}
                  label="Cutoff"
                  value={policy?.cutoffTime || "-"}
                />
                <MiniStat
                  icon={CalendarDaysIcon}
                  label={record.isLate ? "Late by" : "Margin"}
                  value={record.isLate ? record.lateDisplay || "-" : "On time"}
                />
              </div>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
              {row.workMode === "work_from_home"
                ? "An approved work from home day. It counts as a working day and uses none of your leave balance, so no office punch is expected."
                : row.workMode === "on_leave"
                ? "An approved leave day. No punch is expected and none counts against this day."
                : row.isWeekend
                ? "A non-working day. No punch is expected, and none counts against this day."
                : "No punch was recorded on this day. The device cannot tell leave, another site, or an unenrolled worker apart from an absence."}
            </p>
          )}
        </DetailCard>

        {/* Time change: a correction already applied, one waiting, or the way
            to ask for one on a late day. */}
        {changeState && (
          <DetailCard>
            <CardHead
              title="Time change"
              className="mb-2"
              action={<TimeChangeAction row={row} />}
            />
            {changeState === "corrected" && (
              <dl>
                <FieldRow
                  label="Machine check-in"
                  value={record.machineCheckInDisplay || "-"}
                />
                <FieldRow label="Approved check-in" value={row.arrival || "-"} />
              </dl>
            )}
            {changeState === "pending" && (
              <dl>
                <FieldRow
                  label="Machine check-in"
                  value={record.timeDisplay || record.time || "-"}
                />
                <FieldRow
                  label="Requested check-in"
                  value={
                    formatTimeLabel(record.timeChange?.requestedTime) || "-"
                  }
                />
              </dl>
            )}
            {changeState === "requestable" && (
              <>
                <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                  Arrived late with prior approval? Ask for this day to be
                  recorded from the agreed time.
                </p>
                {rejected && (
                  <p className="mt-2 text-[12px] leading-relaxed text-red-600 dark:text-red-400">
                    Your last request for this day was rejected
                    {rejected.reviewComments ? `: ${rejected.reviewComments}` : "."}
                  </p>
                )}
                {onRequestTimeChange && (
                  <div className="mt-3">
                    <TimeChangeAction
                      row={row}
                      onRequest={onRequestTimeChange}
                      size="md"
                    />
                  </div>
                )}
              </>
            )}
          </DetailCard>
        )}

        {/* Record detail */}
        {record && (
          <DetailCard>
            <CardHead title="Record" className="mb-2" />
            <dl>
              {detail.map((item) => (
                <FieldRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </dl>
          </DetailCard>
        )}

        {/* The rule this day was judged under */}
        <DetailCard>
          <CardHead title="Rule applied" className="mb-2" />
          <FieldRow label="Arrival time" value={policy?.cutoffTime || "-"} />
          <FieldRow label="Policy" value={policy?.policy || "-"} />
          {source && (
            <div className="flex items-center gap-2 pt-2 text-[11px] text-gray-400 dark:text-gray-500">
              <ServerIcon className="h-3.5 w-3.5 flex-none" />
              <span className="truncate">Read from {source}</span>
            </div>
          )}
          {policy?.isPreview && (
            <p className="pt-2 text-[11px] text-amber-700 dark:text-amber-400">
              A comparison view. The official arrival time is{" "}
              {policy.officialCutoffTime}.
            </p>
          )}
        </DetailCard>
      </DetailBody>
    </DetailShell>
  );
};

export default DayDrawer;
