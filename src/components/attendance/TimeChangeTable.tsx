import React from "react";
import { motion } from "framer-motion";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CheckIcon,
  NoSymbolIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import useListRowMotion from "../../hooks/useListRowMotion";
import WfhStatusBadge from "../workFromHome/WfhStatusBadge";
import Avatar from "../Avatar";
import { CARD } from "../../lib/surfaces";
import type { TimeChangeRequest } from "../../hooks/useTimeChanges";

/**
 * Time change requests, as a table on desktop and as cards below `lg`.
 *
 * The comparison an approver makes is machine time against requested time, so
 * those two sit side by side with the reason next to them. Approve and reject
 * are on the row itself: there is nothing further to read before deciding.
 */

type Review = (request: TimeChangeRequest, status: "approved" | "rejected") => void;

interface Props {
  requests: TimeChangeRequest[];
  loading?: boolean;
  /** Admin view: employee column plus approve / reject. */
  showEmployee?: boolean;
  onReview?: Review;
  onCancel?: (request: TimeChangeRequest) => void;
  busyId?: string | null;
  emptyMessage?: string;
}

const TH =
  "px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";
const ROW =
  "bg-blue-50/40 transition-colors hover:bg-blue-50/80 dark:bg-blue-500/[0.04] dark:hover:bg-blue-500/[0.09]";

const lateLabel = (request: TimeChangeRequest) => {
  const minutes = request.judgedAgainst?.lateMinutes || 0;
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const span = hours ? `${hours}h${rest ? ` ${rest}m` : ""}` : `${rest}m`;
  return `${span} late`;
};

/** Machine time, an arrow, the requested time. The comparison being made. */
const TimePair: React.FC<{ request: TimeChangeRequest }> = ({ request }) => (
  <div className="flex items-center gap-2 text-sm tabular-nums">
    <span className="text-gray-500 line-through decoration-gray-300 dark:text-gray-400 dark:decoration-gray-600">
      {request.machineCheckInDisplay}
    </span>
    <ArrowRightIcon className="h-3.5 w-3.5 flex-none text-gray-400" />
    <span className="font-semibold text-gray-900 dark:text-gray-100">
      {request.requestedCheckInDisplay}
    </span>
  </div>
);

