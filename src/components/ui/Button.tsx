import React, { forwardRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/solid";
import { DUR, EASE, pressSpring } from "../../lib/motion";

/**
 * The app's one button.
 *
 * The material - glass fill, hairline edge, sheen, accent gradient - lives in
 * the shared .btn-* classes in design-system.css, so this component and the
 * plain `className="btn-primary"` call sites stay the same thing. What the
 * component adds is a typed API over it: variant, size, icons, and busy and
 * done states that cannot get out of sync with `disabled`.
 *
 * Shape is a pill at every size. Tailwind utilities are emitted after
 * design-system.css, so the size classes here override the default height and
 * padding the .btn-* rules set.
 *
 * MOTION
 * ------
 * A button is the control the whole product is judged on, because it is the
 * one the user is touching at the moment they are waiting to find out whether
 * anything happened. Three things are animated, and nothing else is:
 *
 *   Press. A 4% shrink on a spring stiff enough to finish before the finger
 *   lifts. This is feedback, not animation - it exists so the tap is
 *   acknowledged in the same frame it lands, well before the request it
 *   started comes back.
 *
 *   Busy. The label is replaced rather than the whole button, and the button
 *   holds its width while that happens. A button that resizes when it starts
 *   working moves the thing next to it, and on a footer of two actions that
 *   means Cancel sliding out from under a finger that is already on its way.
 *
 *   Done. The brief tick in `success`. Worth having because the alternative -
 *   a toast - appears somewhere else on the screen, and the user is looking
 *   here. It is the same mark as `<SuccessCheck>`, one size down.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

/**
 * React's animation and drag handlers collide with Framer's props of the same
 * names, so they are dropped rather than left to resolve to the wrong one.
 * Nothing in the app passes them to a button.
 */
type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | "size"
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
>;

export interface ButtonProps extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon, e.g. PlusIcon from @heroicons. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Trailing icon - chevrons, external-link marks. */
  iconRight?: React.ComponentType<{ className?: string }>;
  /** Swaps the leading icon for a spinner and disables the button. */
  loading?: boolean;
  /**
   * Shows a tick in place of the label. The caller owns the timing: set it
   * when the work lands and clear it a second or so later.
   */
  success?: boolean;
  /** Label for the done state. Defaults to keeping the button's own children. */
  successLabel?: string;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  /** Square pill for an icon with no label. */
  iconOnly?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
  success: "btn-success",
  ghost: "btn-ghost",
};

/**
 * Horizontal padding is kept at or above half the height, or a pill pinches.
 *
 * Every preset is a step taller below `sm`. A 32px button is the right optical
 * weight beside 13px text under a mouse and a coin-flip under a thumb, and the
 * `sm:` half puts the desktop size back exactly.
 */
const SIZES: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs gap-1 sm:h-7",
  sm: "h-10 px-3.5 text-[13px] gap-1.5 sm:h-8",
  md: "h-11 px-4 text-[13px] gap-1.5 sm:h-9 sm:px-4",
  lg: "h-12 px-5 text-sm gap-2 sm:h-10",
};

/** Icon-only buttons go square-then-round, so they land as true circles. */
const ICON_ONLY: Record<ButtonSize, string> = {
  xs: "h-8 w-8 px-0 sm:h-7 sm:w-7",
  sm: "h-10 w-10 px-0 sm:h-8 sm:w-8",
  md: "h-11 w-11 px-0 sm:h-9 sm:w-9",
  lg: "h-12 w-12 px-0 sm:h-10 sm:w-10",
};

const ICON_SIZE: Record<ButtonSize, string> = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-4 w-4",
  lg: "h-[18px] w-[18px]",
};

const Spinner: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2.5"
      className="opacity-25"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

/** How the three states cross over. Short: this is a swap, not a journey. */
const SWAP = { duration: DUR.fast, ease: EASE.out } as const;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      iconRight: IconRight,
      loading = false,
      success = false,
      successLabel,
      fullWidth = false,
      iconOnly = false,
      disabled,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const reduce = useReducedMotion();
    const iconClass = ICON_SIZE[size];

    /* Which of the three faces is showing. A single key rather than nested
       ternaries inside the tree, so AnimatePresence sees one swap and not a
       different element identity for every combination. */
    const state = loading ? "loading" : success ? "success" : "idle";

    const face = (() => {
      if (state === "loading") {
        return (
          <>
            <Spinner className={iconClass} />
            {!iconOnly && children}
          </>
        );
      }
      if (state === "success") {
        return (
          <>
            <CheckIcon className={iconClass} />
            {!iconOnly && (successLabel ?? children)}
          </>
        );
      }
      return (
        <>
          {Icon && <Icon className={iconClass} />}
          {!iconOnly && children}
          {IconRight && <IconRight className={iconClass} />}
        </>
      );
    })();

    return (
      <motion.button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        /* Press is suppressed while busy or done: a control that still answers
           a tap it is not going to act on is worse than one that plainly does
           not respond. */
        whileTap={
          reduce || disabled || loading || success ? undefined : { scale: 0.96 }
        }
        transition={pressSpring}
        className={`relative inline-flex items-center justify-center rounded-full font-semibold transition-[background-color,box-shadow,opacity,color] duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
          VARIANTS[variant]
        } ${iconOnly ? ICON_ONLY[size] : SIZES[size]} ${
          fullWidth ? "w-full" : ""
        } ${className}`}
      >
        {/* `mode="popLayout"` takes the outgoing face out of the flow while it
            leaves, so the incoming one is centred from its first frame instead
            of being shouldered aside by the label it is replacing. The two
            faces differ only by which glyph leads them, so the button's width
            moves by an icon at most - and it moves once, on the swap, rather
            than tracking a spinner in and out. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={state}
            className="inline-flex items-center justify-center gap-[inherit]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={SWAP}
          >
            {face}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
