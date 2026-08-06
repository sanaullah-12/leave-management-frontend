import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownTrayIcon,
  ArrowUpOnSquareIcon,
  PlusSmallIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AppLogo from "../AppLogo";

/**
 * InstallPrompt
 * -------------
 * The "Install Nexora" surface.
 *
 * Purely presentational: every piece of state arrives as a prop from
 * {@link PWAManager}, which owns the single usePWA() instance. This component
 * deliberately calls no PWA hook of its own - useRegisterSW registers a service
 * worker per call site, so more than one consumer would register twice.
 *
 * Two shapes, because the platforms differ:
 *   - Android/desktop get a real button wired to the native prompt.
 *   - iOS gets instructions, since Safari exposes no install API - the user
 *     must go through Share -> Add to Home Screen.
 */

export interface InstallPromptProps {
  /** A native install prompt is available right now. */
  canInstall: boolean;
  /** iOS Safari, where installation is manual. */
  isIOSSafari: boolean;
  onInstall: () => Promise<boolean>;
  onDismiss: () => void;
}

const CARD =
  "rounded-2xl border border-gray-200/70 bg-white/95 shadow-xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/95";

const InstallPrompt: React.FC<InstallPromptProps> = ({
  canInstall,
  isIOSSafari,
  onInstall,
  onDismiss,
}) => {
  const [installing, setInstalling] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  // On iOS there is no prompt to fire, so the button toggles instructions.
  const manualIOS = isIOSSafari && !canInstall;

  const handleClick = async () => {
    if (manualIOS) {
      setShowIOSHelp((open) => !open);
      return;
    }

    setInstalling(true);
    try {
      await onInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      // Sits above the mobile bottom navigation and clear of the iOS home
      // indicator. z-40 keeps it under modals and toasts.
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md sm:left-auto sm:right-6 sm:mx-0"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="dialog"
      aria-label="Install Nexora"
    >
      <div className={`${CARD} p-4`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            <AppLogo size={38} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Install Nexora
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              {manualIOS
                ? "Add Nexora to your Home Screen for full-screen access."
                : "Get faster access and a full-screen app experience."}
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss install prompt"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showIOSHelp && (
            <motion.ol
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2 overflow-hidden rounded-xl bg-gray-50 p-3 text-xs text-gray-700 dark:bg-white/5 dark:text-gray-300"
            >
              <li className="flex items-center gap-2">
                <ArrowUpOnSquareIcon className="h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  Tap <strong>Share</strong> in the Safari toolbar.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <PlusSmallIcon className="h-4 w-4 shrink-0 text-blue-600" />
                <span>
                  Choose <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-4 w-4 shrink-0" />
                <span>
                  Tap <strong>Add</strong> to finish.
                </span>
              </li>
            </motion.ol>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={handleClick}
          disabled={installing}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-70"
        >
          {manualIOS ? (
            <>
              <ArrowUpOnSquareIcon className="h-4 w-4" />
              {showIOSHelp ? "Hide steps" : "Show me how"}
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="h-4 w-4" />
              {installing ? "Installing..." : "Install Nexora"}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default InstallPrompt;
