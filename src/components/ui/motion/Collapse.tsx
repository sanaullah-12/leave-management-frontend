import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { collapseVariants } from "../../../lib/motion";

/**
 * An expanding section.
 *
 * Height is the property CSS transitions cannot do on its own - `auto` is not
 * an animatable value - so every collapsing panel in a codebase tends to get
 * solved separately: one measures a ref, one hard-codes a max-height that
 * clips on the day the content grows, one gives up and toggles `hidden`. This
 * is the single answer.
 *
 * Two details matter more than the timing:
 *
 *   `overflow-hidden` lives on the animating element and nowhere else. Content
 *   that escapes a half-open section - a dropdown, a focus ring, a shadow - is
 *   the usual reason an accordion looks broken mid-animation.
 *
 *   The children stay mounted through the exit. Unmounting on the first frame
 *   of a close collapses an empty box, which is a different and much cheaper
 *   looking animation than a section closing.
 *
 *   <Collapse open={showDetail}>
 *     <DetailRows />
 *   </Collapse>
 */
export interface CollapseProps {
  open: boolean;
  children: React.ReactNode;
  /** Classes for the inner content wrapper, typically padding. */
  className?: string;
  /** Called once the close animation has finished. */
  onClosed?: () => void;
}

export const Collapse: React.FC<CollapseProps> = ({
  open,
  children,
  className = "",
  onClosed,
}) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return open ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence initial={false} onExitComplete={onClosed}>
      {open && (
        <motion.div
          key="content"
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          variants={collapseVariants}
          className="overflow-hidden"
        >
          <div className={className}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Collapse;
