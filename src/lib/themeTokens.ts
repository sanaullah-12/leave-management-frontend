/**
 * Theme tokens that CSS can't reach.
 *
 * Most theming happens through CSS custom properties and the `html.theme-*`
 * classes in `styles/design-system.css`. But SVG-based UI — Recharts strokes
 * and gradients, gauge arcs, canvas fills — needs a real hex value at render
 * time, and swatch pickers need to paint the colour directly.
 *
 * This map was previously copy-pasted into five files, which meant adding a
 * colour scheme required finding all five. It now lives here, keyed by the
 * `ColorScheme` union so TypeScript fails the build if a scheme is missing.
 *
 * Keep these in sync with the `*-600` values in `tailwind.config.js`.
 */
import type { ColorScheme } from "../context/ThemeContext";

export const ACCENT_HEX: Record<ColorScheme, string> = {
  black: "#374151",
  purple: "#9c5fd1",
  blue: "#2563eb",
  pink: "#db2777",
  violet: "#7c3aed",
  indigo: "#4f46e5",
  orange: "#ea580c",
  teal: "#0d9488",
  bronze: "#b45309",
  mint: "#10b981",
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
