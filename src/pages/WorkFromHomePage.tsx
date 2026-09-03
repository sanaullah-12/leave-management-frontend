import React, { useMemo, useState } from "react";
import {
  HomeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import AppLogo from "../components/AppLogo";
import { CARD, CARD_HOVER } from "../lib/surfaces";
import { AccentEdge } from "../components/ui/CardAccents";
import { useThemeAccent } from "../hooks/useThemeAccent";
import { useAuth } from "../context/AuthContext";
import Select from "../components/ui/Select";
import WfhRequestForm from "../components/workFromHome/WfhRequestForm";
import WfhRequestTable from "../components/workFromHome/WfhRequestTable";
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
 * One page, two readings. An employee gets the request form above their own
 * history; an admin gets the review queue. Same data, same table, so the two
 * never drift apart.
 *
 * Everything below the header updates over Socket.IO - a decision made in one
 * browser reaches the other without a refresh.
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
      <header
        className={`relative flex flex-wrap items-center justify-between gap-3 overflow-hidden ${CARD} px-5 py-4`}
      >
        <AccentEdge color={accent} />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70 dark:ring-gray-600/60">
            <AppLogo size={26} />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {isAdmin ? "Work From Home Requests" : "Work From Home"}
            </p>
            <p className="text-[12.5px] text-gray-400 dark:text-gray-500">
              {isAdmin
                ? "Approve or reject requests from your team"
                : "Request a day away from the office and track its status"}
            </p>
          </div>
        </div>

        <div className="w-[180px]">
          <Select
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            placeholder="Filter by status"
          />
        </div>
      </header>

      {/* Counts */}
      <section
        aria-label="Work from home summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className={`relative overflow-hidden ${CARD} ${CARD_HOVER} p-4 sm:p-5`}
          >
            <AccentEdge color={tile.tone} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-overline truncate text-gray-400 dark:text-gray-500">
                  {tile.label}
                </p>
                <p className="mt-2 text-2xl font-bold leading-none tabular-nums text-gray-900 dark:text-white sm:text-3xl">
                  {tile.value ?? "-"}
                </p>
                <p className="mt-2 text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
                  {tile.caption}
                </p>
              </div>
              <span className="hidden text-blue-600 dark:text-blue-400 sm:block">
                {tile.icon}
              </span>
            </div>
          </div>
        ))}
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
          busyId={busyId}
          emptyMessage={
            isAdmin
              ? "When someone requests a work from home day it will appear here."
              : "Submit a request above and its status will show here."
          }
        />
      </section>
    </div>
  );
};

export default WorkFromHomePage;
