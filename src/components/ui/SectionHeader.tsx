import React from "react";
import "../../styles/section-header.css";

/**
 * The dashboard section banner.
 *
 * Every major screen opens with one. It is configuration-driven on purpose -
 * a page passes what it has (title, description, an action, an illustration)
 * and gets the same shape, height and rhythm as every other section, so the
 * product reads as one system rather than a set of pages that each invented
 * their own heading.
 *
 * The background is drawn as SVG rather than shipped as an image: it scales
 * to any width without a second asset, weighs nothing, and - because the
 * gradient stops read the app's `--blue-*` scale - it recolours with the
 * active theme instead of being pinned to one hue.
 *
 * The ground sits a rung lighter than the accent itself (`--blue-600` into
 * `--blue-500`, with every variant tint moved up the same amount) so a banner
 * on every screen reads as a soft header rather than a block of saturated
 * colour. It stops there rather than going pastel because the copy on top is
 * white: `--blue-600` under the title holds normal-size text above 4.5:1, and
 * a lighter ground would not.
 *
 * Layout is two columns, not an overlay. The copy lives in its own column
 * with a max width and the illustration in another, so a long title can
 * never end up sitting on top of the artwork.
 */

/**
 * Which section this banner belongs to.
 *
 * A variant only shifts the accompanying tint and the angle of the curves.
 * The primary colour is always the theme accent, so a section is
 * recognisable without any screen falling outside the product's palette.
 */
export type SectionVariant =
  | "default"
  | "dashboard"
  | "announcements"
  | "team"
  | "employees"
  | "departments"
  | "attendance"
  | "workFromHome"
  | "leave"
  | "calendar"
  | "policies"
  | "reports"
  | "payroll"
  | "documents"
  | "voice"
  | "notifications"
  | "profile"
  | "settings"
  | "tasks";

/**
 * The second gradient stop per section, as an `--blue-*`-relative tint plus a
 * companion hue. Values are CSS colours so they can be handed straight to an
 * SVG stop.
 */
const VARIANT_TINT: Record<SectionVariant, string> = {
  default: "rgb(var(--blue-400))",
  // The dashboard is home, so it stays on the plain theme accent - no second
  // hue competing with the figures it frames.
  dashboard: "rgb(var(--blue-400))",
  // Announcements carry news, so they lean warm against the accent.
  announcements: "rgb(249 168 212)",

  // People. All three sit on the accent's own scale rather than a second hue,
  // so moving between Team, Employees and Departments reads as one area.
  team: "rgb(var(--blue-300))",
  employees: "rgb(var(--blue-400))",
  departments: "rgb(var(--blue-300))",

  // Time and presence, on the sky end.
  attendance: "rgb(56 189 248)",
  workFromHome: "rgb(125 211 252)",

  // Leave and everything that schedules it, on the indigo end.
  leave: "rgb(129 140 248)",
  calendar: "rgb(165 180 252)",
  policies: "rgb(129 140 248)",

  reports: "rgb(45 212 191)",
  payroll: "rgb(52 211 153)",
  documents: "rgb(34 211 238)",
  voice: "rgb(232 121 249)",
  notifications: "rgb(253 186 116)",

  // Personal settings stay closest to the plain accent: they are chrome, not
  // a section of the product with its own subject.
  profile: "rgb(var(--blue-400))",
  settings: "rgb(var(--blue-300))",

  tasks: "rgb(167 139 250)",
};

/**
 * The vector background: a gradient ground with three smooth curves layered
 * over it at low opacity.
 *
 * `preserveAspectRatio="none"` lets the curves stretch to whatever width the
 * banner ends up at, which is what keeps one drawing usable from a phone to
 * an ultrawide monitor.
 */
