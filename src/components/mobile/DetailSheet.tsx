import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { initialsOf } from "./primitives";

/**
 * The detail sheet - what a drawer looks like on a phone.
 *
 * Every module in this app opens a right-hand panel to show one record in
 * full: an employee's attendance, a single day, a work-from-home session, a
 * voice submission, a letterhead. On a phone none of those are panels. They
 * are the second screen of a push navigation, so they take that shape here -
 * an app bar with a back arrow and the record's name, the record itself on
 * cards over the page tone, and the one action it offers pinned to the bottom.
 *
 * ## Why the pieces live here rather than in each drawer
 *
 * The attendance and work-from-home drawers had each grown their own head row,
 * their own bordered sections and their own 11px label colour. They were close
 * enough to look like one design and different enough to read as several, and
 * a change to the card radius meant editing all of them. Everything a detail
 * sheet is built from is in this file, so the design is one decision.
 *
 * ## Colour
 *
 * Cards sit lifted on the page tone rather than being separated by hairlines:
 * on a small screen a 1px divider is the first thing lost, and a card that
 * carries its own edge survives. The lift is `--card-surface` against
 * `--surface` and the accent is `--accent`, all of which the theme system
 * remaps, so a sheet follows the user's palette through all ten and both
 * schemes rather than pinning one brand colour.
 */

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

interface ShellProps {
  onClose: () => void;
  /** id of the element naming this sheet, for aria-labelledby. */
  labelledBy?: string;
  /** Stacking order. A sheet opened from another sheet passes a higher one. */
  z?: number;
  /**
   * False while another sheet is stacked on top. Escape then belongs to that
   * sheet - closing both layers on one press loses the list underneath.
   */
  escapeEnabled?: boolean;
  children: React.ReactNode;
}

/**
 * Portal, scrim and panel.
 *
 * Rendered into document.body rather than in place: inside the page's own
 * stacking context the panel's z-index is only compared against its siblings
 * there, which left the app sidebar - a sibling of that whole context - above
 * the scrim and undimmed.
 */
export const DetailShell: React.FC<ShellProps> = ({
  onClose,
  labelledBy,
  z = 60,
  escapeEnabled = true,
  children,
}) => {
  // Read through refs so the effect below stays mount-only. Re-running it
  // would capture the `hidden` it set itself as the value to restore, and the
  // page would never scroll again.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const escapeRef = useRef(escapeEnabled);
  escapeRef.current = escapeEnabled;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus moves into the sheet, or a screen reader and a keyboard are both
    // left behind on the page the sheet is covering.
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && escapeRef.current) closeRef.current();
    };
    document.addEventListener("keydown", onKey);

    // iOS ignores `overflow: hidden` on <body> once a touch scroll is already
    // in flight, so the page is pinned by position and its offset restored on
    // close - otherwise dismissing the sheet dropped the user at the top of
    // whatever list they opened it from.
    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 flex justify-end bg-[var(--overlay-scrim)] backdrop-blur-[2px]"
      style={{ zIndex: z }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        /* Full width on a phone, a 440px panel from `sm` up. At 92vw the panel
           left a strip of dimmed page down one side too narrow to aim at and
           too wide to ignore; a phone detail view is a screen, not a panel. */
        className="relative flex h-full w-full flex-col bg-[var(--surface)] shadow-2xl focus:outline-none sm:w-[440px] sm:max-w-[92vw]"
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

/* ------------------------------------------------------------------ */
/* App bar                                                             */
/* ------------------------------------------------------------------ */

/** The 34px bordered square either side of a sheet's title. */
export const SheetIconButton: React.FC<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}> = ({ label, icon: Icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    /* 34px drawn inside a 44px hit area: 34px is the right optical weight
       beside a 14.5px title, and 44px is the smallest thing a thumb hits
       reliably. The negative margin keeps the grown target from pushing the
       title off centre. */
    className="-m-[5px] grid h-11 w-11 flex-none place-items-center text-gray-500 dark:text-gray-400"
  >
    <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] border border-gray-200 bg-[var(--card-surface)] transition-transform active:scale-90 dark:border-white/10">
      <Icon className="h-[17px] w-[17px]" />
    </span>
  </button>
);

interface HeaderProps {
  title: string;
  onBack: () => void;
  /** Trailing control - an overflow menu, a status pill, a refresh. */
  action?: React.ReactNode;
  /** Who or what the sheet is about, shown under the title bar. */
  subject?: {
    name: string;
    meta?: React.ReactNode;
    /** Replaces the initials disc, for a sheet whose subject is not a person. */
    avatar?: React.ReactNode;
  };
  titleId?: string;
}

