import React from "react";
import { ClockIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { formatTimeLabel } from "../ui/TimePicker";
import type { DayRow } from "./DayTable";

/**
 * What a day offers in the way of a time change, in one place so the table
 * row and the day sheet can never disagree:
 *
 *   - an approved change already applied   -> "Time corrected"
 *   - a request waiting for a decision     -> "Change pending"
 *   - a late day that can still be changed -> the "Request time change" button
 *   - anything else                        -> nothing
 */

/** Matches MAX_AGE_DAYS in backend/routes/attendanceCorrections.js. */
const MAX_AGE_DAYS = 60;

export type TimeChangeState = "corrected" | "pending" | "requestable" | null;

const isoDaysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function timeChangeState(row: DayRow): TimeChangeState {
  const record = row.record;
  if (!record) return null;
  if (record.timeCorrected) return "corrected";
  if (record.timeChange?.status === "pending") return "pending";
  if (row.status === "Late" && row.date >= isoDaysAgo(MAX_AGE_DAYS)) {
    return "requestable";
  }
  return null;
}

interface Props {
  row: DayRow;
  /** Omit to show state only, with no way to raise a request. */
  onRequest?: (row: DayRow) => void;
  /** `sm` for a table cell. */
  size?: "sm" | "md";
}

const chip =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold";

const TimeChangeAction: React.FC<Props> = ({ row, onRequest, size = "sm" }) => {
  const state = timeChangeState(row);

  if (state === "corrected") {
    const machine = row.record?.machineCheckInDisplay || row.record?.machineTimeDisplay;
    return (
      <span
        className={`${chip} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-300`}
        title={machine ? `Machine check-in was ${machine}` : undefined}
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
        title={`Requested ${formatTimeLabel(row.record?.timeChange?.requestedTime)}`.trim()}
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
        onClick={(event) => {
          event.stopPropagation();
          onRequest(row);
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

export default TimeChangeAction;
