import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { swapUp } from "../../../lib/motion";

/**
 * A value replacing another in the same place.
 *
 * Text that changes underneath the reader is the single easiest thing in an
 * interface to miss. A status flipping from "Pending" to "Approved", a total
 * recomputing when a filter changes, a card cycling its contents: all of them
 * are the interface answering something the user did, and all of them are
 * silent by default.
 *
 * The old value leaves upwards and the new one arrives from below, so the pair
 * reads as one reel advancing. `mode="popLayout"` keeps the outgoing value out
 * of the layout while it leaves, which is what stops the line jumping to twice
 * its height for the length of the swap.
 *
 * `swapKey` is what decides that a change happened. Pass the value itself for
 * a figure or a label; pass an id when the rendered content is a whole block
 * that should swap as a unit.
 *
 *   <ValueSwap swapKey={status}>{statusLabel}</ValueSwap>
 */
export interface ValueSwapProps {
  swapKey: React.Key;
  children: React.ReactNode;
  className?: string;
  /** Lay out as a block. Default is inline, for use inside a line of text. */
  block?: boolean;
}

export const ValueSwap: React.FC<ValueSwapProps> = ({
  swapKey,
  children,
  className = "",
  block = false,
}) => {
  const reduce = useReducedMotion();

  if (reduce) {
    const Plain = block ? "div" : "span";
    return <Plain className={className}>{children}</Plain>;
  }

  const Element = block ? motion.div : motion.span;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Element
        key={swapKey}
        variants={swapUp}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`${block ? "block" : "inline-block"} ${className}`}
      >
        {children}
      </Element>
    </AnimatePresence>
  );
};

export default ValueSwap;
