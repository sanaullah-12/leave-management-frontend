import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { DUR, EASE, panelSpring, pressSpring } from "../../lib/motion";

const SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  "2xl": "sm:max-w-5xl",
} as const;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: keyof typeof SIZES;
  /** Standard header pieces (omit all to render a fully custom panel). */
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Override the icon tile styling (defaults to blue). */
  iconClassName?: string;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  hideClose?: boolean;
  closeOnBackdrop?: boolean;
  /** Extra classes for the panel (e.g. padding overrides for custom layouts). */
  panelClassName?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  size = "md",
  title,
  description,
  icon,
  iconClassName = "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  badge,
  footer,
  hideClose = false,
  closeOnBackdrop = true,
  panelClassName = "",
  bodyClassName = "",
  children,
}) => {
  const reduce = useReducedMotion();
  /* Below `sm` the panel is a bottom sheet; from `sm` up it is a centred
     dialog. The distinction drives the drag gesture, which only makes sense
     for the sheet. */
  const isSheet = useMediaQuery("(max-width: 639px)");
  const bodyRef = useRef<HTMLDivElement>(null);
  /* True only while the sheet's own scroller is at the top. A downward drag
     should scroll the content when there is content above; it should only
     start dismissing the sheet once there is nothing left to scroll. Without
     this the sheet is dragged away every time somebody tries to scroll up. */
  const [atTop, setAtTop] = useState(true);

  // Lock body scroll + close on Escape while open.
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

  const hasHeader = Boolean(title || icon || badge);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-safe sm:items-center sm:p-6">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE.out }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 28, scale: 0.97 }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1, transition: panelSpring }
            }
            exit={
              reduce
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    y: 16,
                    scale: 0.98,
                    transition: { duration: DUR.fast, ease: EASE.in },
                  }
            }
            /* On phones this is a near-full-height sheet rather than a small
               centred box: a dialog occupying a third of the screen forces its
               own content into a nested scroller, which is the usual reason
               modals feel cramped on mobile. dvh tracks the visible viewport as
               mobile browser chrome hides and shows. */
            /* Swipe down to dismiss, the gesture every native sheet answers
               to. Constrained to downward travel, and armed only when the
               body is scrolled to the top (see `atTop`) so it never competes
               with reading the sheet's own content. Desktop dialogs are not
               draggable - there is nothing to swipe with. */
            drag={reduce || !isSheet ? false : "y"}
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            dragListener={atTop}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            /* The keyboard eats the bottom of the viewport without changing
               dvh, so the sheet has to give that height back itself or its
               footer ends up underneath the keys. */
            style={{ maxHeight: "calc(92dvh - var(--keyboard-inset))" }}
            className={`relative flex min-h-[40vh] w-full touch-pan-y flex-col overflow-hidden border border-[var(--border-default)] bg-[var(--surface-overlay)] shadow-2xl shadow-gray-950/25 rounded-t-3xl sm:!max-h-[94vh] sm:min-h-0 sm:rounded-3xl ${SIZES[size]} ${panelClassName}`}
          >
            {/* Grab handle - the standard affordance that marks a sheet as
                dismissible. Sheet-only, so desktop dialogs are unchanged. */}
            <div className="flex shrink-0 justify-center pt-2.5 sm:hidden" aria-hidden="true">
              <span className="h-1 w-9 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Close button */}
            {!hideClose && (
              <motion.button
                whileHover={{ rotate: 90, scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                transition={pressSpring}
                onClick={onClose}
                aria-label="Close"
                // 44px hit area on touch, the original 32px box from sm up.
                className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 sm:right-4 sm:top-4 sm:h-8 sm:w-8"
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            )}

            {/* Standard header */}
            {hasHeader && (
              <div className="flex-shrink-0 px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-6">
                <div className="flex items-start gap-3 pr-10 sm:gap-4 sm:pr-8">
                  {icon && (
                    <div
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
                    >
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                        {title}
                      </h2>
                      {badge}
                    </div>
                    {description && (
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-5 h-px bg-gray-100 dark:bg-gray-800" />
              </div>
            )}

            {/* Body */}
            <div
              ref={bodyRef}
              onScroll={(e) => {
                const next = e.currentTarget.scrollTop <= 0;
                if (next !== atTop) setAtTop(next);
              }}
              className={`scroll-pane flex-1 ${
                hasHeader ? "px-4 pb-6 sm:px-6" : ""
              } ${
                /* With no footer the body is the last thing above the home
                   indicator, so it reserves that band itself. */
                footer ? "" : "pb-[calc(1.5rem+var(--safe-bottom))] sm:pb-6"
              } ${bodyClassName}`}
            >
              {children}
            </div>

            {/* Sticky footer */}
            {footer && (
              <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-overlay)]/85 px-4 pb-[calc(1rem+var(--safe-bottom))] pt-4 backdrop-blur-sm sm:px-6 sm:pb-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
