import { useCallback, useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * usePWA
 * ------
 * Owns every piece of install/update state the UI needs, so components never
 * touch service-worker or `beforeinstallprompt` plumbing directly.
 *
 * The awkward part of PWA installation is that the three platforms disagree:
 *
 *   Android/Chrome  fires `beforeinstallprompt`, which must be captured and
 *                   replayed later - the event is only valid once, and calling
 *                   prompt() outside a user gesture is ignored.
 *   iOS/Safari      fires nothing and exposes no install API at all. The only
 *                   route is Share -> Add to Home Screen, so the app has to
 *                   detect iOS and explain the manual steps.
 *   Desktop         behaves like Android but the app may already be installed,
 *                   in which case no event ever arrives.
 *
 * This hook normalises all three into: can we install, are we already
 * installed, and what should the button do.
 */

/** The `beforeinstallprompt` event is still non-standard, so it is typed here. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

const DISMISSED_KEY = "nexora:pwa:install-dismissed";

/**
 * True when the app is running as an installed app rather than a browser tab.
 * `display-mode: standalone` covers Android and desktop; `navigator.standalone`
 * is the iOS-only equivalent that predates the media query.
 */
const detectStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    // iOS Safari only.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

const detectIOS = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac, so the touch check is what
  // distinguishes an iPad from a desktop Safari.
  const iPadOS =
    /Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
};

export interface PWAState {
  /** A native install prompt is available and can be shown right now. */
  canInstall: boolean;
  /** Running as an installed app. */
  isInstalled: boolean;
  /** iOS, where installation is manual via the Share sheet. */
  isIOS: boolean;
  /** The user closed the install banner; do not nag them again. */
  isDismissed: boolean;
  /** A new version has activated and is live on the next page load. */
  updateReady: boolean;
  /** The app has been cached and now works offline. */
  offlineReady: boolean;
  /** Triggers the native prompt. Resolves to true if the user accepted. */
  promptInstall: () => Promise<boolean>;
  /** Remembers the dismissal so the banner stays hidden. */
  dismiss: () => void;
  /** Reloads onto the new version. */
  applyUpdate: () => void;
}

// How often a long-lived tab checks for a new deployment. An HRMS is commonly
// left open all day, and without this the tab would only notice a release on a
// full reload.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export const usePWA = (): PWAState => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(detectStandalone);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [updateReady, setUpdateReady] = useState(false);

  const {
    offlineReady: [offlineReady],
  } = useRegisterSW({
    // In `autoUpdate` mode the plugin calls window.location.reload() the moment
    // a new worker activates - unless this callback is supplied. An unannounced
    // reload would discard a half-filled leave request or an unsaved profile
    // edit, so the reload is surfaced as a choice instead.
    //
    // The update is not lost by deferring it: skipWaiting has already made the
    // new worker active, so the next launch or navigation gets the new version
    // regardless of whether the user taps the notice.
    onNeedReload() {
      setUpdateReady(true);
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const timer = setInterval(() => {
        // `update()` is a no-op when the browser is offline or the worker is
        // already current, so this is cheap to run on a schedule.
        void registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);
      // The interval intentionally lives for the page's lifetime; it is
      // cleared by the browser on unload.
      window.addEventListener("beforeunload", () => clearInterval(timer), {
        once: true,
      });
    },
    onRegisterError(error) {
      console.error("Service worker registration failed:", error);
    },
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Chrome shows its own mini-infobar unless the event is cancelled. This
      // is what hands control of the timing and design over to the app.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      // The captured event is single-use and now meaningless.
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Covers the case where the user installs from the browser menu rather
    // than the in-app button: the window switches to standalone without
    // `appinstalled` necessarily firing in this tab.
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };
    displayMode.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    // The event cannot be reused whatever the user chose. Chrome fires a fresh
    // one later if the app is still installable.
    setDeferredPrompt(null);

    if (outcome === "accepted") {
      setIsInstalled(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* private mode - the banner simply reappears next session */
    }
  }, []);

  // The new worker is already active and controlling the page, so a plain
  // reload is all that is needed - there is no waiting worker left to message.
  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    canInstall: Boolean(deferredPrompt) && !isInstalled,
    isInstalled,
    isIOS: detectIOS(),
    isDismissed,
    updateReady,
    offlineReady,
    promptInstall,
    dismiss,
    applyUpdate,
  };
};

export default usePWA;
