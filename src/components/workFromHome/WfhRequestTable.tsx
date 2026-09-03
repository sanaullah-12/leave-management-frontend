import React from "react";
import {
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import WfhStatusBadge from "./WfhStatusBadge";
import { CARD } from "../../lib/surfaces";
import type { WfhRequest } from "../../hooks/useWorkFromHome";

/**
 * The request list.
 *
 * One table for both roles - an admin sees who asked and gets the decision
 * buttons, an employee sees their own history and can withdraw something still
 * pending. Splitting it in two would have meant maintaining the same columns
 * twice.
 */

interface Props {
  requests: WfhRequest[];
  loading?: boolean;
  /** Admin view: show the employee column and the approve/reject actions. */
  showEmployee?: boolean;
  onReview?: (request: WfhRequest, status: "approved" | "rejected") => void;
  onCancel?: (request: WfhRequest) => void;
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

const employeeOf = (request: WfhRequest) =>
  typeof request.employee === "object" && request.employee
    ? request.employee
    : null;

const WfhRequestTable: React.FC<Props> = ({
  requests,
  loading = false,
  showEmployee = false,
  onReview,
  onCancel,
  busyId = null,
  emptyMessage,
}) => {
  const head =
    "whitespace-nowrap border-b border-gray-100 bg-gray-50/70 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300";
  const cell = "border-b border-gray-100 px-4 py-3 dark:border-gray-700";
  const columns = showEmployee ? 6 : 5;

  return (
    <div className={`overflow-hidden ${CARD}`}>
      <div className="overflow-x-auto">
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
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
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
                    <td className={`${cell} text-right`}>
                      {busy ? (
                        <ArrowPathIcon className="ml-auto h-4 w-4 animate-spin text-gray-400" />
                      ) : request.status !== "pending" ? (
                        <span className="text-xs text-gray-400">-</span>
                      ) : onReview ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onReview(request, "approved")}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onReview(request, "rejected")}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : onCancel ? (
                        <button
                          type="button"
                          onClick={() => onCancel(request)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <NoSymbolIcon className="h-3.5 w-3.5" />
                          Withdraw
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
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
  );
};

export default WfhRequestTable;
