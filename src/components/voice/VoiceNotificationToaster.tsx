import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { XMarkIcon, MegaphoneIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import { notificationTarget } from "../NotificationBell";
import { NOTIFICATION_META, isVoiceNotification } from "../../lib/voiceMeta";
import type { AppNotification } from "../../types/employeeVoice";

const MAX_VISIBLE = 3;

/**
 * Surfaces a premium, glowing slide-in card the moment a NEW Employee Voice
 * notification arrives (detected via background polling). Cards keep an unread
 * pulse until the admin opens them; opening marks the notification read and
 * jumps straight to the submission.
 */
const VoiceNotificationToaster: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const { notifications, markRead } = useNotifications({ limit: 20 });

  // Baseline = ids already present on first load (never toasted retroactively).
  const baseline = useRef<Set<string> | null>(null);
  const dismissed = useRef<Set<string>>(new Set());
  const [visible, setVisible] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    if (baseline.current === null) {
      baseline.current = new Set(notifications.map((n) => n._id));
      return;
    }

    setVisible((current) => {
      const byId = new Map(current.map((n) => [n._id, n]));

      for (const n of notifications) {
        const isNew =
          isVoiceNotification(n.type) &&
          !n.read &&
          !baseline.current!.has(n._id) &&
          !dismissed.current.has(n._id);
        if (isNew && !byId.has(n._id)) byId.set(n._id, n);
      }

      // Drop any that have since been read elsewhere.
      const readIds = new Set(
        notifications.filter((n) => n.read).map((n) => n._id)
      );
      let next = Array.from(byId.values()).filter((n) => !readIds.has(n._id));

      // Newest first, capped.
      next.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const capped = next.slice(0, MAX_VISIBLE);

      // Bail out when nothing actually changed.
      //
      // This always built a fresh array, so every run produced a new state
      // reference even when the same toasts were showing. Paired with a
      // `notifications` array whose identity changes on each poll, the two kept
      // re-triggering each other - React reported "Maximum update depth
      // exceeded" and the component re-rendered in a tight loop.
      const unchanged =
        capped.length === current.length &&
        capped.every((n, i) => n._id === current[i]._id);

      return unchanged ? current : capped;
    });
  }, [notifications, isAdmin]);

  const remove = (id: string) =>
    setVisible((v) => v.filter((n) => n._id !== id));

  const open = (n: AppNotification) => {
    markRead(n._id);
    dismissed.current.add(n._id);
    remove(n._id);
    navigate(notificationTarget(n));
  };

  const dismiss = (n: AppNotification) => {
    dismissed.current.add(n._id);
    remove(n._id);
  };

  if (!isAdmin) return null;

  return createPortal(
    // Stacked ABOVE the assistant launcher, not over it. Both sit bottom-right,
    // and at bottom-5 the toast cards covered the launcher entirely - the
    // assistant could not be clicked at all while a toast was showing. The
    // offsets clear the launcher (56px) plus its own bottom inset, and on
    // phones the mobile tab bar underneath it as well.
    <div className="pointer-events-none fixed bottom-[calc(11rem+env(safe-area-inset-bottom,0px))] right-5 z-[90] flex w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col gap-3 lg:bottom-24">
      <AnimatePresence>
        {visible.map((n) => {
          const meta = NOTIFICATION_META[n.type];
          const Icon = meta?.icon || MegaphoneIcon;
          return (
            <motion.div
              key={n._id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="voice-toast pointer-events-auto relative overflow-hidden rounded-2xl border border-blue-200/60 bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-blue-500/20 dark:bg-gray-900/95"
            >
              {/* unread accent bar */}
              <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-blue-400" />

              <div className="flex items-start gap-3 pl-1.5">
                <span className="relative mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-blue-600 dark:text-blue-400">
                  {/* Attention pulse as an expanding ring rather than a filled
                      plate, so the icon keeps its bare treatment. */}
                  <span className="absolute inset-0 animate-ping rounded-xl ring-1 ring-blue-400/40" />
                  <Icon className="relative h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {n.title}
                    </p>
                    <span className="flex h-2 w-2 flex-shrink-0">
                      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-400 opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {n.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <button
                      onClick={() => open(n)}
                      className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      View
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => dismiss(n)}
                  className="flex-shrink-0 rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                  aria-label="Dismiss"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default VoiceNotificationToaster;
