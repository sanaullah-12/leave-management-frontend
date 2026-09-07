import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BellAlertIcon,
  BellSlashIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import { usePushNotifications } from "../../hooks/usePushNotifications";

/**
 * PushNotificationToggle
 * ----------------------
 * The button that turns on browser/OS alerts for this device.
 *
 * A button, not an icon, and deliberately so. This sits on a dashboard that
 * already has a bell in the header - the in-app notification centre - and an
 * unlabelled bell here is indistinguishable from it, so it reads as decoration
 * and gets ignored. It is styled to match the hero's other actions because it
 * is one: something the employee does, once.
 *
 * The three states are the three things an employee can be told:
 *
 *   not enabled  "Enable notifications", blue    - has not been asked yet
 *   enabled      "Notifications on", green       - alerts are arriving
 *   blocked      "Notifications blocked", amber  - the browser refuses, and
 *                                                  only they can undo it
 *
 * Clicking always opens the explanation first. The browser permission prompt is
 * never raised on load: a browser permanently blocks a site that prompts
 * without being asked, and a blocked site cannot ask again - one unprompted
 * call would cost this employee the feature for good. The prompt is raised from
 * the button inside the modal, which is a real user gesture.
 *
 * The explanation is a modal rather than a popover because the hero card is
 * `overflow-hidden`; a dropdown anchored to this button would be clipped by it.
 *
 * None of this is required for notifications to work. It governs the browser
 * copy only - the header bell and the notification centre are fed by Socket.IO
 * and are unaffected by every state below.
 */

const PushNotificationToggle: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { state, busy, error, isEnabled, isBlocked, isUnavailable, enable, disable, sendTest } =
    usePushNotifications();

  const [open, setOpen] = useState(false);
  const [tested, setTested] = useState<null | "sent" | "failed">(null);

  // A deployment with no VAPID keys, or a browser with no Push API, has nothing
  // to offer. Showing a control that cannot work is worse than showing none.
  if (isUnavailable) return null;

  const Icon = isEnabled ? BellAlertIcon : isBlocked ? BellSlashIcon : BellIcon;

  const label = isEnabled
    ? "Notifications on"
    : isBlocked
      ? "Notifications blocked"
      : "Enable notifications";

  // Same shape and weight as the hero's other secondary action, so it reads as
  // part of the set rather than as an alert bolted onto the card.
  const base =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium backdrop-blur border transition-colors";

  const tone = isEnabled
    ? "text-emerald-700 dark:text-emerald-400 bg-white/80 dark:bg-gray-800/80 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
    : isBlocked
      ? "text-amber-700 dark:text-amber-400 bg-white/80 dark:bg-gray-800/80 border-amber-300 dark:border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-500/10"
      : "text-blue-700 dark:text-blue-300 bg-white/80 dark:bg-gray-800/80 border-blue-300 dark:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10";

  const handleEnable = async () => {
    const next = await enable();
    if (next === "enabled") {
      const ok = await sendTest();
      setTested(ok ? "sent" : "failed");
    }
  };

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        aria-label={label}
        className={`${base} ${tone} ${className}`}
      >
        <Icon className="w-4 h-4" />
        {label}
        {isEnabled && (
          <span className="ml-0.5 h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
        )}
      </motion.button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        icon={<Icon className="h-6 w-6" />}
        iconClassName={
          isEnabled
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            : isBlocked
              ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
              : undefined
        }
        title={
          isEnabled
            ? "Browser notifications are on"
            : isBlocked
              ? "Notifications are blocked"
              : "Enable browser notifications"
        }
        footer={
          isBlocked ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Close
            </button>
          ) : isEnabled ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={async () => setTested((await sendTest()) ? "sent" : "failed")}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Send a test
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => disable()}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {busy ? "Working..." : "Turn off"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Not now
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleEnable}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <BellIcon className="h-4 w-4" />
                {busy ? "Enabling..." : "Enable notifications"}
              </button>
            </>
          )
        }
      >
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {isEnabled
            ? "You will be notified on this device even when Nexora is closed."
            : isBlocked
              ? "Your browser is refusing notifications for Nexora. Open your browser's site settings for this page, set Notifications to Allow, then reload."
              : "Enable notifications to receive important attendance, leave, WFH and HR updates."}
        </p>

        {error && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {tested === "sent" && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
            Test notification sent to this device.
          </p>
        )}
        {tested === "failed" && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
            Registered, but the test notification could not be delivered.
          </p>
        )}

        <p className="mt-4 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-400 dark:border-gray-700 dark:text-gray-500">
          {state === "granted-unsubscribed"
            ? "Re-registering this device..."
            : "Separate from the bell in the header, which lists notifications inside the app. This one alerts you outside it."}
        </p>
      </Modal>
    </>
  );
};

export default PushNotificationToggle;
