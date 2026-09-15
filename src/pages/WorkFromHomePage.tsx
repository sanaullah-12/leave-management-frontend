import React, { useMemo, useState } from "react";
import SectionHeader from "../components/ui/SectionHeader";
import { sectionIllustration } from "../components/ui/illustrations";
import {
  HomeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { CARD } from "../lib/surfaces";
import { StatCardRow } from "../components/ui/StatCard";
import { AccentEdge } from "../components/ui/CardAccents";
import { useThemeAccent } from "../hooks/useThemeAccent";
import { useAuth } from "../context/AuthContext";
import Select from "../components/ui/Select";
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

  const handleReview = async (
    request: WfhRequest,
    next: "approved" | "rejected"
  ) => {
    // A rejection without a word back is the one that generates a follow-up
    // question, so the reason is asked for here rather than left optional.
    let reviewComments = "";
    if (next === "rejected") {
      const entered = window.prompt(
        "Reason for rejecting this request (optional):",
        ""
      );
      // Cancel on the prompt means cancel the rejection.
      if (entered === null) return;
      reviewComments = entered;
    }

    setBusyId(request._id);
    try {
      await review.mutateAsync({ id: request._id, status: next, reviewComments });
      showSuccessToast(
        request.isBackdated && next === "approved"
          ? "Approved. Those days now read as work from home instead of absent."
          : `Request ${next}. The employee has been notified.`
      );
    } catch (error: any) {
      showErrorToast(
        error?.response?.data?.message || "Could not update the request"
      );
    } finally {
      setBusyId(null);
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
      tone: "#b5650a",
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
      tone: "#b42318",
      caption: "Not approved",
    },
  ];

  return (
    <div className="space-y-6 fade-in">
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

      {/* Status filter. A control over the list below, so it sits with the
          list rather than in the banner. */}
      <div
        className={`relative flex justify-end overflow-hidden ${CARD} px-5 py-4`}
      >
        <AccentEdge color={accent} />
        <div className="w-[180px]">
          <Select
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            placeholder="Filter by status"
          />
        </div>
      </div>

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
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <HomeIcon className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {isAdmin ? "All requests" : "My requests"}
          </h2>
          <span className="text-xs text-gray-400">
            {requests.length} shown
          </span>
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
      />
    </div>
  );
};

export default WorkFromHomePage;
