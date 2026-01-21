import React from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { leavesAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
// import ParticleBackground from "../components/ParticleBackground";
import Avatar from "../components/Avatar";
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

  // ✅ NEW: Add state for filtering leaves by status
  const [leaveStatusFilter, setLeaveStatusFilter] = React.useState<
    string | null
  >(null);

  // ✅ FIX: Calculate stats from leaves data since getDashboardStats may not exist
  const { data: allLeaves, isLoading: statsLoading } = useQuery({
    queryKey: ["all-leaves-for-stats"],
    queryFn: async () => {
      try {
        // Try getDashboardStats first
        if (leavesAPI.getDashboardStats) {
          return await leavesAPI.getDashboardStats();
        }
      } catch (error) {
        console.warn(
          "getDashboardStats failed, calculating from leaves:",
          error
        );
      }

      // Fallback: Calculate from all leaves
      const response = await leavesAPI.getLeaves(1, 100);
      const leaves = response?.data?.leaves || [];

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const thisMonthLeaves = leaves.filter((leave: any) => {
        const leaveDate = new Date(leave.createdAt || leave.startDate);
        return (
          leaveDate.getMonth() === currentMonth &&
          leaveDate.getFullYear() === currentYear
        );
      }).length;

      const pendingLeaves = leaves.filter(
        (leave: any) => leave.status === "pending"
      ).length;

      const leavesByStatus = [
        {
          _id: "approved",
          count: leaves.filter((leave: any) => leave.status === "approved")
            .length,
        },
        { _id: "pending", count: pendingLeaves },
        {
          _id: "rejected",
          count: leaves.filter((leave: any) => leave.status === "rejected")
            .length,
        },
      ];

      const uniqueEmployees = new Set(
        leaves
          .map((leave: any) =>
            typeof leave.employee === "object"
              ? leave.employee?._id
              : leave.employee
          )
          .filter(Boolean)
      );

      return {
        data: {
          totalEmployees: uniqueEmployees.size || 0,
          thisMonthLeaves,
          pendingLeaves,
          leavesByStatus,
        },
      };
    },
    enabled: user?.role === "admin",
    retry: 1,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // ✅ FIXED: Better data extraction and error handling
  const { data: employeeLeaveStats, isLoading: employeeStatsLoading } =
    useQuery({
      queryKey: ["employee-leave-stats"],
      queryFn: async () => {
        try {
          console.log("📊 Fetching employee leave stats...");
          const response = await leavesAPI.getMyLeaves();
          console.log("📊 Raw API response:", response);
          console.log("📊 Response structure:", {
            hasData: !!response?.data,
            hasLeaves: !!response?.data?.leaves,
            hasDataData: !!response?.data?.data,
            hasDataDataLeaves: !!response?.data?.data?.leaves,
          });

          // Try multiple possible response structures
          let leaves = null;
          if (response?.data?.data?.leaves) {
            leaves = response.data.data.leaves;
            console.log("✅ Using response.data.data.leaves");
          } else if (response?.data?.leaves) {
            leaves = response.data.leaves;
            console.log("✅ Using response.data.leaves");
          } else if (Array.isArray(response?.data)) {
            leaves = response.data;
            console.log("✅ Using response.data (array)");
          } else {
            console.error("❌ Could not find leaves array in response");
            console.error("❌ Available keys:", Object.keys(response || {}));
            console.error(
              "❌ Response.data keys:",
              Object.keys(response?.data || {})
            );
          }

          if (!Array.isArray(leaves)) {
            console.error("❌ Leaves is not an array:", typeof leaves, leaves);
            return {
              data: {
                thisMonthLeaves: 0,
                pendingLeaves: 0,
                approvedLeaves: 0,
                totalLeaves: 0,
              },
            };
          }

          console.log("📊 Successfully extracted leaves array:", leaves);
          console.log("📊 Leaves count:", leaves.length);

          if (leaves.length > 0) {
            console.log("📋 Sample leave:", leaves[0]);
          }

          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          // Count leaves
          const thisMonthLeaves = leaves.filter((leave: any) => {
            const leaveDate = new Date(leave.createdAt || leave.startDate);
            const isThisMonth =
              leaveDate.getMonth() === currentMonth &&
              leaveDate.getFullYear() === currentYear;
            return isThisMonth;
          }).length;

          const pendingLeaves = leaves.filter(
            (l: any) => l.status === "pending"
          ).length;
          const approvedLeaves = leaves.filter(
            (l: any) => l.status === "approved"
          ).length;
          const totalLeaves = leaves.length;

          const stats = {
            thisMonthLeaves,
            pendingLeaves,
            approvedLeaves,
            totalLeaves,
          };

          console.log("📊 Calculated stats:", stats);
          console.log("📊 Stats breakdown:");
          console.log("  - Total:", totalLeaves);
          console.log("  - Pending:", pendingLeaves);
          console.log("  - Approved:", approvedLeaves);
          console.log("  - This month:", thisMonthLeaves);

          return {
            data: stats,
          };
        } catch (error) {
          console.error("❌ Failed to fetch employee leave stats:", error);
          console.error(
            "❌ Error details:",
            error?.response?.data || error?.message
          );
          return {
            data: {
              thisMonthLeaves: 0,
              pendingLeaves: 0,
              approvedLeaves: 0,
              totalLeaves: 0,
            },
          };
        }
      },
      enabled: user?.role === "employee",
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      staleTime: 30 * 1000, // 30 seconds
      retry: 2, // Retry failed requests
    });

  const { data: leaveBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => leavesAPI.getLeaveBalance(),
    enabled: user?.role === "employee",
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentLeaves, isLoading: leavesLoading } = useQuery({
    queryKey: ["recent-leaves"],
    queryFn: () => leavesAPI.getLeaves(1, 5),
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  if (statsLoading && user?.role === "admin") {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const adminStats = allLeaves?.data || {};
  const balance = leaveBalance?.data?.balance || {};
  const employeeStats = employeeLeaveStats?.data || {
    thisMonthLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalLeaves: 0,
  };

  // ✅ Better debug logging
  console.log("👤 Employee Stats Display:");
  console.log("  - Raw data:", employeeLeaveStats);
  console.log("  - Extracted stats:", employeeStats);
  console.log("  - Loading:", employeeStatsLoading);
  console.log("  - Total leaves:", employeeStats.totalLeaves);
  console.log("  - Pending:", employeeStats.pendingLeaves);
  console.log("  - Approved:", employeeStats.approvedLeaves);
  console.log("  - This month:", employeeStats.thisMonthLeaves);

  // ✅ NEW: Filter leaves based on status
  const allLeavesList = recentLeaves?.data?.leaves || [];
  const filteredLeaves = leaveStatusFilter
    ? allLeavesList.filter((leave: any) => leave.status === leaveStatusFilter)
    : allLeavesList;

  return (
    <div className="relative space-y-8 fade-in">
      {/* Particle Background */}
      {/* <ParticleBackground /> */}

      {/* Main Content */}
      <div className="relative" style={{ zIndex: 10 }}>
        {/* Welcome Header */}
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 mb-8 bg-white dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-sm text-gray-400">
                {user?.role === "admin"
                  ? "Here's what's happening in your organization today"
                  : "Here's your leave overview and recent activity"}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="flex items-center space-x-3">
                <span className="badge badge-primary rounded-full p-1 text-sm">
                  {user?.role === "admin" ? "👑 Administrator" : "👤 Employee"}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500">
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
          // ✅ Admin Dashboard Cards
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Employees */}
            <div
              onClick={() => navigate("/employees")}
              className="dashboard-card bg-gray-800/50 dark:bg-gray-800/50 border border-gray-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
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

            {/* This Month Leave Requests */}
            <div
              onClick={() => {
                setLeaveStatusFilter(null);
                // Scroll to leaves section
                document
                  .getElementById("leaves-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
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

            {/* Pending Requests */}
            <div
              onClick={() => {
                setLeaveStatusFilter("pending");
                // Scroll to leaves section
                document
                  .getElementById("leaves-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
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

            {/* Approved Today */}
            <div
              onClick={() => {
                setLeaveStatusFilter("approved");
                // Scroll to leaves section
                document
                  .getElementById("leaves-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
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
        ) : (
          // ✅ Employee Dashboard Cards - SHOW PENDING, APPROVED, THIS MONTH, ALL LEAVES
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pending Leave Requests Card */}
            <div
              onClick={() => {
                setLeaveStatusFilter("pending");
                document
                  .getElementById("leaves-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="dashboard-card bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-emerald-800/20 border border-amber-200 dark:border-amber-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2">
                    Pending
                  </h3>
                  <div className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                    {employeeStatsLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      employeeStats.pendingLeaves
                    )}
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

            {/* Approved Leave Requests Card */}
            <div
              onClick={() => {
                setLeaveStatusFilter("approved");
                document
                  .getElementById("leaves-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="dashboard-card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-2">
                    Approved
                  </h3>
                  <div className="text-4xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                    {employeeStatsLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      employeeStats.approvedLeaves
                    )}
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Processed
                  </p>
                </div>
                <div className="p-4 bg-emerald-500 dark:bg-emerald-600 rounded-2xl group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 transition-colors">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* This Month Leave Requests Card */}
            <div
              onClick={() => {
                setLeaveStatusFilter(null);
                document
                  .getElementById("leaves-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="dashboard-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-2">
                    This Month
                  </h3>
                  <div className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                    {employeeStatsLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      employeeStats.thisMonthLeaves
                    )}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CalendarDaysIcon className="w-3 h-3 mr-1" />
                    Leave requests
                  </p>
                </div>
                <div className="p-4 bg-blue-500 dark:bg-blue-600 rounded-2xl group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-colors">
                  <CalendarDaysIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* ✅ NEW: All Leaves Card */}
            <div
              onClick={() => {
                setLeaveStatusFilter(null);
                navigate("/leaves");
              }}
              className="dashboard-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-2">
                    All Leaves
                  </h3>
                  <div className="text-4xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                    {employeeStatsLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      employeeStats.totalLeaves
                    )}
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <CalendarDaysIcon className="w-3 h-3 mr-1" />
                    Total requests
                  </p>
                </div>
                <div className="p-4 bg-purple-500 dark:bg-purple-600 rounded-2xl group-hover:bg-purple-600 dark:group-hover:bg-purple-500 transition-colors">
                  <CalendarDaysIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Recent Leave Requests - ADD ID FOR SCROLLING */}
        <div
          id="leaves-section"
          className="mt-12 bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        >
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/40 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  📅{" "}
                  {leaveStatusFilter
                    ? `${
                        leaveStatusFilter.charAt(0).toUpperCase() +
                        leaveStatusFilter.slice(1)
                      } `
                    : "Recent "}
                  Leave Requests
                </h2>
                {leaveStatusFilter && (
                  <button
                    onClick={() => setLeaveStatusFilter(null)}
                    className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    ✕ Clear Filter
                  </button>
                )}
              </div>
              <span className="text-sm px-3 py-1 rounded-full bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm text-gray-400 dark:text-gray-500">
                Showing {filteredLeaves.length} of {allLeavesList.length}{" "}
                requests
              </span>
            </div>
          </div>

          <div className="p-8">
            {leavesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredLeaves.length > 0 ? (
              <>
                {/* ✅ Desktop Table - USE FILTERED LEAVES */}
                <div className="hidden lg:block">
                  <div className="overflow-hidden rounded-xl border border-gray-200/30 dark:border-gray-700/30">
                    <table className="min-w-full divide-y divide-gray-200/30 dark:divide-gray-700/30">
                      <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 dark:from-gray-800/60 dark:to-gray-900/30">
                        <tr>
                          {user?.role === "admin" && (
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                              Employee
                            </th>
                          )}
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Leave Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 dark:bg-gray-800/20 divide-y divide-gray-200/20 dark:divide-gray-700/20">
                        {filteredLeaves.map((leave: any) => (
                          <tr
                            key={leave._id}
                            className="group table-row-hover transition-all duration-300"
                          >
                            {/* ✅ Employee Column Fixed */}
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

                            {/* Leave Type */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 capitalize">
                                {leave.leaveType}
                              </span>
                            </td>

                            {/* Duration */}
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {new Date(
                                    leave.startDate
                                  ).toLocaleDateString()}
                                </span>{" "}
                                -{" "}
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {new Date(leave.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400">
                                {leave.totalDays} days
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${
                                  leave.status === "approved"
                                    ? "bg-green-100 text-green-800 dark:bg-green-800/40 dark:text-green-300"
                                    : leave.status === "pending"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-800/40 dark:text-amber-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-800/40 dark:text-red-300"
                                }`}
                              >
                                {leave.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 flex gap-3">
                              <button className="hover:text-blue-500">
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button className="hover:text-green-500">
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button className="hover:text-red-500">
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ✅ Mobile Cards - USE FILTERED LEAVES */}
                <div className="lg:hidden space-y-4">
                  {filteredLeaves.map((leave: any) => (
                    <div
                      key={leave._id}
                      className="bg-white/50 dark:bg-gray-800/50 rounded-xl shadow p-4 space-y-4"
                    >
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
                        <div>
                          <button
                            onClick={() => {
                              if (
                                typeof leave.employee === "object" &&
                                leave.employee?._id
                              ) {
                                navigate(`/employees/${leave.employee._id}`);
                              }
                            }}
                            className="text-left font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
                          >
                            {typeof leave.employee === "object" &&
                            leave.employee?.name
                              ? leave.employee.name
                              : "Unknown"}
                          </button>
                          <p className="text-xs text-gray-400">
                            {leave.leaveType}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-900 dark:text-gray-100">
                          {new Date(leave.startDate).toLocaleDateString()} -{" "}
                          {new Date(leave.endDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {leave.totalDays} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={`px-2 py-1 text-xs rounded-full
                          ${
                            leave.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : leave.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {leave.status}
                        </span>
                        <div className="flex gap-2">
                          <button className="text-gray-400 hover:text-blue-500">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-green-500">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-red-500">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                {leaveStatusFilter
                  ? `No ${leaveStatusFilter} leave requests found`
                  : "No recent leave requests"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
