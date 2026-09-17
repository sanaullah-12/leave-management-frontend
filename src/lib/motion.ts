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

/* ==============================================================
   LIST ROW ENTRANCE
   ==============================================================
   Rows of a list, as distinct from the widgets above: they arrive
   by growing into place rather than rising into it, faster and
   closer together, so a list of twelve reads as one sweep down the
   screen instead of twelve separate cards landing.

   Why not reuse `staggerItem`: a 16px rise is right for a handful
   of dashboard tiles and wrong for a list, where every row rising
   the same distance turns the whole column into a slab that slides.
   Scaling from the row's own centre keeps each row anchored where
   it belongs and leaves the column still.

   Deliberately *not* driven by `staggerChildren`. A container
   stagger has no ceiling, so a 200-row employee table would still
   be dealing out rows ten seconds after it loaded. Each row instead
   carries its own index and computes its own delay, which is what
   lets `LIST_STAGGER_CAP` flatten the tail: the first rows sweep in
   and everything past the cap arrives together, on the reasoning
   that nobody is watching row 60 arrive - they are watching the top
   of the list.
   ============================================================== */

/** Seconds between one row and the next. */
export const LIST_STAGGER = 0.05;

/**
 * Rows past this index share the last delay instead of extending the
 * sequence. Twelve is about one phone screen of rows, so the cap is
 * never reached by anything the eye is actually following.
 */
export const LIST_STAGGER_CAP = 12;

/** Total seconds a list takes to deal in, given its length. */
export const listSweepDuration = (count: number) =>
  Math.min(Math.max(count - 1, 0), LIST_STAGGER_CAP) * LIST_STAGGER + 0.19;

/**
 * One row. Pass the row's index as `custom`:
 *
 *   <motion.li variants={listItem} custom={i} initial="initial" animate="animate" />
 *
 * Self-orchestrating on purpose - no container variant is needed, so a row
 * works the same inside a `<tbody>`, a flex column or a grid.
 */
export const listItem: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: Math.min(i, LIST_STAGGER_CAP) * LIST_STAGGER,
      duration: 0.19,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

/**
 * The same entrance for a wide desktop table row.
 *
 * A row that spans 1200px cannot take the phone's scale: at 0.9 its edges
 * travel 60px each and the row reads as sliding in from both sides at once.
 * Scale is therefore pulled almost flat and the fade does the work, which at
 * table-row width is what the phone's scale looks like anyway.
 */
export const listItemWide: Variants = {
  initial: { opacity: 0, scale: 0.985 },
  animate: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: Math.min(i, LIST_STAGGER_CAP) * LIST_STAGGER,
      duration: 0.19,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

/* Reusable interactive hover/press for cards. */
export const cardHover = {
  y: -4,
  transition: { type: "spring", stiffness: 400, damping: 26 },
} as const;

export const cardTap = { scale: 0.985 } as const;

/* ==============================================================
   THE MOTION LANGUAGE
   ==============================================================
   Everything above this line predates the system and is kept as
   the named curves it always was. Everything below is the scale
   those curves are drawn from, so a new surface picks a token
   instead of inventing a fourth value for "quick".

   Three rules hold the language together:

     1. One easing for anything entering or settling. Motion that
        arrives should decelerate; motion that leaves may simply
        stop. EASE.out is the single entrance curve and nothing in
        the app should introduce another.
     2. Duration follows distance, not importance. A 4px press
        moves for 120ms; a full screen moves for 340ms. A slow
        animation on a small object is the main thing that makes
        an interface feel sluggish rather than calm.
     3. Springs carry geometry, tweens carry opacity. A frame that
        travels reads as physical on a spring; a fade on a spring
        just takes an unpredictable amount of time.
   ============================================================== */

/**
 * Easing curves.
 *
 * `out` is the app's entrance curve - a strong ease-out that covers most of
 * its distance early, which is what makes an element read as arriving rather
 * than as sliding at a constant rate. `inOut` is for anything that both starts
 * and stops on screen (a strip scrolling itself, a value swapping in place),
 * and `in` is exit-only: it is the entrance curve reversed, so leaving looks
 * like the opposite of arriving rather than like a separate idea.
 */
export const EASE = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  in: [0.64, 0, 0.78, 0] as const,
};

