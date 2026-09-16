import React, { forwardRef } from "react";

/**
 * The app's one button.
 *
 * The material - glass fill, hairline edge, sheen, accent gradient - lives in
 * the shared .btn-* classes in design-system.css, so this component and the
 * plain `className="btn-primary"` call sites stay the same thing. What the
 * component adds is a typed API over it: variant, size, icons and a loading
 * state that cannot get out of sync with `disabled`.
 *
 * Shape is a pill at every size. Tailwind utilities are emitted after
 * design-system.css, so the size classes here override the default height and
 * padding the .btn-* rules set.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon, e.g. PlusIcon from @heroicons. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Trailing icon - chevrons, external-link marks. */
  iconRight?: React.ComponentType<{ className?: string }>;
  /** Swaps the leading icon for a spinner and disables the button. */
  loading?: boolean;
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

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      iconRight: IconRight,
      loading = false,
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
    const iconClass = ICON_SIZE[size];

    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`inline-flex items-center justify-center rounded-full font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
          VARIANTS[variant]
        } ${iconOnly ? ICON_ONLY[size] : SIZES[size]} ${
          fullWidth ? "w-full" : ""
        } ${className}`}
      >
        {loading ? (
          <Spinner className={iconClass} />
        ) : (
          Icon && <Icon className={iconClass} />
        )}
        {!iconOnly && children}
        {!loading && IconRight && <IconRight className={iconClass} />}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