/**
 * Back arrow, screen title, trailing action, and the subject row.
 *
 * The title is centred and the arrow is on the leading edge because that is
 * where a phone user looks for them. When there is no trailing action an empty
 * box holds the space, so the title stays centred rather than drifting
 * whenever an action appears.
 *
 * `--safe-top` is what keeps the row out of the iPhone status bar: the panel is
 * full-height and fixed, so it starts at y=0, and without the inset the back
 * arrow lands in the strip iOS keeps for itself where taps never arrive.
 */
export const DetailHeader: React.FC<HeaderProps> = ({
  title,
  onBack,
  action,
  subject,
  titleId,
}) => (
  <div className="flex-shrink-0 border-b border-black/5 px-[max(1.125rem,var(--safe-left))] pb-4 pt-[calc(0.375rem+var(--safe-top))] dark:border-white/[0.07]">
    <div className="flex items-center justify-between gap-3 py-2">
      <SheetIconButton label="Back" icon={ArrowLeftIcon} onClick={onBack} />
      <h2 className="min-w-0 flex-1 truncate text-center text-[14.5px] font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>
      {action ?? (
        <span aria-hidden="true" className="h-[34px] w-[34px] flex-none" />
      )}
    </div>

    {subject && (
      <div className="mt-2 flex items-center gap-3">
        {subject.avatar ?? <SubjectAvatar name={subject.name} />}
        <div className="min-w-0">
          <p
            id={titleId}
            className="truncate text-[18px] font-bold leading-tight text-gray-900 dark:text-white"
          >
            {subject.name}
          </p>
          {subject.meta && (
            <p className="mt-0.5 truncate text-[12.5px] text-gray-500 dark:text-gray-400">
              {subject.meta}
            </p>
          )}
        </div>
      </div>
    )}
  </div>
);

/**
 * The subject's initials on an accent disc.
 *
 * A circle here and a rounded square in the lists on purpose: a list tile
 * stands for a row, this stands for the person the whole screen is about.
 */
export const SubjectAvatar: React.FC<{ name?: string }> = ({ name }) => (
  <span
    aria-hidden="true"
    className="grid h-[52px] w-[52px] flex-none place-items-center rounded-full text-[19px] font-bold text-white"
    style={{
      backgroundImage:
        "linear-gradient(135deg, color-mix(in srgb, var(--accent) 72%, white) 0%, var(--accent) 100%)",
    }}
  >
    {initialsOf(name)}
  </span>
);

/* ------------------------------------------------------------------ */
/* Body                                                                */
/* ------------------------------------------------------------------ */

/**
 * The scrolling stack of cards.
 *
 * The bottom padding clears the home indicator, and a further 4rem when the
 * sheet pins an action, so the last card is never trapped behind it.
 */
export const DetailBody: React.FC<{
  children: React.ReactNode;
  /** Set when the sheet pins an action to the bottom. */
  hasFooter?: boolean;
}> = ({ children, hasFooter = false }) => (
  <div
    className={`scroll-pane flex-1 space-y-4 px-[max(1.125rem,var(--safe-left))] pt-4 ${
      hasFooter
        ? "pb-[calc(6rem+var(--safe-bottom))]"
        : "pb-[calc(2rem+var(--safe-bottom))]"
    }`}
  >
    {children}
  </div>
);

/**
 * The sheet's single action, pinned to the bottom edge.
 *
 * It fades into the page tone rather than sitting on a hard bar: the card
 * behind has to look like it continues under the action, or the sheet reads as
 * having ended early.
 */
export const DetailFooter: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--surface)] from-60% to-transparent px-[max(1.125rem,var(--safe-left))] pb-[calc(1.375rem+var(--safe-bottom)+var(--keyboard-inset))] pt-8">
    <div className="pointer-events-auto">{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export const DetailCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <section
    className={`rounded-[20px] border border-black/[0.06] bg-[var(--card-surface)] p-4 dark:border-white/[0.07] ${className}`}
  >
    {children}
  </section>
);

/** Card title, optional count or range beneath it, optional trailing control. */
export const CardHead: React.FC<{
  title: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, sub, action, className = "mb-4" }) => (
  <div className={`flex items-center justify-between gap-3 ${className}`}>
    <div className="min-w-0">
      <h3 className="truncate text-[14.5px] font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {sub && (
        <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
          {sub}
        </p>
      )}
    </div>
    {action && <div className="flex-none">{action}</div>}
  </div>
);

/** The quiet pill that opens the full list behind a card's summary. */
export const CardAction: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-transform active:scale-95"
    style={{ backgroundColor: "var(--accent-wash)", color: "var(--accent)" }}
  >
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/* Rows and tiles                                                      */
/* ------------------------------------------------------------------ */

