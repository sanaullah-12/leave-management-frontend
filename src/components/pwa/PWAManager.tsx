import React from "react";
import { AnimatePresence } from "framer-motion";
import usePWA from "../../hooks/usePWA";
import InstallPrompt from "./InstallPrompt";
import UpdateNotice from "./UpdateNotice";
import OfflineIndicator from "./OfflineIndicator";

/**
 * PWAManager
 * ----------
 * The single mount point for everything progressive-web-app related.
 *
 * It is the only place that calls usePWA(), and therefore the only place that
 * registers the service worker: useRegisterSW registers once per call site, so
 * a second consumer anywhere in the tree would register a second worker.
 * Components below receive state as props instead of reaching for the hook.
 *
 * Mounted once, near the root, outside the router - installation and updates
 * are app-wide concerns and must not unmount on navigation.
 */
const PWAManager: React.FC = () => {
  const {
    canInstall,
    isInstalled,
    isIOS,
    isDismissed,
    updateReady,
    promptInstall,
    dismiss,
    applyUpdate,
  } = usePWA();

  // Chrome and Firefox on iOS cannot add to the home screen at all - only
  // Safari can - so the manual instructions would be a dead end there.
  const isIOSSafari =
    isIOS && !/CriOS|FxiOS|EdgiOS/.test(window.navigator.userAgent);

  const showInstall =
    !isInstalled && !isDismissed && (canInstall || isIOSSafari);

  return (
    <>
      <OfflineIndicator />

      <AnimatePresence>
        {updateReady && <UpdateNotice key="update" onReload={applyUpdate} />}
      </AnimatePresence>

      <AnimatePresence>
        {showInstall && (
          <InstallPrompt
            key="install"
            canInstall={canInstall}
            isIOSSafari={isIOSSafari}
            onInstall={promptInstall}
            onDismiss={dismiss}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PWAManager;
