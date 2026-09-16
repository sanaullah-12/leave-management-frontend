import React from "react";

/**
 * The pieces a phone screen in this app is built from.
 *
 * A module's phone screens are one app tab, so they have to look like one
 * screen that changed rather than several pages that happen to share a header.
 * Keeping the card, the label, the tile and the status ink here is what holds
 * that together - a padding tweak lands on all of them at once.
 *
 * They live outside any one module because Attendance and the Dashboard both
 * build their phone screens from them, and a kit two modules share is not one
 * module's private business.
 */

/* ------------------------------------------------------------------ */
/* Colour                                                              */
/* ------------------------------------------------------------------ */

/**
 * The five states, as one palette.
 *
 * On time follows the theme accent; the other four are fixed. They carry
 * meaning - "late" turning pink with the theme would stop meaning anything -
 * and they are the same four hex values the desktop page and StatusBadge
 * already use, so a colour cannot say one thing on a phone and another on a
 * laptop.
 */
export const LATE_INK = "#b5650a";
export const ABSENT_INK = "#b42318";
export const LEAVE_INK = "#0e7490";
export const WFH_INK = "#4c3fc7";

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

/** The card these screens sit on. Same material as every other mobile list. */
export const SHEET = "glass-card rounded-[18px]";

/** An inset well inside a card - segmented bars, date fields, action tiles. */
export const WELL =
  "border border-gray-200 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.05]";

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */

/** Uppercase heading that names the group of rows under it. */
export const GroupLabel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <p
    className={`text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500 ${className}`}
  >
    {children}
  </p>
);

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const initialsOf = (name?: string) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/**
 * A rounded square of initials.
 *
 * Deliberately not a circle: a circle of initials reads as an avatar that
 * failed to load a photo, and there are no photos on this device roster.
 */
export const Tile: React.FC<{ name?: string; size?: 34 | 38 }> = ({
  name,
  size = 38,
}) => (
  <span
    aria-hidden="true"
    className="grid flex-none place-items-center rounded-[12px] bg-black/[0.05] font-bold text-gray-600 dark:bg-white/[0.07] dark:text-gray-300"
    style={{
      height: size,
      width: size,
      fontSize: size === 38 ? 13 : 12,
    }}
  >
    {initialsOf(name)}
  </span>
);

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

/** The 34px round icon button used in headers and beside the search field. */
export const IconButton: React.FC<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  busy?: boolean;
  disabled?: boolean;
}> = ({ label, icon: Icon, onClick, busy = false, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || busy}
    aria-label={label}
    className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] text-gray-500 transition-colors active:bg-black/5 disabled:opacity-50 dark:text-gray-400 dark:active:bg-white/10 ${WELL}`}
  >
    <Icon className={`h-[17px] w-[17px] ${busy ? "animate-spin" : ""}`} />
  </button>
);

/**
 * The primary action at the foot of a card. Full width, accent filled.
 *
 * One per screen at most: two accent-filled buttons on one screen is two
 * primary actions, which is none.
 */
export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  busy?: boolean;
}> = ({ children, onClick, disabled = false, icon: Icon, busy = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[13px] px-4 text-[13.5px] font-bold text-white transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    style={{ backgroundColor: "var(--accent)" }}
  >
    {Icon && <Icon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />}
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

/** Placeholder cards, shaped like the person cards they stand in for. */
export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="flex flex-col gap-2.5">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={`${SHEET} flex items-center gap-2.5 px-3.5 py-3`}>
        <div className="h-[38px] w-[38px] flex-none animate-pulse rounded-[12px] bg-black/[0.06] dark:bg-white/[0.07]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/2 animate-pulse rounded bg-black/[0.06] dark:bg-white/[0.07]" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-black/[0.06] dark:bg-white/[0.07]" />
        </div>
        <div className="h-4 w-12 animate-pulse rounded bg-black/[0.06] dark:bg-white/[0.07]" />
      </div>
    ))}
  </div>
);

/** What a screen says when it has nothing to report. */
export const EmptyNote: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body?: string;
}> = ({ icon: Icon, title, body }) => (
  <div className="px-6 py-10 text-center">
    <div className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-[18px] border border-gray-200 bg-[var(--card-surface)] text-gray-400 dark:border-white/10 dark:text-gray-500">
      <Icon className="h-6 w-6" />
    </div>
    <p className="text-[15px] font-bold text-gray-900 dark:text-white">{title}</p>
    {body && (
      <p className="mx-auto mt-1.5 max-w-[17rem] text-[12.5px] leading-relaxed text-gray-500 dark:text-gray-400">
        {body}
      </p>
    )}
  </div>
);
