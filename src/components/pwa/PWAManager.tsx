import React from "react";
import { AnimatePresence } from "framer-motion";
import { usePWAState } from "../../providers/PWAProvider";
import InstallPrompt from "./InstallPrompt";
import UpdateNotice from "./UpdateNotice";
import OfflineIndicator from "./OfflineIndicator";

/**
 * PWAManager
 * ----------
 * The single mount point for everything progressive-web-app related.
 *
 * The single usePWA() call - and therefore the single service-worker
 * registration - now lives in PWAProvider, because the "Get app" button in
 * the header needs the same state and useRegisterSW registers once per call
 * site. This reads that shared state; components below still receive it as
 * props rather than reaching for it themselves.
 *
 * Mounted once, near the root, outside the router - installation and updates
 * are app-wide concerns and must not unmount on navigation.
 */
const PWAManager: React.FC = () => {
  const pwa = usePWAState();
  if (!pwa) return null;

  const {
    canInstall,
    isInstalled,
    isIOS,
    isDismissed,
    updateReady,
    promptInstall,
    dismiss,
    applyUpdate,
  } = pwa;

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