/**
 * Durations, in seconds.
 *
 * The scale is roughly geometric so two steps are always clearly different -
 * adjacent values that differ by 20ms produce arguments rather than choices.
 *
 *   press   a control acknowledging a finger. Below ~120ms a press reads as
 *           instant, which is the point: feedback, not animation.
 *   fast    a small object changing state in place - a chevron, a check, a
 *           colour.
 *   base    the default. A menu, a tooltip, a row, a value swapping.
 *   slow    something the size of a card or a sheet.
 *   page    a whole screen. The ceiling: nothing in the app animates longer,
 *           because past about 350ms the user is waiting on the interface.
 */
export const DUR = {
  press: 0.12,
  fast: 0.16,
  base: 0.22,
  slow: 0.28,
  page: 0.34,
} as const;

/**
 * The press spring.
 *
 * Stiff and heavily damped: it has to finish before the finger lifts, and any
 * overshoot on a control being tapped repeatedly reads as a wobble. Zero
 * bounce is deliberate - this is the one place in the app where a spring is
 * chosen for its speed rather than its physicality.
 */
export const pressSpring: Transition = {
  type: "spring",
  stiffness: 620,
  damping: 34,
  mass: 0.6,
};

/**
 * A mark or badge landing.
 *
 * The one spring in the set with a real overshoot, and the only place the app
 * wants one: a confirmation that settles politely does not register as a
 * confirmation. Shared by `popIn`, by the success mark, and by the dialog
 * icons - so "this happened" looks the same wherever it is said.
 */
export const popSpring: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 18,
  mass: 0.7,
};

/**
 * A panel, sheet or menu arriving.
 *
 * Softer than `spring` because the object is large: the same stiffness that
 * feels crisp on a 40px button feels violent on a 600px sheet. Overshoots by
 * about 1%, which at sheet size is a pixel or two - enough to read as weight,
 * not enough to read as a bounce.
 */
export const panelSpring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};

/* ==============================================================
   INTERACTION PRESETS
   ==============================================================
   Spread onto a `motion` element. Plain objects rather than a
   hook, so they can be used inside a `.map()`, and split by the
   size of the thing being pressed: the 1.5% shrink that is just
   legible on a card is invisible on a 32px icon button, and the
   4% a small button needs looks like a card being crushed.
   ============================================================== */

/** A button, chip or icon control. */
export const pressable = {
  whileTap: { scale: 0.96 },
  transition: pressSpring,
} as const;

/** A card, row or tile - anything wider than about 200px. */
export const pressableCard = {
  whileTap: { scale: 0.985 },
  transition: pressSpring,
} as const;

/**
 * A card that also answers to a mouse.
 *
 * Hover lifts rather than tints, for the same reason `.press-scale` in
 * mobile-app.css scales rather than tints: on a glass surface a background
 * change is close to invisible, while a 3px lift with the shadow following it
 * is legible on any ground in either theme.
 */
export const liftable = {
  whileHover: { y: -3 },
  whileTap: { scale: 0.985, y: 0 },
  transition: pressSpring,
} as const;

/* ==============================================================
   GENERAL-PURPOSE VARIANTS
   ==============================================================
   Named for what the object does, not where it is used, so the
   same entrance can be shared by a toolbar and an empty state
   without either name becoming a lie.
   ============================================================== */

/** Opacity only. For anything whose position is already correct. */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DUR.base, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE.in } },
};

/** Fade plus a short rise. The default entrance for a block of content. */
export const riseIn: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, ease: EASE.out },
  },
  exit: { opacity: 0, y: -6, transition: { duration: DUR.fast, ease: EASE.in } },
};

/**
 * Growing into place from the object's own centre.
 *
 * For anything that appears where it was summoned - a menu under its button, a
 * badge on a tile, a dialog. Starts at 0.96 rather than 0: an element that
 * grows from nothing reads as a cartoon, and the last few percent is where all
 * the legibility is anyway.
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: DUR.base, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: DUR.fast, ease: EASE.in },
  },
};

/**
 * The success mark.
 *
 * The one place a real overshoot is wanted. A confirmation that settles
 * politely does not register as a confirmation; the overshoot here is what
 * makes a check read as landing. Used by the success states on buttons,
 * dialogs and any "done" badge - deliberately identical everywhere, so success
 * is recognisable across the app without reading the label.
 */
