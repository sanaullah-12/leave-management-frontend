/**
 * Nexora Assistant - helper service.
 *
 * The single seam between the assistant and everything outside React: durable
 * preferences, the greeting policy and small shared utilities.
 *
 * Preferences live in `localStorage` today, mirroring Payroll and Document
 * Studio. Moving them onto the user profile later is a change to the two
 * functions below and nothing else - no component reads storage directly.
 */
import {
  ASSISTANT_STORAGE_KEY,
  GREETINGS,
  GREETING_COOLDOWN_MS,
  GREETING_STOPS_AFTER_OPENS,
  MAX_GREETINGS,
  TYPING_MAX_MS,
  TYPING_MIN_MS,
  TYPING_MS_PER_CHAR,
  HIDDEN_ROUTE_PREFIXES,
} from "./config";
import type { AssistantPreferences } from "./types";
import { normalisePath } from "./paths";

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

/** Stable-enough id for transcript keys. */
export const uid = (prefix = "msg"): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;

/**
 * How long to hold the typing indicator before revealing an answer.
 *
 * The local provider is instant, and an answer that appears with zero latency
 * reads as a canned lookup rather than a response. Scaling a short pause by
 * answer length also reserves the slot a real model will occupy later.
 */
export const typingDelayFor = (text: string): number =>
  Math.min(TYPING_MAX_MS, TYPING_MIN_MS + text.length * TYPING_MS_PER_CHAR);

/** Routes where the assistant must not appear (public/auth surfaces). */
export const isAssistantHiddenOn = (pathname: string): boolean => {
  const path = normalisePath(pathname);
  return HIDDEN_ROUTE_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
};

/* ------------------------------------------------------------------ */
/* Preferences                                                         */
/* ------------------------------------------------------------------ */

export const DEFAULT_PREFERENCES: AssistantPreferences = {
  greetingDismissed: false,
  greetingCount: 0,
  lastGreetedAt: null,
  openCount: 0,
};

/** Read preferences, tolerating absent, partial or corrupt storage. */
export function loadPreferences(): AssistantPreferences {
  try {
    const raw = localStorage.getItem(ASSISTANT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<AssistantPreferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    // Private-mode / quota / hand-edited JSON - the assistant still works,
    // it just greets as if this were a first visit.
    return { ...DEFAULT_PREFERENCES };
  }
}

/** Persist preferences. Never throws; a failed write only costs memory. */
export function savePreferences(prefs: AssistantPreferences): void {
  try {
    localStorage.setItem(ASSISTANT_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable - ignore */
  }
}

/** Merge a patch into stored preferences and return the result. */
export function updatePreferences(
  patch: Partial<AssistantPreferences>
): AssistantPreferences {
  const next = { ...loadPreferences(), ...patch };
  savePreferences(next);
  return next;
}

/** Forget everything the assistant remembers (used by "reset"). */
export function clearPreferences(): void {
  try {
    localStorage.removeItem(ASSISTANT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Greeting policy                                                     */
/* ------------------------------------------------------------------ */

/**
 * Whether the assistant may speak first.
 *
 * Four independent brakes, any one of which is enough to stay quiet:
 *
 *   1. an explicit dismissal is permanent;
 *   2. a lifetime cap of {@link MAX_GREETINGS};
 *   3. a cooldown so it is at most once a day;
 *   4. familiarity - once the panel has been opened a couple of times the
 *      user knows the assistant is there, so it stops volunteering.
 *
 * The rules live here, not in the component, so the policy can be tuned or
 * moved server-side without touching the UI.
 */
export function shouldGreet(
  prefs: AssistantPreferences,
  now: number = Date.now()
): boolean {
  if (prefs.greetingDismissed) return false;
  if (prefs.greetingCount >= MAX_GREETINGS) return false;
  if (prefs.openCount >= GREETING_STOPS_AFTER_OPENS) return false;
  if (prefs.lastGreetedAt && now - prefs.lastGreetedAt < GREETING_COOLDOWN_MS)
    return false;
  return true;
}

/**
 * Greeting copy for this showing. Rotated by count rather than random, so a
 * returning user gets a different line instead of the same one twice.
 */
export const greetingFor = (prefs: AssistantPreferences): string =>
  GREETINGS[prefs.greetingCount % GREETINGS.length];
