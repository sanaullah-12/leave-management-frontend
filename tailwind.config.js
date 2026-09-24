/** @type {import('tailwindcss').Config} */

/**
 * A scale whose every step reads a CSS variable, so the utility recolours
 * with the theme and with light/dark instead of being frozen at build time.
 *
 * `<alpha-value>` is what keeps `bg-gray-200/70` working: Tailwind substitutes
 * the opacity into the slot, so the variable only ever holds the three
 * channels.
 */
const varScale = (name) =>
  Object.fromEntries(
    [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [
      step,
      `rgb(var(--${name}-${step}) / <alpha-value>)`,
    ]),
  );

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Geist",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      // The type scale is defined as semantic classes in index.css
      // (.text-display, .text-page-heading, .text-section-heading,
      //  .text-card-title, .text-nav, .text-body, .text-secondary,
      //  .text-caption, .text-overline).

      /* ====================================================================
         Colours
         --------------------------------------------------------------------
         Every scale below is a pointer into styles/tokens.css. Nothing here
         holds a literal colour, which is what makes the token file the only
         place a palette is decided.

         Scales deliberately left at their Tailwind defaults - sky, cyan,
         fuchsia, indigo, lime, stone and the rest - are the chart, avatar and
         illustration colours. Those are categorical: their job is to be
         distinguishable from one another, not to follow the theme, so they
         are not routed through a token.
         ==================================================================== */
      colors: {
        /* --- neutrals ----------------------------------------------------
           One ladder for surfaces, borders and text, re-declared per mode in
           tokens.css. This is why `dark:bg-gray-800` is a card in dark mode
           and `border-gray-200` is a hairline in light mode with no override
           rule anywhere. */
        gray: varScale("gray"),

        /* --- brand -------------------------------------------------------
           `brand` and `blue` are the same scale under two names. `blue` is
           what several hundred existing class names say; `brand` is what new
           code should say. See the note in tokens.css. */
        brand: varScale("brand"),
        blue: varScale("blue"),

        /* `violet` and `purple` are aliases of the brand scale rather than
           fixed hues. They had become a second, unthemed brand colour - the
           `from-violet-500 to-purple-500` pair appears a dozen times across
           the product and printed the same two purples no matter which theme
           was selected. Pointing both at the brand makes those elements
           follow the theme, and collapses the gradient into a single-hue
           wash, which is the quieter result anyway. */
        violet: varScale("brand"),
        purple: varScale("brand"),

        /* --- status ------------------------------------------------------
           Three hues, six names. `green`/`emerald`, `amber`/`yellow` and
           `red`/`rose` had each drifted into two different colours for the
           same meaning; aliasing them here unifies every status badge, pill
           and icon in the app without touching the class names. */
        success: varScale("success"),
        emerald: varScale("success"),
        green: varScale("success"),

        warning: varScale("warning"),
        amber: varScale("warning"),
        yellow: varScale("warning"),

        danger: varScale("danger"),
        red: varScale("danger"),
        rose: varScale("danger"),
      },

      /* Semantic aliases for the surface ladder, so new code can write
         `bg-surface-raised` instead of remembering which grey step a card is. */
      backgroundColor: {
        surface: {
          sunken: "var(--surface-sunken)",
          base: "var(--surface-base)",
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
          input: "var(--surface-input)",
        },
      },
      textColor: {
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
          disabled: "var(--text-disabled)",
        },
      },
      borderColor: {
        subtle: "var(--border-subtle)",
        DEFAULT: "var(--border-default)",
        strong: "var(--border-strong)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-lg)",
      },
      ringColor: {
        focus: "var(--focus-ring)",
      },
    },
  },
  plugins: [],
};
