import React from "react";
import { motion } from "framer-motion";
import useListRowMotion from "../../hooks/useListRowMotion";
import {
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import WfhStatusBadge from "./WfhStatusBadge";
import Avatar from "../Avatar";
import { CARD } from "../../lib/surfaces";
import { formatRequestRange, previewReason } from "../../lib/requestList";
import { formatPlannedWindow } from "./sessionFormat";
import type { WfhRequest } from "../../hooks/useWorkFromHome";

/**
 * The request list.
 *
 * One table for both roles - an admin sees who asked, an employee sees their
 * own history and can withdraw something still pending. Splitting it in two
 * would have meant maintaining the same columns twice.
 *
 * A row carries two words of a reason and opens the request's report; the
 * decision is taken in that report rather than from the row, because a row is
 * not enough to decide on. The buttons in the last column stop the click from
 * reaching the row, so withdrawing something never also opens it.
 *
 * Below `lg` the table is not rendered at all. Six columns need 760px, and on
 * a 390px screen that is a sideways scroll through a grid where no single
 * screenful holds both a name and its decision buttons - which is the one
 * pairing the admin view exists for. The same records render as cards instead:
 * the dates and the status lead, the detail that filled the middle columns
 * moves into the request's own report a tap away, and the decision sits at the
 * foot of the card as a full-width pair of buttons.
 */

interface Props {
  requests: WfhRequest[];
  loading?: boolean;
  /** Admin view: show the employee column and the approve/reject actions. */
  showEmployee?: boolean;
  onReview?: (request: WfhRequest, status: "approved" | "rejected") => void;
  onCancel?: (request: WfhRequest) => void;
  /** Opens the request's own report. The whole row is the control. */
  onOpen?: (request: WfhRequest) => void;
  /** Id of the request currently being acted on, so its row can show it. */
  busyId?: string | null;
  emptyMessage?: string;
}

/* The same column heading and row tint the leave request list uses, so the
   two queues an admin works through in the same sitting read as one. */
const TH =
  "px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";
const ROW =
  "bg-blue-50/40 transition-colors hover:bg-blue-50/80 dark:bg-blue-500/[0.04] dark:hover:bg-blue-500/[0.09]";

const employeeOf = (request: WfhRequest) =>
  typeof request.employee === "object" && request.employee
    ? request.employee
    : null;

/** Approve / Reject / Withdraw, sized for a thumb. */
const MobileActions: React.FC<{
  request: WfhRequest;
  busy: boolean;
  onReview?: (request: WfhRequest, status: "approved" | "rejected") => void;
  onCancel?: (request: WfhRequest) => void;
}> = ({ request, busy, onReview, onCancel }) => {
  if (busy) {
    return (
      <div className="flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-gray-500">
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
        Saving
      </div>
    );
  }

  if (request.status === "pending" && onReview) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onReview(request, "rejected")}
          className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-[13px] font-semibold text-red-700 transition-transform active:scale-[0.98] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
        >
          <XMarkIcon className="h-4 w-4" />
          Reject
        </button>
        <button
          type="button"
          onClick={() => onReview(request, "approved")}
          className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-[13px] font-semibold text-emerald-700 transition-transform active:scale-[0.98] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
        >
          <CheckIcon className="h-4 w-4" />
          Approve
        </button>
      </div>
    );
  }

  if (request.status === "pending" && onCancel) {
    return (
      <button
        type="button"
        onClick={() => onCancel(request)}
        className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 transition-transform active:scale-[0.98] dark:border-white/10 dark:text-gray-300"
      >
        <NoSymbolIcon className="h-4 w-4" />
        Withdraw request
      </button>
    );
  }

  return null;
};

/**
 * One request as a card.
 *
 * The card itself opens the report, so everything that filled the Reason and
 * Days columns can stay out of the list: what a phone screen has to show is
 * which days, for whom, and what state the request is in.
 */
