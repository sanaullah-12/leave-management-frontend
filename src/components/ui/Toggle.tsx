import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { pressSpring } from "../../lib/motion";

/**
 * The app's switch.
 *
 * A switch is unusual among controls in that the animation is not decoration:
 * the knob travelling from one end to the other is what tells you which way it
 * just went. A switch that snaps leaves the user checking the colour to work
 * out whether their tap registered or whether they had already turned it on.
 *
 * The knob is on a spring while the track is on a tween. Colour has no
 * momentum, so a spring on the fill produces a fade of unpredictable length
 * for no benefit; the travel is the part that wants weight behind it.
 */

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Required unless the switch is labelled by a visible element. */
  label?: string;
  /** Id of the element that labels it, for a row with its own heading. */
  labelledBy?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  labelledBy,
  className = "",
}) => {
  const reduce = useReducedMotion();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--blue-500))] disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
      } ${className}`}
    >
      {/* `justify-*` rather than a translate, so the knob's travel is derived
          from the track's own padding. A hard-coded offset is what breaks the
          moment somebody changes the switch's width. */}
      <span
        className={`flex w-full ${checked ? "justify-end" : "justify-start"}`}
      >
        <motion.span
          layout
          transition={reduce ? { duration: 0 } : pressSpring}
          className="block h-5 w-5 rounded-full bg-white shadow-sm"
        />
      </span>
    </button>
  );
};

export default Toggle;
