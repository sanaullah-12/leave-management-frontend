import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NOTIF_KEY } from "./useNotifications";
import {
  disablePush,
  enablePush,
  isPushSupported,
  resolveState,
  sendTestPush,
  type PushState,
} from "../services/pushNotifications";

/**
 * usePushNotifications
 * --------------------
 * Browser push, as a piece of UI state.
 *
 * Every branch a browser can be in is a value of PushState rather than an
 * error, because none of them are faults: an employee who never enables this,
 * or whose browser cannot do it at all, still gets every notification in the
 * app. This hook only decides what the bell shows and what clicking it does.
 *
 * It also re-registers a granted subscription on mount. That single line is
 * what handles subscription expiry, the browser rotating an endpoint, and an
 * employee logging in on a browser they had enabled months ago - the browser
 * hands over whatever subscription it has now, and the backend upserts it onto
 * the endpoint. Nothing has to detect that a subscription went stale.
 */
export function usePushNotifications() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [state, setState] = useState<PushState>(() =>
    isPushSupported() ? "default" : "unsupported"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards the mount-time re-registration so a re-render cannot re-run it.
  const syncedFor = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setState(await resolveState());
    } catch {
      // A failed status read must not make the bell claim "blocked" - that
      // would tell an employee their browser refused something it did not.
      setState((current) => (current === "enabled" ? current : "default"));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setState(isPushSupported() ? "default" : "unsupported");
      syncedFor.current = null;
      return;
    }

    const userKey = String(user?.id || "");
    if (syncedFor.current === userKey) return;
    syncedFor.current = userKey;

    let cancelled = false;

    (async () => {
      const resolved = await resolveState().catch(() => null);
      if (cancelled || !resolved) return;

      // Permission is already granted but this browser holds no subscription
      // the backend knows about - it expired, was rotated, or belongs to the
      // person who logged out. Re-registering silently is correct here: the
      // employee already said yes, so there is nothing to ask them again.
      if (resolved === "granted-unsubscribed") {
        const next = await enablePush().catch(() => resolved);
        if (!cancelled) setState(next);
        return;
      }

      // Already enabled: re-register anyway so the server row's endpoint and
      // keys match what this browser holds right now, and so `lastSeenAt`
      // proves the device is still real.
      if (resolved === "enabled") {
        enablePush().catch(() => undefined);
      }

      setState(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  /**
   * Messages from the service worker.
   *
   * "push-received" arrives only when a tab is in the foreground, where the
   * worker deliberately shows no OS notification because Socket.IO has already
   * delivered the same news. Refreshing the notification query keeps the bell
   * correct even if that socket event was missed.
   */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "push-received") {
        queryClient.invalidateQueries({ queryKey: NOTIF_KEY });
      }

      // Tapping an OS notification focuses the tab; route with the router
      // rather than a reload so the app is not rebooted to change page.
      if (data.type === "push-navigate" && typeof data.url === "string") {
        queryClient.invalidateQueries({ queryKey: NOTIF_KEY });
        navigate(data.url);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [queryClient, navigate]);

  /** Ask for permission and subscribe. Must run from a user gesture. */
  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await enablePush();
      setState(next);

      if (next === "blocked") {
        setError(
          "Your browser is blocking notifications for Nexora. Allow them in your browser's site settings to turn this on."
        );
      } else if (next === "unavailable") {
        setError("Browser notifications are not configured on this server yet.");
      } else if (next === "no-worker") {
        // Permission was granted, so the employee has done their part. This
        // is the app failing to set itself up, and it is stated as such -
        // never as a build instruction, which means nothing to the person
        // reading it.
        setError(
          "Notifications could not be set up on this device. Reload the page and try again."
        );
      }

      return next;
    } catch {
      setError("Could not turn on browser notifications. Please try again.");
      return state;
    } finally {
      setBusy(false);
    }
  }, [state]);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setState(await disablePush());
    } catch {
      setError("Could not turn off browser notifications.");
    } finally {
      setBusy(false);
    }
  }, []);

  const sendTest = useCallback(() => sendTestPush(), []);

  return {
    state,
    busy,
    error,
    /** The employee has browser notifications working right now. */
    isEnabled: state === "enabled",
    /** Nothing to offer: no Push API, or no keys on this deployment. */
    isUnavailable: state === "unsupported" || state === "unavailable",
    isBlocked: state === "blocked",
    enable,
    disable,
    refresh,
    sendTest,
  };
}
