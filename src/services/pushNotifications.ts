import { pushAPI } from "./api";

/**
 * pushNotifications.ts
 * --------------------
 * Everything the browser side of Web Push needs, and nothing about the UI.
 *
 * The whole feature is optional by construction. Every function here answers
 * with a state rather than throwing, because every one of these is a normal
 * thing for a browser to be: no service worker (Safari before 16.4, any page
 * served over plain http), no Push API, permission never asked, permission
 * denied, permission blocked at the OS level. An employee in any of those
 * states must still get their in-app notifications, so nothing here is ever
 * allowed to become an error the app has to handle.
 */

export type PushState =
  /** This browser cannot do Web Push at all. */
  | "unsupported"
  /** Supported, but this deployment has no VAPID keys configured. */
  | "unavailable"
  /** Supported and available; the employee has not been asked yet. */
  | "default"
  /** Permission granted and a subscription is registered with the backend. */
  | "enabled"
  /** Permission granted but no subscription yet (mid-flight, or just revoked). */
  | "granted-unsubscribed"
  /** The employee said no, or the browser/OS blocks notifications for this site. */
  | "blocked"
  /**
   * The browser can do push, but this page has no service worker to receive it.
   * Distinct from "unsupported" on purpose: nothing is wrong with the browser,
   * so the control stays available to retry rather than disappearing.
   */
  | "no-worker";

/**
 * Whether this browser can do Web Push.
 *
 * All three are required and they are genuinely independent: iOS Safari has
 * had service workers for years and only gained the Push API in 16.4, and then
 * only for an installed home-screen app.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** The browser's current permission, without prompting for it. */
export function currentPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * The VAPID public key, as bytes.
 *
 * The key is distributed as base64url text and `applicationServerKey` wants a
 * Uint8Array, so this conversion is unavoidable rather than incidental.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);

  // Backed by an explicit ArrayBuffer rather than `new Uint8Array(length)`.
  // The latter is typed Uint8Array<ArrayBufferLike>, which includes
  // SharedArrayBuffer and so is not assignable to BufferSource - and
  // applicationServerKey wants a BufferSource.
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/** How long to wait for a service worker before giving up on it. */
const SERVICE_WORKER_TIMEOUT_MS = 5000;

/**
 * The app's service worker registration, or null.
 *
 * `ready` rather than `register`: the worker is registered once by usePWA()
 * through vite-plugin-pwa, and registering a second one here would give the app
 * two workers racing over the same scope with only one of them receiving
 * pushes. This waits for the existing one instead.
 *
 * The race is not optional. `navigator.serviceWorker.ready` resolves when a
 * worker becomes active and **never settles otherwise** - it does not reject,
 * it waits forever. With no worker registered it hangs indefinitely, which is
 * exactly what happens in `npm run dev` (vite-plugin-pwa registers none there)
 * and left the Enable button spinning on "Enabling..." with nothing to report.
 * The same hang would occur in production any time registration failed.
 *
 * Bounding it converts "we will never know" into "we do not have one", which is
 * a state the UI can actually tell the employee about.
 */
async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;

  try {
    const existing = await navigator.serviceWorker.getRegistration();

    // The dev server registers no service worker at all - vite-plugin-pwa's
    // devOptions are off because a precaching worker fights Vite's HMR. That
    // leaves nothing for the push handlers to be imported into, so push simply
    // did not work in development.
    //
    // Registering push-sw.js on its own is safe here precisely because nothing
    // else is registered, and because that file declares no fetch handler: a
    // worker that never intercepts a request cannot serve a stale module or
    // interfere with HMR, which is the only thing the devOptions comment is
    // guarding against. In a production build the Workbox worker already owns
    // this scope and imports the very same file.
    if (import.meta.env.DEV) {
      // Only ever touch our own registration. In a production build the Workbox
      // worker owns this scope, and registering a second script here would give
      // the app two workers with only one of them receiving pushes.
      const ours =
        !existing ||
        [existing.active, existing.waiting, existing.installing].some(
          (worker) => worker && worker.scriptURL.endsWith("/push-sw.js")
        );

      // Called every time, not only when nothing is registered. register() on
      // the same URL is idempotent, and it triggers the update check that is
      // the only way a changed worker reaches a browser whose tab never closes.
      if (ours) {
        await navigator.serviceWorker
          .register("/push-sw.js")
          .catch(() => undefined);
      }
    }

    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), SERVICE_WORKER_TIMEOUT_MS)
      ),
    ]);
  } catch {
    return null;
  }
}

