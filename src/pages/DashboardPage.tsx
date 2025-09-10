import React from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { leavesAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  UsersIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => leavesAPI.getDashboardStats(),
    enabled: user?.role === "admin",
    refetchInterval: false, // Disabled auto-refresh
    refetchIntervalInBackground: false, // Disabled background refresh
    refetchOnWindowFocus: false, // Disabled window focus refresh
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const { data: leaveBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => leavesAPI.getLeaveBalance(),
    enabled: user?.role === "employee",
    refetchInterval: false, // Disabled auto-refresh
    refetchIntervalInBackground: false, // Disabled background refresh
    refetchOnWindowFocus: false, // Disabled window focus refresh
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  const { data: recentLeaves, isLoading: leavesLoading } = useQuery({
    queryKey: ["recent-leaves"],
    queryFn: () => leavesAPI.getLeaves(1, 5),
    refetchInterval: false, // Disabled auto-refresh
    refetchIntervalInBackground: false, // Disabled background refresh
    refetchOnWindowFocus: false, // Disabled window focus refresh
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  if (statsLoading && user?.role === "admin") {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const adminStats = stats?.data || {};
  const balance = leaveBalance?.data?.balance || {};

  return (
    <div className="space-y-8 fade-in">
      {/* Welcome Header */}
      <div
        className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 mb-8"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              {user?.role === "admin"
                ? "Here's what's happening in your organization today"
                : "Here's your leave overview and recent activity"}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-3">
              {/* {user?.role === 'employee' && (
                <a
                  href="/leaves"
                  className="btn-primary inline-flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Request Leave
                </a>
              )} */}
              <span className="badge badge-primary text-sm">
                {user?.role === "admin" ? "👑 Administrator" : "👤 Employee"}
              </span>
              <span
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                {typeof user?.department === "object" &&
                (user?.department as any)?.name
                  ? (user.department as any).name
                  : user?.department}
              </span>
            </div>
          </div>
        </div>
      </div>

      {user?.role === "admin" ? (
        // Admin Dashboard
        <>
          {/* Admin Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stats-card hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Total Employees
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {adminStats.totalEmployees || 0}
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    <ArrowTrendingUpIcon className="w-3 h-3 inline mr-1" />
                    Active workforce
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="stats-card hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    This Month
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {adminStats.thisMonthLeaves || 0}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    <CalendarDaysIcon className="w-3 h-3 inline mr-1" />
                    Leave requests
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                  <CalendarDaysIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="stats-card hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Pending
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {adminStats.pendingLeaves || 0}
                  </p>
                  <p className="text-xs text-yellow-500 mt-1">
                    <ClockIcon className="w-3 h-3 inline mr-1" />
                    Awaiting review
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl">
                  <ClockIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="stats-card hover-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Approved Today
                  </p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {adminStats.leavesByStatus?.find(
                      (s: any) => s._id === "approved"
                    )?.count || 0}
                  </p>
                  <p className="text-xs text-purple-500 mt-1">
                    <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                    Processed
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                  <CheckCircleIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Employee Dashboard
        <>
          {/* Employee Leave Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {!balanceLoading &&
              Object.entries(balance).map(([type, data]: [string, any]) => (
                <div key={type} className="stats-card hover-lift">
                  <div className="text-center">
                    <h3
                      className="text-lg font-semibold capitalize mb-4"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {type} Leave
                    </h3>

                    {/* Circular Progress */}
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <svg
                        className="w-24 h-24 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={
                            type === "annual"
                              ? "#3b82f6"
                              : type === "sick"
                              ? "#10b981"
                              : "#f59e0b"
                          }
                          strokeWidth="2"
                          strokeDasharray={`${
                            (data.used / data.total) * 100
                          }, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p
                            className="text-lg font-bold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {data.remaining}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            left
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--text-secondary)" }}>
                          Total:
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {data.total}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--text-secondary)" }}>
                          Used:
                        </span>
                        <span className="font-semibold text-red-600">
                          {data.used}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--text-secondary)" }}>
                          Available:
                        </span>
                        <span className="font-semibold text-green-600">
                          {data.remaining}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* Recent Leave Requests */}
      <div className="card-elevated">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              📅 Recent Leave Requests
            </h2>
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Last {recentLeaves?.data?.leaves?.length || 0} requests
            </span>
          </div>
        </div>

        <div className="card-body">
          {leavesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (recentLeaves?.data?.leaves?.length || 0) > 0 ? (
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
                          Leave Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Duration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700" style={{ backgroundColor: 'var(--surface)' }}>
                      {recentLeaves!.data.leaves.map((leave: any) => (
                        <tr key={leave._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          {user?.role === "admin" && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                                    {typeof leave.employee === "object" &&
                                    leave.employee?.name
                                      ? leave.employee.name
                                          .split(" ")
                                          .map((n: string) => n[0])
                                          .join("")
                                          .substring(0, 2)
                                      : "U"}
                                  </div>
                                </div>
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
                                  <div
                                    className="text-sm"
                                    style={{ color: "var(--text-secondary)" }}
                                  >
                                    {typeof leave.employee === "object" &&
                                    leave.employee?.employeeId
                                      ? leave.employee.employeeId
                                      : "N/A"}
                                  </div>
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
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                leave.status === "approved"
                                  ? "badge-success"
                                  : leave.status === "rejected"
                                  ? "badge-error"
                                  : "badge-warning"
                              }`}
                            >
                              {leave.status === "approved" && "✅ "}
                              {leave.status === "rejected" && "❌ "}
                              {leave.status === "pending" && "⏳ "}
                              {leave.status.charAt(0).toUpperCase() +
                                leave.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-all">
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              {(user?.role === "admin" ||
                                leave.status === "pending") && (
                                <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-all">
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                              )}
                              {user?.role === "admin" && (
                                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-all">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View - Shown on mobile and tablet */}
              <div className="lg:hidden space-y-4">
                {recentLeaves!.data.leaves.map((leave: any) => (
                  <div key={leave._id} className="rounded-lg p-4 border transition-all hover:shadow-md" 
                       style={{ 
                         backgroundColor: 'var(--surface-hover)',
                         borderColor: 'var(--border-primary)'
                       }}>
                    
                    {/* Header with Type and Status */}
                    <div className="flex items-start justify-between mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 capitalize">
                        {leave.leaveType}
                      </span>
                      
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          leave.status === "approved"
                            ? "badge-success"
                            : leave.status === "rejected"
                            ? "badge-error"
                            : "badge-warning"
                        }`}
                      >
                        {leave.status === "approved" && "✅ "}
                        {leave.status === "rejected" && "❌ "}
                        {leave.status === "pending" && "⏳ "}
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </div>

                    {/* Employee Info (Admin only) */}
                    {user?.role === "admin" && (
                      <div className="flex items-center space-x-3 mb-3 pb-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                            {typeof leave.employee === "object" &&
                            leave.employee?.name
                              ? leave.employee.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .substring(0, 2)
                              : "U"}
                          </div>
                        </div>
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
                          <div
                            className="text-xs"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {typeof leave.employee === "object" &&
                            leave.employee?.employeeId
                              ? leave.employee.employeeId
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Duration */}
                    <div className="mb-4">
                      <div className="text-xs font-medium uppercase tracking-wider mb-2" 
                           style={{ color: 'var(--text-secondary)' }}>
                        Duration
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>From: </span>
                        <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                        <span className="mx-2">-</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>To: </span>
                        <span>{new Date(leave.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-all" title="View Details">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {(user?.role === "admin" || leave.status === "pending") && (
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-all" title="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      {user?.role === "admin" && (
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-all" title="Delete">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CalendarDaysIcon
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "var(--text-tertiary)" }}
              />
              <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
                No leave requests found
              </p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Submit your first leave request to see it here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
