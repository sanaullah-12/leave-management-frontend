import React, { useState } from "react";
import {
  HomeIcon,
  ArrowPathIcon,
  PlusIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "../ui/DatePicker";
import Select from "../ui/Select";
import { CARD } from "../../lib/surfaces";
import { AccentEdge } from "../ui/CardAccents";
import { useThemeAccent } from "../../hooks/useThemeAccent";
import { formatPlannedTime } from "./sessionFormat";
import type { WfhPolicy } from "../../hooks/useWorkFromHome";

import Input from "../ui/Input";
/**
 * The request form.
 *
 * Two questions in the order a person answers them - when, and what - each
 * under its own rule. The grouping is the design: seven fields stacked in one
 * column all look equally important and none of them looks like part of
 * anything, whereas a reader scanning this can stop after "When" if that is all
 * they came to fill in.
 *
 * The date, the reason and at least one task are required; the hours come
 * pre-filled with a standard day, and only the note is optional. Asking for the
 * tasks here rather than on the day is deliberate - it is what the request is
 * approved against, and it is the list the work timer opens with. Each section is
 * laid out the same way - two fields side by side, then whatever spans the
 * width underneath - so the eye travels down one shape instead of learning a
 * new one at every heading.
 *
 * One summary line replaces the hints that used to sit under each field. It
 * says what has actually been asked for - the day, how many of them, and the
 * hours - so the reader confirms their request by reading a sentence rather
 * than by re-reading four inputs and doing the arithmetic themselves.
 *
 * The planned hours and the task list are both statements of intent, nothing
 * more. What is actually worked, and what it was spent on, is measured on the
 * day by the work timer; nothing entered here can influence either number. The
 * tasks do carry forward, though - the day's timer starts with this list, so
 * writing it out here is the difference between starting work and starting work
 * with the list already made.
 */

interface Props {
  onSubmit: (data: {
    startDate: string;
    endDate?: string;
    reason: string;
    note?: string;
    plannedStartTime?: string;
    plannedEndTime?: string;
    plannedTasks?: string[];
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

/**
 * "Mon, 15 Sep" from "2026-09-15".
 *
 * Parsed with an explicit midnight so it is read as a local calendar day. Left
 * bare, a date-only string is parsed as UTC and renders as the day before for
 * anybody west of Greenwich.
 */
const readableDay = (iso: string) => {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

/**
 * Every half hour of the day, as the app's own dropdown reads them.
 *
 * A Select rather than a native time input, so the field is the same control
 * as every other choice in the app - one look, one keyboard behaviour, and the
 * same glass panel - instead of whatever the browser and operating system
 * happen to draw for `type="time"`, which differs on every one of them.
 *
 * Built once at module load; the list is the same for every request there has
 * ever been.
 */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const value = `${String(Math.floor(index / 2)).padStart(2, "0")}:${
    index % 2 ? "30" : "00"
  }`;
  return { value, label: formatPlannedTime(value) };
});

/** A group of fields under a caption, separated by a hairline from the last. */
const Section: React.FC<{
  title: string;
  Icon: typeof CalendarDaysIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, Icon, action, children }) => (
  <section className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0 dark:border-white/10">
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      {action}
    </div>
    {children}
  </section>
);

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
  // The hours the employee means to keep. Pre-filled with a standard day so the
  // common case is one glance rather than two fields to fill in; what is
  // actually worked is measured by the timer and is unaffected by this.
  const [plannedStart, setPlannedStart] = useState("09:00");
  const [plannedEnd, setPlannedEnd] = useState("17:00");
  // What they mean to work on. A list rather than a paragraph, because the
  // day's timer works through it one item at a time.
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskDraft, setTaskDraft] = useState("");
  const [error, setError] = useState("");

  const addTask = () => {
    const text = taskDraft.trim();
    if (!text) return;
    // Silently ignoring a duplicate beats an error message for something the
    // reader can see for themselves in the list above the field.
    if (tasks.length >= 20 || tasks.includes(text)) return setTaskDraft("");
    setTasks((current) => [...current, text]);
    setTaskDraft("");
  };

  const removeTask = (index: number) =>
    setTasks((current) => current.filter((_, i) => i !== index));

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
    // The day is approved against what will be worked on, so a request that
    // names nothing is not a request anybody can judge.
    if (![...tasks, taskDraft.trim()].filter(Boolean).length) {
      return setError("List at least one task you will work on.");
    }
    if (plannedStart && plannedEnd && plannedEnd <= plannedStart) {
      return setError(
        "The planned end time must be later than the planned start time."
      );
    }

    await onSubmit({
      startDate,
      endDate: isRange && endDate ? endDate : startDate,
      reason: reason.trim(),
      note: note.trim() || undefined,
      plannedStartTime: plannedStart || undefined,
      plannedEndTime: plannedEnd || undefined,
      // Whatever is still in the field counts: someone who typed a task and
      // pressed Submit meant to include it, and losing it to an unpressed Add
      // button would be the form's fault, not theirs.
      plannedTasks: [...tasks, taskDraft.trim()].filter(Boolean),
    });

    // Cleared only on success - a thrown error leaves the form as typed.
    setStartDate("");
    setEndDate("");
    setReason("");
    setNote("");
    setPlannedStart("09:00");
    setPlannedEnd("17:00");
    setTasks([]);
    setTaskDraft("");
    setIsRange(false);
  };

  const link =
    "text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300";
  const fieldLabel =
    "mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400";

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative overflow-hidden ${CARD} p-5 sm:p-6`}
    >
      <AccentEdge color={accent} />

      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <HomeIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
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
        {/* -- When ------------------------------------------------------- */}
        <Section
          title="When"
          Icon={CalendarDaysIcon}
          action={
            <button
              type="button"
              onClick={() => {
                setIsRange((v) => !v);
                setEndDate("");
              }}
              className={link}
            >
              {isRange ? "Single day" : "Use a date range"}
            </button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>{isRange ? "From" : "Date"}</label>
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
              <div>
                <label className={fieldLabel}>To</label>
                <DatePicker
                  value={endDate}
                  min={startDate || earliest}
                  onChange={setEndDate}
                  placeholder="End date"
                />
              </div>
            )}

            {/* On a single-day request this sits beside the date; on a range it
                takes the full width under both, so the two dates stay paired. */}
            <div className={isRange ? "sm:col-span-2" : ""}>
              <label className={`${fieldLabel} flex items-center gap-1.5`}>
                <ClockIcon className="h-3.5 w-3.5" />
                Working hours
              </label>
              <div className="flex items-center gap-2">
                <Select
                  value={plannedStart}
                  onChange={setPlannedStart}
                  options={TIME_OPTIONS}
                  placeholder="Start"
                  className="flex-1"
                />
                <span className="shrink-0 text-xs text-gray-400">to</span>
                <Select
                  value={plannedEnd}
                  onChange={setPlannedEnd}
                  options={TIME_OPTIONS}
                  placeholder="End"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {days > 0 && (
            <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400">
              {readableDay(startDate)}
              {isRange && endDate && endDate !== startDate
                ? ` to ${readableDay(endDate)}`
                : ""}
              {" - "}
              {days} day{days === 1 ? "" : "s"}
              {plannedStart && plannedEnd
                ? `, ${formatPlannedTime(plannedStart)} to ${formatPlannedTime(
                    plannedEnd
                  )}`
                : ""}
            </p>
          )}

          {isBackdated && (
            <p className="mt-2.5 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                These days have already passed, so this is a correction to the
                record rather than a request for permission. Approving it changes
                those days from absent to work from home.
              </span>
            </p>
          )}
        </Section>

        {/* -- What ------------------------------------------------------- */}
        <Section title="What" Icon={PencilSquareIcon}>
          {/* Reason and the task field share a row: both are one-line inputs
              answering the same question, and side by side they read as one
              step rather than two. The list they produce sits under both. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="wfh-reason" className={fieldLabel}>
                Reason
              </label>
              <Input
                id="wfh-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                placeholder="Why do you need to work from home?"
              />
            </div>

            <div>
              <label htmlFor="wfh-task" className={fieldLabel}>
                Tasks
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="wfh-task"
                  value={taskDraft}
                  onChange={(e) => setTaskDraft(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter adds the task rather than submitting the form,
                    // which is what a list field is expected to do.
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    addTask();
                  }}
                  maxLength={200}
                  placeholder="e.g. Build the payroll APIs"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={addTask}
                  disabled={!taskDraft.trim() || tasks.length >= 20}
                  aria-label="Add task"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {tasks.length > 0 && (
              <ul className="space-y-1 sm:col-span-2">
                {tasks.map((task, index) => (
                  <li
                    key={`${task}-${index}`}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 py-1.5 pl-2.5 pr-1.5 dark:bg-white/5"
                  >
                    <span className="w-4 shrink-0 text-center text-[11px] font-semibold text-gray-400">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-200">
                      {task}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      aria-label={`Remove ${task}`}
                      className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="wfh-note" className={fieldLabel}>
                Note{" "}
                <span className="text-gray-400 dark:text-gray-500">
                  (optional)
                </span>
              </label>
              <textarea
                id="wfh-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                rows={2}
                placeholder="Anything your approver should know"
                className="w-full resize-y rounded-xl bg-[var(--card-surface)] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 ring-1 ring-inset ring-gray-200/70 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-gray-100 dark:ring-white/10"
              />
            </div>

            <p className="text-xs text-gray-400 sm:col-span-2 dark:text-gray-500">
              Your work timer starts with the first task on the day. You can
              add or change tasks while you work.
            </p>
          </div>
        </Section>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
          {submitting ? "Submitting..." : "Submit request"}
        </button>
      </div>
    </form>
  );
};

export default WfhRequestForm;
