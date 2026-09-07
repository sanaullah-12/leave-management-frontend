import React, { createContext, useContext, useMemo } from "react";
import usePWA, { type PWAState } from "../hooks/usePWA";

/**
 * PWAProvider
 * -----------
 * Calls usePWA() exactly once for the whole app and shares the result.
 *
 * The single call matters: usePWA wraps useRegisterSW, which registers a
 * service worker per call site. A second consumer anywhere in the tree would
 * register a second worker, and the two would contend over the same scope with
 * only one of them receiving pushes.
 *
 * That invariant used to be held by PWAManager simply being the only caller,
 * which worked until something outside it - the "Get app" button in the header
 * - also needed to know whether the app can be installed. A provider keeps the
 * single call and lets anyone read it.
 */

const PWAContext = createContext<PWAState | null>(null);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pwa = usePWA();

  // The hook returns a fresh object each render; memoising on its fields keeps
  // consumers from re-rendering when nothing they read has changed.
  const value = useMemo(
    () => pwa,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      pwa.canInstall,
      pwa.isInstalled,
      pwa.isIOS,
      pwa.isDismissed,
      pwa.updateReady,
      pwa.offlineReady,
    ]
  );

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
};

/**
 * The app's install/update state.
 *
 * Returns null outside the provider rather than throwing: every consumer of
 * this is an optional affordance - an install button, an update notice - and
 * none of them is worth taking a screen down for.
 */
export const usePWAState = (): PWAState | null => useContext(PWAContext);

export default PWAProvider;
