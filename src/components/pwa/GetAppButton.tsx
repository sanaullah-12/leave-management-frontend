import React, { useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpOnSquareIcon,
  EllipsisVerticalIcon,
  PlusSmallIcon,
} from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import AppLogo from "../AppLogo";
import { usePWAState } from "../../providers/PWAProvider";

/**
 * GetAppButton
 * ------------
 * "Get app" in the header: installs Nexora as a real app on this device.
 *
 * It reads the shared PWA state rather than calling usePWA itself - that hook
 * registers a service worker per call site, so only PWAProvider may call it.
 *
 * **Shown whenever the app is not already installed**, even when no native
 * prompt is available. That is deliberate. `beforeinstallprompt` fires once,
 * only when Chrome's own install criteria are met, and never on Safari or
 * Firefox at all - so a button that renders only when a prompt exists is
 * invisible on most browsers most of the time, which reads as a missing
 * feature rather than an unavailable one. Where a prompt exists it is used;
 * where it does not, the modal gives the manual steps for that browser.
 *
 * It hides once installed: there is nothing left to get.
 */

type Platform = "ios-safari" | "ios-other" | "android" | "desktop" | "unknown";

function detectPlatform(isIOS: boolean): Platform {
  if (typeof window === "undefined") return "unknown";
  const ua = window.navigator.userAgent;

  if (isIOS) {
    // Chrome and Firefox on iOS cannot add to the home screen at all - only
    // Safari can - so pointing them at the Share sheet would be a dead end.
    return /CriOS|FxiOS|EdgiOS/.test(ua) ? "ios-other" : "ios-safari";
  }
  if (/Android/i.test(ua)) return "android";
  if (/Chrome|Chromium|Edg\//.test(ua)) return "desktop";
  return "unknown";
}

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <li className="flex items-start gap-2.5">
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      {n}
    </span>
    <span className="flex flex-wrap items-center gap-1.5">{children}</span>
  </li>
);

const Strong: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
);

const GetAppButton: React.FC<{ className?: string; compact?: boolean }> = ({
  className = "",
  compact = false,
}) => {
  const pwa = usePWAState();
  const [showSteps, setShowSteps] = useState(false);
  const [installing, setInstalling] = useState(false);
  /** Set when Install was pressed but this browser offered no prompt. */
  const [noPrompt, setNoPrompt] = useState(false);

  if (!pwa || pwa.isInstalled) return null;

  const platform = detectPlatform(pwa.isIOS);

  const install = async () => {
    // No captured prompt means the browser has not offered one - Safari and
    // Firefox never do, and Chrome only once its own install criteria are met.
    // Say so rather than leaving a button that visibly does nothing.
    if (!pwa.canInstall) {
      setNoPrompt(true);
      return false;
    }

    setInstalling(true);
    setNoPrompt(false);
    try {
      const accepted = await pwa.promptInstall();
      if (accepted) setShowSteps(false);
      return accepted;
    } finally {
      setInstalling(false);
    }
  };

  const handleClick = async () => {
    // A real prompt beats any instructions, so it is always preferred.
    if (pwa.canInstall) {
      // Chrome can decline to show the prompt, and the person can dismiss it.
      // Falling back to the steps means the click always does something.
      if (!(await install())) setShowSteps(true);
      return;
    }
    setShowSteps(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={installing}
        aria-label="Get the Nexora app"
        title="Install Nexora on this device"
        className={
          "inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20 " +
          className
        }
      >
        <ArrowDownTrayIcon className="h-4 w-4 shrink-0" />
        {!compact && (
          <span className="whitespace-nowrap">
            {installing ? "Installing..." : "Get app"}
          </span>
        )}
      </button>

      <Modal
        open={showSteps}
        onClose={() => setShowSteps(false)}
        size="sm"
        icon={<ArrowDownTrayIcon className="h-6 w-6" />}
        title="Install Nexora on this device"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowSteps(false)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Close
            </button>

            {/* Always offered. Gating it on a captured prompt meant it was
                invisible on every browser that has not fired
                beforeinstallprompt - which is Safari and Firefox always, and
                Chrome until its install criteria are met - so the modal looked
                like it had no install button at all. Pressing it without a
                prompt explains why instead of doing nothing. */}
            <button
              type="button"
              disabled={installing}
              onClick={install}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {installing ? "Installing..." : "Install now"}
            </button>
          </>
        }
      >
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-700">
          <AppLogo className="h-10 w-10" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Nexora
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Opens full screen, works offline, and can notify you.
            </p>
          </div>
        </div>

        <ol className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
          {platform === "ios-safari" && (
            <>
              <Step n={1}>
                Tap
                <ArrowUpOnSquareIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Strong>Share</Strong> at the bottom of Safari.
              </Step>
              <Step n={2}>
                Choose
                <PlusSmallIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Strong>Add to Home Screen</Strong>.
              </Step>
              <Step n={3}>
                Tap <Strong>Add</Strong>.
              </Step>
            </>
          )}

          {platform === "ios-other" && (
            <Step n={1}>
              On iPhone and iPad only <Strong>Safari</Strong> can install a web
              app. Open this page in Safari, then tap Share and Add to Home
              Screen.
            </Step>
          )}

          {platform === "android" && (
            <>
              <Step n={1}>
                Tap
                <EllipsisVerticalIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                the browser menu, top right.
              </Step>
              <Step n={2}>
                Choose <Strong>Install app</Strong> or{" "}
                <Strong>Add to Home screen</Strong>.
              </Step>
            </>
          )}

          {platform === "desktop" && (
            <>
              <Step n={1}>
                Click the <Strong>install icon</Strong> at the right-hand end of
                the address bar.
              </Step>
              <Step n={2}>
                Or open the browser menu and choose{" "}
                <Strong>Install Nexora</Strong>.
              </Step>
            </>
          )}

          {platform === "unknown" && (
            <Step n={1}>
              This browser cannot install web apps. Open Nexora in{" "}
              <Strong>Chrome</Strong>, <Strong>Edge</Strong> or{" "}
              <Strong>Safari</Strong> to install it.
            </Step>
          )}
        </ol>

        {noPrompt && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              {/* The banner on the landing page fires the very same prompt.
                  The difference is only that it is shown when one exists,
                  whereas this button is always here - and a prompt is spent
                  by the first attempt, accepted or not. */}
              Chrome offers its one-click install once per page load, and it
              has already been used or dismissed on this one. Reloading gets it
              back - or use the steps above, which install exactly the same app.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white/70 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-white dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-500/10"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Reload and try again
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default GetAppButton;
