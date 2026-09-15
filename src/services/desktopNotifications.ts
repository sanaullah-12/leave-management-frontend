import { existingSubscription, isPushSupported } from "./pushNotifications";

/**
 * desktopNotifications.ts
 * ----------------------
 * System notifications drawn by this tab, using the browser's Notification API.
 *
 * The sibling of services/pushNotifications.ts, and deliberately not a
 * replacement for it. Web Push reaches a browser that is closed, needs VAPID
 * keys configured on the server and a subscription registered against them, and
 * is unavailable on several browsers people actually use. This needs none of
 * that: it works anywhere permission has been granted, for as long as a tab is
 * open. Between them, an event reaches the desk whether or not this deployment
 * has push configured.
 *
 * Two rules keep them from both showing the same thing.
 *
 *   1. A tab that is on screen shows nothing. The in-app toast and the bell
 *      have already said it, and a notice about something the reader just did
 *      in front of them is noise. The one exception is a notice whose premise
 *      is that nobody is there - see `force` below.
 *
 *   2. A browser with a live push subscription shows nothing from here FOR A
 *      NOTICE THE SERVER WILL PUSH TO IT. The server is already sending that
 *      one, and the service worker will draw it. The caller says which notices
 *      those are (`pushWillDeliver`), because only the caller knows: a
 *      notification is pushed to the people it is addressed to, and a page can
 *      hold a push subscription and still not be on the list. Suppressing on
 *      the subscription alone silences exactly those notices - see the
 *      work-from-home timer, whose events are addressed to admins while the
 *      employee's own browser is subscribed for everything else.
 *
 * Everything answers with a value rather than throwing. No Notification API, a
 * permission never asked for, a permission refused, an OS that blocks the site
 * outright - all of them are ordinary states for a browser to be in, and none
 * of them may become an error the app has to handle. In-app notifications carry
 * on regardless.
 */

export type DesktopNoticeState =
  /** This browser has no Notification API. */
  | "unsupported"
  /** Supported; nobody has been asked yet. */
  | "default"
  /** Permission granted - notices will be drawn. */
  | "granted"
  /** Refused, here or at the OS level. Asking again would achieve nothing. */
  | "denied";

/**
 * That the question has been put, once, on this device.
 *
 * Permission stays "default" when someone dismisses the prompt without
 * answering, so without this flag every start of a work session would put the
 * same prompt up again. The brief is to ask at a sensible moment, not to keep
 * asking.
 */
const ASKED_KEY = "nexora:desktop-notices:asked";

export function desktopNoticesSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** The current permission, without prompting for it. */
export function desktopNoticeState(): DesktopNoticeState {
  if (!desktopNoticesSupported()) return "unsupported";
  const permission = Notification.permission;
  if (permission === "granted") return "granted";
  if (permission === "denied") return "denied";
  return "default";
}

/** Whether this device has already been asked. */
export function desktopNoticesAsked(): boolean {
  try {
    return localStorage.getItem(ASKED_KEY) === "1";
  } catch {
    // Private mode, or storage blocked. Treat it as not asked: one prompt too
    // many is a smaller failure than a feature that can never be turned on.
    return false;
  }
}

/**
 * Whether an opt-in control is worth showing.
 *
 * Only the permission matters, not whether the question has been put before. A
 * control somebody has to find and click is not the app asking; it is the one
 * way back for somebody who waved the prompt away the first time, and hiding it
 * from them would leave the feature unreachable short of browser settings.
 */
export function canAskForDesktopNotices(): boolean {
  return desktopNoticeState() === "default";
}

/**
 * Ask for permission.
 *
 * Must be called from a user gesture. Browsers refuse a prompt nobody asked
 * for, and Chrome permanently blocks a site that prompts on load - which would
 * cost this employee the notifications for good, not just today.
 *
 * Asked at most once per device unless `userInitiated`, which is the difference
 * between the app raising the subject off the back of some other click and
 * somebody pressing a button that says what it does. The first must not become
 * a prompt on every start of a working day; the second is the whole point of
 * the button.
 */
export async function requestDesktopNotices({
  userInitiated = false,
}: { userInitiated?: boolean } = {}): Promise<DesktopNoticeState> {
  const state = desktopNoticeState();
  if (state !== "default") return state;
  if (!userInitiated && desktopNoticesAsked()) return state;

  try {
    localStorage.setItem(ASKED_KEY, "1");
  } catch {
    /* Storage is unavailable; the prompt is still worth putting up. */
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted"
      ? "granted"
      : permission === "denied"
      ? "denied"
      : "default";
  } catch {
    return desktopNoticeState();
  }
}