const Actions: React.FC<{
  request: TimeChangeRequest;
  busy: boolean;
  onReview?: Review;
  onCancel?: (request: TimeChangeRequest) => void;
  stacked?: boolean;
}> = ({ request, busy, onReview, onCancel, stacked = false }) => {
  if (busy) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-500">
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
        Saving
      </span>
    );
  }
  if (request.status !== "pending") return null;

  const base = stacked
    ? "flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border text-[13px] font-semibold"
    : "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold";

  if (onReview) {
    return (
      <div className={stacked ? "grid grid-cols-2 gap-2" : "flex items-center justify-end gap-2"}>
        <button
          type="button"
          onClick={() => onReview(request, "rejected")}
          className={`${base} border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400`}
        >
          <XMarkIcon className="h-4 w-4" />
          Reject
        </button>
        <button
          type="button"
          onClick={() => onReview(request, "approved")}
          className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400`}
        >
          <CheckIcon className="h-4 w-4" />
          Approve
        </button>
      </div>
    );
  }

  if (onCancel) {
    return (
      <button
        type="button"
        onClick={() => onCancel(request)}
        className={`${base} ${
          stacked ? "w-full" : ""
        } border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-gray-700`}
      >
        <NoSymbolIcon className="h-4 w-4" />
        Withdraw
      </button>
    );
  }

  return null;
};

const Empty: React.FC<{ message?: string }> = ({ message }) => (
  <>
    <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
      Nothing here yet.
    </p>
    <p className="mx-auto mt-1.5 max-w-[20rem] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
      {message || "Time change requests will appear in this list."}
    </p>
  </>
);

const TimeChangeTable: React.FC<Props> = ({
  requests,
  loading = false,
  showEmployee = false,
  onReview,
  onCancel,
  busyId = null,
  emptyMessage,
}) => {
  const listRow = useListRowMotion(true);
  const columns = showEmployee ? 6 : 5;

  return (
    <>
      {/* ---------------- Phones and small tablets ---------------- */}
      <div className="lg:hidden">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`h-[120px] animate-pulse ${CARD}`} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className={`px-6 py-10 text-center ${CARD}`}>
            <Empty message={emptyMessage} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((request) => {
              const busy = busyId === request.id;
              const actionable =
                request.status === "pending" && Boolean(onReview || onCancel);
              return (
                <div key={request.id} className={`overflow-hidden ${CARD}`}>
                  <div className="px-4 pb-3 pt-3.5">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        {showEmployee && (
                          <p className="truncate text-[15px] font-bold leading-tight text-gray-900 dark:text-white">
                            {request.employee?.name || "Unknown"}
                          </p>
                        )}
                        <p
                          className={`truncate ${
                            showEmployee
                              ? "mt-0.5 text-[13px] text-gray-500 dark:text-gray-400"
                              : "text-[15px] font-bold leading-tight text-gray-900 dark:text-white"
                          }`}
                        >
                          {request.dateDisplay}
                        </p>
                      </div>
                      <WfhStatusBadge status={request.status} />
                    </div>
                    <div className="mt-2">
                      <TimePair request={request} />
                    </div>
                    <p className="mt-2 line-clamp-3 text-[13px] leading-snug text-gray-600 dark:text-gray-300">
                      {request.reason}
                    </p>
                    {request.status !== "pending" && request.reviewComments && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-gray-400 dark:text-gray-500">
                        {request.reviewComments}
                      </p>
                    )}
                  </div>
                  {(actionable || busy) && (
                    <div className="border-t border-gray-100 px-4 py-3 dark:border-white/10">
                      <Actions
                        request={request}
                        busy={busy}
                        onReview={onReview}
                        onCancel={onCancel}
                        stacked
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- Desktop ---------------- */}
      <div className={`hidden overflow-hidden lg:block ${CARD}`}>
        <div className="table-scroll">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                {showEmployee && <th className={TH}>Employee</th>}
                <th className={TH}>Date</th>
                <th className={TH}>Machine / Requested</th>
                <th className={TH}>Reason</th>
                <th className={TH}>Status</th>
                <th className={`${TH} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white dark:divide-gray-800/60">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className={ROW}>
                    {Array.from({ length: columns }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={columns} className="px-4 py-16 text-center">
                    <Empty message={emptyMessage} />
                  </td>
                </tr>
              ) : (
                requests.map((request, i) => (
                  <motion.tr key={request.id} {...listRow(i)} className={ROW}>
                    {showEmployee && (
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={request.employee?.name || "Unknown"}
                            size="md"
                            className="flex-shrink-0"
                          />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {request.employee?.name || "Unknown"}
                            </span>
                            <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {request.employeeCode}
                              {request.employee?.department
                                ? ` - ${request.employee.department}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {request.dateDisplay}
                      </span>
                      {lateLabel(request) && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          Marked {lateLabel(request)}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <TimePair request={request} />
                    </td>
                    <td className="max-w-[18rem] px-5 py-4">
                      <p
                        title={request.reason}
                        className="line-clamp-2 text-sm text-gray-700 dark:text-gray-200"
                      >
                        {request.reason}
                      </p>
                      {request.status !== "pending" && request.reviewComments && (
                        <p
                          title={request.reviewComments}
                          className="mt-0.5 line-clamp-1 text-xs text-gray-400 dark:text-gray-500"
                        >
                          Reviewer: {request.reviewComments}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <WfhStatusBadge status={request.status} dot />
                      {request.reviewedBy && request.status !== "pending" && (
                        <span className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">
                          by {request.reviewedBy.name}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <Actions
                        request={request}
                        busy={busyId === request.id}
                        onReview={onReview}
                        onCancel={onCancel}
                      />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TimeChangeTable;
