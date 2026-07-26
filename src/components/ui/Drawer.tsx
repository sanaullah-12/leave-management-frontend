import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

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
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Right-anchored sliding panel, styled to match the app's premium modal. */
const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  width = "xl",
  title,
  description,
  icon,
  iconClassName = "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  headerExtra,
  footer,
  children,
}) => {
  const reduce = useReducedMotion();

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

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={
              reduce
                ? { opacity: 1 }
                : {
                    x: 0,
                    transition: { type: "spring", stiffness: 320, damping: 34 },
                  }
            }
            exit={reduce ? { opacity: 0 } : { x: "100%", transition: { duration: 0.2 } }}
            className={`relative flex h-full w-full flex-col border-l border-gray-200/80 bg-white shadow-2xl shadow-gray-900/20 dark:border-gray-700/60 dark:bg-gray-900 ${WIDTHS[width]}`}
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div className="flex items-start gap-3 pr-8">
                {icon && (
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
                  >
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
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
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 border-t border-gray-100 bg-white/80 px-5 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
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
