import type { Variants, Transition } from "framer-motion";

/* Spring tokens - fast but smooth, never bouncy. */
export const spring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.9,
};

export const softSpring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
};

/*
 * The card-to-screen morph.
 *
 * Framer and SwiftUI solve the same second-order system, so the iOS spec
 * translates exactly rather than by eye. SwiftUI states a spring as a period
 * and a damping ratio; Framer states the same spring as its constants:
 *
 *   w0 = 2*pi / response      stiffness = w0^2 * mass      damping = 2 * zeta * w0 * mass
 *
 * spring(response: 0.45, dampingFraction: 0.75) is therefore w0 = 13.96 rad/s,
 * which at mass 1 is stiffness 195, damping 21. It overshoots by 2.8% once and
 * settles in about 380ms - responsive, with just enough overshoot to read as
 * physical rather than as a timed slide.
 *
 * Every geometric property of the morph rides this one curve. Frame, corner
 * radius and type scale arriving on the same spring is what makes the pieces
 * read as one object instead of several views animating near each other, so
 * resist giving any single part its own timing.
 */
export const morphSpring: Transition = {
  type: "spring",
  stiffness: 195,
  damping: 21,
  mass: 1,
};

/*
 * Content that is not shared with the card.
 *
 * spring(response: 0.38, dampingFraction: 0.85) - quicker and flatter than the
 * morph so it settles first and never competes with it.
 */
export const morphRevealSpring: Transition = {
  type: "spring",
  stiffness: 273,
  damping: 28,
  mass: 1,
};

/** Seconds before the first revealed row arrives, and between each one after. */
export const MORPH_REVEAL_DELAY = 0.12;
export const MORPH_REVEAL_STAGGER = 0.045;

/* Page entrance - fade + gentle rise. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
};

/* Orchestrates children so widgets appear one after another. */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

/* Individual widget/card entrance used inside a staggerContainer. */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 30 },
  },
};

/* Reusable interactive hover/press for cards. */
export const cardHover = {
  y: -4,
  transition: { type: "spring", stiffness: 400, damping: 26 },
} as const;

export const cardTap = { scale: 0.985 } as const;
