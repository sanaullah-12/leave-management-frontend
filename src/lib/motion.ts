import type { Variants, Transition } from "framer-motion";

/* Spring tokens — fast but smooth, never bouncy. */
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

/* Page entrance — fade + gentle rise. */
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
