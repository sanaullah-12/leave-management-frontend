import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { leavesAPI } from "../services/api";
import { useNotifications } from "../components/NotificationSystem";
// Inline type definition
interface LeaveRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}
import LoadingSpinner from "../components/LoadingSpinner";
import { PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import "../styles/design-system.css";

const LeavesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [showForm, setShowForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: leavesData, isLoading, refetch } = useQuery({
    queryKey: ["leaves", selectedStatus],
    queryFn: () => leavesAPI.getLeaves(1, 20, selectedStatus),
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue refetching in background
    refetchOnWindowFocus: true, // Refetch when user comes back to the page
  });

  const handleRefresh = () => {
    refetch();
  };

  const submitLeaveMutation = useMutation({
    mutationFn: leavesAPI.submitLeave,
    onSuccess: (response) => {
      const newLeave = response.data.leave;
      
      // Update all relevant leave queries for both admin and employee views
      const updateAllLeaveQueries = () => {
        // Update main leaves query (current view)
        queryClient.setQueryData(["leaves", selectedStatus], (oldData: any) => {
          if (oldData?.data?.leaves) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                leaves: [newLeave, ...oldData.data.leaves],
                totalCount: oldData.data.totalCount + 1
              }
            };
          }
          return oldData;
        });
        
        // Update "all" status query if we're not already on it
        if (selectedStatus !== "") {
          queryClient.setQueryData(["leaves", ""], (oldData: any) => {
            if (oldData?.data?.leaves) {
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  leaves: [newLeave, ...oldData.data.leaves],
                  totalCount: oldData.data.totalCount + 1
                }
              };
            }
            return oldData;
          });
        }
        
        // Update pending status query (new requests are always pending)
        queryClient.setQueryData(["leaves", "pending"], (oldData: any) => {
          if (oldData?.data?.leaves) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                leaves: [newLeave, ...oldData.data.leaves],
                totalCount: oldData.data.totalCount + 1
              }
            };
          }
          return oldData;
        });

        // Update employee-specific queries if we have user info
        if (user?.id) {
          // Update employee leave requests query
          queryClient.setQueryData(['employee-leave-requests', user.id, '', new Date().getFullYear()], (oldData: any) => {
            if (oldData?.data?.leaves) {
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  leaves: [newLeave, ...oldData.data.leaves],
                  totalCount: oldData.data.totalCount + 1
                }
              };
            }
            return oldData;
          });

          // Update employee pending requests query
          queryClient.setQueryData(['employee-leave-requests', user.id, 'pending', new Date().getFullYear()], (oldData: any) => {
            if (oldData?.data?.leaves) {
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  leaves: [newLeave, ...oldData.data.leaves],
                  totalCount: oldData.data.totalCount + 1
                }
              };
            }
            return oldData;
          });
        }
      };

      updateAllLeaveQueries();
      setShowForm(false);
      reset();
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Leave Request Submitted',
        message: 'Your leave request has been submitted and is pending approval.',
      });
      
      // Invalidate all related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => {
      console.error('Failed to submit leave:', error);
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error?.response?.data?.message || 'Failed to submit leave request. Please try again.',
      });
    },
  });

  const reviewLeaveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      leavesAPI.reviewLeave(id, data),
    onSuccess: (response, { id, data }) => {
      // Get the updated leave from response
      const updatedLeave = response?.data?.leave;
      const newStatus = data.status;
      const reviewComments = data.reviewComments;

      // Optimistically update the cache without refetching
      const updateLeaveInQuery = (queryKey: string) => {
        queryClient.setQueryData(["leaves", queryKey], (oldData: any) => {
          if (oldData?.data?.leaves) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                leaves: oldData.data.leaves.map((leave: any) =>
                  leave._id === id ? { ...leave, status: newStatus, reviewComments: reviewComments } : leave
                )
              }
            };
          }
          return oldData;
        });
      };

      // Update employee-specific queries
      const updateEmployeeLeaveQueries = (employeeId: string) => {
        const currentYear = new Date().getFullYear();
        
        // Update all employee status queries
        ['', 'pending', 'approved', 'rejected'].forEach(status => {
          queryClient.setQueryData(['employee-leave-requests', employeeId, status, currentYear], (oldData: any) => {
            if (oldData?.data?.leaves) {
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  leaves: oldData.data.leaves.map((leave: any) =>
                    leave._id === id ? { ...leave, status: newStatus, reviewComments: reviewComments } : leave
                  )
                }
              };
            }
            return oldData;
          });
        });
      };

      // Update all admin view queries
      updateLeaveInQuery(selectedStatus);
      updateLeaveInQuery("");
      updateLeaveInQuery("pending");
      updateLeaveInQuery("approved");
      updateLeaveInQuery("rejected");

      // If we have employee ID from the updated leave, update their queries too
      if (updatedLeave && updatedLeave.employee && typeof updatedLeave.employee === 'object') {
        updateEmployeeLeaveQueries(updatedLeave.employee._id || updatedLeave.employee.id);
      } else if (updatedLeave && typeof updatedLeave.employee === 'string') {
        updateEmployeeLeaveQueries(updatedLeave.employee);
      }
      
      // Show success notification
      const employeeName = typeof updatedLeave?.employee === 'object' ? updatedLeave.employee.name : 'Employee';
      addNotification({
        type: newStatus === 'approved' ? 'success' : 'warning',
        title: `Leave Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: `${employeeName}'s leave request has been ${newStatus}.`,
      });
      
      // Invalidate all related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => {
      console.error('Failed to review leave:', error);
      addNotification({
        type: 'error',
        title: 'Review Failed',
        message: error?.response?.data?.message || 'Failed to review leave request. Please try again.',
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveRequest>();

  const onSubmit = async (data: LeaveRequest) => {
    try {
      await submitLeaveMutation.mutateAsync(data);
    } catch (error: any) {
      console.error("Failed to submit leave:", error);
    }
  };

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
      addNotification({
        type: 'error',
        title: 'Rejection Reason Required',
        message: 'Please provide a reason for rejecting this leave request.',
      });
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const leaves = leavesData?.data?.leaves || [];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Leave Requests
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
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
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {user?.role === "employee" && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex space-x-4">
        <button
          onClick={() => setSelectedStatus("")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedStatus === "" ? "badge-primary" : "btn-secondary"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedStatus("pending")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedStatus === "pending" ? "badge-warning" : "btn-secondary"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setSelectedStatus("approved")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedStatus === "approved" ? "badge-success" : "btn-secondary"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setSelectedStatus("rejected")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedStatus === "rejected" ? "badge-error" : "btn-secondary"
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Leave Request Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-elevated rounded-lg p-6 w-full max-w-md mx-4">
            <h2
              className="text-lg font-medium mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Request Leave
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Leave Type
                </label>
                <select
                  {...register("leaveType", {
                    required: "Leave type is required",
                  })}
                  className="mt-1 input-field"
                >
                  <option value="">Select leave type</option>
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
                {errors.leaveType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.leaveType.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  {...register("startDate", {
                    required: "Start date is required",
                  })}
                  className="mt-1 input-field"
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  {...register("endDate", { required: "End date is required" })}
                  className="mt-1 input-field"
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Reason
                </label>
                <textarea
                  {...register("reason", { required: "Reason is required" })}
                  rows={3}
                  className="mt-1 input-field"
                  placeholder="Please provide reason for leave"
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.reason.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLeaveMutation.isPending}
                  className="btn-primary"
                >
                  {submitLeaveMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Requests Section */}
      <div className="card">
        {leaves.length > 0 ? (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="" style={{ backgroundColor: 'var(--surface-hover)' }}>
                    <tr>
                      {user?.role === "admin" && (
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Employee
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Days
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Status
                      </th>
                      {user?.role === "admin" && (
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700" style={{ backgroundColor: 'var(--surface)' }}>
                    {leaves.map((leave: any) => (
                      <tr key={leave._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        {user?.role === "admin" && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <div
                                className="text-sm font-medium"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {typeof leave.employee === "object" &&
                                leave.employee?.name
                                  ? leave.employee.name
                                  : "Unknown"}
                              </div>
                              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                {typeof leave.employee === "object" &&
                                leave.employee?.employeeId
                                  ? leave.employee.employeeId
                                  : "N/A"}
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 capitalize">
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm" style={{ color: "var(--text-primary)" }}>
                          <div>
                            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>From: </span>
                            <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                            <span className="mx-2">-</span>
                            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>To: </span>
                            <span>{new Date(leave.endDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm line-clamp-2" style={{ color: "var(--text-primary)" }} title={leave.reason}>
                              {leave.reason}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col space-y-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                                leave.status === "approved"
                                  ? "badge-success"
                                  : leave.status === "rejected"
                                  ? "badge-error"
                                  : "badge-warning"
                              }`}
                            >
                              {leave.status}
                            </span>
                            {leave.status === "rejected" && leave.reviewComments && (
                              <div className="text-xs p-2 rounded border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20 max-w-xs">
                                <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                                  Rejection Reason:
                                </div>
                                <div className="text-red-700 dark:text-red-300">
                                  {leave.reviewComments}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        {user?.role === "admin" && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            {leave.status === "pending" ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleReview(leave._id, "approved")}
                                  disabled={reviewLeaveMutation.isPending}
                                  className="btn-success px-3 py-1 text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectClick(leave._id)}
                                  disabled={reviewLeaveMutation.isPending}
                                  className="btn-danger px-3 py-1 text-xs"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Reviewed</span>
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
            <div className="lg:hidden space-y-4">
              {leaves.map((leave: any) => (
                <div key={leave._id} className="rounded-lg p-4 border transition-all hover:shadow-md" 
                     style={{ 
                       backgroundColor: 'var(--surface-hover)',
                       borderColor: 'var(--border-primary)'
                     }}>
                  
                  {/* Header with Type and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 capitalize">
                        {leave.leaveType}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                          leave.status === "approved"
                            ? "badge-success"
                            : leave.status === "rejected"
                            ? "badge-error"
                            : "badge-warning"
                        }`}
                      >
                        {leave.status}
                      </span>
                      {leave.status === "rejected" && leave.reviewComments && (
                        <div className="text-xs p-3 rounded-md border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20">
                          <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                            Rejection Reason:
                          </div>
                          <div className="text-red-700 dark:text-red-300">
                            {leave.reviewComments}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employee Info (Admin only) */}
                  {user?.role === "admin" && (
                    <div className="mb-3 pb-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {typeof leave.employee === "object" && leave.employee?.name
                          ? leave.employee.name
                          : "Unknown"}
                      </div>
                      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {typeof leave.employee === "object" && leave.employee?.employeeId
                          ? leave.employee.employeeId
                          : "N/A"}
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="mb-3">
                    <div className="text-xs font-medium uppercase tracking-wider mb-2" 
                         style={{ color: 'var(--text-secondary)' }}>
                      Duration
                    </div>
                    <div className="flex justify-between text-sm" style={{ color: 'var(--text-primary)' }}>
                      <div>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>From: </span>
                        {new Date(leave.startDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>To: </span>
                        {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Reason Section */}
                  <div className="mb-4">
                    <div className="text-xs font-medium uppercase tracking-wider mb-2" 
                         style={{ color: 'var(--text-secondary)' }}>
                      Reason
                    </div>
                    <div className="text-sm line-clamp-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md" 
                         style={{ color: 'var(--text-primary)' }}>
                      {leave.reason}
                    </div>
                  </div>

                  {/* Action Buttons (Admin only) */}
                  {user?.role === "admin" && leave.status === "pending" && (
                    <div className="flex space-x-3 pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                      <button
                        onClick={() => handleReview(leave._id, "approved")}
                        disabled={reviewLeaveMutation.isPending}
                        className="btn-success px-4 py-2 text-sm flex-1"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(leave._id)}
                        disabled={reviewLeaveMutation.isPending}
                        className="btn-danger px-4 py-2 text-sm flex-1"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {user?.role === "admin" && leave.status !== "pending" && (
                    <div className="pt-3 border-t text-center" style={{ borderColor: 'var(--border-primary)' }}>
                      <span className="text-sm text-gray-400">Request Reviewed</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p style={{ color: "var(--text-secondary)" }}>
              No leave requests found
            </p>
          </div>
        )}
      </div>

      {/* Rejection Reason Popup */}
      {showRejectionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" style={{ backgroundColor: 'var(--surface-primary)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Rejection Reason
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Please provide a reason for rejecting this leave request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border rounded-md resize-none"
              style={{ 
                backgroundColor: 'var(--surface-secondary)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              rows={4}
              maxLength={500}
            />
            <div className="text-xs mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
              {rejectionReason.length}/500 characters
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRejectCancel}
                className="btn-secondary px-4 py-2 flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={reviewLeaveMutation.isPending}
                className="btn-danger px-4 py-2 flex-1"
              >
                {reviewLeaveMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesPage;