const MobileRequestCard: React.FC<{
  request: WfhRequest;
  showEmployee: boolean;
  busy: boolean;
  onReview?: (request: WfhRequest, status: "approved" | "rejected") => void;
  onCancel?: (request: WfhRequest) => void;
  onOpen?: (request: WfhRequest) => void;
}> = ({ request, showEmployee, busy, onReview, onCancel, onOpen }) => {
  const employee = employeeOf(request);
  const actionable =
    request.status === "pending" && Boolean(onReview || onCancel);

  return (
    <div
      className={`overflow-hidden ${CARD} ${
        request.isBackdated ? "border-s-[3px] border-s-amber-400" : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpen ? () => onOpen(request) : undefined}
        disabled={!onOpen}
        className="press-scale block w-full px-4 pb-3 pt-3.5 text-start disabled:cursor-default"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {showEmployee && (
              <p className="truncate text-[15px] font-bold leading-tight tracking-[-0.01em] text-gray-900 dark:text-white">
                {employee?.name || "Unknown"}
              </p>
            )}
            <p
              className={`truncate ${
                showEmployee
                  ? "mt-0.5 text-[13px] text-gray-500 dark:text-gray-400"
                  : "text-[15px] font-bold leading-tight tracking-[-0.01em] text-gray-900 dark:text-white"
              }`}
            >
              {formatRequestRange(request.startDate, request.endDate)}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-gray-400 dark:text-gray-500">
              {request.totalDays} {request.totalDays === 1 ? "day" : "days"}
              {request.plannedStartTime && request.plannedEndTime
                ? ` - ${formatPlannedWindow(
                    request.plannedStartTime,
                    request.plannedEndTime
                  )}`
                : ""}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <WfhStatusBadge status={request.status} />
            {request.isBackdated && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Backdated
              </span>
            )}
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-gray-600 dark:text-gray-300">
          {request.reason}
        </p>

        {request.status !== "pending" && request.reviewComments && (
          <p className="mt-1 line-clamp-2 text-[12px] text-gray-400 dark:text-gray-500">
            {request.reviewComments}
          </p>
        )}

        {onOpen && (
          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 dark:text-blue-400">
            View report
            <ChevronRightIcon className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </span>
        )}
      </button>

      {(actionable || busy) && (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-white/10">
          <MobileActions
            request={request}
            busy={busy}
            onReview={onReview}
            onCancel={onCancel}
          />
        </div>
      )}
    </div>
  );
};

const WfhRequestTable: React.FC<Props> = ({
  requests,
  loading = false,
  showEmployee = false,
  onReview,
  onCancel,
  onOpen,
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
              <div key={i} className={`h-[104px] animate-pulse ${CARD}`} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className={`px-6 py-10 text-center ${CARD}`}>
            <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
              Nothing here yet.
            </p>
            <p className="mx-auto mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
              {emptyMessage ||
                "Work from home requests will appear in this list."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((request) => (
              <MobileRequestCard
                key={request._id}
                request={request}
                showEmployee={showEmployee}
                busy={busyId === request._id}
                onReview={onReview}
                onCancel={onCancel}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------------- Desktop ---------------- */}
      <div className={`hidden overflow-hidden lg:block ${CARD}`}>
        <div className="table-scroll">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                {showEmployee && <th className={TH}>Employee</th>}
                <th className={TH}>Dates</th>
                <th className={TH}>Days</th>
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
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={columns} className="px-4 py-16 text-center">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Nothing here yet.
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {emptyMessage ||
                        "Work from home requests will appear in this list."}
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((request, i) => {
                  const employee = employeeOf(request);
                  const busy = busyId === request._id;

                  return (
                    <motion.tr
                      key={request._id}
                      {...listRow(i)}
                      onClick={onOpen ? () => onOpen(request) : undefined}
                      className={`${ROW} ${onOpen ? "cursor-pointer" : ""}`}
                    >
                      {showEmployee && (
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={employee?.name || "Unknown"}
                              size="md"
                              className="flex-shrink-0"
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                                {employee?.name || "Unknown"}
                              </span>
                              <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {employee?.employeeId || "-"}
                                {employee?.department
                                  ? ` · ${employee.department}`
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* The span on one line. Everything the middle columns
                          used to stack - when it was requested, the planned
                          window, the note, the task list - is in the report
                          the row opens, where it is read rather than skimmed. */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                          {formatRequestRange(
                            request.startDate,
                            request.endDate
                          )}
                        </span>
                        {request.isBackdated && (
                          <span
                            className="mt-1 flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25"
                            title="Raised after the days had passed - approving corrects the attendance record"
                          >
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            Backdated
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                          {request.totalDays}{" "}
                          {request.totalDays === 1 ? "day" : "days"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          title={request.reason}
                          className="inline-flex max-w-[13rem] items-center gap-2 rounded-full bg-blue-50/80 px-3 py-1.5 ring-1 ring-inset ring-blue-100 dark:bg-blue-500/10 dark:ring-blue-500/15"
                        >
                          <ChatBubbleBottomCenterTextIcon className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400" />
                          <span className="min-w-0 truncate text-sm text-blue-900 dark:text-blue-100">
                            {previewReason(request.reason)}
                          </span>
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <WfhStatusBadge status={request.status} dot />
                      </td>

                      <td
                        className="whitespace-nowrap px-6 py-4 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {busy ? (
                          <ArrowPathIcon className="ml-auto h-4 w-4 animate-spin text-gray-400" />
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {request.status === "pending" && onCancel && (
                              <button
                                type="button"
                                onClick={() => onCancel(request)}
                                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700"
                              >
                                <NoSymbolIcon className="h-3.5 w-3.5" />
                                Withdraw
                              </button>
                            )}
                            {onOpen && (
                              <button
                                type="button"
                                onClick={() => onOpen(request)}
                                className="inline-flex items-center rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default WfhRequestTable;
