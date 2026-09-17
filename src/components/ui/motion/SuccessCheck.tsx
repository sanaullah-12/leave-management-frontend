import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE, popSpring } from "../../../lib/motion";

/**
 * The app's one "that worked" mark.
 *
 * Success is the moment an interface most needs to be unambiguous and most
 * often is not: a toast that reads "Saved" is gone before it is noticed, and a
 * row quietly changing colour is not an answer to a button that was pressed.
 * This is deliberately the same object everywhere - approving leave, running
 * payroll, saving a template - so the shape is recognised before the label is
 * read.
 *
 * Three things happen, in an order that matters. The disc lands first, so
 * there is something for the eye to arrive at. The tick then draws rather than
 * appearing, which is what reads as a confirmation being written rather than a
 * static icon being swapped in. The ring expands out of the disc last and
 * fades, which returns attention to the screen instead of leaving a solid
 * badge sitting on it.
 *
 * No confetti. A particle burst is a celebration, and most successes in an HR
 * tool are somebody getting through a list of eleven approvals.
 */

export interface SuccessCheckProps {
  /** Diameter in pixels. */
  size?: number;
  /** Disc colour. Defaults to the app's success green. */
  color?: string;
  className?: string;
}

export const SuccessCheck: React.FC<SuccessCheckProps> = ({
  size = 56,
  color = "#10b981",
  className = "",
}) => {
  const reduce = useReducedMotion();

  return (
    <span
      className={`relative inline-grid place-items-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Success"
    >
      {/* The ring. Painted behind the disc and scaled past it, so it reads as
          coming out of the mark rather than as a second object. */}
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${color}` }}
          initial={{ scale: 0.8, opacity: 0.55 }}
          animate={{ scale: 1.55, opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE.out, delay: 0.14 }}
        />
      )}

      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={popSpring}
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="relative"
        style={{ width: size * 0.5, height: size * 0.5 }}
        fill="none"
      >
        <motion.path
          d="M5 12.5 10 17.5 19 7.5"
          stroke="white"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: DUR.slow,
            ease: EASE.out,
            // Starts as the disc is settling, not after it has stopped: the
            // two overlapping is what makes this one gesture rather than two.
            delay: reduce ? 0 : 0.12,
          }}
        />
      </svg>
    </span>
  );
};

export default SuccessCheck;
