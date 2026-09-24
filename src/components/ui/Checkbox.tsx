import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DUR, EASE, pressSpring } from "../../lib/motion";

/**
 * The app's checkbox.
 *
 * Built around a real `<input type="checkbox">` rather than a button with
 * `role="checkbox"`. The input is the thing that is focused, tabbed to, read
 * out, submitted with the form and driven by react-hook-form; the box beside
 * it is paint. That split is why this can be dropped into a form or a table
 * selection column without anything downstream needing to know.
 *
 * The tick is drawn rather than faded in. On a row-selection column - a
 * payroll ledger, a bulk approval - a fade means twenty boxes all becoming
 * slightly less empty at once, and no sense of which one the pointer actually
 * hit. A stroke that draws has a direction and a start, so the box that was
 * clicked is the one the eye follows.
 *
 * `indeterminate` is the header box over a partly-selected list. It is a bar
 * rather than a tick because it is not a claim that everything is selected,
 * and it scales in from the centre so the three states read as one control
 * changing rather than as three different glyphs.
 */

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "size" | "onChange" | "checked"
  > {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Partly-selected, for a header box over a list. Overrides the tick. */
  indeterminate?: boolean;
  /** Text to the right of the box. Makes the whole row a hit target. */
  label?: React.ReactNode;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  indeterminate = false,
  label,
  disabled,
  className = "",
  ...props
}) => {
  const reduce = useReducedMotion();
  const on = checked || indeterminate;

  return (
    <label
      className={`group inline-flex cursor-pointer items-center gap-2.5 ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      } ${className}`}
    >
      <span className="relative inline-grid h-[18px] w-[18px] flex-shrink-0 place-items-center">
        <input
          {...props}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          /* Kept in the layout and merely transparent, so it is still the
             focus target and still hit-tested - `hidden` or `display:none`
             would take it out of the tab order. */
          className="peer absolute inset-0 z-10 m-0 cursor-[inherit] appearance-none rounded-[5px]"
        />

        {/* Fill and edge are left to CSS. Framer would have to be handed a
            resolved colour per theme to interpolate one, and a 150ms tween
            between two flat colours is exactly what a CSS transition is for -
            the class also keeps the dark-mode pair in one place. Framer is
            here only for the press, which CSS cannot spring. */}
        <motion.span
          aria-hidden="true"
          whileTap={reduce || disabled ? undefined : { scale: 0.88 }}
          transition={pressSpring}
          className={`pointer-events-none absolute inset-0 rounded-[5px] border-[1.5px] transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-[rgb(var(--brand-500))]/40 peer-focus-visible:ring-offset-1 ${
            on
              ? "border-[rgb(var(--brand-500))] bg-[rgb(var(--brand-500))]"
              : "border-gray-300 bg-transparent dark:border-gray-600"
          }`}
        />

        <svg
          aria-hidden="true"
          viewBox="0 0 18 18"
          className="pointer-events-none relative h-[18px] w-[18px]"
          fill="none"
        >
          <AnimatePresence initial={false} mode="wait">
            {indeterminate ? (
              <motion.path
                key="mixed"
                d="M4.5 9h9"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.fast, ease: EASE.out }}
              />
            ) : checked ? (
              <motion.path
                key="tick"
                d="M4.3 9.3 7.4 12.3 13.7 5.9"
                stroke="white"
                strokeWidth={2.1}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.base, ease: EASE.out }}
              />
            ) : null}
          </AnimatePresence>
        </svg>
      </span>

      {label && (
        <span className="select-none text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
