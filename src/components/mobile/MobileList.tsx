import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { InboxIcon } from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import useListRowMotion from "../../hooks/useListRowMotion";
import { fadeIn, popIn, pressSpring, spring } from "../../lib/motion";

/**
 * Mobile list primitives.
 *
 * The pattern established on Leave Requests, generalised so every list screen
 * reads the same way on a phone:
 *
 *   - the list is a thin index: a tile, a title, one line of sub-detail and a
 *     tag. Enough to pick a row out, and nothing more.
 *   - everything else lives in a detail sheet one tap away.
 *
 * Cramming a full record into every row is what made these screens scroll for
 * six screens to show six items. Splitting index from detail is the whole
 * point; these components exist so that split is cheap to apply and identical
 * everywhere.
 *
 * All of it is `lg:hidden` at the call site - desktop tables are untouched.
 */

/** A 42px rounded-square tile of initials. Same shape family as tags/buttons. */
export const InitialsTile: React.FC<{ name?: string; className?: string }> = ({
  name,
  className = "",
}) => {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={`grid h-[42px] w-[42px] flex-none place-items-center rounded-[14px] text-[13px] font-extrabold tracking-wide text-white ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(150deg, color-mix(in srgb, var(--accent) 78%, white), var(--accent))",
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};

export interface MobileRowProps {
  title: string;
  /** Secondary line - an ID, department, or date. */
  subtitle?: string;
  /** Right-hand tag. Pass the tint classes with it. */
  tag?: { label: string; className: string };
  /** Draws the 3px left edge, marking a row that needs attention. */
  flagged?: boolean;
  flagClassName?: string;
  /** Overrides the initials tile (e.g. a real avatar or an icon). */
  leading?: React.ReactNode;
  onClick?: () => void;
  /**
   * Position in the list, which is what staggers the entrance. Pass the map
   * index. Left off, every row arrives at once - correct for a row that is not
   * part of a list, wrong for one that is.
   */
  index?: number;
}

export const MobileRow: React.FC<MobileRowProps> = ({
  title,
  subtitle,
  tag,
  flagged = false,
  flagClassName = "bg-amber-500",
  leading,
  onClick,
  index = 0,
}) => {
  // Safe to call here, unlike at the call site: a row is its own component, so
  // the hook runs once per row rather than in a loop whose length changes.
  const row = useListRowMotion();

  return (
    <motion.button
      {...row(index)}
      type="button"
      onClick={onClick}
      /* The row is the primary control on every mobile screen in the product -
         it is how a leave request, an employee and a document are all opened -
         so it gets the press, not just the tint. A background change on glass
         is close to invisible; the shrink is not. */
      whileTap={{ scale: 0.985 }}
      transition={pressSpring}
      className="glass-card relative w-full overflow-hidden rounded-[18px] px-4 pb-3.5 pt-4 text-left transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.03]"
    >
      {flagged && (
        <span className={`absolute inset-y-0 left-0 w-[3px] ${flagClassName}`} />
      )}
      <div className="flex items-center gap-3">
        {leading ?? <InitialsTile name={title} />}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold leading-tight tracking-[-0.01em] text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-[3px] truncate text-[11px] tracking-wide text-gray-400 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        {tag && (
          <span
            className={`shrink-0 rounded-lg px-2.5 py-[5px] text-[11px] font-bold capitalize ${tag.className}`}
          >
            {tag.label}
          </span>
        )}
      </div>
    </motion.button>
  );
};

export interface MobileFilter {
  key: string;
  label: string;
}

interface MobileListProps {
  title: string;
  /** Status line under the title, e.g. "5 waiting on you". */
  status?: { text: string; tone: "attention" | "clear" };
  /** Icon button on the right of the header. */
  action?: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; busy?: boolean };
  filters?: MobileFilter[];
  activeFilter?: string;
  onFilterChange?: (key: string) => void;
  /** Per-filter counts. Omit when they cannot be known - never guess. */
  counts?: Record<string, number> | null;
  empty: { title: string; body: string };
  children: React.ReactNode;
  isEmpty: boolean;
}

export const MobileList: React.FC<MobileListProps> = ({
  title,
  status,
  action,
  filters,
  activeFilter,
  onFilterChange,
  counts,
  empty,
  children,
  isEmpty,
}) => {
  const reduce = useReducedMotion();
  // Scoped so two lists on one screen do not hand the chip fill to each other.
  const strip = React.useId();

  return (
  <div className="lg:hidden">
    <div className="mb-3.5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-gray-900 dark:text-white">
          {title}
        </h2>
        {status && (
          <div className="mt-1.5 flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400">
            <span
              className={`h-[7px] w-[7px] rounded-full ${
                status.tone === "attention"
                  ? "bg-amber-500 ring-4 ring-amber-500/15"
                  : "bg-emerald-500 ring-4 ring-emerald-500/15"
              }`}
            />
            {status.text}
          </div>
        )}
      </div>

      {action && (
        <motion.button
          onClick={action.onClick}
          disabled={action.busy}
          aria-label={action.label}
          whileTap={reduce || action.busy ? undefined : { scale: 0.9 }}
          transition={pressSpring}
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-gray-200 bg-[var(--card-surface)] text-gray-500 transition-colors active:bg-black/5 disabled:opacity-60 dark:border-white/10 dark:text-gray-400 dark:active:bg-white/10"
        >
          <action.icon className={`h-[17px] w-[17px] ${action.busy ? "animate-spin" : ""}`} />
        </motion.button>
      )}
    </div>

    {filters && filters.length > 0 && (
      <div className="-mx-3 mb-3.5 flex gap-2 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => {
          const active = activeFilter === f.key;
          const count = counts ? counts[f.key] ?? 0 : null;
          return (
            <motion.button
              key={f.key}
              onClick={() => onFilterChange?.(f.key)}
              aria-pressed={active}
              whileTap={reduce ? undefined : { scale: 0.94 }}
              transition={pressSpring}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                active
                  ? "border-transparent text-white"
                  : "border-gray-200 bg-[var(--card-surface)] text-gray-500 dark:border-white/10 dark:text-gray-400"
              }`}
            >
              {/* The accent fill is one element that travels between chips
                  rather than a background switching off one and on another.
                  Same reasoning as the tab bar's badge and the tab strip's
                  pill: the eye follows a selection that moves, and has to
                  re-find one that teleports. All three now use the same
                  spring, so changing a filter, a tab and a screen are
                  recognisably the same gesture. */}
              {active && (
                <motion.span
                  layoutId={reduce ? undefined : `${strip}-chip`}
                  transition={spring}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: "var(--brand-solid)" }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
              {count !== null && (
                <span
                  className={`relative z-10 rounded-md px-1.5 py-px text-[11px] font-bold tabular-nums ${
                    active
                      ? "bg-black/20 text-white"
                      : "bg-black/5 text-gray-400 dark:bg-white/10 dark:text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    )}

    {/* Empty and populated are two states of one region, so they cross over
        rather than replacing each other. Switching a filter to something with
        no matches is the common case, and a list blinking straight to an empty
        panel reads as an error until the copy is read. */}
    <AnimatePresence mode="wait" initial={false}>
      {isEmpty ? (
        <motion.div
          key="empty"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="px-6 pt-12 text-center"
        >
          {/* The icon lands after the panel it sits in, which is what stops an
              empty state reading as a failed load. */}
          <motion.div
            variants={reduce ? undefined : popIn}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.05 }}
            className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[20px] border border-gray-200 bg-[var(--card-surface)] text-gray-400 dark:border-white/10 dark:text-gray-500"
          >
            <InboxIcon className="h-6 w-6" />
          </motion.div>
          <h4 className="text-[16px] font-bold text-gray-900 dark:text-white">
            {empty.title}
          </h4>
          <p className="mx-auto mt-2 max-w-[16rem] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
            {empty.body}
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="rows"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col gap-3.5"
        >
          {/* Rows that are removed shrink out and the column closes over them.
              Rows opt into that themselves - see useListRowMotion - so a list
              that never deletes anything pays nothing for the wrapper. */}
          <AnimatePresence initial={false}>{children}</AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  );
};

/** Section label inside a detail sheet. */
export const SheetLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
    {children}
  </p>
);

/** Inset panel used for balances, attachments and other boxed facts. */
export const SheetPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`rounded-[14px] border border-gray-200 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] ${className}`}
  >
    {children}
  </div>
);

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sticky footer - actions, or a status plus Close. */
  footer?: React.ReactNode;
}

/**
 * The detail sheet shell. Wraps the app's Modal (already a bottom sheet under
 * `sm`) with the padding this pattern uses: generous at the top and bottom
 * edges, and a footer that clears the iOS home indicator.
 */
export const MobileSheet: React.FC<MobileSheetProps> = ({
  open,
  onClose,
  children,
  footer,
}) => (
  <Modal open={open} onClose={onClose} size="md" hideClose>
    {/* Explicit values, not pt-6/pb-6: the mobile density layer compresses
        those to 16px, which is right for cards and tight against a sheet. */}
    <div className="px-4 pb-[22px] pt-[18px] sm:px-6">{children}</div>
    {footer && (
      <div
        className="flex gap-2.5 border-t border-gray-100 px-4 pt-4 dark:border-white/10 sm:px-6"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {footer}
      </div>
    )}
  </Modal>
);
