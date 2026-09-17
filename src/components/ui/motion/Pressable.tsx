import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { pressSpring } from "../../../lib/motion";

/**
 * Press and hover feedback for anything that is not already a `<Button>`.
 *
 * Cards, rows, tiles and chips are the controls people actually spend their
 * day hitting in this product, and a card that does nothing under a finger
 * reads as decoration until it navigates - by which point the feedback is
 * moot. The `.press-scale` rule in mobile-app.css covers the touch case
 * without any JavaScript, and remains the right answer for a static element
 * inside a long list; this is for a control that also wants a hover lift, or
 * that needs the feedback on a mouse as well as a finger.
 *
 * Scale is chosen by `size` rather than left to the caller, because the amount
 * that reads as a press is a function of how big the object is: 1.5% is
 * legible across a 320px card and invisible on a 32px chip.
 *
 *   <Pressable as="button" onClick={open} className="glass-card ...">
 *
 * Renders a plain element under `prefers-reduced-motion`, so nothing about the
 * markup or the styling changes - only the feedback goes away.
 */

export interface PressableProps
  extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "button" | "li" | "a";
  /** How large the pressed object is. Picks the scale. */
  size?: "card" | "control";
  /** Lift on hover. For a card that is also a link or a navigation target. */
  lift?: boolean;
  disabled?: boolean;
  href?: string;
  type?: "button" | "submit";
  children: React.ReactNode;
}

const SCALE = { card: 0.985, control: 0.96 } as const;

export const Pressable: React.FC<PressableProps> = ({
  as = "div",
  size = "card",
  lift = false,
  disabled = false,
  children,
  className = "",
  ...rest
}) => {
  const reduce = useReducedMotion();

  if (reduce || disabled) {
    const Plain = as as React.ElementType;
    return (
      <Plain className={className} {...(rest as object)} disabled={disabled || undefined}>
        {children}
      </Plain>
    );
  }

  const Element = motion[as] as React.ElementType;

  return (
    <Element
      className={className}
      whileTap={{ scale: SCALE[size], y: 0 }}
      whileHover={lift ? { y: -3 } : undefined}
      transition={pressSpring}
      {...rest}
    >
      {children}
    </Element>
  );
};

export default Pressable;
