import React, { useMemo, useState } from "react";
import SectionHeader from "../components/ui/SectionHeader";
import { sectionIllustration } from "../components/ui/illustrations";
import {
  HomeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { XCircleIcon as XCircleSolid } from "@heroicons/react/24/solid";
import { StatCardRow } from "../components/ui/StatCard";
import { useThemeAccent } from "../hooks/useThemeAccent";
import { useAuth } from "../context/AuthContext";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import InlineLoader from "../components/InlineLoader";
import WfhRequestForm from "../components/workFromHome/WfhRequestForm";
import WfhRequestTable from "../components/workFromHome/WfhRequestTable";
import WfhTodayCard from "../components/workFromHome/WfhTodayCard";
import WfhLiveMonitor from "../components/workFromHome/WfhLiveMonitor";
import WfhRequestDrawer from "../components/workFromHome/WfhRequestDrawer";
import {
  useWfhRequests,
  useWfhStats,
  useSubmitWfhRequest,
  useReviewWfhRequest,
  useCancelWfhRequest,
  useWfhPolicy,
  type WfhRequest,
} from "../hooks/useWorkFromHome";
import { showSuccessToast, showErrorToast } from "../utils/toastHelpers";
import { statusColor } from "../lib/themeTokens";

/**
 * Work From Home
 * --------------
 * One page, two readings. An employee gets today's work timer and the request
 * form above their own history; an admin gets the live monitor and the review
 * queue. Same data, same table, so the two never drift apart.
 *
 * The ordering is by urgency rather than by module. Today's day comes first for
 * both roles - a running timer and a colleague who has not started yet are the
 * things that need attention now - and the request queue, which is about days
 * that have not happened, sits below it.
 *
 * Everything below the header updates over Socket.IO - a decision made in one
 * browser, or a timer paused in another, reaches the rest without a refresh.
 */

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const WorkFromHomePage: React.FC = () => {
  const accent = useThemeAccent(600);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [status, setStatus] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  // The request whose report is open. Held here rather than in the table so the
  // drawer is mounted once, outside the scrolling list it was opened from.
  const [openRequest, setOpenRequest] = useState<WfhRequest | null>(null);
  /** The request being rejected, and the reason being typed for it. */
  const [rejecting, setRejecting] = useState<WfhRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const filters = useMemo(
    () => (status === "all" ? {} : { status }),
    [status]
  );
  const { data: requests = [], isLoading } = useWfhRequests(filters);
  const { data: stats } = useWfhStats();
  const { data: policy } = useWfhPolicy();

  const submit = useSubmitWfhRequest();
  const review = useReviewWfhRequest();
  const cancel = useCancelWfhRequest();

  const handleSubmit = async (data: {
    startDate: string;
    endDate?: string;
    reason: string;
    note?: string;
    plannedStartTime?: string;
    plannedEndTime?: string;
    plannedTasks?: string[];
  }) => {
    try {
      await submit.mutateAsync(data);
      showSuccessToast("Work from home request submitted");
    } catch (error: any) {
      showErrorToast(
        error?.response?.data?.message || "Could not submit the request"
      );
      // Rethrown so the form keeps what was typed rather than clearing it.
      throw error;
    }
  };

  const applyReview = async (
    request: WfhRequest,
    next: "approved" | "rejected",
    reviewComments = ""
  ) => {
    setBusyId(request._id);
    try {
      await review.mutateAsync({ id: request._id, status: next, reviewComments });
      showSuccessToast(
        request.isBackdated && next === "approved"
          ? "Approved. Those days now read as work from home instead of absent."
          : `Request ${next}. The employee has been notified.`
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
    request: WfhRequest,
    next: "approved" | "rejected"
  ) => {
    // A rejection without a word back is the one that generates a follow-up
    // question, so it is asked for in the app's own dialog - the same one the
    // leave queue uses - rather than a browser prompt.
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

  const handleCancel = async (request: WfhRequest) => {
    setBusyId(request._id);
    try {
      await cancel.mutateAsync(request._id);
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
    {
      label: "Pending",
      value: stats?.pending ?? null,
      icon: <ClockIcon className="h-6 w-6" />,
      tone: statusColor("warning"),
      caption: isAdmin ? "Waiting for your decision" : "Waiting for approval",
    },
    {
      label: "Approved",
      value: stats?.approved ?? null,
      icon: <CheckCircleIcon className="h-6 w-6" />,
      tone: accent,
      caption: "Counted as working days",
    },
    {
      label: "Rejected",
      value: stats?.rejected ?? null,
      icon: <XCircleIcon className="h-6 w-6" />,
      tone: statusColor("danger"),
      caption: "Not approved",
    },
  ];

  return (
    <div className="space-y-6 stagger-children">
      {/* Header */}
      <SectionHeader
        variant="workFromHome"
        eyebrow="Presence"
        title={isAdmin ? "Work From Home Requests" : "Work From Home"}
        description={
          isAdmin
            ? "Approve or reject requests from your team."
            : "Request a day away from the office and track its status."
        }
        illustration={sectionIllustration("workFromHome")}
      />

      {/* Today, before anything else. An employee with a running timer and an
          admin watching who has started are both looking at the same day.

          The card is rendered for admins too. It draws nothing unless the
          viewer personally has an approved day, so it costs an admin nothing -
          and an admin who does have one would otherwise have a monitor showing
          their own name with no way to start the timer it is reporting on. */}
      <WfhTodayCard />

      {isAdmin && <WfhLiveMonitor />}

      {/* Counts */}
      <section aria-label="Work from home summary">
        <StatCardRow
          tiles={tiles.map((tile) => ({
            label: tile.label,
            value: tile.value ?? "-",
            icon: tile.icon,
          }))}
        />
      </section>

      {/* Employees request; admins only review. An admin who needs a WFH day
          submits it the same way an employee does, from their own account. */}
      {!isAdmin && (
        <WfhRequestForm
          onSubmit={handleSubmit}
          submitting={submit.isPending}
          policy={policy}
        />
      )}

      {/* Requests */}
      <section className="space-y-2.5">
        {/* The status filter belongs to this list, so it sits on it. It used
            to be a card of its own at the top of the page, three sections
            above the rows it changes - on a phone that is far enough that the
            list appears to have emptied itself. Full width below `sm`: a
            180px control jammed against the right edge is both hard to hit
            and hard to read the current value of. */}
        <div className="flex flex-col gap-2.5 px-1 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <HomeIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isAdmin ? "All requests" : "My requests"}
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

        <WfhRequestTable
          requests={requests}
          loading={isLoading}
          showEmployee={isAdmin}
          onReview={isAdmin ? handleReview : undefined}
          onCancel={isAdmin ? undefined : handleCancel}
          onOpen={setOpenRequest}
          busyId={busyId}
          emptyMessage={
            isAdmin
              ? "When someone requests a work from home day it will appear here."
              : "Submit a request above and its status will show here."
          }
        />
      </section>

      {/* The report behind any request in the list: what was asked for, and
          what the work timer recorded against it. An overlay, so it is mounted
          once at the end rather than inside the list it is opened from. */}
      <WfhRequestDrawer
        request={openRequest}
        onClose={() => setOpenRequest(null)}
        onReview={
          isAdmin
            ? async (request, next) => {
                await handleReview(request, next);
                setOpenRequest(null);
              }
            : undefined
        }
        busy={Boolean(openRequest) && busyId === openRequest?._id}
      />

      {/* Rejection reason. Same dialog as the leave queue, so a reviewer
          declining one request and then the other types into the same box. */}
      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        size="md"
        icon={<XCircleSolid className="h-6 w-6" />}
        iconClassName="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
        title="Reject this request"
        description="Let the employee know why the day was declined."
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

export default WorkFromHomePage;