/** The subscription this browser already holds, if any. */
export async function existingSubscription(): Promise<PushSubscription | null> {
  const reg = await registration();
  if (!reg) return null;
  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Work out where this browser stands, without prompting or subscribing.
 * Used to render the bell on load.
 */
export async function resolveState(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";

  const { data } = await pushAPI.getVapidPublicKey();
  if (!data?.supported || !data?.publicKey) return "unavailable";

  if (Notification.permission !== "granted") return "default";

  const subscription = await existingSubscription();
  return subscription ? "enabled" : "granted-unsubscribed";
}

/**
 * Ask for permission, subscribe, and register the subscription with the backend.
 *
 * Must be called from a user gesture: browsers refuse a permission prompt that
 * no one asked for, and Chrome permanently blocks a site that prompts on load.
 * That is why the UI asks first and only calls this from the click.
 *
 * Registering with the backend is part of "enabling". A browser subscription
 * the server does not know about receives nothing, so a failure to store it
 * leaves the employee unsubscribed rather than silently half-on.
 */
export async function enablePush(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";

  const { data } = await pushAPI.getVapidPublicKey();
  if (!data?.supported || !data?.publicKey) return "unavailable";

  const permission = await Notification.requestPermission();
  if (permission === "denied") return "blocked";
  if (permission !== "granted") return "default";

  const reg = await registration();
  // Permission has been granted at this point, so the employee has done their
  // part; the app simply has nowhere to deliver to yet.
  if (!reg) return "no-worker";

  // Reuse whatever this browser already has. Subscribing again would produce a
  // second endpoint for one browser and orphan the first.
  let subscription = await reg.pushManager.getSubscription();

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      // Required by Chrome and Firefox: a push must result in something the
      // employee can see. It is also what this feature is for.
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });
  }

  const payload = subscription.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
    return "granted-unsubscribed";
  }

  await pushAPI.subscribe({
    endpoint: payload.endpoint,
    keys: { p256dh: payload.keys.p256dh, auth: payload.keys.auth },
  });

  return "enabled";
}

/**
 * Stop this browser receiving pushes.
 *
 * The server row goes first. If the order were reversed and the request failed,
 * the browser would be unsubscribed while the server still believed otherwise,
 * and every later push would be spent on an endpoint that is gone.
 *
 * Permission itself is deliberately untouched - only the employee can revoke
 * that, from browser settings - so re-enabling later needs no second prompt.
 */
export async function disablePush(): Promise<PushState> {
  const subscription = await existingSubscription();

  if (subscription) {
    try {
      await pushAPI.unsubscribe({ endpoint: subscription.endpoint });
    } catch {
      /* Already gone server-side, or offline. Unsubscribe locally regardless. */
    }
    try {
      await subscription.unsubscribe();
    } catch {
      /* Nothing more to do; the server row is what mattered. */
    }
  }

  if (!isPushSupported()) return "unsupported";
  return Notification.permission === "granted" ? "granted-unsubscribed" : "default";
}

/**
 * Detach this browser at logout.
 *
 * The subscription is owned by a person, not by a machine. Leaving it in place
 * would push the next person to use this browser somebody else's attendance and
 * leave notifications, so this runs on every logout and is best-effort: logging
 * out must never fail because a push service was unreachable.
 */
export async function detachOnLogout(): Promise<void> {
  try {
    const subscription = await existingSubscription();
    if (!subscription) return;
    try {
      await pushAPI.unsubscribe({ endpoint: subscription.endpoint });
    } catch {
      /* The row is orphaned at worst; it is pruned on its first failed push. */
    }
    await subscription.unsubscribe().catch(() => undefined);
  } catch {
    /* Never block a logout. */
  }
}

/** Ask the backend to push this browser a test notification. */
export async function sendTestPush(): Promise<boolean> {
  try {
    const { data } = await pushAPI.sendTest();
    return Boolean(data?.success && data?.sent > 0);
  } catch {
    return false;
  }
}
