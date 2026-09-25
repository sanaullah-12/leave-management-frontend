import React, { useMemo } from "react";
import { ClockIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { formatTimeLabel } from "../ui/TimePicker";
import type { DayRow } from "./DayTable";
import { useMyTimeChanges } from "../../hooks/useTimeChanges";
import { useTimeChangeRequest } from "../../providers/TimeChangeProvider";

/**
 * What a day offers in the way of a time change, in one place so every screen
 * that shows a late time says the same thing next to it:
 *
 *   - an approved change already applied   -> "Time corrected"
 *   - a request waiting for a decision     -> "Change pending"
 *   - a late day that can still be changed -> the "Request time change" button
 *   - anything else                        -> nothing
 *
 * `TimeChangeAction` reads an attendance page day row. `LateDayTimeChange`
 * reads any other late day (a roster row, a late report entry) and opens the
 * app-wide form from TimeChangeProvider itself.
 */

/** Matches MAX_AGE_DAYS in backend/routes/attendanceCorrections.js. */
export const MAX_AGE_DAYS = 60;

export type TimeChangeState = "corrected" | "pending" | "requestable" | null;

export const isoDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Whether a day is still inside the window a request is accepted for. */
export const withinRequestWindow = (date: string) =>
  date >= isoDaysAgo(MAX_AGE_DAYS);

/**
 * Minutes past midnight from any clock the API sends: "09:42", "09:42:10" or
 * "9:42 AM". Null for anything else.
 */
export const clockMinutes = (value?: string | null) => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (match[3]) hours = (hours % 12) + (/p/i.test(match[3]) ? 12 : 0);
  return hours * 60 + minutes;
};

/** Minutes past midnight as "HH:MM". */
export const clockString = (minutes: number) => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
};

export function timeChangeState(row: DayRow): TimeChangeState {
  const record = row.record;
  if (!record) return null;
  if (record.timeCorrected) return "corrected";
  if (record.timeChange?.status === "pending") return "pending";
  if (row.status === "Late" && withinRequestWindow(row.date)) {
    return "requestable";
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* The three faces                                                     */
/* ------------------------------------------------------------------ */

const chip =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold";

interface ChipProps {
  state: TimeChangeState;
  /** The device check-in on a corrected day. */
  machineDisplay?: string | null;
  /** "HH:MM" of a pending request. */
  requestedTime?: string | null;
  /** Omit to show state only, with no way to raise a request. */
  onRequest?: () => void;
  /** Shown on the button's tooltip, e.g. why an earlier request was refused. */
  hint?: string;
  /** `sm` for a table cell or list row. */
  size?: "sm" | "md";
}

export const TimeChangeChip: React.FC<ChipProps> = ({
  state,
  machineDisplay,
  requestedTime,
  onRequest,
  hint,
  size = "sm",
}) => {
  if (state === "corrected") {
    return (
      <span
        className={`${chip} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-300`}
        title={machineDisplay ? `Machine check-in was ${machineDisplay}` : undefined}
      >
        <CheckCircleIcon className="h-3.5 w-3.5" />
        Time corrected
      </span>
    );
  }

  if (state === "pending") {
    return (
      <span
        className={`${chip} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/15 dark:text-amber-300`}
        title={`Requested ${formatTimeLabel(requestedTime || undefined)}`.trim()}
      >
        <ClockIcon className="h-3.5 w-3.5" />
        Change pending
      </span>
    );
  }

  if (state === "requestable" && onRequest) {
    return (
      <button
        type="button"
        title={hint}
        onClick={(event) => {
          event.stopPropagation();
          onRequest();
        }}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-200 bg-white font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:border-blue-400/50 dark:hover:text-blue-300 ${
          size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm"
        }`}
      >
        <PencilSquareIcon className="h-4 w-4" />
        Request time change
      </button>
    );
  }

  return null;
};

/* ------------------------------------------------------------------ */
/* An attendance page day row                                          */
/* ------------------------------------------------------------------ */

interface Props {
  row: DayRow;
  /** Omit to show state only, with no way to raise a request. */
  onRequest?: (row: DayRow) => void;
  size?: "sm" | "md";
}

const TimeChangeAction: React.FC<Props> = ({ row, onRequest, size = "sm" }) => (
  <TimeChangeChip
    state={timeChangeState(row)}
    machineDisplay={
      row.record?.machineCheckInDisplay || row.record?.machineTimeDisplay
    }
    requestedTime={row.record?.timeChange?.requestedTime}
    onRequest={onRequest ? () => onRequest(row) : undefined}
    size={size}
  />
);

export default TimeChangeAction;

/* ------------------------------------------------------------------ */
/* Any other late day                                                  */
/* ------------------------------------------------------------------ */

export interface LateDay {
  /** Whose day it is. Nothing is shown on anyone's day but the viewer's own. */
  employeeCode?: string | null;
  /** YYYY-MM-DD */
  date: string;
  dateDisplay: string;
  isLate: boolean;
  /** The arrival as shown: "09:42", "09:42:10" or "9:42 AM". */
  arrival: string | null;
  /** How late the arrival was judged, to recover the start time it was judged against. */
  lateMinutes?: number | null;
  /** The office start time, "HH:MM", when the caller has it. */
  cutoffTime?: string | null;
  /** The server already applied an approved change to this day. */
  corrected?: boolean;
  machineCheckInDisplay?: string | null;
}

/**
 * The time change state of one of the signed-in person's days, joining what
 * the day's own record says with the requests they have raised - the record
 * may be a read older than a request made a moment ago.
 */
export function useLateDayTimeChange(day: LateDay) {
  const { canRequest, employeeCode, requestTimeChange } = useTimeChangeRequest();
  const own =
    canRequest &&
    (day.employeeCode == null || String(day.employeeCode) === employeeCode);
  const { data: mine } = useMyTimeChanges(canRequest);

  const latest = useMemo(
    () =>
      own
        ? (mine || []).find(
            (request) => request.date === day.date && request.status !== "cancelled"
          ) || null
        : null,
    [own, mine, day.date]
  );

  let state: TimeChangeState = null;
  if (own) {
    if (day.corrected || latest?.status === "approved") state = "corrected";
    else if (latest?.status === "pending") state = "pending";
    else if (
      day.isLate &&
      clockMinutes(day.arrival) != null &&
      withinRequestWindow(day.date)
    ) {
      state = "requestable";
    }
  }

  const open = () => {
    const arrival = clockMinutes(day.arrival);
    if (arrival == null) return;
    const judgedAgainst =
      day.cutoffTime ||
      (day.lateMinutes ? clockString(arrival - day.lateMinutes) : undefined);
    requestTimeChange({
      date: day.date,
      dateDisplay: day.dateDisplay,
      machineTime: clockString(arrival),
      machineTimeDisplay: formatTimeLabel(clockString(arrival)),
      cutoffTime: judgedAgainst,
    });
  };

  return {
    state,
    request: latest,
    open,
    hint:
      latest?.status === "rejected"
        ? `Your last request for this day was rejected${
            latest.reviewComments ? `: ${latest.reviewComments}` : ""
          }`
        : undefined,
  };
}

export const LateDayTimeChange: React.FC<{ day: LateDay; size?: "sm" | "md" }> = ({
  day,
  size = "sm",
}) => {
  const { state, request, open, hint } = useLateDayTimeChange(day);
  return (
    <TimeChangeChip
      state={state}
      machineDisplay={day.machineCheckInDisplay || request?.machineCheckInDisplay}
      requestedTime={request?.requestedTime}
      onRequest={open}
      hint={hint}
      size={size}
    />
  );
};
