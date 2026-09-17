import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE, riseIn, staggerContainer, staggerItem } from "../../../lib/motion";

/**
 * Content that arrives as it is scrolled to.
 *
 * Mount-time entrances only work for what is already on screen. A reports page
 * is four screens tall, and animating all of it on mount means everything
 * below the fold has finished happening before anyone sees it - the animation
 * is paid for and never watched. Revealing on scroll instead is what makes a
 * long page feel like it is unfolding.
 *
 * Used sparingly and only below the fold. The first screenful should already
 * be arriving on the page's own entrance; a card that waits for the user to
 * reach it, when they can already see it, just looks late.
 *
 *   <Reveal><ChartCard /></Reveal>
 *   <Reveal delay={0.06}><ChartCard /></Reveal>
 */
export interface RevealProps {
  children: React.ReactNode;
  /** Seconds to hold before starting. For a row of two or three. */
  delay?: number;
  /** Rendered element. `li`, `tr` and friends when the parent demands one. */
  as?: "div" | "section" | "li" | "article";
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  as = "div",
  className = "",
}) => {
  const reduce = useReducedMotion();
  const Component = motion[as];

  if (reduce) {
    const Plain = as as React.ElementType;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component
      className={className}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      variants={riseIn}
      transition={{ duration: DUR.slow, ease: EASE.out, delay }}
    >
      {children}
    </Component>
  );
};

/**
 * A group whose children arrive one after another when the group is reached.
 *
 * The stagger lives on the container rather than on each child so the order is
 * the DOM order, and a child added later joins the sequence without anyone
 * renumbering delays by hand. For a list long enough that the tail would drag,
 * use `useListRowMotion` instead - it caps the sequence, and this does not.
 */
export const RevealGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
};

/** One child of a {@link RevealGroup}. */
export const RevealItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
};

export default Reveal;
