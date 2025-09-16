import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router-dom";
import { leavesAPI } from "../services/api";
// import { useNotifications } from "../components/NotificationSystem"; // Removed for Socket.IO implementation
import xlogoImage from "../assets/xlogoanimate.png";
// Inline type definition
interface LeaveRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}
import LoadingSpinner from "../components/LoadingSpinner";
import Avatar from "../components/Avatar";
import { 
  PlusIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

const LeavesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // const { addNotification } = useNotifications(); // Removed for Socket.IO implementation
  const [searchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Initialize selectedStatus from URL parameters on mount
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setSelectedStatus(statusFromUrl);
    }
  }, [searchParams]);

  // Function to get badge colors for leave types
  const getLeaveTypeBadge = (leaveType: string) => {
    switch (leaveType.toLowerCase()) {
      case 'annual':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'sick':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      case 'casual':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'maternity':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-200';
      case 'paternity':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200';
      case 'emergency':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Function to get status icons and colors
  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return {
          icon: <CheckCircleIcon className="w-4 h-4" />,
          className: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
          text: 'Approved'
        };
      case 'rejected':
        return {
          icon: <XCircleIcon className="w-4 h-4" />,
          className: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200',
          text: 'Rejected'
        };
      case 'pending':
        return {
          icon: <ClockIcon className="w-4 h-4" />,
          className: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
          text: 'Pending'
        };
      default:
        return {
          icon: <ClockIcon className="w-4 h-4" />,
          className: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
          text: status
        };
    }
  };

  const { data: leavesData, isLoading, refetch } = useQuery({
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
      // addNotification({
      //   type: 'success',
      //   title: 'Leave Request Submitted',
      //   message: 'Your leave request has been submitted and is pending approval.',
      // });
      console.log('Leave request submitted successfully');
      
      // Invalidate all related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => {
      console.error('Failed to submit leave:', error);
      // addNotification({
      //   type: 'error',
      //   title: 'Submission Failed',
      //   message: error?.response?.data?.message || 'Failed to submit leave request. Please try again.',
      // });
      console.error('Leave submission failed:', error?.response?.data?.message || error.message);
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
      // addNotification({
      //   type: newStatus === 'approved' ? 'success' : 'warning',
      //   title: `Leave Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      //   message: `${employeeName}'s leave request has been ${newStatus}.`,
      // });
      console.log(`Leave request ${newStatus} for ${employeeName}`);
      
      // Invalidate all related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => {
      console.error('Failed to review leave:', error);
      // addNotification({
      //   type: 'error',
      //   title: 'Review Failed',
      //   message: error?.response?.data?.message || 'Failed to review leave request. Please try again.',
      // });
      console.error('Leave review failed:', error?.response?.data?.message || error.message);
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
      // addNotification({
      //   type: 'error',
      //   title: 'Rejection Reason Required',
      //   message: 'Please provide a reason for rejecting this leave request.',
      // });
      console.warn('Rejection reason required');
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
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
          >
            Leave Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
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
              <img 
                src={xlogoImage} 
                alt="Loading..." 
                className="h-5 w-5 mr-2 animate-pulse object-contain"
                style={{ animation: 'pulse 1s ease-in-out infinite' }}
              />
            ) : (
              <ArrowPathIcon className="h-5 w-5 mr-2" />
            )}
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
              className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100"
            >
              Request Leave
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-900 dark:text-gray-100"
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
                  className="block text-sm font-medium text-gray-900 dark:text-gray-100"
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
                  className="block text-sm font-medium text-gray-900 dark:text-gray-100"
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
                  className="block text-sm font-medium text-gray-900 dark:text-gray-100"
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
      <div className="mt-10 bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {leaves.length > 0 ? (
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden lg:block p-8">
              <div className="overflow-hidden rounded-xl border border-gray-200/30 dark:border-gray-700/30">
                <table className="min-w-full divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 dark:from-gray-800/60 dark:to-gray-900/30">
                    <tr>
                      {user?.role === "admin" && (
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                          Employee
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Days
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Status
                      </th>
                      {user?.role === "admin" && (
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 dark:bg-gray-800/20 divide-y divide-gray-200/20 dark:divide-gray-700/20">
                    {leaves.map((leave: any) => (
                      <tr key={leave._id} className="group table-row-hover transition-all duration-300 ease-in-out hover:shadow-md rounded-lg cursor-pointer">
                        {user?.role === "admin" && (
                          <td className="pl-2 pr-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={typeof leave.employee === "object" ? leave.employee?.profilePicture : null}
                                name={typeof leave.employee === "object" && leave.employee?.name ? leave.employee.name : "Unknown"}
                                size="md"
                                className="flex-shrink-0"
                              />
                              <div className="flex flex-col">
                                <button
                                  onClick={() => {
                                    if (typeof leave.employee === "object" && leave.employee?._id) {
                                      navigate(`/employees/${leave.employee._id}`);
                                    }
                                  }}
                                  className="text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
                                >
                                  {typeof leave.employee === "object" &&
                                  leave.employee?.name
                                    ? leave.employee.name
                                    : "Unknown"}
                                </button>
                                <span className="text-xs text-gray-400">
                                  {typeof leave.employee === "object" &&
                                  leave.employee?.employeeId
                                    ? leave.employee.employeeId
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium capitalize ${getLeaveTypeBadge(leave.leaveType)}`}>
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">From: </span>
                            <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                            <span className="mx-2">-</span>
                            <span className="text-xs text-gray-600 dark:text-gray-300">To: </span>
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
                            <div className="text-sm line-clamp-2 text-gray-900 dark:text-gray-100" title={leave.reason}>
                              {leave.reason}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col space-y-1">
                            <span className={getStatusDisplay(leave.status).className}>
                              <span className="mr-2">
                                {getStatusDisplay(leave.status).icon}
                              </span>
                              {getStatusDisplay(leave.status).text}
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
            <div className="lg:hidden space-y-4 p-8">
              {leaves.map((leave: any) => (
                <div key={leave._id} className="rounded-xl p-6 border border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-br from-white/80 to-gray-50/40 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                  
                  {/* Header with Type and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium capitalize ${getLeaveTypeBadge(leave.leaveType)}`}>
                        {leave.leaveType}
                      </span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <span className={getStatusDisplay(leave.status).className}>
                        <span className="mr-2">
                          {getStatusDisplay(leave.status).icon}
                        </span>
                        {getStatusDisplay(leave.status).text}
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
                    <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={typeof leave.employee === "object" ? leave.employee?.profilePicture : null}
                          name={typeof leave.employee === "object" && leave.employee?.name ? leave.employee.name : "Unknown"}
                          size="sm"
                        />
                        <div>
                          <button
                            onClick={() => {
                              if (typeof leave.employee === "object" && leave.employee?._id) {
                                navigate(`/employees/${leave.employee._id}`);
                              }
                            }}
                            className="text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
                          >
                            {typeof leave.employee === "object" && leave.employee?.name
                              ? leave.employee.name
                              : "Unknown"}
                          </button>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {typeof leave.employee === "object" && leave.employee?.employeeId
                              ? leave.employee.employeeId
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="mb-3">
                    <div className="text-xs font-medium uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                      Duration
                    </div>
                    <div className="flex justify-between text-sm text-gray-900 dark:text-gray-100">
                      <div>
                        <span className="text-xs text-gray-600 dark:text-gray-300">From: </span>
                        {new Date(leave.startDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-xs text-gray-600 dark:text-gray-300">To: </span>
                        {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Reason Section */}
                  <div className="mb-4">
                    <div className="text-xs font-medium uppercase tracking-wider mb-2 text-gray-600 dark:text-gray-300">
                      Reason
                    </div>
                    <div className="text-sm line-clamp-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-gray-900 dark:text-gray-100">
                      {leave.reason}
                    </div>
                  </div>

                  {/* Action Buttons (Admin only) */}
                  {user?.role === "admin" && leave.status === "pending" && (
                    <div className="flex space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
                    <div className="pt-3 border-t text-center border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-400">Request Reviewed</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 px-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center">
              <ClockIcon
                className="w-10 h-10 text-gray-400 dark:text-gray-500"
              />
            </div>
            <p className="text-lg font-medium mb-2 text-gray-600 dark:text-gray-300">
              No leave requests found
            </p>
            <p className="text-sm max-w-md mx-auto text-gray-400 dark:text-gray-500">
              {selectedStatus ? `No ${selectedStatus} leave requests found` : 'Submit your first leave request to see it here'}
            </p>
          </div>
        )}
      </div>

      {/* Rejection Reason Popup */}
      {showRejectionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="rounded-lg p-6 w-full max-w-md mx-4 border shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Rejection Reason
            </h3>
            <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
              Please provide a reason for rejecting this leave request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs mt-1 mb-4 text-gray-600 dark:text-gray-300">
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
