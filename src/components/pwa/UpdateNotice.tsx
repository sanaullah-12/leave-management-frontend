import React from "react";
import { motion } from "framer-motion";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

/**
 * UpdateNotice
 * ------------
 * Shown when a new build has been installed and is waiting on a page load.
 *
 * The service worker has already activated by this point, so the update is
 * applied automatically the next time the app is launched. This notice only
 * exists so a user who is mid-session can take it immediately, instead of the
 * page reloading under them and discarding whatever they were typing.
 */

export interface UpdateNoticeProps {
  onReload: () => void;
}

const UpdateNotice: React.FC<UpdateNoticeProps> = ({ onReload }) => (
  <motion.div
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ type: "spring", stiffness: 380, damping: 30 }}
    className="fixed inset-x-0 top-3 z-40 mx-auto w-fit px-4"
    style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
    role="status"
  >
    <div className="flex items-center gap-3 rounded-full border border-gray-200/70 bg-white/95 py-1.5 pl-4 pr-1.5 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/95">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
        A new version of Nexora is available
      </span>
      <button
        type="button"
        onClick={onReload}
        className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <ArrowPathIcon className="h-3.5 w-3.5" />
        Refresh
      </button>
    </div>
  </motion.div>
);

export default UpdateNotice;
