import React from "react";
import { formatClock, formatHm } from "./sessionFormat";
import type { WfhSessionTask } from "../../hooks/useWfhSession";

/**
 * What a day was spent on, task by task.
 *
 * Each task carries the stretches it was in hand for AND the time counted
 * inside each of them, because the two are different numbers: somebody on one
 * task from 9 to 12 who took an hour out worked two hours, not three. Printing
 * the window alone would quietly turn that break into work, which is the one
 * thing this whole module exists not to do.
 *
 * Shared by the day drawer and the request drawer so the same day can never be
 * reported two different ways depending on which row was clicked.
 */

interface Props {
  tasks: WfhSessionTask[];
  /** Dropped by callers that already have a heading above it. */
  title?: string;
}

/** How each task stands, in the words a reader would use. */
const TASK_META = {
  completed: {
    label: "Completed",
    dot: "bg-blue-500",
    tone: "text-gray-500 dark:text-gray-400",
  },
  active: {
    label: "In progress",
    dot: "bg-emerald-500",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  pending: {
    label: "Not started",
    dot: "bg-gray-300 dark:bg-gray-600",
    tone: "text-gray-400 dark:text-gray-500",
  },
} as const;

const WfhTaskReport: React.FC<Props> = ({ tasks, title = "Task report" }) => {
  if (!tasks || tasks.length === 0) return null;

  const completed = tasks.filter((task) => task.status === "completed").length;
  const inProgress = tasks.some((task) => task.status === "active");
  // What is still to do. Stated rather than left to be worked out from the
  // other two numbers, because it is the one a reader of this report is
  // actually asking for.
  const pending = tasks.filter((task) => task.status === "pending").length;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        {title && (
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </p>
        )}
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {completed} of {tasks.length} completed
          </span>
          {inProgress && (
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              1 in progress
            </span>
          )}
          {pending > 0 && (
            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              {pending} pending
            </span>
          )}
        </p>
      </div>

      <ul className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/10">
        {tasks.map((task) => {
          const meta = TASK_META[task.status];
          return (
            <li
              key={task._id}
              className="border-b border-gray-100 px-3 py-2.5 last:border-b-0 dark:border-white/10"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
                  aria-hidden="true"
                />
                <span
                  className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100"
                  title={task.title}
                >
                  {task.title}
                </span>
                {task.source === "added" && (
                  <span className="shrink-0 rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:border-white/15 dark:text-gray-400">
                    Added
                  </span>
                )}
                <span className={`shrink-0 text-xs ${meta.tone}`}>
                  {meta.label}
                </span>
                <span className="w-14 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {formatHm(task.activeMs)}
                </span>
              </div>

              {/* When it was worked on. A task picked up three times reads as
                  three lines adding up to the figure above. */}
              {task.spans.length > 0 && (
                <ul className="mt-1 space-y-0.5 pl-[18px]">
                  {task.spans.map((span, index) => (
                    <li
                      key={`${span.from}-${index}`}
                      className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400"
                    >
                      <span>
                        {formatClock(span.from)} to{" "}
                        {span.to ? formatClock(span.to) : "now"}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatHm(span.activeMs)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WfhTaskReport;
