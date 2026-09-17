import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { DUR, EASE, panelSpring, pressSpring } from "../../lib/motion";
import { SheetIconButton } from "../mobile/DetailSheet";

const WIDTHS = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
} as const;

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  width?: keyof typeof WIDTHS;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
  /**
   * What the phone app bar is called, when the record's own name belongs on
   * the subject row underneath it instead. Falls back to `title`.
   */
  screenTitle?: string;
  /** Trailing control in the phone app bar. */
  headerAction?: React.ReactNode;
  /**
   * What the body sits on below `sm`.
   *
   * "page" is the detail-sheet look: the page tone behind, content on lifted
   * cards. It is only right for a body already built from filled cards - an
   * unfilled bordered block reads as a hollow outline on a tinted ground - so
   * panels whose content was written for a white surface stay on "panel"
   * until their sections are moved onto cards.
   */
  surface?: "panel" | "page";
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Right-anchored sliding panel, styled to match the app's premium modal.
 *
 * Below `sm` it is not a panel at all but a pushed screen: full width, the
 * detail sheet's app bar, and a back arrow where a phone user expects one.
 * That is the same spatial model the drawer already had - a detail view
 * arriving from the right - read the way a phone reads it.
 *
 * The phone chrome is the one in `mobile/DetailSheet`, so a work-from-home
 * session, a voice submission and an attendance record all open the same way.
 * From `sm` up the panel keeps its own header: there the drawer sits beside
 * the page rather than replacing it, and a centred title with a back arrow
 * would be describing a navigation that did not happen.
 */
const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  width = "xl",
  title,
  description,
  icon,
  iconClassName = "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  screenTitle,
  headerAction,
  surface = "panel",
  headerExtra,
  footer,
  children,
}) => {
  const reduce = useReducedMotion();
  const isPhone = useMediaQuery("(max-width: 639px)");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /** The name the phone app bar carries. */
  const barTitle =
    screenTitle ?? (typeof title === "string" ? title : "Details");

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE.out }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={
              reduce
                ? { opacity: 1 }
                : { x: 0, transition: panelSpring }
            }
            exit={
              reduce
                ? { opacity: 0 }
                : { x: "100%", transition: { duration: DUR.base, ease: EASE.in } }
            }
            /* Swipe right to go back, on phones only. */
            drag={reduce || !isPhone ? false : "x"}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 90 || info.velocity.x > 500) onClose();
            }}
            /* The app bar always sits on the page tone, so the phone chrome
               matches the detail sheets; whether the body joins it is the
               `surface` prop's call. From `sm` up this is a panel over the
               page and keeps the panel tone throughout. */
            className={`relative flex h-full w-full touch-pan-y flex-col border-l border-gray-200/80 shadow-2xl shadow-gray-900/20 dark:border-gray-700/60 sm:bg-white sm:dark:bg-gray-900 ${
              surface === "page"
                ? "bg-[var(--surface)]"
                : "bg-white dark:bg-gray-900"
            } ${WIDTHS[width]}`}
          >
            {/* Phone app bar. Back arrow, centred title, optional action -
                and `--safe-top`, which is what keeps the row out of the iPhone
                status bar: the panel is full-height and fixed, so without the
                inset the back arrow lands in the strip iOS keeps for itself,
                where taps never arrive. */}
            <div className="flex-shrink-0 border-b border-black/5 bg-[var(--surface)] px-[max(1.125rem,var(--safe-left))] pb-3 pt-[calc(0.375rem+var(--safe-top))] dark:border-white/[0.07] sm:hidden">
              <div className="flex items-center justify-between gap-3 py-2">
                <SheetIconButton
                  label="Back"
                  icon={ArrowLeftIcon}
                  onClick={onClose}
                />
                <h2 className="min-w-0 flex-1 truncate text-center text-[14.5px] font-semibold text-gray-900 dark:text-gray-100">
                  {barTitle}
                </h2>
                {headerAction ?? (
                  <span
                    aria-hidden="true"
                    className="h-[34px] w-[34px] flex-none"
                  />
                )}
              </div>

              {/* The subject row: what this screen is about, under its name.
                  Only drawn when there is something to say that the bar title
                  has not already said. */}
              {(description || (screenTitle && title)) && (
                <div className="mt-1 flex items-start gap-3">
                  {icon && (
                    <div
                      className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${iconClassName}`}
                    >
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {screenTitle && title && (
                      <p className="truncate text-[17px] font-bold leading-tight text-gray-900 dark:text-white">
                        {title}
                      </p>
                    )}
                    {description && (
                      <div className="min-w-0 text-[12.5px] text-gray-500 dark:text-gray-400">
                        {description}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {headerExtra}
            </div>

            {/* Panel header, from `sm` up. */}
            <div className="hidden flex-shrink-0 border-b border-gray-100 px-4 pb-4 dark:border-gray-800 sm:block sm:px-5">
              <div className="flex items-start gap-3 pt-4">
                {icon && (
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
                  >
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1 sm:pr-8">
                  {title && (
                    <h2 className="truncate text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {description}
                    </div>
                  )}
                </div>
              </div>
              {headerExtra}
              <motion.button
                whileHover={{ rotate: 90, scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                transition={pressSpring}
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 hidden h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 sm:flex"
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Body */}
            <div
              className={`scroll-pane flex-1 ${
                footer ? "" : "pb-[var(--safe-bottom)]"
              }`}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className={`flex-shrink-0 border-t border-black/5 px-4 pb-[calc(1rem+var(--safe-bottom)+var(--keyboard-inset))] pt-4 backdrop-blur-sm dark:border-white/[0.07] sm:bg-white/80 sm:px-5 sm:pb-4 sm:dark:bg-gray-900/80 ${
                  surface === "page"
                    ? "bg-[var(--surface)]/90"
                    : "bg-white/80 dark:bg-gray-900/80"
                }`}
              >
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Drawer;
