import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  XMarkIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
import type { DayRow } from "./DayTable";

/**
 * Slide-over for a single day.
 *
 * Everything here comes from the punch the page already fetched, so the
 * verdict in the panel is the same verdict the row shows, judged by the same
 * rule. Nothing is recalculated on the way in.
 */

interface Props {
  row: DayRow;
  /** The lateTimePolicy the records were judged under. */
  policy: any;
  /** Where the punch came from, for the provenance line. */
  source?: string;
  onClose: () => void;
}

const ACCENT = "rgb(var(--blue-600))";
const LATE_TONE = "#b45309";

/** "HH:MM" or "HH:MM:SS" to minutes past midnight. */
const toMinutes = (value?: string) => {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

const DayDrawer: React.FC<Props> = ({ row, policy, source, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const record = row.record;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // The page behind must not scroll while a modal layer is open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

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

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-gray-900/60 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-drawer-title"
        className="flex h-full w-[440px] max-w-[92vw] flex-col bg-white shadow-2xl dark:bg-gray-800"
      >
        {/* Head */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <div className="min-w-0">
            <p
              id="day-drawer-title"
              className="truncate text-[15px] font-semibold text-gray-900 dark:text-gray-100"
            >
              {row.dateDisplay}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {row.weekday}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={row.status} />
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close panel"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {/* Arrival */}
          <section className="border-b border-gray-100 py-4 dark:border-gray-700">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Arrival
            </h3>

            {record ? (
              <>
                {timeline && (
                  <div className="mb-4">
                    <div className="relative mb-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600">
                      <div
                        className="absolute top-0 h-full rounded-full"
                        style={{
                          left: 0,
                          width: `${timeline.arrivalPct}%`,
                          background: timeline.isLate ? LATE_TONE : ACCENT,
                        }}
                      />
                      {/* The rule the verdict was made against. */}
                      <div
                        className="absolute -top-1 h-3.5 w-0.5 bg-gray-400"
                        style={{ left: `${timeline.cutoffPct}%` }}
                        title={`Cutoff ${policy?.cutoffTime}`}
                      />
                      <div
                        className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 bg-white dark:bg-gray-800"
                        style={{
                          left: `${timeline.arrivalPct}%`,
                          borderColor: timeline.isLate ? LATE_TONE : ACCENT,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>{timeline.fromLabel}</span>
                      <span>cutoff {policy?.cutoffTime}</span>
                      <span>{timeline.toLabel}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-700/40">
                    <ArrowRightOnRectangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Arrived
                      </p>
                      <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                        {row.arrival || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-700/40">
                    <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Cutoff
                      </p>
                      <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                        {policy?.cutoffTime || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-700/40">
                    <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {record.isLate ? "Late by" : "Margin"}
                      </p>
                      <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                        {record.isLate
                          ? record.lateDisplay || "-"
                          : "On time"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {row.workMode === "work_from_home"
                  ? "An approved work from home day. It counts as a working day and uses none of your leave balance, so no office punch is expected."
                  : row.workMode === "on_leave"
                  ? "An approved leave day. No punch is expected and none counts against this day."
                  : row.isWeekend
                  ? "A non-working day. No punch is expected, and none counts against this day."
                  : "No punch was recorded on this day. The device cannot tell leave, another site, or an unenrolled worker apart from an absence."}
              </p>
            )}
          </section>

          {/* Record detail */}
          {record && (
            <section className="border-b border-gray-100 py-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Record
              </h3>
              <dl className="space-y-2">
                {detail.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-3 text-[13px]"
                  >
                    <dt className="shrink-0 text-gray-500 dark:text-gray-400">
                      {item.label}
                    </dt>
                    <dd className="min-w-0 break-all text-right font-medium text-gray-900 dark:text-gray-100">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* The rule this day was judged under */}
          <section className="py-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Rule applied
            </h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">
                  Arrival time
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {policy?.cutoffTime || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Policy</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {policy?.policy || "-"}
                </span>
              </div>
              {source && (
                <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
                  <ServerIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>Read from {source}</span>
                </div>
              )}
              {policy?.isPreview && (
                <p className="pt-1 text-xs text-amber-700 dark:text-amber-400">
                  A comparison view. The official arrival time is{" "}
                  {policy.officialCutoffTime}.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DayDrawer;
