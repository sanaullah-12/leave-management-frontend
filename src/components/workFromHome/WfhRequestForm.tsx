import React, { useState } from "react";
import { HomeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import DatePicker from "../ui/DatePicker";
import { CARD } from "../../lib/surfaces";
import { AccentEdge } from "../ui/CardAccents";
import { useThemeAccent } from "../../hooks/useThemeAccent";
import type { WfhPolicy } from "../../hooks/useWorkFromHome";

/**
 * The request form: a date or date range, a reason, and an optional note.
 *
 * Single-day is the common case, so the range is one date until the reader
 * asks for two - a second date field that is usually a copy of the first is
 * noise on the screen and a mistake waiting to happen.
 */

interface Props {
  onSubmit: (data: {
    startDate: string;
    endDate?: string;
    reason: string;
    note?: string;
  }) => Promise<void> | void;
  submitting?: boolean;
  /** The server's rules. Until it loads, the picker allows today onward. */
  policy?: WfhPolicy;
}

/** Today in the browser's own calendar, as YYYY-MM-DD. */
const todayISO = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
};

const WfhRequestForm: React.FC<Props> = ({
  onSubmit,
  submitting = false,
  policy,
}) => {
  const accent = useThemeAccent(600);
  const [isRange, setIsRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Days already past are allowed inside the policy window: someone who worked
  // from home on Monday and remembers on Wednesday needs to put the record
  // straight, and refusing leaves those days marked absent - a false record.
  const earliest = policy?.earliestStartDate || todayISO();
  const today = policy?.today || todayISO();
  const isBackdated = !!startDate && startDate < today;

  const days =
    startDate && (!isRange || !endDate)
      ? 1
      : startDate && endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              86400000
          ) + 1
        )
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!startDate) return setError("Choose the day you want to work from home.");
    if (isRange && endDate && endDate < startDate) {
      return setError("The end date must be on or after the start date.");
    }
    if (!reason.trim()) return setError("Add a reason for the request.");

    await onSubmit({
      startDate,
      endDate: isRange && endDate ? endDate : startDate,
      reason: reason.trim(),
      note: note.trim() || undefined,
    });

    // Cleared only on success - a thrown error leaves the form as typed.
    setStartDate("");
    setEndDate("");
    setReason("");
    setNote("");
    setIsRange(false);
  };

  const field =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative overflow-hidden ${CARD} p-5 sm:p-6`}
    >
      <AccentEdge color={accent} />

      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <HomeIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Request work from home
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Approved days count as working days and do not use your leave
            balance
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              {isRange ? "Dates" : "Date"}
            </label>
            <button
              type="button"
              onClick={() => {
                setIsRange((v) => !v);
                setEndDate("");
              }}
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {isRange ? "Single day" : "Use a date range"}
            </button>
          </div>

          <div className={isRange ? "flex items-center gap-2" : ""}>
            <div className="flex-1">
              <DatePicker
                value={startDate}
                min={earliest}
                onChange={(next) => {
                  setStartDate(next);
                  if (endDate && next > endDate) setEndDate("");
                }}
                placeholder="Select a date"
              />
            </div>
            {isRange && (
              <>
                <span className="text-sm text-gray-400">to</span>
                <div className="flex-1">
                  <DatePicker
                    value={endDate}
                    min={startDate || earliest}
                    onChange={setEndDate}
                    placeholder="End date"
                  />
                </div>
              </>
            )}
          </div>

          {days > 0 && (
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              {days} day{days === 1 ? "" : "s"} requested
            </p>
          )}

          {isBackdated && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              These days have already passed, so this is a correction to the
              record rather than a request for permission. Your administrator
              will see it as backdated. Approving it changes those days from
              absent to work from home.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="wfh-reason"
            className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300"
          >
            Reason
          </label>
          <input
            id="wfh-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Why do you need to work from home?"
            className={field}
          />
        </div>

        <div>
          <label
            htmlFor="wfh-note"
            className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300"
          >
            Note <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="wfh-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Anything your approver should know"
            className={`${field} resize-y`}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
          {submitting ? "Submitting..." : "Submit request"}
        </button>
      </div>
    </form>
  );
};

export default WfhRequestForm;
