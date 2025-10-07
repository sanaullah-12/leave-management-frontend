import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { realMachinePerformanceAPI } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import Avatar from "./Avatar";
import {
  TrophyIcon,
  ChartBarIcon,
  ServerIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowTrendingDownIcon,
  SignalIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import {
  TrophyIcon as TrophySolidIcon,
  StarIcon as StarSolidIcon,
  FireIcon as FireSolidIcon,
} from "@heroicons/react/24/solid";
import "../styles/design-system.css";

interface MachinePerformanceDashboardProps {
  machineIP: string;
  isConnected: boolean;
  employees: any[]; // From machine connection
}

const MachinePerformanceDashboard: React.FC<
  MachinePerformanceDashboardProps
> = ({ machineIP, isConnected, employees }) => {
  // Date range state (default to last 2 months)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Display controls
  const [leaderboardLimit, setLeaderboardLimit] = useState(10);
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview");

  // Fetch real machine users performance data
  const {
    data: performanceData,
    isLoading: performanceLoading,
    error: performanceError,
    refetch: refetchPerformance,
  } = useQuery({
    queryKey: [
      "real-machine-performance",
      machineIP,
      startDate,
      endDate,
      leaderboardLimit,
    ],
    queryFn: () =>
      realMachinePerformanceAPI.getMachineUsersPerformance(machineIP, {
        startDate,
        endDate,
        limit: leaderboardLimit,
      }),
    enabled: !!machineIP && isConnected,
  });

  // Fetch machine summary data
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["machine-summary", machineIP],
    queryFn: () => realMachinePerformanceAPI.getMachineSummary(machineIP),
    enabled: !!machineIP && isConnected,
  });

  // Get performance level styling
  const getPerformanceLevelStyle = (level: string) => {
    switch (level) {
      case "star":
        return {
          bg: "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
          border: "border-yellow-200 dark:border-yellow-700",
          text: "text-yellow-800 dark:text-yellow-200",
          icon: StarSolidIcon,
          badge:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        };
      case "excellent":
        return {
          bg: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
          border: "border-green-200 dark:border-green-700",
          text: "text-green-800 dark:text-green-200",
          icon: TrophySolidIcon,
          badge:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        };
      case "good":
        return {
          bg: "bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20",
          border: "border-blue-200 dark:border-blue-700",
          text: "text-blue-800 dark:text-blue-200",
          icon: FireSolidIcon,
          badge:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        };
      case "poor":
        return {
          bg: "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20",
          border: "border-orange-200 dark:border-orange-700",
          text: "text-orange-800 dark:text-orange-200",
          icon: ArrowTrendingDownIcon,
          badge:
            "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20",
          border: "border-gray-200 dark:border-gray-700",
          text: "text-gray-800 dark:text-gray-200",
          icon: ArrowTrendingDownIcon,
          badge:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        };
    }
  };

  // Get rank medal icon
  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-2xl">🥇</span>;
      case 2:
        return <span className="text-2xl">🥈</span>;
      case 3:
        return <span className="text-2xl">🥉</span>;
      default:
        return (
          <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
            #{rank}
          </span>
        );
    }
  };

  // Get badge display for machine-specific badges
  const getBadgeDisplay = (badges: string[]) => {
    const badgeMap: {
      [key: string]: { icon: string; text: string; color: string };
    } = {
      PERFECT_ATTENDANCE: {
        icon: "🏅",
        text: "Perfect",
        color: "bg-yellow-100 text-yellow-800",
      },
      PUNCTUALITY_CHAMPION: {
        icon: "⚡",
        text: "Punctual",
        color: "bg-blue-100 text-blue-800",
      },
      MACHINE_STAR: {
        icon: "⭐",
        text: "Machine Star",
        color: "bg-purple-100 text-purple-800",
      },
      NEVER_LATE: {
        icon: "🎯",
        text: "Never Late",
        color: "bg-green-100 text-green-800",
      },
    };

    return badges.slice(0, 2).map((badge, index) => {
      const badgeInfo = badgeMap[badge] || {
        icon: "🏆",
        text: badge,
        color: "bg-gray-100 text-gray-800",
      };
      return (
        <span
          key={index}
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeInfo.color} mr-1`}
        >
          <span className="mr-1">{badgeInfo.icon}</span>
          {badgeInfo.text}
        </span>
      );
    });
  };

  const leaderboard = performanceData?.data?.leaderboard || [];
  const machineInfo = performanceData?.data?.machineInfo;
  const summary = performanceData?.data?.summary;
  const machineSummary = summaryData?.data;

  const isLoading = performanceLoading || summaryLoading;

  // Don't show if machine is not connected
  if (!isConnected) {
    return (
      <div className="card bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <div className="p-6 text-center">
          <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Machine Performance Dashboard
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Connect to a biometric machine to view employee performance data
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600 dark:text-gray-300">
            Loading machine performance data...
          </span>
        </div>
      </div>
    );
  }

  if (performanceError) {
    return (
      <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
        <div className="p-6 text-center">
          <p className="text-red-800 dark:text-red-200">
            Failed to load machine performance data. Please try again.
          </p>
          <button
            onClick={() => refetchPerformance()}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <CpuChipIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            Machine Performance Dashboard
          </h2>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <ServerIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-300 font-mono">
                {machineIP}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <SignalIcon className="h-5 w-5 text-green-500" />
              <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                Connected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-300 text-sm">
                {employees.length} machine employees
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("overview")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === "overview"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === "detailed"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Machine Statistics */}
      {(machineInfo || summary || machineSummary) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-blue-200 dark:border-blue-700">
            <div className="p-6 text-center">
              <ServerIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {machineInfo?.totalUsers || machineSummary?.totalUsers || 0}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Machine Employees
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
            <div className="p-6 text-center">
              <CalendarDaysIcon className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {summary?.dateRange?.workingDays || 0}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Working Days
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
            <div className="p-6 text-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {(
                  summary?.totalRecords ||
                  machineSummary?.totalAttendanceRecords ||
                  0
                ).toLocaleString()}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                Total Records
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700">
            <div className="p-6 text-center">
              <SignalIcon className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                {machineInfo?.activeUsers || 0}/{machineInfo?.totalUsers || 0}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Active Users
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Machine Employee Leaderboard */}
      <div className="card">
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-b border-blue-200 dark:border-blue-700 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  🏆 Top Machine Performers
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Machine: {machineIP} • {leaderboard.length} employees analyzed
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={leaderboardLimit}
                onChange={(e) => setLeaderboardLimit(Number(e.target.value))}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>All</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {leaderboard.length > 0 ? (
            <div className="space-y-4">
              {leaderboard.map((entry: any) => {
                const style = getPerformanceLevelStyle(
                  entry.performance.performanceLevel
                );
                const IconComponent = style.icon;

                return (
                  <div
                    key={entry.user.userId}
                    className={`p-4 rounded-xl border-2 ${style.border} ${style.bg} hover:shadow-lg transition-all duration-300 group cursor-pointer`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 text-center">
                        {getRankMedal(entry.rank)}
                      </div>

                      {/* Employee Avatar */}
                      <div className="flex-shrink-0">
                        <Avatar
                          src="" // Machine employees don't have profile pictures
                          name={entry.user.name}
                          size="lg"
                          className="ring-2 ring-white dark:ring-gray-800 shadow-lg"
                        />
                      </div>

                      {/* Employee Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                            {entry.user.name}
                          </h4>
                          <IconComponent className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                          <span>ID: {entry.user.userId}</span>
                          <span>•</span>
                          <span>Dept: {entry.user.department}</span>
                          <span>•</span>
                          <span>{entry.performance.totalRecords} records</span>
                        </div>

                        {/* Badges */}
                        <div className="mt-2">
                          {getBadgeDisplay(entry.performance.badges)}
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="flex-shrink-0 text-right space-y-1">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {entry.performance.attendanceRate}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {entry.performance.presentDays}/
                          {entry.performance.totalWorkingDays} days
                        </div>
                        {viewMode === "detailed" && (
                          <div className="text-xs space-y-1">
                            <div className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {entry.performance.avgRecordsPerDay} rec/day
                            </div>
                            <div className="text-xs text-gray-500">
                              Score: {entry.performance.finalScore}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed view expansion */}
                    {viewMode === "detailed" && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {entry.performance.checkIns || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              Check Ins
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {entry.performance.checkOuts || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              Check Outs
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {entry.performance.avgRecordsPerDay}
                            </div>
                            <div className="text-xs text-gray-500">
                              Avg Records/Day
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ServerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No performance data available for machine {machineIP} in the
                selected period.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Ensure attendance data is synced from the biometric machine.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachinePerformanceDashboard;
