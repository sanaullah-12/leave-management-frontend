import React, { useMemo, useState } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { XCircleIcon as XCircleSolid } from "@heroicons/react/24/solid";
import SectionHeader from "../components/ui/SectionHeader";
import { sectionIllustration } from "../components/ui/illustrations";
import { StatCardRow } from "../components/ui/StatCard";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import InlineLoader from "../components/InlineLoader";
import TimeChangeTable from "../components/attendance/TimeChangeTable";
import LateDayList from "../components/attendance/LateDayList";
import {
  MAX_AGE_DAYS,
  isoDaysAgo,
} from "../components/attendance/TimeChangeAction";
import { useAuth } from "../context/AuthContext";
import { useLateHours } from "../hooks/useLateHours";
import {
  useCancelTimeChange,
  useMyTimeChanges,
  useReviewTimeChange,
  useTimeChangeQueue,
  type TimeChangeRequest,
} from "../hooks/useTimeChanges";
import { showErrorToast, showSuccessToast } from "../utils/toastHelpers";

/**
 * Time Change Requests
 * --------------------
 * An admin reviews requests to have a late day read at an agreed arrival time.
 * An employee sees their late days from the request window, each with its
 * Request time change button or the state of the request already raised, and
 * below them the requests themselves. The same button sits next to every late
 * time elsewhere in the app; all of them open one form (TimeChangeProvider).
 *
 * Approving changes nothing in the device record. The approved time becomes
 * the day's effective arrival on the server, so every attendance screen,
 * report and count picks it up on its next read.
 */

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Withdrawn" },
  { value: "all", label: "All statuses" },
];

const TimeChangesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // An admin opens this page to work the queue, so it starts on pending.
  const [status, setStatus] = useState(isAdmin ? "pending" : "all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<TimeChangeRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const queue = useTimeChangeQueue(status, isAdmin);
  const mine = useMyTimeChanges(!isAdmin);

  // The employee's late days across the whole window a request is accepted
  // for. Judged by the server with approved changes applied, so a corrected
  // day comes back on time and is kept only to show that it was corrected.
  const lateWindow = useMemo(
    () => ({ startDate: isoDaysAgo(MAX_AGE_DAYS), endDate: isoDaysAgo(0) }),
    []
  );
  const lateHours = useLateHours(user?.employeeId, {
    ...lateWindow,
    enabled: !isAdmin && Boolean(user?.employeeId),
  });
  const lateDays = useMemo(
    () => lateHours.entries.filter((e) => e.lateMinutes > 0 || e.timeCorrected),
    [lateHours.entries]
  );
  const openLateDays = useMemo(() => {
    const asked = new Set(
      (mine.data ?? [])
        .filter((r) => r.status === "pending" || r.status === "approved")
        .map((r) => r.date)
    );
    return lateDays.filter((e) => e.lateMinutes > 0 && !asked.has(e.date))
      .length;
  }, [lateDays, mine.data]);
  const review = useReviewTimeChange();
  const cancel = useCancelTimeChange();

  const requests = useMemo(() => {
    if (isAdmin) return queue.data?.requests ?? [];
    const own = mine.data ?? [];
    return status === "all" ? own : own.filter((r) => r.status === status);
  }, [isAdmin, queue.data, mine.data, status]);

  const counts = useMemo(() => {
    if (isAdmin) return queue.data?.counts;
    const own = mine.data ?? [];
    return {
      pending: own.filter((r) => r.status === "pending").length,
      approved: own.filter((r) => r.status === "approved").length,
      rejected: own.filter((r) => r.status === "rejected").length,
      cancelled: own.filter((r) => r.status === "cancelled").length,
    };
  }, [isAdmin, queue.data, mine.data]);

  const loading = isAdmin ? queue.isLoading : mine.isLoading;

  const applyReview = async (
    request: TimeChangeRequest,
    next: "approved" | "rejected",
    reviewComments = ""
  ) => {
    setBusyId(request.id);
    try {
      await review.mutateAsync({ id: request.id, status: next, reviewComments });
      showSuccessToast(
        next === "approved"
          ? `Approved. ${request.employee?.name || "The employee"}'s check-in on ${request.dateDisplay} is now ${request.requestedCheckInDisplay}.`
          : "Request rejected. The employee has been notified."
      );
      return true;
    } catch (error: any) {
      showErrorToast(
        error?.response?.data?.message || "Could not update the request"
      );
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const handleReview = async (
    request: TimeChangeRequest,
    next: "approved" | "rejected"
  ) => {
    if (next === "rejected") {
      setRejectionReason("");
      setRejecting(request);
      return;
    }
    await applyReview(request, "approved");
  };

  const handleRejectSubmit = async () => {
    if (!rejecting) return;
    if (!rejectionReason.trim()) {
      showErrorToast("Please provide a reason for rejection");
      return;
    }
    const done = await applyReview(rejecting, "rejected", rejectionReason.trim());
    if (done) {
      setRejecting(null);
      setRejectionReason("");
    }
  };

  const handleCancel = async (request: TimeChangeRequest) => {
    setBusyId(request.id);
    try {
      await cancel.mutateAsync(request.id);
      showSuccessToast("Request withdrawn");
    } catch (error: any) {
      showErrorToast(
        error?.response?.data?.message || "Could not withdraw the request"
      );
    } finally {
      setBusyId(null);
    }
  };

  const tiles = [
    ...(isAdmin
      ? []
      : [
          {
            label: "Late, not requested",
            value: lateHours.isLoading ? "-" : openLateDays,
            icon: <ExclamationTriangleIcon className="h-6 w-6" />,
          },
        ]),
    {
      label: "Pending",
      value: counts?.pending ?? "-",
      icon: <ClockIcon className="h-6 w-6" />,
    },
    {
      label: "Approved",
      value: counts?.approved ?? "-",
      icon: <CheckCircleIcon className="h-6 w-6" />,
    },
    {
      label: "Rejected",
      value: counts?.rejected ?? "-",
      icon: <XCircleIcon className="h-6 w-6" />,
    },
  ];

  return (
    <div className="space-y-6 stagger-children">
      <SectionHeader
        variant="attendance"
        eyebrow="Attendance"
        title="Time Change Requests"
        description={
          isAdmin
            ? "Review requests to record a late arrival from an agreed time. The machine check-in is always kept."
            : `Your late days from the last ${MAX_AGE_DAYS} days and the requests you have raised. Request a change right from the late day.`
        }
        illustration={sectionIllustration("attendance")}
      />

      <section aria-label="Time change summary">
        <StatCardRow tiles={tiles} fourUp={!isAdmin} />
      </section>

      {!isAdmin && (
        <section className="space-y-2.5" aria-label="Late days">
          <div className="flex min-w-0 items-center gap-2 px-1">
            <ClockIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Late days
            </h2>
            <span className="text-xs text-gray-400">
              Last {MAX_AGE_DAYS} days
              {lateDays.length ? ` - ${lateDays.length} shown` : ""}
            </span>
          </div>
          <LateDayList
            entries={lateDays}
            loading={lateHours.isLoading}
            emptyMessage={
              user?.employeeId
                ? `Every check-in in the last ${MAX_AGE_DAYS} days was on time.`
                : "Your account is not linked to a device ID yet, so there are no check-ins to show."
            }
          />
        </section>
      )}

      <section className="space-y-2.5">
        <div className="flex flex-col gap-2.5 px-1 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <PencilSquareIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isAdmin ? "Requests" : "My requests"}
            </h2>
            <span className="text-xs text-gray-400">
              {requests.length} shown
            </span>
          </div>
          <div className="w-full sm:w-[190px]">
            <Select
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              placeholder="Filter by status"
            />
          </div>
        </div>

        <TimeChangeTable
          requests={requests}
          loading={loading}
          showEmployee={isAdmin}
          onReview={isAdmin ? handleReview : undefined}
          onCancel={isAdmin ? undefined : handleCancel}
          busyId={busyId}
          emptyMessage={
            isAdmin
              ? status === "pending"
                ? "No requests are waiting for a decision."
                : "When someone requests a time change it will appear here."
              : "Use Request time change on a late day above to raise one."
          }
        />
      </section>

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        size="md"
        icon={<XCircleSolid className="h-6 w-6" />}
        iconClassName="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
        title="Reject this request"
        description="The day stays marked from the machine check-in. Let the employee know why."
        footer={
          <>
            <button
              onClick={() => setRejecting(null)}
              disabled={review.isPending}
              className="rounded-full border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectSubmit}
              disabled={review.isPending}
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-700 disabled:opacity-70"
            >
              {review.isPending ? (
                <InlineLoader label="Rejecting..." />
              ) : (
                "Confirm reject"
              )}
            </button>
          </>
        }
      >
        <textarea
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          placeholder="Enter rejection reason..."
          rows={4}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-sm text-gray-900 outline-none transition-all focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100 dark:focus:bg-gray-900"
        />
        <div className="mt-1.5 text-right text-xs tabular-nums text-gray-400">
          {rejectionReason.length}/500
        </div>
      </Modal>
    </div>
  );
};

export default TimeChangesPage;
