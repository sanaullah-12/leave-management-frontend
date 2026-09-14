import React from "react";
import SectionHeader from "../components/ui/SectionHeader";
import { sectionIllustration } from "../components/ui/illustrations";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useNotifications } from "../hooks/useNotifications";
import { notificationTarget } from "../components/NotificationBell";
import { NOTIFICATION_META } from "../lib/voiceMeta";
import LogoLoader from "../components/LogoLoader";
import { staggerContainer, staggerItem } from "../lib/motion";
import "../styles/design-system.css";

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotifications({ limit: 50 });

  if (isLoading) {
    return <LogoLoader label="Loading notifications..." />;
  }

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <SectionHeader
          variant="notifications"
          eyebrow="Activity"
          title="Notifications"
          description={
            unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                } waiting on you.`
              : "You're all caught up - nothing needs your attention."
          }
          illustration={sectionIllustration("notifications")}
          action={
            unreadCount > 0 ? (
              <button onClick={() => markAllRead()} className="sh-action">
                <CheckIcon className="h-4 w-4" />
                Mark all read
              </button>
            ) : undefined
          }
        />
      </motion.div>

      {notifications.length === 0 ? (
        <motion.div
          variants={staggerItem}
          className="surface-card py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-blue-600 dark:text-blue-400">
            <BellIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            No notifications yet
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Leave and Employee Voice activity will show up here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerItem}
          className="surface-card divide-y divide-gray-100 overflow-hidden dark:divide-gray-700/50"
        >
          {notifications.map((n) => {
            const meta = NOTIFICATION_META[n.type];
            const Icon = meta?.icon || BellIcon;
            return (
              <button
                key={n._id}
                onClick={() => {
                  if (!n.read) markRead(n._id);
                  navigate(notificationTarget(n));
                }}
                className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/30 ${
                  !n.read ? "bg-blue-50/40 dark:bg-blue-500/5" : ""
                }`}
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    meta?.tile || "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {n.message}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                  <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </button>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

export default NotificationsPage;
