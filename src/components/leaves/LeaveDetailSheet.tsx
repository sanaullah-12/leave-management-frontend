import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import { leavesAPI } from "../../services/api";
import {
  InitialsTile,
  MonthRail,
  StatusPill,
  toneFor,
  type LeaveRow,
} from "./leaveParts";

/**
 * LeaveDetailSheet
 * ----------------
 * The full request, opened from a row in the mobile list.
 *
 * The list is deliberately a thin index - who, what kind - and everything
 * needed to actually decide lives here: the span, the reason, any attachment,
 * how much of the employee's balance is already spent, and where the request
 * has got to.
 *
 * Sections render only when their data exists. Nothing here is placeholder: an
 * absent attachment or an unreachable balance hides the block rather than
 * showing an empty frame, because a decision aid that might be fabricated is
 * worse than no decision aid.
 */

interface Props {
  leave: LeaveRow | null;
  onClose: () => void;
  isAdmin: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
    {children}
  </p>
);

const SURFACE =
  "rounded-[14px] border border-gray-200 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]";

const formatSize = (bytes?: number) => {
  if (!bytes) return null;
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
};

const formatStamp = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${d.toLocaleString("en-GB", { month: "short" })}, ${d.toLocaleTimeString(
    [],
    { hour: "numeric", minute: "2-digit" }
  )}`;
};

const LeaveDetailSheet: React.FC<Props> = ({
  leave,
  onClose,
  isAdmin,
  onApprove,
  onReject,
}) => {
  const employee =
    leave && typeof leave.employee === "object" ? leave.employee : null;
  const employeeId = employee?._id;

  // The balance is only meaningful for a named employee, and only worth
  // fetching while the sheet is actually open.
  const { data: balanceData } = useQuery({
    queryKey: ["leaveBalance", employeeId],
    queryFn: () => leavesAPI.getEmployeeLeaveBalance(employeeId as string),
    enabled: Boolean(leave && employeeId),
    staleTime: 60_000,
    retry: false,
  });

  if (!leave) return null;

  const tone = toneFor(leave.leaveType);
  const isPending = leave.status === "pending";
  const filed = formatStamp(leave.appliedDate || leave.createdAt);
  const decided = formatStamp(leave.reviewedDate);
  const reviewerName =
    leave.reviewedBy && typeof leave.reviewedBy === "object"
      ? leave.reviewedBy.name
      : undefined;

  const balances = (balanceData as any)?.data?.balances;
  const typeBalance = balances?.[leave.leaveType];
  const used = typeBalance?.used;
  const total = typeBalance?.total;
  const hasBalance =
    typeof used === "number" && typeof total === "number" && total > 0;
  const pct = hasBalance ? Math.min(100, Math.round((used / total) * 100)) : 0;

  const attachments = leave.attachments || [];

  return (
    <Modal open={Boolean(leave)} onClose={onClose} size="md" hideClose>
      {/* `hideClose` means there is no header above this, so the content would
          otherwise start immediately under the grab handle. */}
      {/* Explicit values rather than pt-6/pb-6: the mobile density layer in
          index.css compresses those utilities to 16px under 640px, which is
          the right default for cards but too tight against a sheet edge. */}
      <div className="px-4 pb-[22px] pt-[18px] sm:px-6">
        {/* Header mirrors the list row, plus when it was filed. */}
        <div className="flex items-center gap-3">
          <InitialsTile name={employee?.name} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[18px] font-bold leading-tight tracking-[-0.01em] text-gray-900 dark:text-white">
              {employee?.name || "Leave request"}
            </h3>
            <p className="mt-0.5 truncate text-[11px] tracking-wide text-gray-400 dark:text-gray-500">
              ID {employee?.employeeId || "-"}
              {filed && ` · Filed ${filed}`}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${tone.tag}`}
          >
            {leave.leaveType}
          </span>
        </div>

        <MonthRail leave={leave} />

        {leave.reason && (
          <div className="mt-6">
            <Label>Reason given</Label>
            <p className="text-[14px] leading-relaxed text-gray-800 dark:text-gray-200">
              {leave.reason}
            </p>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mt-6">
            <Label>Attached</Label>
            <div className="space-y-2">
              {attachments.map((file, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3.5 py-3 ${SURFACE}`}
                >
                  <DocumentTextIcon className="h-[18px] w-[18px] shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                      {file.originalName || file.filename || "Attachment"}
                    </span>
                    {formatSize(file.size) && (
                      <small className="mt-0.5 block text-[11px] text-gray-400 dark:text-gray-500">
                        {formatSize(file.size)}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasBalance && (
          <div className="mt-6">
            <Label>Before you decide</Label>
            <div className={`p-3.5 ${SURFACE}`}>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] capitalize text-gray-500 dark:text-gray-400">
                  {leave.leaveType} leave used this year
                </span>
                <b className="text-[15px] font-bold tabular-nums text-gray-900 dark:text-gray-100">
                  {used}/{total}
                </b>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: pct >= 100 ? "#f59e0b" : "var(--accent)",
                  }}
                />
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-400 dark:text-gray-500">
                {pct >= 100
                  ? "The allowance for this type is already spent."
                  : `${total - used} of ${total} days still available.`}
              </p>
            </div>
          </div>
        )}

        {/* Progress. Only steps the record can actually prove: when it was
            filed, and the decision if one has been made. */}
        <div className="mt-6">
          <Label>Progress</Label>
          <div className="flex flex-col">
            <div className="relative flex gap-3 pb-4">
              <span className="absolute bottom-0 left-[5px] top-3.5 w-px bg-gray-200 dark:bg-white/10" />
              <span
                className="mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2"
                style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--accent)",
                }}
              />
              <div>
                <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                  Requested
                </div>
                {filed && (
                  <small className="mt-0.5 block text-[11px] text-gray-400 dark:text-gray-500">
                    {filed}
                  </small>
                )}
              </div>
            </div>

            <div className="relative flex gap-3">
              <span
                className={`mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${
                  isPending
                    ? "border-amber-500 bg-amber-500"
                    : leave.status === "approved"
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-rose-500 bg-rose-500"
                }`}
              />
              <div>
                <div className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                  {isPending
                    ? isAdmin
                      ? "Waiting on you"
                      : "Waiting for review"
                    : `${leave.status === "approved" ? "Approved" : "Declined"}${
                        reviewerName ? ` by ${reviewerName}` : ""
                      }`}
                </div>
                <small className="mt-0.5 block text-[11px] text-gray-400 dark:text-gray-500">
                  {isPending
                    ? "No decision yet"
                    : leave.reviewComments || decided || "Employee notified"}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action bar, matching the list's button treatment. */}
      {/* The sheet sits on the bottom edge, so the action row has to clear the
          iOS home indicator as well as carry its own padding. */}
      <div
        className="flex gap-2.5 border-t border-gray-100 px-4 pb-4 pt-4 dark:border-white/10 sm:px-6"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {isAdmin && isPending ? (
          <>
            <button
              onClick={() => {
                onReject(leave._id);
                onClose();
              }}
              className="flex flex-1 items-center justify-center rounded-[13px] border border-rose-500/35 py-2.5 text-[13px] font-bold text-rose-600 active:bg-rose-500/10 dark:text-rose-400"
            >
              Decline
            </button>
            <button
              onClick={() => {
                onApprove(leave._id);
                onClose();
              }}
              className="flex flex-1 items-center justify-center rounded-[13px] py-2.5 text-[13px] font-bold text-white active:opacity-85"
              style={{ backgroundColor: "var(--accent)" }}
            >
              Approve
            </button>
          </>
        ) : (
          <div className="flex w-full items-center justify-between">
            <StatusPill status={leave.status} />
            <button
              onClick={onClose}
              className="rounded-[13px] px-4 py-2.5 text-[13px] font-bold text-gray-500 active:bg-black/5 dark:text-gray-400 dark:active:bg-white/10"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LeaveDetailSheet;
