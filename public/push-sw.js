/* eslint-disable no-undef */
/**
 * push-sw.js
 * ----------
 * The push half of the service worker.
 *
 * It is registered two different ways, and never twice at once:
 *
 *   production  pulled into the Workbox worker vite-plugin-pwa generates, via
 *               `workbox.importScripts` in vite.config.ts, so the app keeps
 *               exactly one registered worker. A second registration would
 *               fight the first over scope and updates, and only one of them
 *               would ever receive a push.
 *
 *   development vite-plugin-pwa registers no worker at all (a precaching worker
 *               fights Vite's HMR), so this file is registered directly by
 *               services/pushNotifications.ts. There is nothing for it to
 *               conflict with, and it declares no fetch handler - so it never
 *               intercepts a request and cannot serve a stale module.
 *
 * Not declaring a fetch handler is therefore load-bearing, not an omission.
 *
 * It is deliberately free of application knowledge. The server sends a rendered
 * title, body and destination; this only displays them. Adding a notification
 * type - Leave Approved, WFH Rejected, Payroll - needs no change here, which is
 * what keeps the worker stable across releases. A worker that has to be updated
 * for every new notification is a worker that will be out of date.
 */

/**
 * Take over as soon as this version installs, instead of waiting for every tab
 * to close first.
 *
 * Without these two lines a changed worker installs and then sits in "waiting"
 * for as long as one tab stays open, so the version actually receiving pushes
 * stays whatever was current when the employee first enabled them. That is how
 * a fixed worker can look like it was never fixed: the fix is installed, parked,
 * and never activated.
 *
 * In a production build these sit alongside Workbox's own skipWaiting and
 * clientsClaim, which ask for exactly the same thing, so this only adds
 * behaviour to the standalone dev registration.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/** Shown when a payload is missing or unreadable, so a push is never silent. */
const FALLBACK = {
  title: "Nexora",
  body: "You have a new notification.",
  url: "/notifications",
};

/**
 * Read the push payload.
 *
 * A push with no data, or with a body that is not the JSON we send, must still
 * produce a notification: the browser requires that a push event results in
 * something visible, and an employee seeing a generic message is far better
 * than the browser's own "This site was updated in the background".
 */
function readPayload(event) {
  if (!event.data) return FALLBACK;
  try {
    const parsed = event.data.json();
    return {
      title: parsed.title || FALLBACK.title,
      body: parsed.body || FALLBACK.body,
      url: parsed.url || FALLBACK.url,
      tag: parsed.tag,
      data: parsed.data || {},
    };
  } catch (_) {
    try {
      return { ...FALLBACK, body: event.data.text() || FALLBACK.body };
    } catch (_) {
      return FALLBACK;
    }
  }
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      const payload = readPayload(event);

      // Every open tab is told, whether or not a notification is drawn, so the
      // bell and the lists refresh even for a push that arrived while the
      // socket was down.
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "push-received", payload });
      }

      // The notification itself is always drawn, including while the app is on
      // screen.
      //
      // This worker used to stay silent whenever any Nexora window was focused,
      // on the reasoning that Socket.IO had already delivered the same news as
      // an in-app toast. In practice that silenced almost everything: people
      // keep the app open while they work, so the only push that ever reached
      // the desktop was the one the test button marked as an exception. A
      // notification feature that is quiet exactly when somebody is at their
      // computer is not a notification feature.
      //
      // The duplicate it was guarding against is real but small - a toast and a
      // system notification about one event - and the tag below already stops
      // the same event stacking twice. Missing the notification entirely is the
      // larger failure, so it is the one that gets avoided.
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        // Collapse key from the server. A repeat about the same thing replaces
        // the earlier one instead of stacking on the lock screen.
        tag: payload.tag || undefined,
        renotify: Boolean(payload.tag),
        data: { url: payload.url, ...payload.data },
        timestamp: Date.now(),
      });
    })()
  );
});

/**
 * Open the app at whatever the notification was about.
 *
 * An already-open tab is focused and navigated rather than duplicated: an
 * employee who taps three notifications should end up with one window, not
 * three.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clients) {
        if ("focus" in client) {
          await client.focus();
          // Routing is the app's job: postMessage lets React Router navigate
          // without a full reload, and navigate() is the fallback for a client
          // that is not listening.
          client.postMessage({ type: "push-navigate", url: target });
          if ("navigate" in client) {
            try {
              await client.navigate(target);
            } catch (_) {
              /* cross-origin or unsupported; the postMessage already went */
            }
          }
          return;
        }
      }

      if (self.clients.openWindow) await self.clients.openWindow(target);
    })()
  );
});

/**
 * The browser rotated or expired this subscription.
 *
 * Re-subscribe so the browser keeps a valid one, using the same server key the
 * old subscription carried. It is deliberately NOT posted to the server from
 * here: a service worker holds no session, and an endpoint that accepted an
 * unauthenticated re-binding would let anyone holding an old endpoint URL
 * redirect somebody else's notifications.
 *
 * The app registers the new subscription the next time it is opened, and the
 * stale row is deleted server-side the first time a push to it returns 410. So
 * the worst case is that pushes pause until the employee next opens Nexora,
 * with nothing lost - the notifications are all still in the notification
 * centre.
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const applicationServerKey =
        event.oldSubscription &&
        event.oldSubscription.options &&
        event.oldSubscription.options.applicationServerKey;

      if (!applicationServerKey) return;

      try {
        await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      } catch (_) {
        /* Permission may since have been revoked; the app will sort it out. */
      }
    })()
  );
});