/** One fact about the record, with its own icon tile. */
export const InfoRow: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}> = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2.5 py-2 text-[13px] text-gray-600 dark:text-gray-300">
    <span className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-black/[0.06] bg-[var(--card-surface)] text-gray-400 dark:border-white/[0.07] dark:text-gray-500">
      <Icon className="h-3.5 w-3.5" />
    </span>
    <span className="min-w-0 truncate">{children}</span>
  </div>
);

/** A small labelled reading inside a card - three to a row. */
export const MiniStat: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}> = ({ icon: Icon, label, value }) => (
  <div className="rounded-[10px] bg-black/[0.035] px-2 py-3 dark:bg-white/[0.05]">
    <Icon className="mb-1.5 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
    <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
      {label}
    </p>
    <p className="mt-0.5 truncate text-[13.5px] font-bold text-gray-900 dark:text-gray-100">
      {value}
    </p>
  </div>
);

/** A counted state - present, late, absent. The dot carries the tone. */
export const StatBox: React.FC<{
  tone: string;
  value: React.ReactNode;
  label: string;
}> = ({ tone, value, label }) => (
  <div className="rounded-[10px] bg-black/[0.035] px-2.5 py-3 dark:bg-white/[0.05]">
    <span
      aria-hidden="true"
      className="mb-2 block h-[7px] w-[7px] rounded-full"
      style={{ background: tone }}
    />
    <p className="text-[18px] font-bold leading-none text-gray-900 dark:text-gray-100">
      {value}
    </p>
    <p className="mt-1 truncate text-[10.5px] text-gray-400 dark:text-gray-500">
      {label}
    </p>
  </div>
);

/** A single figure that sums up the card above it. */
export const RateRow: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: string;
}> = ({ label, value, tone = "var(--accent)" }) => (
  <div className="flex items-center justify-between gap-3 rounded-[10px] bg-black/[0.035] px-3.5 py-3 dark:bg-white/[0.05]">
    <span className="min-w-0 text-[12px] text-gray-500 dark:text-gray-400">
      {label}
    </span>
    <span className="flex-none text-[16px] font-bold" style={{ color: tone }}>
      {value}
    </span>
  </div>
);

/**
 * A date, what happened, and the verdict.
 *
 * Rendered as a button when the row opens something, so it is reachable by
 * keyboard and announced as a control rather than being a div that happens to
 * respond to a tap.
 */
export const HistoryRow: React.FC<{
  date: React.ReactNode;
  detail: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
}> = ({ date, detail, badge, onClick }) => {
  const inner = (
    <>
      <span className="w-[78px] flex-none truncate text-start text-[12.5px] font-semibold text-gray-900 dark:text-gray-100">
        {date}
      </span>
      <span className="min-w-0 flex-1 truncate text-start text-[12px] text-gray-500 dark:text-gray-400">
        {detail}
      </span>
      {badge}
    </>
  );

  const shared =
    "flex w-full items-center justify-between gap-2 border-b border-black/5 py-[11px] last:border-b-0 last:pb-0 dark:border-white/[0.07]";

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`${shared} -mx-2 w-[calc(100%+1rem)] rounded-lg px-2 transition-colors active:bg-black/5 dark:active:bg-white/10`}
    >
      {inner}
    </button>
  ) : (
    <div className={shared}>{inner}</div>
  );
};

/** Label on the left, value on the right - the shape of a record's fields. */
export const FieldRow: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 py-1.5 text-[13px]">
    <span className="flex-none text-gray-500 dark:text-gray-400">{label}</span>
    <span className="min-w-0 break-words text-right font-medium text-gray-900 dark:text-gray-100">
      {value}
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Arrival track                                                       */
/* ------------------------------------------------------------------ */

/**
 * Where a time sits inside the window it is judged in.
 *
 * The bar carries the reading on its own and the upright marks the rule it was
 * judged against; a knob on the end of the fill only repeated the number
 * printed under it.
 */
export const RangeTrack: React.FC<{
  fillPct: number;
  markPct: number;
  from: string;
  to: string;
  mark: string;
  late?: boolean;
}> = ({ fillPct, markPct, from, to, mark, late = false }) => (
  <div>
    <div className="relative mb-2 h-1.5 rounded-full bg-black/[0.07] dark:bg-white/[0.12]">
      <div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{
          width: `${fillPct}%`,
          backgroundImage: late
            ? "linear-gradient(90deg, #d97706, #b45309)"
            : "linear-gradient(90deg, color-mix(in srgb, var(--accent) 70%, white), var(--accent))",
        }}
      />
      <div
        className="absolute -top-1 h-3.5 w-0.5 rounded-sm bg-gray-500 dark:bg-gray-300"
        style={{ left: `${markPct}%` }}
        title={mark}
      />
    </div>
    <div className="flex justify-between text-[10.5px] text-gray-400 dark:text-gray-500">
      <span>{from}</span>
      <span>{mark}</span>
      <span>{to}</span>
    </div>
  </div>
);
