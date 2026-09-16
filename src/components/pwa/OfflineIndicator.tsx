import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SignalSlashIcon } from "@heroicons/react/24/outline";

/**
 * OfflineIndicator
 * ----------------
 * Tells the user the network is gone.
 *
 * This is what an installed SPA needs instead of a static offline.html. The
 * service worker precaches the app shell and serves it as the navigation
 * fallback, so the app still *opens* offline - it is the data behind it that
 * cannot load. A separate offline page would never be reached, whereas an
 * unexplained set of failing screens is exactly the confusion this prevents.
 *
 * `navigator.onLine` only proves a network interface exists, not that the
 * backend is reachable - it is reliable for "definitely offline", which is the
 * only claim made here.
 */
const OfflineIndicator: React.FC = () => {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine === false
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      /* Below the mobile app bar rather than over it: at top-3 the pill landed
         on the screen title, and on an installed iPhone inside the status bar.
         Desktop has no app bar in the way and keeps the original place. */
      className="fixed inset-x-0 top-[calc(var(--safe-top)+var(--app-bar-h)+0.5rem)] z-40 mx-auto w-fit px-4 lg:top-[calc(var(--safe-top)+0.75rem)]"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 shadow-lg shadow-black/5 dark:border-amber-500/25 dark:bg-amber-500/10">
        <SignalSlashIcon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
          You are offline. Showing the last loaded data.
        </span>
      </div>
    </motion.div>
  );
};

export default OfflineIndicator;
