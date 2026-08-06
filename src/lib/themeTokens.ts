/**
 * Theme tokens that CSS can't reach.
 *
 * Most theming happens through CSS custom properties and the `html.theme-*`
 * classes in `styles/design-system.css`. But SVG-based UI - Recharts strokes
 * and gradients, gauge arcs, canvas fills - needs a real hex value at render
 * time, and swatch pickers need to paint the colour directly.
 *
 * Keyed by the `ColorScheme` union so the build fails if a scheme is missing
 * an entry.
 *
 * Keep these EXACTLY in sync with the `--blue-600` value each `html.theme-*`
 * block sets at the bottom of `styles/design-system.css`. That variable is what
 * every `blue-*` utility resolves to, so any drift here means an SVG chart sits
 * next to a button in a visibly different shade of the "same" accent.
 */
import type { ColorScheme } from "../context/ThemeContext";

export const ACCENT_HEX: Record<ColorScheme, string> = {
  black: "#475569",
  purple: "#9c5fd1",
  blue: "#2563eb",
  pink: "#db2777",
  violet: "#7c3aed",
  indigo: "#4f46e5",
  orange: "#ea580c",
  teal: "#0d9488",
  bronze: "#d97706",
  mint: "#059669",
};

/**
 * Softer accent (the theme's `--blue-400`) for the second stop of chart
 * gradients and arc strokes. Same hue, so a gradient reads as depth rather
 * than as a second colour.
 */
export const ACCENT_SOFT_HEX: Record<ColorScheme, string> = {
  black: "#94a3b8",
  purple: "#d49eff",
  blue: "#60a5fa",
  pink: "#f472b6",
  violet: "#a78bfa",
  indigo: "#818cf8",
  orange: "#fb923c",
  teal: "#2dd4bf",
  bronze: "#fbbf24",
  mint: "#34d399",
};

/** Human labels for the colour schemes, used by the theme pickers. */
export const SCHEME_LABEL: Record<ColorScheme, string> = {
  black: "Black",
  purple: "Purple",
  blue: "Blue",
  pink: "Pink",
  violet: "Violet",
  indigo: "Indigo",
  orange: "Orange",
  teal: "Teal",
  bronze: "Bronze",
  mint: "Mint",
};

/**
 * Accent hex for a scheme, falling back to blue. Accepts a plain string so
 * callers holding an unvalidated value (e.g. from storage) stay safe.
 */
export const accentFor = (scheme: string): string =>
  ACCENT_HEX[scheme as ColorScheme] ?? ACCENT_HEX.blue;

/** Lighter companion to {@link accentFor}, same fallback behaviour. */
export const accentSoftFor = (scheme: string): string =>
  ACCENT_SOFT_HEX[scheme as ColorScheme] ?? ACCENT_SOFT_HEX.blue;
