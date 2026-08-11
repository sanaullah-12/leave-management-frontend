import React, { useMemo } from "react";
import {
  ArrowPathIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { InitialsTile, employeeOf, toneFor, type LeaveRow } from "./leaveParts";

/**
 * MobileLeaveList
 * ---------------
 * The phone layout for Leave Requests.
 *
 * The list is a thin index, not a stack of full records: each row carries only
 * what is needed to pick one out - who filed it, what kind of leave, and
 * whether it still needs a decision (the amber left edge). Everything else -
 * the month rail, the reason, the balance, the progress - lives in the detail
 * sheet a tap away.
 *
 * That split is the point. Putting the whole request in every row meant one
 * card filled half the screen and scanning six requests took six screens.
 *
 * Rendered only under `lg`; the desktop table is untouched.
 */

interface Props {
  leaves: LeaveRow[];
  /** Server-side status filter currently applied ("" = all). */
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpen: (leave: LeaveRow) => void;
}

const EMPTY_COPY: Record<string, [string, string]> = {
  pending: ["You are all caught up", "New requests appear here the moment someone files one."],
  approved: ["Nothing approved yet", "Approved leave shows up here and on the team calendar."],
  rejected: ["Nothing declined", "Requests you turn down land here, along with the note you sent back."],
  "": ["No leave requests", "Nothing has been filed yet."],
};

const MobileLeaveList: React.FC<Props> = ({
  leaves,
  selectedStatus,
  onSelectStatus,
  onRefresh,
  isRefreshing,
  onOpen,
}) => {
  // Counts are only trustworthy when the server returned an unfiltered page.
  // Under an active filter the list holds a single status, so the other chips
  // would read zero - a badge there would be inventing a number.
  const counts = useMemo(() => {
    if (selectedStatus !== "") return null;
    const by: Record<string, number> = { "": leaves.length };
    for (const l of leaves) by[l.status] = (by[l.status] || 0) + 1;
    return by;
  }, [leaves, selectedStatus]);

  const pendingCount = counts ? counts.pending || 0 : null;

  const filters = [
    { key: "", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  const [emptyTitle, emptyBody] = EMPTY_COPY[selectedStatus] || EMPTY_COPY[""];

  return (
    <div className="lg:hidden">
      {/* What needs attention is the useful fact here - the app bar already
          carries the screen name. */}
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-gray-900 dark:text-white">
            Leave requests
          </h2>
          {pendingCount !== null && (
            <div className="mt-1.5 flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400">
              <span
                className={`h-[7px] w-[7px] rounded-full ${
                  pendingCount > 0
                    ? "bg-amber-500 ring-4 ring-amber-500/15"
                    : "bg-emerald-500 ring-4 ring-emerald-500/15"
                }`}
              />
              {pendingCount > 0
                ? `${pendingCount} waiting on you`
                : "Nothing waiting on you"}
            </div>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh requests"
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl border border-gray-200 bg-[var(--card-surface)] text-gray-500 transition-colors active:bg-black/5 disabled:opacity-60 dark:border-white/10 dark:text-gray-400 dark:active:bg-white/10"
        >
          <ArrowPathIcon
            className={`h-[17px] w-[17px] ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Chips scroll horizontally so they never wrap or shrink below a
          tappable size. */}
      <div className="-mx-3 mb-3.5 flex gap-2 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => {
          const active = selectedStatus === f.key;
          const count = counts ? counts[f.key] ?? 0 : null;
          return (
            <button
              key={f.key}
              onClick={() => onSelectStatus(f.key)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                active
                  ? "border-transparent text-white"
                  : "border-gray-200 bg-[var(--card-surface)] text-gray-500 dark:border-white/10 dark:text-gray-400"
              }`}
              style={active ? { backgroundColor: "var(--accent)" } : undefined}
            >
              {f.label}
              {count !== null && (
                <span
                  className={`rounded-md px-1.5 py-px text-[11px] font-bold tabular-nums ${
                    active
                      ? "bg-black/20 text-white"
                      : "bg-black/5 text-gray-400 dark:bg-white/10 dark:text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {leaves.length === 0 ? (
        <div className="px-6 pt-12 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[20px] border border-gray-200 bg-[var(--card-surface)] text-gray-400 dark:border-white/10 dark:text-gray-500">
            <InboxIcon className="h-6 w-6" />
          </div>
          <h4 className="text-[16px] font-bold text-gray-900 dark:text-white">
            {emptyTitle}
          </h4>
          <p className="mx-auto mt-2 max-w-[16rem] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
            {emptyBody}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {leaves.map((leave) => {
            const emp = employeeOf(leave);
            const tone = toneFor(leave.leaveType);
            const isPending = leave.status === "pending";

            return (
              <button
                key={leave._id}
                type="button"
                onClick={() => onOpen(leave)}
                className="relative w-full overflow-hidden rounded-[18px] border border-gray-200 bg-[var(--card-surface)] px-4 pb-3.5 pt-4 text-left transition-colors active:bg-black/[0.02] dark:border-white/10 dark:active:bg-white/[0.03]"
              >
                {/* Left edge marks a request that still needs a decision. */}
                {isPending && (
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-amber-500" />
                )}

                <div className="flex items-center gap-3">
                  <InitialsTile name={emp.name} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-bold leading-tight tracking-[-0.01em] text-gray-900 dark:text-white">
                      {emp.name}
                    </h3>
                    <p className="mt-[3px] text-[11px] tracking-wide text-gray-400 dark:text-gray-500">
                      ID {emp.employeeId || "-"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-[5px] text-[11px] font-bold capitalize ${tone.tag}`}
                  >
                    {leave.leaveType}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MobileLeaveList;
