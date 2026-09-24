/**
 * Status colours for the places CSS cannot reach.
 *
 * Almost everything in the app takes its colour from a CSS custom property in
 * `styles/tokens.css`, directly or through a Tailwind utility. Two things
 * cannot: a Recharts stroke or gradient stop, and a canvas fill. Those need a
 * real colour string at render time.
 *
 * This file used to answer that for the BRAND as well, with a hand-written
 * table of hexes per colour scheme, under a comment instructing the reader to
 * keep it "EXACTLY in sync" with the brand ramp. It was not in sync, so on
 * three of the ten schemes a chart line was a visibly different shade from the
 * button beside it. A table that must be kept in step with another table by
 * hand will always end up like that.
 *
 * The brand is not here any more either way. Reading it correctly means
 * watching the class on <html> rather than sampling it during render, because
 * ThemeContext sets that class in an effect and a parent's effect runs after
 * its children's - a value read during render is one switch behind. That is
 * `hooks/useThemeAccent`, and it is the only supported way to get the accent
 * as a string.
 */

/* ==========================================================================
   Status colours for SVG and canvas
   --------------------------------------------------------------------------
   Same problem as the accent, same answer. A Recharts `fill`, a pie slice and
   a legend dot are set as attributes rather than as CSS, so a `var()` does not
   resolve in them - they need a concrete colour at render time.

   The attendance and work-from-home modules had grown their own literal set
   for this (#0f7a4c, #b5650a, #b42318, #5c6470, #0e7490, #4c3fc7, #1a5fb4),
   used in 66 places across 18 files. Two things were wrong with it: it did not
   match the status colours the rest of the product uses for the same meanings,
   so an "Absent" figure on a chart was a different red from the "Absent" badge
   beside it; and being fixed light-mode values, the whole set stayed put when
   the app went dark, where it reads several steps too heavy.

   These read the status tokens instead, so a chart and a badge are the same
   colour by construction, and both follow the mode.
   ========================================================================== */

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "leave"
  | "remote";

/**
 * Resolve a semantic colour token to a concrete `rgb(...)` string.
 *
 * Unlike the brand steps above, these tokens already hold a colour rather than
 * a channel triplet, so `getComputedStyle` hands back something an SVG
 * attribute accepts as-is.
 */
const readColorToken = (name: string, fallback: string): string => {
  if (typeof window === "undefined" || !document.documentElement) return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return raw || fallback;
};

const TONE_TOKEN: Record<StatusTone, { token: string; fallback: string }> = {
  success: { token: "--success", fallback: "#058961" },
  warning: { token: "--warning", fallback: "#b26807" },
  danger: { token: "--danger", fallback: "#cb2e2e" },
  neutral: { token: "--text-muted", fallback: "#676f7e" },
  // Not semantic: "on leave" and "working remotely" are kinds of day, not
  // verdicts on one. They keep a hue of their own so they cannot be confused
  // with a good or bad state, and so they do not move with the theme.
  leave: { token: "--tone-leave", fallback: "#0e7490" },
  remote: { token: "--tone-remote", fallback: "#4c3fc7" },
};

/** The colour for a status tone, ready for an SVG attribute or a canvas fill. */
export const statusColor = (tone: StatusTone): string => {
  const { token, fallback } = TONE_TOKEN[tone];
  return readColorToken(token, fallback);
};
