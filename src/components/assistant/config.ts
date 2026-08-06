/**
 * Nexora Assistant - configuration.
 *
 * Every tunable lives here: timings, thresholds, copy and the routes the
 * assistant stays off. Nothing in this file imports React, so it is safe to
 * read from services, tests and the knowledge base alike.
 *
 * The `STRINGS` block is deliberately the only place UI copy is written. The
 * app's i18n bundles are namespace-per-module (see `i18n/config.ts`) and the
 * assistant ships English-only for now, exactly like Document Studio and
 * Payroll; when it earns translations, this object is the single seam to
 * replace with `t("assistant:...")` calls.
 */

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

/** localStorage key, namespaced like `nexora.payroll.v1`. */
export const ASSISTANT_STORAGE_KEY = "nexora.assistant.v1";

/* ------------------------------------------------------------------ */
/* Greeting behaviour - the "don't be annoying" rules                  */
/* ------------------------------------------------------------------ */

/** Delay before the greeting bubble appears, so it never fights first paint. */
export const GREETING_DELAY_MS = 2600;

/** The bubble retracts to a plain launcher on its own after this long. */
export const GREETING_AUTOHIDE_MS = 15000;

/**
 * Hard cap on lifetime greetings. After this the launcher is still there -
 * the assistant just stops speaking first.
 */
export const MAX_GREETINGS = 3;

/** Minimum gap between two greetings. One a day is plenty. */
export const GREETING_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Once someone has opened the panel this many times they know it exists, so
 * the greeting stops volunteering itself.
 */
export const GREETING_STOPS_AFTER_OPENS = 2;

/**
 * Rotated in order rather than picked at random, so a user who sees two
 * greetings sees two different ones.
 */
export const GREETINGS = [
  "Welcome to Nexora. May I help you?",
  "Looking for something? I'm here to help.",
  "Need a hand? Ask me anything about Nexora.",
] as const;

/* ------------------------------------------------------------------ */
/* Typing simulation                                                   */
/* ------------------------------------------------------------------ */

/**
 * The local provider answers in well under a millisecond. A brief, length-
 * scaled pause is what makes the reply read as considered rather than
 * pre-baked - and it is exactly the latency a real model will occupy later.
 */
export const TYPING_MIN_MS = 420;
export const TYPING_MAX_MS = 1400;
export const TYPING_MS_PER_CHAR = 5;

/* ------------------------------------------------------------------ */
/* Answering                                                           */
/* ------------------------------------------------------------------ */

/** Below this score a match is treated as a guess, not an answer. */
export const LOW_CONFIDENCE = 0.34;

/** Suggested questions shown on the empty state. */
export const SUGGESTION_LIMIT = 5;

/** Alternatives offered when confidence is low or nothing matched. */
export const FALLBACK_ALTERNATIVES = 4;

/** Turns kept in memory; older ones are trimmed to bound the DOM. */
export const MAX_TRANSCRIPT = 40;

/* ------------------------------------------------------------------ */
/* Placement                                                           */
/* ------------------------------------------------------------------ */

/**
 * Routes where the assistant never mounts. It lives inside the authenticated
 * shell, so these are belt-and-braces for the public surfaces.
 */
export const HIDDEN_ROUTE_PREFIXES = [
  "/landing",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/invite",
  "/verify-invitation",
] as const;

/** Viewport width (px) below which the panel goes full-screen. */
export const MOBILE_BREAKPOINT = 640;

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

export const STRINGS = {
  name: "Nexora Assistant",
  tagline: "Your in-app guide",
  launcherLabel: "Open Nexora Assistant",
  closeLabel: "Close assistant",
  dismissGreetingLabel: "Dismiss greeting",
  inputPlaceholder: "Ask me anything about Nexora...",
  send: "Send",
  suggestionsTitle: "Try asking",
  quickActionsTitle: "Quick actions",
  contextTitle: "You're viewing",
  emptyGreeting: (name?: string) =>
    name ? `Hi ${name.split(" ")[0]}` : "Hi there",
  emptyBody:
    "I can walk you through anything in Nexora - applying for leave, running payroll, adding people, and more. Pick a question below or type your own.",
  thinking: "Nexora Assistant is typing",
  stepsTitle: "Here's how",
  tipsTitle: "Good to know",
  relatedTitle: "Related",
  lowConfidence:
    "I'm not certain I understood that. Did you mean one of these?",
  noMatch:
    "I don't have an answer for that yet. Here are the things I'm best at:",
  resetLabel: "Clear conversation",
  sourceBadge: {
    knowledge: "Guide",
    context: "This page",
    fallback: "Suggestion",
    ai: "AI",
  },
} as const;
