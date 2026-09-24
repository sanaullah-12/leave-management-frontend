import React, { useEffect, useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import TimePicker, { formatTimeLabel } from "../ui/TimePicker";
import InlineLoader from "../InlineLoader";
import {
  useSubmitTimeChange,
  type TimeChangeRequest,
} from "../../hooks/useTimeChanges";
import { showErrorToast, showSuccessToast } from "../../utils/toastHelpers";

/**
 * Request Time Change.
 *
 * Asks for one late day to be read at an agreed arrival time. The date and the
 * machine check-in are shown for reference only: the server reads the machine
 * time off the device record itself, so nothing typed here can alter what the
 * device saw. What the employee supplies is the time the office agreed to and
 * why.
 */

export interface TimeChangeDay {
  /** YYYY-MM-DD */
  date: string;
  dateDisplay: string;
  /** Office wall-clock "HH:MM" or "HH:MM:SS" of the machine check-in. */
  machineTime: string;
  machineTimeDisplay: string;
  /** The office arrival time the day was judged against, "HH:MM". */
  cutoffTime?: string;
}

interface Props {
  day: TimeChangeDay | null;
  onClose: () => void;
  onSubmitted?: (request: TimeChangeRequest) => void;
}

const toMinutes = (value?: string) => {
  const [h, m] = String(value || "").split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

const fieldLabel =
  "mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400";
const readOnlyField =
  "rounded-xl bg-black/[0.03] px-4 py-2.5 text-sm font-medium text-gray-800 ring-1 ring-inset ring-gray-200/70 dark:bg-white/[0.04] dark:text-gray-100 dark:ring-white/10";

const TimeChangeRequestModal: React.FC<Props> = ({ day, onClose, onSubmitted }) => {
  const submit = useSubmitTimeChange();
  const [requestedTime, setRequestedTime] = useState("");
  const [reason, setReason] = useState("");

  // A fresh form per day, starting from the office arrival time, which is the
  // answer in the usual case of "I told my manager I would be in at 9:30".
  useEffect(() => {
    if (!day) return;
    setRequestedTime((day.cutoffTime || "").slice(0, 5));
    setReason("");
  }, [day]);

  const machineMinutes = toMinutes(day?.machineTime);
  const requestedMinutes = toMinutes(requestedTime);
  const timeError =
    requestedMinutes != null &&
    machineMinutes != null &&
    requestedMinutes >= machineMinutes
      ? "Must be earlier than the machine check-in."
      : null;
  const canSubmit =
    !!day &&
    requestedMinutes != null &&
    !timeError &&
    reason.trim().length >= 3 &&
    !submit.isPending;

  const handleSubmit = async () => {
    if (!day || !canSubmit) return;
    try {
      const request = await submit.mutateAsync({
        date: day.date,
        requestedTime,
        reason: reason.trim(),
      });
      showSuccessToast("Time change request sent for approval");
      onSubmitted?.(request);
      onClose();
    } catch (error: any) {
      showErrorToast(
        error?.response?.data?.message || "Could not submit the request"
      );
    }
  };

  return (
    <Modal
      open={!!day}
      onClose={onClose}
      size="md"
      icon={<ClockIcon className="h-6 w-6" />}
      iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
      title="Request time change"
      description="If you arrived late with prior approval, ask for this day to be recorded from the agreed time."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submit.isPending}
            className="rounded-full border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submit.isPending ? (
              <InlineLoader label="Submitting..." />
            ) : (
              "Submit request"
            )}
          </button>
        </>
      }
    >
      {day && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className={fieldLabel}>Date</span>
              <div className={readOnlyField}>{day.dateDisplay}</div>
            </div>
            <div>
              <span className={fieldLabel}>Machine check-in</span>
              <div className={`${readOnlyField} tabular-nums`}>
                {day.machineTimeDisplay}
              </div>
            </div>
          </div>

          <div>
            <label className={fieldLabel}>Requested check-in</label>
            <TimePicker
              value={requestedTime}
              onChange={setRequestedTime}
              step={5}
              aria-label="Requested check-in time"
            />
            <p
              className={`mt-1.5 text-xs ${
                timeError
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {timeError ||
                (day.cutoffTime
                  ? `Office start time is ${formatTimeLabel(day.cutoffTime)}.`
                  : "The time your manager agreed to.")}
            </p>
          </div>

          <div>
            <label htmlFor="time-change-reason" className={fieldLabel}>
              Reason
            </label>
            <textarea
              id="time-change-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Informed my manager in advance about a doctor's appointment"
              className="w-full resize-none rounded-xl bg-[var(--card-surface)] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 ring-1 ring-inset ring-gray-200/70 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-gray-100 dark:ring-white/10"
            />
            <div className="mt-1 text-right text-xs tabular-nums text-gray-400">
              {reason.length}/500
            </div>
          </div>

          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            The machine record is kept as it is. If an admin approves, the
            requested time is used for this day everywhere attendance is
            calculated.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default TimeChangeRequestModal;
