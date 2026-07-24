import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { leavesAPI } from "../services/api";
import { formatDistanceToNow } from "date-fns";
import { HeaderSkeleton, NotificationsSkeleton } from "../components/Skeletons";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

interface Notice {
  id: string;
  title: string;
  detail: string;
  status: "approved" | "rejected" | "pending";
  when: Date;
}

const STATUS_STYLE = {
  approved: {
    icon: CheckCircleIcon,
    ring: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  rejected: {
    icon: XCircleIcon,
    ring: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  },
  pending: {
    icon: ClockIcon,
    ring: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
} as const;

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-leaves"],
    queryFn: () => leavesAPI.getLeaves(1, 40),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const notices: Notice[] = useMemo(() => {
    const leaves: any[] = (data as any)?.data?.leaves || [];
    return leaves
      .map((lv) => {
        const empName =
          typeof lv.employee === "object" && lv.employee?.name
            ? lv.employee.name
            : "An employee";
        const type = `${lv.leaveType} leave`;
        const when = new Date(lv.updatedAt || lv.createdAt || lv.startDate);
        let title = "";
        let detail = "";
        if (lv.status === "pending") {
          title = isAdmin
            ? `${empName} requested ${type}`
            : `Your ${type} request is pending`;
          detail = isAdmin
            ? "Awaiting your review"
            : "Waiting for approval";
        } else if (lv.status === "approved") {
          title = isAdmin
            ? `${empName}'s ${type} was approved`
            : `Your ${type} was approved`;
          detail = `${lv.totalDays || ""} ${
            lv.totalDays === 1 ? "day" : "days"
          }`.trim();
        } else {
          title = isAdmin
            ? `${empName}'s ${type} was rejected`
            : `Your ${type} was rejected`;
          detail = lv.reviewComments || "See details in Leave Requests";
        }
        return {
          id: lv._id,
          title,
          detail,
          status: lv.status as Notice["status"],
          when,
        };
      })
      .sort((a, b) => b.when.getTime() - a.when.getTime());
  }, [data, isAdmin]);

  const pendingCount = notices.filter((n) => n.status === "pending").length;

  if (isLoading) {
    return (
      <div className="space-y-6 fade-in">
        <HeaderSkeleton />
        <NotificationsSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {pendingCount > 0
            ? `${pendingCount} item${pendingCount === 1 ? "" : "s"} need attention`
            : "You're all caught up"}
        </p>
      </div>

      {notices.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700/60">
            <BellIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            No notifications yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Leave activity will show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 shadow-sm divide-y divide-gray-100 dark:divide-gray-700/50 stagger-children">
          {notices.map((n) => {
            const s = STATUS_STYLE[n.status];
            const Icon = s.icon;
            return (
              <button
                key={n.id}
                onClick={() => navigate("/leaves")}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${s.ring}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                    {n.title}
                  </p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {n.detail}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                  {formatDistanceToNow(n.when, { addSuffix: true })}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
