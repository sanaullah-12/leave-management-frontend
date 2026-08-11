import React, { useState, useEffect } from "react";
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
import type { LeaveRow } from "../components/leaves/leaveParts";
import InlineLoader from "../components/InlineLoader";
import LogoLoader from "../components/LogoLoader";
import {
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

const LeavesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // const { addNotification } = useNotifications(); // Removed for Socket.IO implementation
  const [searchParams] = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showCommentsPopup, setShowCommentsPopup] = useState(false);
  /** The request shown in the mobile detail sheet. */
  const [detailLeave, setDetailLeave] = useState<LeaveRow | null>(null);
  const [popupContent, setPopupContent] = useState({
    title: "",
    content: "",
    type: "",
  });

  // Initialize selectedStatus from URL parameters on mount
  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    if (statusFromUrl) {
      setSelectedStatus(statusFromUrl);
    }
  }, [searchParams]);

  // Function to get badge colors for leave types - soft tinted pills
  const getLeaveTypeBadge = (leaveType: string) => {
    switch (leaveType.toLowerCase()) {
      case "annual":
        return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-inset ring-blue-200/60 dark:ring-blue-500/20";
      case "sick":
        return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-1 ring-inset ring-red-200/60 dark:ring-red-500/20";
      case "casual":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200/60 dark:ring-emerald-500/20";
      case "maternity":
        return "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400 ring-1 ring-inset ring-pink-200/60 dark:ring-pink-500/20";
      case "paternity":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 ring-1 ring-inset ring-indigo-200/60 dark:ring-indigo-500/20";
      case "emergency":
        return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 ring-1 ring-inset ring-orange-200/60 dark:ring-orange-500/20";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300 ring-1 ring-inset ring-gray-200/60 dark:ring-gray-500/20";
    }
  };

  // Function to get status icons and colors - soft tinted pills with a leading dot
  const getStatusDisplay = (status: string) => {
    const base =
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset";
    switch (status.toLowerCase()) {
      case "approved":
        return {
          icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
          className: `${base} bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-500/20`,
          text: "Approved",
        };
      case "rejected":
        return {
          icon: <XCircleIcon className="w-3.5 h-3.5" />,
          className: `${base} bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 ring-red-200/60 dark:ring-red-500/20`,
          text: "Rejected",
        };
      case "pending":
        return {
          icon: <ClockIcon className="w-3.5 h-3.5" />,
          className: `${base} bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200/60 dark:ring-amber-500/20`,
          text: "Pending",
        };
      default:
        return {
          icon: <ClockIcon className="w-3.5 h-3.5" />,
          className: `${base} bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300 ring-gray-200/60 dark:ring-gray-500/20`,
          text: status,
        };
    }
  };

  const {
    data: leavesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["leaves", selectedStatus],
    queryFn: () => leavesAPI.getLeaves(1, 20, selectedStatus),
    refetchInterval: false, // Disabled auto-refresh - only manual refresh
    refetchIntervalInBackground: false, // Disabled background refresh
    refetchOnWindowFocus: false, // Only refetch on manual action
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

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

      // Optimistically update the cache without refetching
      const updateLeaveInQuery = (queryKey: string) => {
        queryClient.setQueryData(["leaves", queryKey], (oldData: any) => {
          if (oldData?.data?.leaves) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                leaves: oldData.data.leaves.map((leave: any) =>
                  leave._id === id
                    ? {
                        ...leave,
                        status: newStatus,
                        reviewComments: reviewComments,
                      }
                    : leave
                ),
              },
            };
          }
          return oldData;
        });
      };

      // Update employee-specific queries
      const updateEmployeeLeaveQueries = (employeeId: string) => {
        const currentYear = new Date().getFullYear();

        // Update all employee status queries
        ["", "pending", "approved", "rejected"].forEach((status) => {
          queryClient.setQueryData(
            ["employee-leave-requests", employeeId, status, currentYear],
            (oldData: any) => {
              if (oldData?.data?.leaves) {
                return {
                  ...oldData,
                  data: {
                    ...oldData.data,
                    leaves: oldData.data.leaves.map((leave: any) =>
                      leave._id === id
                        ? {
                            ...leave,
                            status: newStatus,
                            reviewComments: reviewComments,
                          }
                        : leave
                    ),
                  },
                };
              }
              return oldData;
            }
          );
        });
      };

      // Update all admin view queries
      updateLeaveInQuery(selectedStatus);
      updateLeaveInQuery("");
      updateLeaveInQuery("pending");
      updateLeaveInQuery("approved");
      updateLeaveInQuery("rejected");

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

  const showRejectionCommentsPopup = (comments: string) => {
    setPopupContent({
      title: "Rejection Reason",
      content: comments,
      type: "rejection",
    });
    setShowCommentsPopup(true);
  };

  const showLeaveReasonPopup = (reason: string) => {
    setPopupContent({
      title: "Leave Reason",
      content: reason,
      type: "reason",
    });
    setShowCommentsPopup(true);
  };

  const closeCommentsPopup = () => {
    setShowCommentsPopup(false);
    setPopupContent({ title: "", content: "", type: "" });
  };

  if (isLoading) {
    return <LogoLoader label="Loading leave requests..." />;
  }

  const leaves = leavesData?.data?.leaves || [];

  return (
    <div className="space-y-6 fade-in">
      {/* Desktop chrome. The mobile list carries its own header, refresh
          control and filter chips, so this whole block would otherwise be
          shown twice on a phone. */}
      <div className="hidden flex-col gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
        {/* Hidden on phones: the mobile app bar already shows "Leave Requests",
            so this block repeated the title and spent ~120px of a 844px screen
            restating it before any content appeared. Desktop has no app bar
            title, so it keeps the heading. */}
        <div className="hidden sm:block">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Leave Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {user?.role === "admin"
              ? "Manage employee leave requests"
              : "View and submit your leave requests"}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-secondary inline-flex items-center"
          >
            {isLoading ? (
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <ArrowPathIcon className="h-5 w-5 mr-2" />
            )}
            Refresh
          </button>

          {user?.role === "employee" && (
            <button
              onClick={() => navigate("/apply-leave")}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Status Filter (desktop only - the mobile list renders chips) */}
      <div className="hidden flex-wrap gap-1 rounded-xl border border-gray-200/60 bg-gray-100 p-1 dark:border-gray-700/60 dark:bg-gray-800/80 lg:inline-flex">
        {[
          { key: "", label: "All", active: "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" },
          { key: "pending", label: "Pending", active: "bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm" },
          { key: "approved", label: "Approved", active: "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm" },
          { key: "rejected", label: "Rejected", active: "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedStatus === tab.key
                ? tab.active
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>


      {/* Mobile: the table becomes one card per request. It is a separate
          component rather than a restyled table because the phone layout
          shares no markup with the desktop one - it owns its own header,
          filters and empty state. */}
      <MobileLeaveList
        leaves={leaves}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
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

      {/* Leave Requests Section */}
      <div className="mt-8 hidden backdrop-blur-sm surface-card overflow-hidden lg:block">
        {leaves.length > 0 ? (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/60">
                  <thead className="bg-gray-50/80 dark:bg-gray-800/60">
                    <tr>
                      {user?.role === "admin" && (
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Employee
                        </th>
                      )}
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Type
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Duration
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Days
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Reason
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      {user?.role === "admin" && (
                        <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {leaves.map((leave: any) => (
                      <tr
                        key={leave._id}
                        className="group transition-colors duration-200 hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
                      >
                        {user?.role === "admin" && (
                          <td className="pl-2 pr-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={
                                  typeof leave.employee === "object"
                                    ? leave.employee?.profilePicture
                                    : null
                                }
                                name={
                                  typeof leave.employee === "object" &&
                                  leave.employee?.name
                                    ? leave.employee.name
                                    : "Unknown"
                                }
                                size="md"
                                className="flex-shrink-0"
                              />
                              <div className="flex flex-col">
                                <button
                                  onClick={() => {
                                    if (
                                      typeof leave.employee === "object" &&
                                      leave.employee?._id
                                    ) {
                                      navigate(
                                        `/employees/${leave.employee._id}`
                                      );
                                    }
                                  }}
                                  className="text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
                                >
                                  {typeof leave.employee === "object" &&
                                  leave.employee?.name
                                    ? leave.employee.name
                                    : "Unknown"}
                                </button>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {typeof leave.employee === "object" &&
                                  leave.employee?.employeeId
                                    ? leave.employee.employeeId
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium capitalize ${getLeaveTypeBadge(
                              leave.leaveType
                            )}`}
                          >
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              From:{" "}
                            </span>
                            <span>
                              {new Date(leave.startDate).toLocaleDateString()}
                            </span>
                            <span className="mx-2">-</span>
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              To:{" "}
                            </span>
                            <span>
                              {new Date(leave.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-baseline gap-1">
                            <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                              {leave.totalDays}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {leave.totalDays === 1 ? "day" : "days"}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="flex items-center space-x-2">
                              <div
                                className="text-sm line-clamp-2 text-gray-900 dark:text-gray-100 flex-1"
                                title={leave.reason}
                              >
                                {leave.reason}
                              </div>
                              {leave.reason && (
                                <button
                                  onClick={() =>
                                    showLeaveReasonPopup(leave.reason)
                                  }
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                                  title="View full reason"
                                >
                                  <EyeIcon className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={
                                getStatusDisplay(leave.status).className
                              }
                            >
                              {getStatusDisplay(leave.status).icon}
                              {getStatusDisplay(leave.status).text}
                            </span>
                            {leave.status === "rejected" &&
                              leave.reviewComments && (
                                <button
                                  onClick={() =>
                                    showRejectionCommentsPopup(
                                      leave.reviewComments
                                    )
                                  }
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                  title="View rejection reason"
                                >
                                  <EyeIcon className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" />
                                </button>
                              )}
                          </div>
                        </td>
                        {user?.role === "admin" && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {leave.status === "pending" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleReview(leave._id, "approved")
                                  }
                                  disabled={reviewLeaveMutation.isPending}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-inset ring-emerald-200/70 dark:ring-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectClick(leave._id)}
                                  disabled={reviewLeaveMutation.isPending}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 ring-1 ring-inset ring-red-200/70 dark:ring-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                Reviewed
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View - Shown on mobile and tablet */}
            {/* Mobile list.
                A native list, not a stack of framed cards: rows separated by
                hairlines inside the surrounding panel. The previous version
                nested a p-6 card inside a p-8 container, so every request cost
                56px of padding before any content and one row filled half a
                phone screen. */}
          </>
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
              className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectSubmit}
              disabled={reviewLeaveMutation.isPending}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-700 disabled:opacity-70"
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

      {/* Comments / Reason Modal */}
      <Modal
        open={showCommentsPopup}
        onClose={closeCommentsPopup}
        size="lg"
        title={popupContent.title}
        footer={
          <button
            onClick={closeCommentsPopup}
            className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Close
          </button>
        }
      >
        <div
          className={`rounded-xl border-l-4 p-4 ${
            popupContent.type === "rejection"
              ? "border-red-400 bg-red-50 dark:bg-red-900/20"
              : "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
          }`}
        >
          <div
            className={`text-sm leading-relaxed ${
              popupContent.type === "rejection"
                ? "text-red-700 dark:text-red-300"
                : "text-blue-700 dark:text-blue-300"
            }`}
          >
            {popupContent.content}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeavesPage;
