import React from "react";
import {
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import WfhStatusBadge from "./WfhStatusBadge";
import { CARD } from "../../lib/surfaces";
import { formatPlannedWindow } from "./sessionFormat";
import type { WfhRequest } from "../../hooks/useWorkFromHome";

/**
 * The request list.
 *
 * One table for both roles - an admin sees who asked and gets the decision
 * buttons, an employee sees their own history and can withdraw something still
 * pending. Splitting it in two would have meant maintaining the same columns
 * twice.
 *
 * A row opens the request's report. The buttons in the last column stop the
 * click from reaching the row, so approving something never also opens it - a
 * drawer sliding out over a decision that has just been made reads as an
 * error, not as a confirmation.
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

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatRange = (request: WfhRequest) => {
  const from = formatDate(request.startDate);
  const to = formatDate(request.endDate);
  return from === to ? from : `${from} - ${to}`;
};

/**
 * The way in to a request's report, for rows with no decision left to make.
 *
 * The row has been the control all along; this is what says so. Absent when the
 * table has nowhere to open, which is how it renders wherever no drawer is
 * mounted.
 */
const ViewReport: React.FC<{
  request: WfhRequest;
  onOpen?: (request: WfhRequest) => void;
}> = ({ request, onOpen }) =>
  onOpen ? (
    <button
      type="button"
      onClick={() => onOpen(request)}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
    >
      View report
      <ChevronRightIcon className="h-3.5 w-3.5" />
    </button>
  ) : (
    <span className="text-xs text-gray-400">-</span>
  );

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
              {formatRange(request)}
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
  const head =
    "whitespace-nowrap border-b border-gray-100 bg-gray-50/70 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300";
  const cell = "border-b border-gray-100 px-4 py-3 dark:border-gray-700";
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
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr>
              {showEmployee && <th className={head}>Employee</th>}
              <th className={head}>Dates</th>
              <th className={head}>Days</th>
              <th className={head}>Reason</th>
              <th className={head}>Status</th>
              <th className={`${head} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: columns }).map((__, j) => (
                    <td key={j} className={cell}>
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
              requests.map((request) => {
                const employee = employeeOf(request);
                const busy = busyId === request._id;

                return (
                  <tr
                    key={request._id}
                    onClick={onOpen ? () => onOpen(request) : undefined}
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                      onOpen ? "cursor-pointer" : ""
                    }`}
                  >
                    {showEmployee && (
                      <td className={cell}>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {employee?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {employee?.employeeId || "-"}
                          {employee?.department ? ` - ${employee.department}` : ""}
                        </p>
                      </td>
                    )}
                    <td className={cell}>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatRange(request)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Requested {formatDate(request.createdAt)}
                      </p>
                      {request.plannedStartTime && request.plannedEndTime && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Planned{" "}
                          {formatPlannedWindow(
                            request.plannedStartTime,
                            request.plannedEndTime
                          )}
                        </p>
                      )}
                      {request.isBackdated && (
                        <span
                          className="mt-1 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                          title="Raised after the days had passed - approving corrects the attendance record"
                        >
                          <ExclamationTriangleIcon className="h-3 w-3" />
                          Backdated
                        </span>
                      )}
                    </td>
                    <td
                      className={`${cell} text-sm text-gray-700 dark:text-gray-200`}
                    >
                      {request.totalDays}
                    </td>
                    <td className={cell}>
                      <p className="max-w-[280px] text-sm text-gray-700 dark:text-gray-200">
                        {request.reason}
                      </p>
                      {request.note && (
                        <p className="mt-0.5 max-w-[280px] text-xs text-gray-500 dark:text-gray-400">
                          {request.note}
                        </p>
                      )}
                      {/* What they said they would work on. Shown to the
                          reviewer because a day of named work is a different
                          request from a day of unnamed work, and this is the
                          screen where that judgement is made. */}
                      {request.plannedTasks &&
                        request.plannedTasks.length > 0 && (
                          <ul className="mt-1.5 max-w-[280px] space-y-0.5">
                            {request.plannedTasks.map((task, index) => (
                              <li
                                key={`${task}-${index}`}
                                className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400"
                              >
                                <span
                                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600"
                                  aria-hidden="true"
                                />
                                <span className="min-w-0 flex-1">{task}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                    </td>
                    <td className={cell}>
                      <WfhStatusBadge status={request.status} />
                      {request.status !== "pending" &&
                        request.reviewComments && (
                          <p className="mt-1 max-w-[220px] text-xs text-gray-500 dark:text-gray-400">
                            {request.reviewComments}
                          </p>
                        )}
                    </td>
                    <td
                      className={`${cell} text-right`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {busy ? (
                        <ArrowPathIcon className="ml-auto h-4 w-4 animate-spin text-gray-400" />
                      ) : request.status !== "pending" ? (
                        <ViewReport request={request} onOpen={onOpen} />
                      ) : onReview ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onReview(request, "approved")}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onReview(request, "rejected")}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : onCancel ? (
                        <button
                          type="button"
                          onClick={() => onCancel(request)}
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <NoSymbolIcon className="h-3.5 w-3.5" />
                          Withdraw
                        </button>
                      ) : (
                        <ViewReport request={request} onOpen={onOpen} />
                      )}
                    </td>
                  </tr>
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
