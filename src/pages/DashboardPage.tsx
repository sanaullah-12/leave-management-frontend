import React from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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
              <span className="badge badge-primary rounded-full p-1  text-sm">
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
          {/* Modern Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Employees Card */}
            <div
              onClick={() => navigate("/employees")}
              className="dashboard-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-2">
                    Total Employees
                  </h3>
                  <div className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                    {adminStats.totalEmployees || 0}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                    Active workforce
                  </p>
                </div>
                <div className="p-4 bg-blue-500 dark:bg-blue-600 rounded-2xl group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-colors">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* This Month Leave Requests Card */}
            <div
              onClick={() => navigate("/leaves")}
              className="dashboard-card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-2">
                    This Month
                  </h3>
                  <div className="text-4xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                    {adminStats.thisMonthLeaves || 0}
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CalendarDaysIcon className="w-3 h-3 mr-1" />
                    Leave requests
                  </p>
                </div>
                <div className="p-4 bg-emerald-500 dark:bg-emerald-600 rounded-2xl group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-colors">
                  <CalendarDaysIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Pending Requests Card */}
            <div
              onClick={() => navigate("/leaves?status=pending")}
              className="dashboard-card bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2">
                    Pending
                  </h3>
                  <div className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                    {adminStats.pendingLeaves || 0}
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    Awaiting review
                  </p>
                </div>
                <div className="p-4 bg-amber-500 dark:bg-amber-600 rounded-2xl group-hover:bg-amber-600 dark:group-hover:bg-amber-500 transition-colors">
                  <ClockIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Approved Today Card */}
            <div
              onClick={() => navigate("/leaves?status=approved")}
              className="dashboard-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-2">
                    Approved Today
                  </h3>
                  <div className="text-4xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                    {adminStats.leavesByStatus?.find(
                      (s: any) => s._id === "approved"
                    )?.count || 0}
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Processed
                  </p>
                </div>
                <div className="p-4 bg-purple-500 dark:bg-purple-600 rounded-2xl group-hover:bg-purple-600 dark:group-hover:bg-purple-500 transition-colors">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
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
      <div className="mt-12 bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/40 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              📅 Recent Leave Requests
            </h2>
            <span className="text-sm px-3 py-1 rounded-full bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm" style={{ color: "var(--text-tertiary)" }}>
              Last {recentLeaves?.data?.leaves?.length || 0} requests
            </span>
          </div>
        </div>

        <div className="p-8">
          {leavesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (recentLeaves?.data?.leaves?.length || 0) > 0 ? (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden lg:block">
                <div className="overflow-hidden rounded-xl border border-gray-200/30 dark:border-gray-700/30">
                  <table className="min-w-full divide-y divide-gray-200/30 dark:divide-gray-700/30">
                    <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 dark:from-gray-800/60 dark:to-gray-900/30">
                      <tr>
                        {user?.role === "admin" && (
                          <th
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Employee
                          </th>
                        )}
                        <th
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Leave Type
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Duration
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Status
                        </th>
                        <th
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 dark:bg-gray-800/20 divide-y divide-gray-200/20 dark:divide-gray-700/20">
                      {recentLeaves!.data.leaves.map((leave: any) => (
                        <tr
                          key={leave._id}
                          className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/10 transition-all duration-300 ease-in-out hover:shadow-md rounded-lg cursor-pointer"
                        >
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
                          <td
                            className="px-4 py-4 whitespace-nowrap text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            <div>
                              <span
                                className="text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                From:{" "}
                              </span>
                              <span>
                                {new Date(leave.startDate).toLocaleDateString()}
                              </span>
                              <span className="mx-2">-</span>
                              <span
                                className="text-xs"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                To:{" "}
                              </span>
                              <span>
                                {new Date(leave.endDate).toLocaleDateString()}
                              </span>
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
                  <div
                    key={leave._id}
                    className="rounded-xl p-6 border border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-br from-white/80 to-gray-50/40 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                  >
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
                        {leave.status.charAt(0).toUpperCase() +
                          leave.status.slice(1)}
                      </span>
                    </div>

                    {/* Employee Info (Admin only) */}
                    {user?.role === "admin" && (
                      <div
                        className="flex items-center space-x-3 mb-3 pb-3 border-b"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
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
                      <div
                        className="text-xs font-medium uppercase tracking-wider mb-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Duration
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          From:{" "}
                        </span>
                        <span>
                          {new Date(leave.startDate).toLocaleDateString()}
                        </span>
                        <span className="mx-2">-</span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          To:{" "}
                        </span>
                        <span>
                          {new Date(leave.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div
                      className="flex justify-end space-x-3 pt-3 border-t"
                      style={{ borderColor: "var(--border-primary)" }}
                    >
                      <button
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-all"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {(user?.role === "admin" ||
                        leave.status === "pending") && (
                        <button
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-all"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      {user?.role === "admin" && (
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-all"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center">
                <CalendarDaysIcon
                  className="w-10 h-10"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </div>
              <p className="text-lg font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                No leave requests found
              </p>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-tertiary)" }}>
                Submit your first leave request to see it here and track your leave history
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