const BannerBackdrop: React.FC<{ variant: SectionVariant; id: string }> = ({
  variant,
  id,
}) => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 1200 200"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="1" y2="1">
        {/* Stops are set through `style` rather than the `stop-color`
            attribute: a CSS variable only resolves in a style declaration. */}
        <stop offset="0%" style={{ stopColor: "rgb(var(--blue-600))" }} />
        <stop offset="55%" style={{ stopColor: "rgb(var(--blue-500))" }} />
        <stop offset="100%" style={{ stopColor: VARIANT_TINT[variant] }} />
      </linearGradient>

      {/* A soft light source in the upper right, which is what stops the
          gradient from reading as a flat swatch. */}
      <radialGradient id={`${id}-glow`} cx="0.78" cy="0.1" r="0.7">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>

    <rect width="1200" height="200" fill={`url(#${id}-ground)`} />
    <rect width="1200" height="200" fill={`url(#${id}-glow)`} />

    {/* Three sweeps at increasing opacity. Drawn well outside the viewBox so
        the curve reads as a slice of something larger passing through. */}
    <path
      d="M-40 210 C 220 120, 380 260, 700 130 S 1080 40, 1260 96 L1260 210 Z"
      fill="#fff"
      fillOpacity="0.05"
    />
    <path
      d="M-40 210 C 260 160, 420 250, 760 168 S 1100 96, 1260 140 L1260 210 Z"
      fill="#fff"
      fillOpacity="0.07"
    />
    <path
      d="M620 -30 C 760 60, 900 -10, 1010 70 S 1180 150, 1260 120 L1260 -30 Z"
      fill="#000"
      fillOpacity="0.035"
    />
  </svg>
);

export interface SectionHeaderProps {
  /** The section's name. The one thing that is never optional. */
  title: React.ReactNode;
  /** A sentence on what the section is for. */
  description?: React.ReactNode;
  /** Small label above the title - a breadcrumb or a category. */
  eyebrow?: React.ReactNode;
  /** Sits beside the title, for a count or a status. */
  badge?: React.ReactNode;
  /** A primary action, placed clear of the illustration. */
  action?: React.ReactNode;
  /**
   * The artwork. Any node: the SVG illustrations in ./illustrations, or a
   * LottieIllustration once an animation is chosen for this section.
   * Hidden below `lg`, where the width is worth more than the decoration.
   */
  illustration?: React.ReactNode;
  variant?: SectionVariant;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  eyebrow,
  badge,
  action,
  illustration,
  variant = "default",
  className = "",
}) => {
  // The gradient ids have to be unique per instance: two banners on one page
  // would otherwise both resolve to whichever `defs` block rendered first.
  const id = React.useId().replace(/:/g, "");

  return (
    <header
      className={`relative isolate overflow-hidden rounded-2xl ${className}`}
    >
      <BannerBackdrop variant={variant} id={id} />

      {/* 136px of gradient at the top of every screen is a tenth of a phone,
          spent restating a title the app bar is already showing. The banner
          keeps its job on mobile - it frames the section and holds its
          actions - in about two thirds of the height. */}
      <div className="relative flex min-h-[6.5rem] items-center px-4 py-3.5 sm:min-h-[9.5rem] sm:px-8 sm:py-4">
        {/* Copy. `lg:pr-64` is what keeps this column clear of the artwork.
            The prose is capped again inside, but the action row is not: a
            measure that suits a sentence is narrower than three buttons need,
            and capping them wrapped the last action onto its own line on any
            screen with more than two. */}
        <div className="min-w-0 flex-1 lg:pr-64">
          {/* The eyebrow is a breadcrumb, and on a phone the app bar above it
              already says which screen this is. Desktop keeps it: there the
              equivalent context lives in a sidebar the eye has to travel to. */}
          {eyebrow && (
            <p className="hidden max-w-2xl text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 sm:block">
              {eyebrow}
            </p>
          )}

          <div className="flex max-w-2xl flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {title}
            </h1>
            {badge}
          </div>

          {/* Clamped rather than hidden: the first two lines carry the point
              of every one of these sentences, and a third line on a 375px
              screen pushes the actions off the banner. */}
          {description && (
            <p className="mt-1 line-clamp-2 max-w-xl text-[13px] leading-snug text-white/90 sm:mt-1.5 sm:line-clamp-none sm:text-sm sm:leading-relaxed">
              {description}
            </p>
          )}

          {action && (
            <div className="mt-2.5 flex flex-wrap gap-2 sm:mt-3 sm:gap-2.5">
              {action}
            </div>
          )}
        </div>

        {/* Artwork. Decorative, so it is out of the accessibility tree - the
            heading beside it already says what the section is. */}
        {illustration && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block xl:right-8"
          >
            {illustration}
          </div>
        )}
      </div>
    </header>
  );
};

export default SectionHeader;
