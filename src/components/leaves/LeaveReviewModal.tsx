import React from "react";
import Modal from "../ui/Modal";
import Avatar from "../Avatar";
import InlineLoader from "../InlineLoader";
import { employeeOf, formatLeaveDate, type LeaveRow } from "./leaveParts";

/**
 * The desktop review dialog.
 *
 * One row expands into three blocks - who and when, what was asked for, what
 * was decided - so the reason and the decision behind it are read together.
 * The list previously split those across two separate eye-icon popups, which
 * meant opening one to find out what the other was answering.
 */

interface Props {
  leave: LeaveRow | null;
  onClose: () => void;
  isAdmin: boolean;
  isBusy?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

/** Tint, label and fallback copy for the decision block, per status. */
const DECISION = {
  rejected: {
    label: "Rejection reason",
    empty: "No rejection reason was provided.",
    panel:
      "bg-red-50/80 ring-red-100 dark:bg-red-500/5 dark:ring-red-500/15",
    heading: "text-red-600 dark:text-red-400",
    pill:
      "bg-red-50 text-red-600 ring-red-200/70 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
    dot: "bg-red-500",
    text: "Rejected",
  },
  approved: {
    label: "Approval note",
    empty: "No note was added.",
    panel:
      "bg-emerald-50/80 ring-emerald-100 dark:bg-emerald-500/5 dark:ring-emerald-500/15",
    heading: "text-emerald-700 dark:text-emerald-400",
    pill:
      "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    dot: "bg-emerald-500",
    text: "Approved",
  },
  pending: {
    label: "Decision",
    empty: "Awaiting review.",
    panel:
      "bg-amber-50/80 ring-amber-100 dark:bg-amber-500/5 dark:ring-amber-500/15",
    heading: "text-amber-700 dark:text-amber-500",
    pill:
      "bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    dot: "bg-amber-500",
    text: "Pending",
  },
} as const;

const LeaveReviewModal: React.FC<Props> = ({
  leave,
  onClose,
  isAdmin,
  isBusy = false,
  onApprove,
  onReject,
}) => {
  // Held open through the exit animation: reading `leave` after the parent has
  // cleared it would blank the panel a frame before it finishes leaving.
  const [shown, setShown] = React.useState<LeaveRow | null>(leave);
  React.useEffect(() => {
    if (leave) setShown(leave);
  }, [leave]);

  const row = leave || shown;
  if (!row) return null;

  const employee = employeeOf(row);
  const status = (row.status || "pending").toLowerCase();
  const tone = DECISION[status as keyof typeof DECISION] || DECISION.pending;
  const pending = status === "pending";

  return (
    <Modal
      open={Boolean(leave)}
      onClose={onClose}
      size="md"
      icon={
        <Avatar
          src={employee.profilePicture}
          name={employee.name || "Unknown"}
          size="md"
        />
      }
      iconClassName="bg-transparent"
      title={employee.name || "Unknown"}
      description={[
        employee.employeeId,
        row.leaveType,
        `${row.totalDays} ${row.totalDays === 1 ? "day" : "days"}`,
      ]
        .filter(Boolean)
        .join(" · ")}
      footer={
        <>
          {isAdmin && pending && (
            <>
              <button
                onClick={() => onReject(row._id)}
                disabled={isBusy}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-red-600 ring-1 ring-inset ring-red-200/70 transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:ring-red-500/30 dark:hover:bg-red-500/10"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(row._id)}
                disabled={isBusy}
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 disabled:opacity-70"
              >
                {isBusy ? <InlineLoader label="Approving..." /> : "Approve"}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="rounded-full px-3.5 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </>
      }
    >
      <div className="flex items-center justify-between gap-4 pb-1">
        <span className="text-overline text-gray-400 dark:text-gray-500">
          Leave window
        </span>
        <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
          {formatLeaveDate(row.startDate)}
          <span className="mx-2 text-gray-300 dark:text-gray-600">&rarr;</span>
          {formatLeaveDate(row.endDate)}
        </span>
      </div>

      <div className="mt-3 rounded-2xl bg-blue-50/70 p-4 ring-1 ring-inset ring-blue-100 dark:bg-blue-500/5 dark:ring-blue-500/15">
        <p className="text-overline text-blue-700 dark:text-blue-400">
          Leave reason
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          {row.reason?.trim() || "No reason was provided."}
        </p>
      </div>

      <div className={`mt-3 rounded-2xl p-4 ring-1 ring-inset ${tone.panel}`}>
        <div className="flex items-center justify-between gap-3">
          <p className={`text-overline ${tone.heading}`}>{tone.label}</p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${tone.pill}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {tone.text}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          {row.reviewComments?.trim() || tone.empty}
        </p>
      </div>
    </Modal>
  );
};

export default LeaveReviewModal;
