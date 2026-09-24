import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SectionHeader from "../components/ui/SectionHeader";
import { sectionIllustration } from "../components/ui/illustrations";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { leavesAPI } from "../services/api";
import {
  showErrorToast,
  showLeaveApprovalSuccess,
  showLeaveRejectionSuccess,
} from "../utils/toastHelpers";
import Avatar from "../components/Avatar";
import Modal from "../components/ui/Modal";
import MobileLeaveList from "../components/leaves/MobileLeaveList";
import LeaveDetailSheet from "../components/leaves/LeaveDetailSheet";
import LeaveReviewModal from "../components/leaves/LeaveReviewModal";
import { toneFor, type LeaveRow } from "../components/leaves/leaveParts";
import { formatRequestRange, previewReason } from "../lib/requestList";
import InlineLoader from "../components/InlineLoader";
import LogoLoader from "../components/LogoLoader";
import useListRowMotion from "../hooks/useListRowMotion";
import {
  PlusIcon,
  ArrowPathIcon,
  XCircleIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";
import { spring } from "../lib/motion";

/** Every column heading, so the row of them cannot drift apart. */
const TH =
  "px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";

const LeavesPage: React.FC = () => {
  const { user } = useAuth();
  const listRow = useListRowMotion(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // const { addNotification } = useNotifications(); // Removed for Socket.IO implementation
  const [searchParams] = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  /** The request shown in the mobile detail sheet. */
  const [detailLeave, setDetailLeave] = useState<LeaveRow | null>(null);
  /** The request shown in the desktop review dialog. */
  const [reviewLeave, setReviewLeave] = useState<LeaveRow | null>(null);

  // Initialize selectedStatus from URL parameters on mount
  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl) {
      setSelectedStatus(statusFromUrl);
    }
  }, [searchParams]);

  /* Status pill: a dot rather than an icon. At 12px a check, a cross and a
     clock read as three different shapes competing with the word beside
     them; a dot carries the colour and lets the label do the naming. */
  const getStatusDisplay = (status: string) => {
    const base =
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset";
    switch (status.toLowerCase()) {
      case "approved":
        return {
          dot: "bg-emerald-500",
          className: `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-500/20`,
          text: "Approved",
        };
      case "rejected":
        return {
          dot: "bg-red-500",
          className: `${base} bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 ring-red-200/60 dark:ring-red-500/20`,
          text: "Rejected",
        };
      case "pending":
        return {
          dot: "bg-amber-500",
          className: `${base} bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200/60 dark:ring-amber-500/20`,
          text: "Pending",
        };
      default:
        return {
          dot: "bg-gray-400",
          className: `${base} bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300 ring-gray-200/60 dark:ring-gray-500/20`,
          text: status,
        };
    }
  };

  // One unfiltered page backs every tab. Keying the query by the status filter
  // meant each chip click created a query with no cached data, so `isLoading`
  // flipped true and the full-page loader below replaced the entire screen -
  // chips included - until the round trip finished. Filtering client-side makes
  // switching instant and lets every chip carry a real count.
  const {
    data: leavesData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["leaves"],
    queryFn: () => leavesAPI.getLeaves(1, 200),
    refetchInterval: false, // Real-time via Socket.IO (see useSocket) - no polling.
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const allLeaves: any[] = leavesData?.data?.leaves || [];
  const leaves = React.useMemo(
    () =>
      selectedStatus
        ? allLeaves.filter((l: any) => l.status === selectedStatus)
        : allLeaves,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leavesData, selectedStatus]
  );

  const handleRefresh = () => {
    refetch();
  };


  const reviewLeaveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      leavesAPI.reviewLeave(id, data),
    onSuccess: (response, { id, data }) => {
      // Get the updated leave from response
      const updatedLeave = response?.data?.leave;
      const newStatus = data.status;
      const reviewComments = data.reviewComments;
      const empName = updatedLeave?.employee?.name || "Employee";

      // Show success toast with custom helper
      if (newStatus === "approved") {
        const days = updatedLeave?.totalDays || 1;
        showLeaveApprovalSuccess(empName, days);
      } else {
        showLeaveRejectionSuccess(empName);
      }

      // Flip the row instantly; the invalidation below reconciles with the
      // server. One list now backs every tab, so this is a single patch.
      queryClient.setQueryData(["leaves"], (oldData: any) => {
        if (!oldData?.data?.leaves) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            leaves: oldData.data.leaves.map((leave: any) =>
              leave._id === id
                ? { ...leave, status: newStatus, reviewComments }
                : leave
            ),
          },
        };
      });

      // Patch the employee's own activity list. That query is keyed by employee
      // alone now, so this is one write rather than a guess across four status
      // variants and a hardcoded year - none of which matched a real key.
      const updateEmployeeLeaveQueries = (employeeId: string) => {
        queryClient.setQueryData(
          ["employee-leave-requests", employeeId],
          (oldData: any) => {
            if (!oldData?.data?.leaves) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                leaves: oldData.data.leaves.map((leave: any) =>
                  leave._id === id
                    ? { ...leave, status: newStatus, reviewComments }
                    : leave
                ),
              },
            };
          }
        );
      };

      // If we have employee ID from the updated leave, update their queries too
      if (
        updatedLeave &&
        updatedLeave.employee &&
        typeof updatedLeave.employee === "object"
      ) {
        updateEmployeeLeaveQueries(
          updatedLeave.employee._id || updatedLeave.employee.id
        );
      } else if (updatedLeave && typeof updatedLeave.employee === "string") {
        updateEmployeeLeaveQueries(updatedLeave.employee);
      }

      // Show success notification
      const employeeName =
        typeof updatedLeave?.employee === "object"
          ? updatedLeave.employee.name
          : "Employee";
      // addNotification({
      //   type: newStatus === 'approved' ? 'success' : 'warning',
      //   title: `Leave Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      //   message: `${employeeName}'s leave request has been ${newStatus}.`,
      // });
      console.log(`Leave request ${newStatus} for ${employeeName}`);

      // Invalidate all related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["recent-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error: any) => {
      console.error("Failed to review leave:", error);
      // addNotification({
      //   type: 'error',
      //   title: 'Review Failed',
      //   message: error?.response?.data?.message || 'Failed to review leave request. Please try again.',
      // });
      console.error(
        "Leave review failed:",
        error?.response?.data?.message || error.message
      );
    },
  });


  const handleReview = async (
    leaveId: string,
    status: string,
    comments?: string
  ) => {
    try {
      await reviewLeaveMutation.mutateAsync({
        id: leaveId,
        data: { status, reviewComments: comments },
      });
    } catch (error: any) {
      console.error("Failed to review leave:", error);
    }
  };

  const handleRejectClick = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setShowRejectionPopup(true);
    setRejectionReason("");
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      showErrorToast("Please provide a reason for rejection");
      return;
    }

    try {
      await handleReview(selectedLeaveId, "rejected", rejectionReason);
      setShowRejectionPopup(false);
      setSelectedLeaveId("");
      setRejectionReason("");
    } catch (error: any) {
      console.error("Failed to reject leave:", error);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectionPopup(false);
    setSelectedLeaveId("");
    setRejectionReason("");
  };

  // Only the very first load reaches this now - tab switches never refetch.
  if (isLoading) {
    return <LogoLoader label="Loading leave requests..." />;
  }

  return (
    <div className="space-y-6 stagger-children">
      {/* Desktop chrome. The mobile list carries its own header, refresh
          control and filter chips, so this banner would otherwise be shown
          twice on a phone. */}
      <div className="hidden lg:block">
        <SectionHeader
          variant="leave"
          eyebrow="Time off"
          title="Leave Requests"
          description={
            user?.role === "admin"
              ? "Review, approve and track every leave request across the company."
              : "View the requests you have submitted and start a new one."
          }
          illustration={sectionIllustration("leave")}
          action={
            <>
              <button
                onClick={handleRefresh}
                disabled={isFetching}
                className="sh-action"
              >
                <ArrowPathIcon
                  className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              {user?.role === "employee" && (
                <button
                  onClick={() => navigate("/apply-leave")}
                  className="sh-action-primary"
                >
                  <PlusIcon className="h-5 w-5" />
                  Request Leave
                </button>
              )}
            </>
          }
        />
      </div>

      {/* Status Filter (desktop only - the mobile list renders chips) */}
      <div className="hidden flex-wrap gap-1 rounded-full border border-gray-200/60 bg-gray-100 p-1 dark:border-gray-700/60 dark:bg-gray-800/80 lg:inline-flex">
        {[
          { key: "", label: "All", active: "text-blue-600 dark:text-blue-400" },
          { key: "pending", label: "Pending", active: "text-amber-600 dark:text-amber-400" },
          { key: "approved", label: "Approved", active: "text-emerald-600 dark:text-emerald-400" },
          { key: "rejected", label: "Rejected", active: "text-red-600 dark:text-red-400" },
        ].map((tab) => {
          const on = selectedStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                on
                  ? tab.active
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              }`}
            >
              {/* One pill that slides between the four, rather than a white
                  background switching off one button and on to another. The
                  strip then reads as a horizontal axis with a position on it,
                  which is what a segmented control is - and it is the same
                  gesture as the mobile filter chips and the tab bar, on the
                  same spring. The text colour still changes per status, so
                  the pill travels while the label recolours under it. */}
              {on && (
                <motion.span
                  layoutId="leave-status-pill"
                  transition={spring}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-gray-700"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>


      {/* Mobile: the table becomes one card per request. It is a separate
          component rather than a restyled table because the phone layout
          shares no markup with the desktop one - it owns its own header,
          filters and empty state. */}
      <MobileLeaveList
        leaves={leaves}
        allLeaves={allLeaves}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        onOpen={(leave) => setDetailLeave(leave)}
      />

      {/* Everything needed to decide lives here rather than in every row. */}
      <LeaveDetailSheet
        leave={detailLeave}
        onClose={() => setDetailLeave(null)}
        isAdmin={user?.role === "admin"}
        onApprove={(id) => handleReview(id, "approved")}
        onReject={(id) => handleRejectClick(id)}
      />

      {/* Leave Requests Section
          One row, one decision: the reason sits in the row as a readable chip
          and every other detail lives behind a single Review dialog, rather
          than the two separate eye-icon popups this table used to carry. */}
      <div className="mt-8 hidden overflow-hidden backdrop-blur-sm surface-card lg:block">
        {leaves.length > 0 ? (
          <div className="table-scroll">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/60">
                  {user?.role === "admin" && <th className={TH}>Employee</th>}
                  <th className={TH}>Type</th>
                  <th className={TH}>Duration</th>
                  <th className={TH}>Days</th>
                  <th className={TH}>Reason</th>
                  <th className={TH}>Status</th>
                  <th className={`${TH} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white dark:divide-gray-800/60">
                {leaves.map((leave: any, i: number) => {
                  const employee =
                    typeof leave.employee === "object" && leave.employee
                      ? leave.employee
                      : null;
                  const status = getStatusDisplay(leave.status);
                  return (
                    <motion.tr
                      key={leave._id}
                      {...listRow(i)}
                      className="bg-blue-50/40 transition-colors hover:bg-blue-50/80 dark:bg-blue-500/[0.04] dark:hover:bg-blue-500/[0.09]"
                    >
                      {user?.role === "admin" && (
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={employee?.profilePicture}
                              name={employee?.name || "Unknown"}
                              size="md"
                              className="flex-shrink-0"
                            />
                            <div className="flex flex-col">
                              <button
                                onClick={() =>
                                  employee?._id &&
                                  navigate(`/employees/${employee._id}`)
                                }
                                className="text-left text-[15px] font-semibold text-gray-900 underline-offset-2 transition-colors hover:text-blue-700 hover:underline dark:text-gray-100 dark:hover:text-blue-400"
                              >
                                {employee?.name || "Unknown"}
                              </button>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {employee?.employeeId || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                            toneFor(leave.leaveType).tag
                          }`}
                        >
                          {leave.leaveType}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                          {formatRequestRange(leave.startDate, leave.endDate)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                          {leave.totalDays}{" "}
                          {leave.totalDays === 1 ? "day" : "days"}
                        </span>
                      </td>

                      {/* The reason is the cell people actually read, so it
                          gets a surface of its own and opens the dialog. */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setReviewLeave(leave)}
                          title={leave.reason || undefined}
                          className="inline-flex max-w-[13rem] items-center gap-2 rounded-full bg-blue-50/80 px-3 py-1.5 text-left ring-1 ring-inset ring-blue-100 transition-colors hover:bg-blue-100/70 dark:bg-blue-500/10 dark:ring-blue-500/15 dark:hover:bg-blue-500/20"
                        >
                          <ChatBubbleBottomCenterTextIcon className="h-4 w-4 flex-none text-blue-600 dark:text-blue-400" />
                          <span className="min-w-0 truncate text-sm text-blue-900 dark:text-blue-100">
                            {previewReason(leave.reason)}
                          </span>
                          {leave.status === "rejected" && (
                            <span className="flex-none text-xs font-medium text-red-600 dark:text-red-400">
                              View rejection
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={status.className}>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          />
                          {status.text}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          onClick={() => setReviewLeave(leave)}
                          className="inline-flex items-center rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                          Review
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ClockIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-lg font-medium mb-2 text-gray-600 dark:text-gray-300">
              No leave requests found
            </p>
            <p className="text-sm max-w-md mx-auto text-gray-400 dark:text-gray-500">
              {selectedStatus
                ? `No ${selectedStatus} leave requests found`
                : "Submit your first leave request to see it here"}
            </p>
          </div>
        )}
      </div>

      {/* Row detail, and the only place a request is approved or rejected
          from on desktop. */}
      <LeaveReviewModal
        leave={reviewLeave}
        onClose={() => setReviewLeave(null)}
        isAdmin={user?.role === "admin"}
        isBusy={reviewLeaveMutation.isPending}
        onApprove={async (id) => {
          // Closed on success only - a failed approval leaves the dialog up
          // rather than dropping the reviewer back to an unchanged row.
          try {
            await reviewLeaveMutation.mutateAsync({
              id,
              data: { status: "approved" },
            });
            setReviewLeave(null);
          } catch {
            /* reported by the mutation's onError */
          }
        }}
        onReject={(id) => {
          setReviewLeave(null);
          handleRejectClick(id);
        }}
      />

      {/* Rejection Reason Modal */}
      <Modal
        open={showRejectionPopup}
        onClose={handleRejectCancel}
        size="md"
        icon={<XCircleIcon className="h-6 w-6" />}
        iconClassName="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
        title="Reject leave request"
        description="Let the employee know why this request was declined."
        footer={
          <>
            <button
              onClick={handleRejectCancel}
              disabled={reviewLeaveMutation.isPending}
              className="rounded-full border border-gray-200 dark:border-gray-700 px-3 py-2 sm:px-3.5 text-[13px] sm:text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectSubmit}
              disabled={reviewLeaveMutation.isPending}
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-700 disabled:opacity-70"
            >
              {reviewLeaveMutation.isPending ? (
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
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={4}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-3.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-red-500/10"
        />
        <div className="mt-1.5 text-right text-xs tabular-nums text-gray-400">
          {rejectionReason.length}/500
        </div>
      </Modal>

    </div>
  );
};

export default LeavesPage;
