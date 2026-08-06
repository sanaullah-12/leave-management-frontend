import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

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
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
                : {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: "spring", stiffness: 320, damping: 30 },
                  }
            }
            exit={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } }
            }
            /* On phones this is a near-full-height sheet rather than a small
               centred box: a dialog occupying a third of the screen forces its
               own content into a nested scroller, which is the usual reason
               modals feel cramped on mobile. dvh tracks the visible viewport as
               mobile browser chrome hides and shows. */
            className={`relative flex max-h-[92dvh] min-h-[40vh] w-full flex-col overflow-hidden border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-2xl shadow-gray-900/20 rounded-t-3xl sm:max-h-[94vh] sm:min-h-0 sm:rounded-3xl ${SIZES[size]} ${panelClassName}`}
          >
            {/* Grab handle - the standard affordance that marks a sheet as
                dismissible. Sheet-only, so desktop dialogs are unchanged. */}
            <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
              <span className="h-1 w-9 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Close button */}
            {!hideClose && (
              <motion.button
                whileHover={{ rotate: 90, scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
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
              className={`flex-1 overflow-y-auto ${
                hasHeader ? "px-6 pb-6" : ""
              } ${bodyClassName}`}
            >
              {children}
            </div>

            {/* Sticky footer */}
            {footer && (
              <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 px-6 py-4 backdrop-blur-sm">
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