export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.4 },
  animate: { opacity: 1, scale: 1, transition: popSpring },
  exit: { opacity: 0, scale: 0.8, transition: { duration: DUR.fast } },
};

/**
 * A bottom sheet or a bar docked to an edge.
 *
 * Travels its own height, so the distance is a percentage rather than a pixel
 * count and one variant serves a 120px bar and a 600px sheet.
 */
export const sheetUp: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: panelSpring },
  exit: { y: "100%", transition: { duration: DUR.base, ease: EASE.in } },
};

/**
 * A value replacing another in the same spot - a figure that changed, a tile
 * whose contents cycled, a status that flipped.
 *
 * The new value comes up from below and the old one leaves upwards, so the
 * pair reads as one reel advancing rather than as a crossfade. Distance is
 * small on purpose: this runs inside a line of text, where anything past a few
 * pixels collides with the line above.
 */
export const swapUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.base, ease: EASE.out },
  },
  exit: { opacity: 0, y: -8, transition: { duration: DUR.fast, ease: EASE.in } },
};

/* ==============================================================
   SCROLL REVEAL
   ==============================================================
   Content below the fold arrives as it is scrolled to rather than
   all at once on mount, which is the difference between a long
   page that unfolds and a long page that has already happened by
   the time you reach the middle of it.
   ============================================================== */

/**
 * Spread onto a `motion` element to reveal it on first scroll into view.
 *
 * `once` matters more than it looks: without it, scrolling back up replays
 * every entrance and a page the user is re-reading animates at them. The
 * margin starts the entrance while the element is still 80px below the fold,
 * so it is finishing rather than starting by the time it is properly on
 * screen.
 */
export const revealOnScroll = {
  initial: "initial" as const,
  whileInView: "animate" as const,
  viewport: { once: true, margin: "0px 0px -80px 0px" },
  variants: riseIn,
};

/* ==============================================================
   EXPAND / COLLAPSE
   ==============================================================
   Height is the one property that has to be handed `auto`
   explicitly. These are what `<Collapse>` uses, exported so a
   component with its own markup can reuse the timing without
   taking the component.
   ============================================================== */

export const collapseVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: DUR.base, ease: EASE.in },
      opacity: { duration: DUR.press },
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: DUR.slow, ease: EASE.out },
      // The content fades in behind the opening edge rather than with it, so
      // the section does not read as text being stretched.
      opacity: { duration: DUR.base, delay: 0.06 },
    },
  },
};

/* ==============================================================
   ROUTE TRANSITIONS
   ==============================================================
   A whole screen arriving, and the one it displaced leaving.

   Exit is deliberately much shorter than entrance and carries no
   travel. The outgoing screen stops being relevant the moment it
   is dismissed; animating it out at the same weight as the new one
   makes every navigation feel like it takes twice as long as it
   does. It is also why the pair is used with `mode="wait"` - two
   screens cross-dissolving is legible on a 400px phone and chaos
   on a 1600px dashboard.
   ============================================================== */

export const routeVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.page, ease: EASE.out },
  },
  exit: { opacity: 0, transition: { duration: DUR.press, ease: EASE.in } },
};

/* ==============================================================
   REDUCED MOTION
   ==============================================================
   `<MotionConfig reducedMotion="user">` in App.tsx already pins
   transform and layout animations for anyone who asks for less
   motion, so a variant that only moves or scales needs nothing
   further. What it does not remove is *timing*: a staggered list
   still deals itself in one row at a time, just without the
   travel, and a twelve-row sweep of fades is exactly what the
   preference is asking not to see.

   `flat` is therefore for orchestration, not for transforms.
   Spread it in place of a stagger or a delay when the user has
   asked for less. `useListRowMotion` applies the same idea to a
   row.
   ============================================================== */

/** Replaces any variant props under reduced motion: no entrance at all. */
export const flat = {} as const;

/** A transition that is honest about being instant. */
export const instant: Transition = { duration: 0 };
