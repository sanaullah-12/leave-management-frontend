import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import InlineLoader from "./InlineLoader";

export type StepStatus = "done" | "active" | "pending";

export interface ProgressStep {
  label: string;
  status: StepStatus;
}

interface StepProgressProps {
  steps: ProgressStep[];
  /** 0–100. If omitted, the bar animates indeterminately. */
  progress?: number;
  /** e.g. "about 10s remaining" */
  eta?: string;
  title?: string;
  className?: string;
}

/**
 * Premium multi-step progress for long operations: animated bar + a checklist
 * that ticks off completed steps. Use for exports, syncs, bulk operations.
 */
const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  progress,
  eta,
  title = "Working on it…",
  className = "",
}) => {
  const determinate = typeof progress === "number";
  const pct = Math.max(0, Math.min(100, progress ?? 0));

  return (
    <div
      className={`w-full max-w-md rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/60 p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {eta && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{eta}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-700/60">
        {determinate ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <span className="animate-indeterminate bg-gradient-to-r from-blue-500 to-emerald-500" />
        )}
      </div>
      {determinate && (
        <p className="mt-1.5 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {Math.round(pct)}%
        </p>
      )}

      {/* Steps checklist */}
      <ul className="mt-4 space-y-2.5">
        {steps.map((step, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            {step.status === "done" ? (
              <CheckCircleIcon className="animate-pop-in h-5 w-5 flex-shrink-0 text-emerald-500" />
            ) : step.status === "active" ? (
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-blue-500">
                <InlineLoader />
              </span>
            ) : (
              <span className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-200 dark:border-gray-600" />
            )}
            <span
              className={
                step.status === "pending"
                  ? "text-gray-400 dark:text-gray-500"
                  : step.status === "active"
                  ? "font-medium text-gray-900 dark:text-gray-100"
                  : "text-gray-600 dark:text-gray-300"
              }
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StepProgress;
