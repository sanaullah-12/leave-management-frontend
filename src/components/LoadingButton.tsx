import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import InlineLoader from "./InlineLoader";
import SuccessCheck from "./ui/motion/SuccessCheck";
import { DUR, EASE, pressSpring } from "../lib/motion";

interface LoadingButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    | "onAnimationStart"
    | "onAnimationEnd"
    | "onAnimationIteration"
    | "onDrag"
    | "onDragStart"
    | "onDragEnd"
    | "onDragEnter"
    | "onDragLeave"
    | "onDragOver"
    | "onDrop"
  > {
  loading?: boolean;
  /** Briefly show the success state (the parent owns the timing). */
  success?: boolean;
  loadingText?: string;
  successText?: string;
}

/**
 * A button that swaps its label for an inline loader while `loading`, shows the
 * app's success mark when `success`, and disables itself during processing.
 * Defaults to the app's `btn-primary` styling; override via `className`.
 *
 * The three faces cross over rather than replacing each other outright, and
 * the outgoing one leaves the flow while it goes, so the label that is arriving
 * is centred from its first frame instead of being shouldered aside by the one
 * it is replacing. Same arrangement as `<Button>`, deliberately - these two
 * coexist because call sites were written against both, and they should not
 * behave differently under a finger.
 */
const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  success = false,
  loadingText,
  successText = "Done",
  children,
  className = "btn-primary",
  disabled,
  ...rest
}) => {
  const reduce = useReducedMotion();
  const state = loading ? "loading" : success ? "success" : "idle";

  return (
    <motion.button
      className={`${className} inline-flex items-center justify-center gap-2`}
      disabled={disabled || loading}
      aria-busy={loading}
      whileTap={
        reduce || disabled || loading || success ? undefined : { scale: 0.96 }
      }
      transition={pressSpring}
      {...rest}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={state}
          className="inline-flex items-center justify-center gap-1.5"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: DUR.fast, ease: EASE.out }}
        >
          {state === "loading" ? (
            <InlineLoader label={loadingText} />
          ) : state === "success" ? (
            <>
              {/* The same mark as the toasts and the dialogs. Sized to sit on
                  the button's text line rather than tower over it. */}
              <SuccessCheck size={18} />
              {successText}
            </>
          ) : (
            children
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

export default LoadingButton;