/** True when a tab of this app is open AND being looked at. */
function appIsInForeground(): boolean {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "visible" && document.hasFocus();
}

/**
 * Whether the server is already delivering to this browser over Web Push.
 *
 * Cached rather than re-derived per notice: it changes only when somebody turns
 * push on or off, which goes through services/pushNotifications.ts, and asking
 * the service worker on every event would put an await in front of a
 * notification that should be immediate.
 */
let pushDelivers: boolean | null = null;

async function pushIsDelivering(): Promise<boolean> {
  if (pushDelivers === true) return true;
  if (!isPushSupported()) return false;
  try {
    const subscribed = Boolean(await existingSubscription());
    // Only a positive answer is remembered. A negative one can mean the
    // service worker simply was not ready yet - the lookup gives up after a
    // few seconds - and caching that would leave this tab drawing notices the
    // push channel is also drawing, for as long as it stays open.
    if (subscribed) pushDelivers = true;
    return subscribed;
  } catch {
    return false;
  }
}

/** Called when push is enabled or disabled, so the next notice re-checks. */
export function resetDesktopNoticeRouting(): void {
  pushDelivers = null;
}

/**
 * The last time each tag was shown.
 *
 * A duplicate is a socket event delivered twice, or two components reacting to
 * one change - the same news within seconds. A repeat that is genuinely new -
 * somebody stepping away twice in an afternoon - is minutes apart and passes.
 */
const shownAt = new Map<string, number>();
const DUPLICATE_WINDOW_MS = 20 * 1000;

export interface DesktopNotice {
  /**
   * Identifies what this is about. The OS replaces a notification carrying the
   * same tag rather than stacking a second one beside it, and it is what the
   * duplicate check keys on.
   */
  tag: string;
  title: string;
  body: string;
  /**
   * Show it even though this tab is on screen.
   *
   * For the one kind of notice whose whole premise is that nobody is here: an
   * employee's own timer pausing for inactivity. The tab is visible and focused
   * precisely because they walked away and left it that way, so the usual
   * reading of "the app is in front of them" is the wrong one, and staying
   * quiet would withhold the message at the only moment it matters.
   */
  force?: boolean;
  /**
   * Whether the server will also push THIS notice to THIS person.
   *
   * True for a notice addressed to the reader, who may therefore get it twice;
   * this tab stays quiet and lets the push through. False for one that is not
   * addressed to them - a work-from-home timer event, which is written for the
   * admins watching - where no push is coming and this tab is the only thing
   * that can tell them.
   *
   * Defaults to true, which is the safe direction: at worst a notice is missed
   * rather than shown twice, and the in-app notification is unaffected either
   * way.
   */
  pushWillDeliver?: boolean;
}

/**
 * Draw a system notification, if this is the right tab to draw it in.
 *
 * @returns whether anything was shown, so a caller can fall back to something
 *   else. Nothing here throws.
 */
export async function showDesktopNotice({
  tag,
  title,
  body,
  force = false,
  pushWillDeliver = true,
}: DesktopNotice): Promise<boolean> {
  if (desktopNoticeState() !== "granted") return false;

  const foreground = appIsInForeground();
  if (foreground && !force) return false;

  const now = Date.now();
  const last = shownAt.get(tag);
  if (last !== undefined && now - last < DUPLICATE_WINDOW_MS) return false;

  // The service worker draws every push it receives, on screen or not, so a
  // notice the server is pushing to this browser is never drawn from here as
  // well - whatever the tab is doing.
  if (pushWillDeliver && (await pushIsDelivering())) return false;

  shownAt.set(tag, now);
  // Bound the map on a page that stays open all day.
  if (shownAt.size > 50) {
    for (const [key, at] of shownAt) {
      if (now - at > DUPLICATE_WINDOW_MS) shownAt.delete(key);
    }
  }

  const options: NotificationOptions = {
    body,
    tag,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
  };

  try {
    const notice = new Notification(title, options);
    notice.onclick = () => {
      window.focus();
      notice.close();
    };
    return true;
  } catch {
    // Android Chrome refuses the constructor outright and requires the service
    // worker to draw it. Any registration will do - it needs no push
    // subscription to show a notification.
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (!reg) return false;
      await reg.showNotification(title, options);
      return true;
    } catch {
      return false;
    }
  }
}
