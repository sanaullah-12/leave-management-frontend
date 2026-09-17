import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DUR, EASE } from "../../../lib/motion";

/**
 * The crossover from a skeleton to the content it was standing in for.
 *
 * A skeleton already solves the layout half of loading: the page does not jump
 * when the data lands, because the placeholder was the right shape. What it
 * does not solve is the swap itself, which by default is a single frame - the
 * shimmer is replaced by real text between one paint and the next, and on a
 * fast connection the whole thing reads as a flicker rather than as content
 * arriving.
 *
 * Crossing the two over is the fix, and it has to be a genuine cross rather
 * than a fade-out then a fade-in: `mode="popLayout"` takes the skeleton out of
 * the flow as it leaves so the content is already in its final position while
 * the shimmer fades off it. Sequencing them instead gives an empty box in the
 * middle, which is worse than the flicker.
 *
 *   <LoadSwap loading={isLoading} skeleton={<StatCardsSkeleton count={4} />}>
 *     <StatCardRow tiles={tiles} />
 *   </LoadSwap>
 *
 * Deliberately short. This is not an entrance - the content's own entrance, if
 * it has one, plays underneath - it is only the seam between two states, and a
 * seam that takes a third of a second is a seam you notice.
 */
export interface LoadSwapProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const LoadSwap: React.FC<LoadSwapProps> = ({
  loading,
  skeleton,
  children,
  className = "",
}) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{loading ? skeleton : children}</div>;
  }

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={loading ? "skeleton" : "content"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.fast, ease: EASE.out }}
        >
          {loading ? skeleton : children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LoadSwap;
