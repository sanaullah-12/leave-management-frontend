import React, { useState } from "react";
import {
  CheckCircleIcon,
  PlayIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import Input from "../ui/Input";
import { formatHm } from "./sessionFormat";
import type { WfhSessionTask } from "../../hooks/useWfhSession";

/**
 * What the employee is working on, and what each piece has taken.
 *
 * The list is the day's, not a to-do list that outlives it: it starts as the
 * tasks named on the request and grows as work turns up. Exactly one task is
 * ever in hand, which is the whole reason the times underneath can be trusted -
 * a minute counted against two tasks would make every figure here a matter of
 * opinion.
 *
 * Two actions and no more. Start moves the clock's attention to a task;
 * Done closes one. Nothing starts by itself when a task is completed, because
 * the system deciding which task the next hour belongs to would be guessing
 * about the one thing this panel exists to record.
 */

interface Props {
  tasks: WfhSessionTask[];
  /** Live milliseconds to add to the task in hand, for a time that ticks. */
  liveExtraMs?: number;
  /** A finished day is a record; its tasks are read, never changed. */
  readOnly?: boolean;
  busy?: boolean;
  onStart: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onAdd: (title: string) => void;
}

const STATUS_DOT: Record<WfhSessionTask["status"], string> = {
  active: "bg-emerald-500",
  pending: "bg-gray-300 dark:bg-gray-600",
  completed: "bg-blue-500",
};

const WfhTaskPanel: React.FC<Props> = ({
  tasks,
  liveExtraMs = 0,
  readOnly = false,
  busy = false,
  onStart,
  onComplete,
  onAdd,
}) => {
  const [draft, setDraft] = useState("");

  const submitDraft = () => {
    const text = draft.trim();
    if (!text || busy) return;
    onAdd(text);
    setDraft("");
  };

  const done = tasks.filter((task) => task.status === "completed").length;

  const action =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-4 rounded-xl border border-gray-100 p-3 dark:border-white/10">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Tasks
        </p>
        {tasks.length > 0 && (
          <span className="text-[11px] text-gray-400">
            {done} of {tasks.length} done
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="py-2 text-xs text-gray-400 dark:text-gray-500">
          {readOnly
            ? "No tasks were recorded for this day."
            : "Add what you are working on and the timer will count against it."}
        </p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((task) => {
            const isActive = task.status === "active";
            const isDone = task.status === "completed";
            return (
              <li
                key={task._id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    STATUS_DOT[task.status]
                  } ${isActive ? "animate-pulse" : ""}`}
                  aria-hidden="true"
                />

                <span
                  className={`min-w-0 flex-1 truncate text-xs ${
                    isDone
                      ? "text-gray-400 line-through dark:text-gray-500"
                      : "text-gray-800 dark:text-gray-100"
                  } ${isActive ? "font-semibold" : ""}`}
                  title={task.title}
                >
                  {task.title}
                </span>

                <span className="shrink-0 font-mono text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                  {formatHm(task.activeMs + (isActive ? liveExtraMs : 0))}
                </span>

                {!readOnly && (
                  <span className="shrink-0">
                    {isDone ? (
                      <CheckCircleSolid className="h-4 w-4 text-blue-500" />
                    ) : isActive ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onComplete(task._id)}
                        className={`${action} text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10`}
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Done
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onStart(task._id)}
                        className={`${action} text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10`}
                      >
                        <PlayIcon className="h-3.5 w-3.5" />
                        Start
                      </button>
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              submitDraft();
            }}
            maxLength={200}
            placeholder="Add a task"
            aria-label="Add a task"
            className="flex-1"
          />
          <button
            type="button"
            onClick={submitDraft}
            disabled={!draft.trim() || busy}
            aria-label="Add task"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
          >
            {busy ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default WfhTaskPanel;
