import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { BellIcon } from "@heroicons/react/24/outline";
import { useNotifications, voiceIdOf } from "../hooks/useNotifications";
import { NOTIFICATION_META, isVoiceNotification } from "../lib/voiceMeta";
import type { AppNotification } from "../types/employeeVoice";

/**
 * Where opening a notification should take you.
 *
 * Every type is listed rather than falling through to /leaves, which used to
 * send an announcement and a late-arrival notice to the leave screen - a
 * destination with nothing to do with either.
 */
export const notificationTarget = (n: AppNotification): string => {
  if (isVoiceNotification(n.type)) {
    const id = voiceIdOf(n);
    return id ? `/employee-voice?voice=${id}` : "/employee-voice";
  }
  if (n.type && n.type.startsWith("wfh_")) return "/work-from-home";
  if (n.type === "announcement") return "/announcements";
  if (n.type === "attendance_late") return "/attendance/late-time";
  // A release is about the app as a whole, so it opens the app.
  if (n.type === "app_update") return "/";
  return "/leaves";
};

/**
 * `compact` is for the desktop bar, where every control is a 36px chrome
 * button and a 44px one reads as oversized. The mobile header keeps the
 * default: 44px is the touch target, not a style choice.
 */
const NotificationBell: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({
    limit: 12,
  });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleOpen = (n: AppNotification) => {
    if (!n.read) markRead(n._id);
    setOpen(false);
    navigate(notificationTarget(n));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className={`relative flex items-center justify-center rounded-full border border-transparent text-gray-600 transition-colors hover:border-gray-200/80 hover:bg-white/60 hover:text-gray-900 dark:text-gray-300 dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-white ${
          compact ? "h-9 w-9" : "h-11 w-11"
        } ${open ? "border-gray-200/80 bg-white/60 text-gray-900 dark:border-white/10 dark:bg-white/10 dark:text-white" : ""}`}
      >
        <BellIcon className={compact ? "h-[18px] w-[18px]" : "h-6 w-6"} />
        {unreadCount > 0 && (
          // The count is ringed in the bar's own colour so it stays legible
          // where it overlaps the bell, and the ping is dropped under reduced
          // motion - an indefinite pulse in the chrome is exactly the kind of
          // thing that preference is for.
          <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-gray-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="glass-panel absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Notifications
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[24rem] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <BellIcon className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
                  <p className="mt-2 text-sm text-gray-400">You're all caught up</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const meta = NOTIFICATION_META[n.type];
                  const Icon = meta?.icon || BellIcon;
                  return (
                    <button
                      key={n._id}
                      onClick={() => handleOpen(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                        !n.read ? "bg-blue-50/40 dark:bg-blue-500/5" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                          meta?.tile || "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {n.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="block w-full border-t border-gray-100 py-2.5 text-center text-xs font-medium text-blue-600 hover:bg-gray-50 dark:border-gray-800 dark:text-blue-400 dark:hover:bg-gray-800/60"
            >
              View all notifications
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
