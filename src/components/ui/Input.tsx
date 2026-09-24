import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DUR, EASE, pressSpring } from "../../lib/motion";

/**
 * The app's one text input.
 *
 * Visual language is the pill field: a filled rounded-full shell carrying a
 * soft shadow, a muted leading icon, and - on focus - the shell going
 * transparent while a hairline accent border and the accent-tinted icon take
 * over. A non-empty field grows a round clear button on the trailing edge.
 *
 * Every colour is a semantic token rather than a fixed hex or a raw palette
 * step: the shell is --surface-input, the hairline is --border-default, the
 * focus accent is --brand and the invalid state is --danger. All four are
 * declared per mode in styles/tokens.css, so the field is correct in light and
 * dark and recolours with the theme without a single `dark:` variant.
 *
 * Sizing is the caller's: `className` lands on the shell, so `w-64`, `h-9`,
 * `max-w-sm` and friends work there. `inputSize` only picks the default
 * height/padding/type-scale triple.
 *
 * Works controlled and uncontrolled - a react-hook-form register() spread goes
 * straight onto it, and the clear button writes through the native value setter
 * so react-hook-form sees a real input event.
 *
 * Heights step up below `sm`. The field family is drawn at 36-40px, which is
 * right beside 14px text under a mouse and under the 44px a fingertip can hit
 * reliably; on a phone each preset gains a step. The `sm:` half restores the
 * desktop height exactly, so nothing changes above 640px.
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
    shell: "h-10 sm:h-9",
    text: "text-[13px]",
    pad: "px-3.5",
    left: "left-3.5",
    right: "right-3.5",
    icon: "h-4 w-4",
  },
  md: {
    shell: "h-11 sm:h-10",
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

    const reduce = useReducedMotion();
    const hasError = Boolean(error);
    /* Shake only on the crossing into an invalid state, not on every render
       that happens to be invalid. Held in a ref rather than in state so
       noticing the crossing does not itself cause a render - the render that
       set the error is the one that plays it. */
    const wasInvalid = useRef(hasError);
    const shake = !reduce && hasError && !wasInvalid.current;
    useEffect(() => {
      wasInvalid.current = hasError;
    }, [hasError]);

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
        {/* The field shakes once when a message first appears under it.
            Validation is the one case where the thing that changed is below
            where the user is looking - they are still on the field, or already
            on the submit button - and a red line quietly appearing underneath
            is routinely missed. Two small swings, over in a fifth of a second:
            a shake of the head, not an alarm. */}
        <motion.div
          animate={shake ? { x: [0, -5, 4, -2, 0] } : undefined}
          transition={{ duration: DUR.base, ease: EASE.inOut }}
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
              on focus - the border is always there so focus costs no reflow.

              The fill is --surface-input, not --card-surface. An input drawn
              in exactly the card's own tone has no edge of its own and reads
              as a line of text that happens to have a border round it; in
              dark mode it disappeared into the card entirely. The input token
              is a rung off the card in both modes, which is what makes a form
              scannable as a set of fields. */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 -z-10 rounded-full border bg-[var(--surface-input)] transition-colors duration-200 peer-focus:bg-[var(--surface-raised)] ${
              error
                ? "border-[var(--danger)]"
                : "border-[var(--border-default)] peer-focus:border-[var(--brand)]"
            } ${disabled ? "opacity-60" : ""}`}
          />

          {/* Focus halo. A soft accent ring that grows in behind the shell,
              so focus arrives rather than switching on. Driven by the peer
              selector rather than by state: a text field that re-renders on
              every focus and blur is the last component in the app that should
              be doing so. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 scale-[0.97] rounded-full opacity-0 ring-4 ring-[var(--focus-ring)] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] peer-focus:scale-100 peer-focus:opacity-100"
          />

          {Icon && (
            <Icon
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 transition-[color,transform] duration-200 peer-focus:scale-110 peer-focus:text-[var(--brand)] dark:text-gray-500 ${size.icon} ${size.left}`}
            />
          )}

          {showClear ? (
            /* Grows out of the centre the moment there is something to clear,
               rather than blinking on at the first character typed. */
            <motion.button
              type="button"
              onClick={handleClear}
              tabIndex={-1}
              aria-label="Clear"
              initial={reduce ? false : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={reduce ? undefined : { scale: 0.85 }}
              transition={pressSpring}
              className={`tap-target absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--brand-solid)] text-white transition-opacity hover:opacity-90 ${size.right}`}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
              </svg>
            </motion.button>
          ) : (
            trailing && (
              <div
                className={`absolute top-1/2 flex -translate-y-1/2 items-center text-gray-500 dark:text-gray-400 ${size.right}`}
              >
                {trailing}
              </div>
            )
          )}
        </motion.div>

        {/* The message fades down out of the field rather than appearing
            under it, so a form that has just been submitted does not snap a
            line taller in the same frame the error arrives. */}
        <AnimatePresence initial={false}>
          {(error || hint) && (
            <motion.p
              key={error ? "error" : "hint"}
              id={`${fieldId}-msg`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.fast, ease: EASE.out }}
              className={`mt-1.5 text-xs ${
                error
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {error || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
