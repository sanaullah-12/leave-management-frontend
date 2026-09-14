import React, { forwardRef, useCallback, useId, useRef, useState } from "react";

/**
 * The app's one text input.
 *
 * Visual language is the pill field: a filled rounded-full shell carrying a
 * soft shadow, a muted leading icon, and - on focus - the shell going
 * transparent while a hairline accent border and the accent-tinted icon take
 * over. A non-empty field grows a round clear button on the trailing edge.
 *
 * Every colour is an app token rather than a fixed hex: the shell is
 * --card-surface (the same sheet Select, DatePicker and the cards sit on), the
 * hairline is the app's gray-200/white-10 pair, and the focus accent is
 * --blue-*, so the field recolours with the theme like everything else.
 *
 * Sizing is the caller's: `className` lands on the shell, so `w-64`, `h-9`,
 * `max-w-sm` and friends work there. `inputSize` only picks the default
 * height/padding/type-scale triple.
 *
 * Works controlled and uncontrolled - a react-hook-form register() spread goes
 * straight onto it, and the clear button writes through the native value setter
 * so react-hook-form sees a real input event.
 */

export type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Text label rendered above the field. */
  label?: string;
  /** Error message; also switches the shell to the danger border. */
  error?: string;
  /** Helper text under the field. Hidden while `error` is set. */
  hint?: string;
  /** Leading icon component, e.g. MagnifyingGlassIcon from @heroicons. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Custom trailing control (a visibility toggle, a unit suffix, a kbd hint). */
  trailing?: React.ReactNode;
  /** Show the round clear button once the field has a value. */
  clearable?: boolean;
  /** Called after the clear button empties the field. */
  onClear?: () => void;
  /** Height / padding / type-scale preset. Default "md" (40px, the design). */
  inputSize?: InputSize;
  /** Classes for the pill shell - width, height and margins go here. */
  className?: string;
  /** Classes for the input element itself. */
  inputClassName?: string;
  /** Classes for the outer block wrapping label, field and message. */
  wrapperClassName?: string;
}

const SIZES: Record<
  InputSize,
  {
    shell: string;
    text: string;
    pad: string;
    left: string;
    right: string;
    icon: string;
  }
> = {
  sm: {
    shell: "h-9",
    text: "text-[13px]",
    pad: "px-3.5",
    left: "left-3.5",
    right: "right-3.5",
    icon: "h-4 w-4",
  },
  md: {
    shell: "h-10",
    text: "text-sm",
    pad: "px-4",
    left: "left-4",
    right: "right-4",
    icon: "h-[17px] w-[17px]",
  },
  lg: {
    shell: "h-12",
    text: "text-[15px]",
    pad: "px-5",
    left: "left-5",
    right: "right-5",
    icon: "h-5 w-5",
  },
};

/** Leading/trailing clearance, so text never runs under an adornment. */
const LEAD_PAD: Record<InputSize, string> = {
  sm: "pl-9",
  md: "pl-10",
  lg: "pl-12",
};

const TRAIL_PAD: Record<InputSize, string> = {
  sm: "pr-9",
  md: "pr-10",
  lg: "pr-12",
};

/**
 * Assigning input.value directly skips React's and react-hook-form's change
 * tracking, so the clear button goes through the prototype setter and fires the
 * event both of them listen for.
 */
const clearNatively = (el: HTMLInputElement) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  setter?.call(el, "");
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      trailing,
      clearable = false,
      onClear,
      inputSize = "md",
      className = "",
      inputClassName = "",
      wrapperClassName = "",
      id,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLInputElement | null>(null);
    const autoId = useId();
    const fieldId = id ?? `input-${autoId}`;

    // The clear button has to work for uncontrolled fields too, where `value`
    // never reaches this component, so emptiness is tracked from the DOM.
    const [filled, setFilled] = useState(() =>
      Boolean(props.value ?? props.defaultValue)
    );
    const isFilled =
      props.value !== undefined ? String(props.value).length > 0 : filled;

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilled(e.target.value.length > 0);
      onChange?.(e);
    };

    const handleClear = () => {
      const el = innerRef.current;
      if (el) {
        clearNatively(el);
        el.focus();
      }
      setFilled(false);
      onClear?.();
    };

    const size = SIZES[inputSize];
    const showClear = clearable && isFilled && !disabled;
    const hasTrailing = showClear || Boolean(trailing);

    return (
      <div className={wrapperClassName}>
        {label && (
          <label
            htmlFor={fieldId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        {/* `isolate` keeps the shell's -z-10 inside this box rather than
            dropping it behind the card the field sits on. */}
        <div
          className={`relative isolate flex w-full items-center ${size.shell} ${className}`}
        >
          {/* The input comes first in the DOM so everything after it can react
              to peer-focus. The adornments are positioned over it. */}
          <input
            {...props}
            id={fieldId}
            ref={setRefs}
            disabled={disabled}
            onChange={handleChange}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
            className={`peer h-full w-full border-none bg-transparent text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-100 dark:placeholder:text-gray-500 ${size.text} ${size.pad} ${Icon ? LEAD_PAD[inputSize] : ""} ${hasTrailing ? TRAIL_PAD[inputSize] : ""} ${inputClassName}`}
          />

          {/* The shell. Filled at rest, transparent behind an accent hairline
              on focus - the border is always there so focus costs no reflow. */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 -z-10 rounded-full border bg-[var(--card-surface)] shadow-[0_1px_4px_rgba(0,0,0,0.16)] transition-colors duration-200 peer-focus:bg-transparent ${
              error
                ? "border-red-500"
                : "border-gray-200/70 peer-focus:border-[rgb(var(--blue-500))] dark:border-white/10"
            } ${disabled ? "opacity-60" : ""}`}
          />

          {Icon && (
            <Icon
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 transition-colors peer-focus:text-[rgb(var(--blue-500))] dark:text-gray-500 ${size.icon} ${size.left}`}
            />
          )}

          {showClear ? (
            <button
              type="button"
              onClick={handleClear}
              tabIndex={-1}
              aria-label="Clear"
              className={`absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(var(--blue-500))] text-white transition-opacity hover:opacity-90 ${size.right}`}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
              </svg>
            </button>
          ) : (
            trailing && (
              <div
                className={`absolute top-1/2 flex -translate-y-1/2 items-center text-gray-500 dark:text-gray-400 ${size.right}`}
              >
                {trailing}
              </div>
            )
          )}
        </div>

        {(error || hint) && (
          <p
            id={`${fieldId}-msg`}
            className={`mt-1.5 text-xs ${
              error
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
