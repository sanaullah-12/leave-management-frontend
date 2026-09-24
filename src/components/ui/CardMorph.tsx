import React from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useLocation, useNavigate } from "react-router-dom";
import { EASE, MORPH_REVEAL_DELAY, MORPH_REVEAL_STAGGER, morphRevealSpring, morphSpring } from "../../lib/motion";

/**
 * Card to full screen, as one object.
 *
 * A tapped card does not open a screen next to it - it becomes the screen. The
 * card's plate, its artwork and its title are the same three elements before
 * and after, carried across by shared `layoutId`s, so the eye tracks one thing
 * growing rather than one thing leaving and another arriving. Everything the
 * screen adds that the card never had waits for the morph to mostly settle and
 * then arrives on a stagger, because content fading in over a plate that is
 * still moving is what makes these transitions read as busy.
 *
 * Built as a wrapper rather than a card component. The product already has a
 * dozen card shapes - KPI tiles, studio cards, payroll bands, employee rows -
 * and none of them should be rewritten to gain this. Wrap what is already
 * there:
 *
 *   <MorphTrigger morphId={`leave-${id}`} screen={() => <LeaveDetail id={id} />}>
 *     <StatCard label="Leaves taken" value={12} icon={<CalendarIcon />} />
 *   </MorphTrigger>
 *
 * {@link MorphZone} must be mounted once above everything that uses this; it is
 * already mounted at the app root. The screen renders in a portal on <body>, so
 * a card inside a scrolled panel or a clipped container still expands to the
 * real viewport.
 *
 * Inside a screen, {@link MorphTitle}, {@link MorphHero} and {@link MorphReveal}
 * name which parts travel and which parts arrive. A screen that names none of
 * them still morphs - the plate alone carries it.
 */

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/** Matches the product's card radius, so the plate starts where the card is. */
const CARD_RADIUS = 14;
/** Roughly a modern phone's display radius, so a full-bleed screen sits right. */
const SCREEN_RADIUS = 28;

/** Drag distance that maps to a completed dismiss. */
const DISMISS_DISTANCE = 220;
/** Fraction of that distance which commits on release. */
const DISMISS_THRESHOLD = 0.3;
/** Downward velocity (px/s) that dismisses however far the drag actually got. */
const DISMISS_VELOCITY = 800;
/** How far the screen shrinks at a full drag. */
const DRAG_SCALE = 0.16;

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

type ScreenRender = (api: { close: () => void }) => React.ReactNode;

interface OpenScreen {
  morphId: string;
  /**
   * "overlay" renders its own screen and owns dismissal.
   *
   * "handoff" is for a card whose destination is a real route. The plate grows
   * to fill the viewport while the router swaps the page in behind it, then
   * fades to reveal it - so the card becomes the page rather than a lookalike
   * of it. Nothing about the URL, the back button or a deep link changes.
   */
  mode: "overlay" | "handoff";
  render?: ScreenRender;
  /** The path a handoff navigated to. Leaving it closes the morph. */
  route?: string;
  /** Where dismissal returns to, so close always lands somewhere real. */
  returnTo?: string;
  /** Focused again on close, so a keyboard user is not returned to the top. */
  origin: HTMLElement | null;
}

interface ZoneValue {
  openId: string | null;
  open: (screen: OpenScreen) => void;
  close: () => void;
}

const ZoneContext = React.createContext<ZoneValue | null>(null);

/** Tells the pieces inside a card or a screen which morph they belong to. */
const MorphIdContext = React.createContext<string | null>(null);

function useMorphId(part: string): string {
  const id = React.useContext(MorphIdContext);
  if (id === null) {
    throw new Error(`<${part}> must be rendered inside a <MorphTrigger>.`);
  }
  return id;
}

/* ------------------------------------------------------------------ */
/* Zone                                                                */
/* ------------------------------------------------------------------ */

/**
 * Owns which screen is open and renders it.
 *
 * Mounted once at the app root, above the router: a morph that survives a route
 * change would be a bug, but remounting the zone on every navigation would drop
 * the layout projection mid-flight.
 */
export const MorphZone: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [screen, setScreen] = React.useState<OpenScreen | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const clear = React.useCallback(() => {
    setScreen((current) => {
      current?.origin?.focus?.();
      return null;
    });
  }, []);

  const close = React.useCallback(() => {
    // A handoff owns a URL, so dismissing it is a navigation. The effect below
    // is what then clears the state - doing both here would race.
    if (screen?.returnTo) navigate(screen.returnTo);
    else clear();
  }, [screen?.returnTo, navigate, clear]);

  const open = React.useCallback((next: OpenScreen) => setScreen(next), []);

  // Leaving the route a handoff opened closes it, which is what makes the
  // browser's back button behave the way the close button does.
  //
  // The morph opens a frame before the navigation lands, so "not on the route"
  // is also true for that first frame. Arming on arrival rather than on open
  // is what tells the two apart.
  const reachedRoute = React.useRef(false);

  React.useEffect(() => {
    reachedRoute.current = false;
  }, [screen?.morphId]);

  React.useEffect(() => {
    if (!screen?.route) return;
    if (location.pathname === screen.route) {
      reachedRoute.current = true;
    } else if (reachedRoute.current) {
      clear();
    }
  }, [location.pathname, screen?.route, clear, screen]);

  const value = React.useMemo<ZoneValue>(
    () => ({ openId: screen?.morphId ?? null, open, close }),
    [screen?.morphId, open, close]
  );

  // The page behind must not scroll under an open screen: on a phone the
  // rubber band shows the page moving behind a surface that is meant to be
  // the page. A handoff is the exception - the page behind it is the
  // destination, and it has to be free to settle at its own scroll position.
  React.useEffect(() => {
    if (!screen || screen.mode === "handoff") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [screen]);

  React.useEffect(() => {
    if (!screen || screen.mode === "handoff") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, close]);

  return (
    <ZoneContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {screen &&
              (screen.mode === "handoff" ? (
                <MorphHandoff
                  key={screen.morphId}
                  morphId={screen.morphId}
                  onDone={clear}
                />
              ) : (
                <MorphScreen
                  key={screen.morphId}
                  morphId={screen.morphId}
                  onClose={close}
                >
                  {screen.render?.({ close })}
                </MorphScreen>
              ))}
          </AnimatePresence>,
          document.body
        )}
    </ZoneContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/* Handoff                                                             */
/* ------------------------------------------------------------------ */

/**
 * How long the plate holds before it lifts, in ms.
 *
 * Sized to the spring: morphSpring settles in about 380ms, and the plate then
 * fades over 220ms, so lifting at 440ms starts the reveal just as the plate
 * lands. `onLayoutAnimationComplete` lifts it earlier when it fires, but a
 * shared-layout handoff does not reliably report, so the timer is what this
 * actually runs on rather than a backstop.
 *
 * The number only holds because the navigation is deferred a frame - see
 * MorphTrigger. Navigating in the same commit delayed the morph's first frame
 * by well over a hundred milliseconds, and any fixed dwell measured from mount
 * was wrong by that much.
 */
const HANDOFF_DWELL = 440;

/**
 * The plate, alone, growing from the card to fill the viewport.
 *
 * The destination page is mounting behind it the whole time. Once the spring
 * has settled the plate fades, and what is underneath is the real route - so
 * the card visibly became the page instead of a copy of it. If the page is
 * still fetching when the plate lifts, its own skeleton is what shows, which
 * is the honest thing to show and not this component's job to hide.
 */
const MorphHandoff: React.FC<{ morphId: string; onDone: () => void }> = ({
  morphId,
  onDone,
}) => {
  const lifted = React.useRef(false);

  const finish = React.useCallback(() => {
    if (lifted.current) return;
    lifted.current = true;
    onDone();
  }, [onDone]);

  React.useEffect(() => {
    const timer = window.setTimeout(finish, HANDOFF_DWELL);
    return () => window.clearTimeout(timer);
  }, [finish]);

  return (
    <motion.div
      aria-hidden="true"
      layoutId={`morph-surface-${morphId}`}
      transition={morphSpring}
      onLayoutAnimationComplete={finish}
      className="pointer-events-none fixed inset-0 z-[120] bg-[var(--glass-fill)] backdrop-blur-[18px] backdrop-saturate-[1.8]"
      style={{ borderRadius: SCREEN_RADIUS }}
      exit={{ opacity: 0, transition: { duration: 0.22, ease: EASE.out } }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Trigger                                                             */
/* ------------------------------------------------------------------ */

export interface MorphTriggerProps {
  /** Unique and stable per card. Two cards sharing one id will fight. */
  morphId: string;
  /**
   * The screen this card becomes, rendered only while open. Omit it and pass
   * `route` instead when the destination is a real page.
   */
  screen?: ScreenRender;
  /**
   * The path this card opens. The card morphs into the viewport while the
   * router swaps the page in behind it, so the URL, the back button and deep
   * links all keep working exactly as they did before.
   */
  route?: string;
  children: React.ReactNode;
  /** Announced to a screen reader, since the card itself is the control. */
  label?: string;
  /** Falls back to rendering the card alone, with no interaction. */
  disabled?: boolean;
  className?: string;
}

/**
 * Wraps a card and makes it the source of a morph.
 *
 * The card stays mounted and visible while the screen is open. Hiding it would
 * cost the exit animation its destination, and it is covered by the growing
 * plate long before it could be noticed.
 */
export const MorphTrigger: React.FC<MorphTriggerProps> = ({
  morphId,
  screen,
  route,
  children,
  label,
  disabled = false,
  className = "",
}) => {
  const zone = React.useContext(ZoneContext);
  const location = useLocation();
  const navigate = useNavigate();
  const ref = React.useRef<HTMLDivElement>(null);
  const isOpen = zone?.openId === morphId;

  if (!zone || disabled || (!screen && !route)) {
    return (
      <MorphIdContext.Provider value={morphId}>
        <div className={className}>{children}</div>
      </MorphIdContext.Provider>
    );
  }

  const openScreen = () => {
    zone.open({
      morphId,
      mode: route ? "handoff" : "overlay",
      render: screen,
      route,
      returnTo: route ? location.pathname + location.search : undefined,
      origin: ref.current,
    });
    // Navigating in the same commit stalls the morph: the destination's lazy
    // chunk mounts before the projection gets its first frame, and the plate
    // sits motionless on the card for over a hundred milliseconds before
    // snapping most of the way open. A frame's head start is enough for the
    // spring to be underway, and the plate covers the route mount anyway.
    if (route) requestAnimationFrame(() => navigate(route));
  };

  return (
    <MorphIdContext.Provider value={morphId}>
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-expanded={isOpen}
        onClick={openScreen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openScreen();
          }
        }}
        className={`cursor-pointer rounded-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${className}`}
      >
        {/* The plate. Sized by the card it wraps, so a KPI tile and a
            full-width band both hand over the right starting box. */}
        <motion.div
          layoutId={`morph-surface-${morphId}`}
          transition={morphSpring}
          style={{ borderRadius: CARD_RADIUS }}
        >
          {children}
        </motion.div>
      </div>
    </MorphIdContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

const MorphScreen: React.FC<{
  morphId: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ morphId, onClose, children }) => {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [atTop, setAtTop] = React.useState(true);

  // Drag lives in motion values rather than state: a dismiss drag would
  // otherwise re-render the whole screen on every pointer move.
  const y = useMotionValue(0);
  const progress = useTransform(y, [0, DISMISS_DISTANCE], [0, 1], {
    clamp: true,
  });
  const scale = useTransform(progress, [0, 1], [1, 1 - DRAG_SCALE]);
  // The radius eases back toward the card's while you drag, so the screen is
  // already card-shaped by the time you let go.
  const radius = useTransform(progress, [0, 1], [SCREEN_RADIUS, CARD_RADIUS]);
  const scrimOpacity = useTransform(progress, [0, 1], [1, 0.2]);

  React.useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-[120]">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-[2px]"
        style={{ opacity: scrimOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={morphSpring}
        onClick={onClose}
      />

      <motion.div
        layoutId={`morph-surface-${morphId}`}
        transition={morphSpring}
        role="dialog"
        aria-modal="true"
        className="absolute inset-0 overflow-hidden bg-[var(--glass-fill)] backdrop-blur-[18px] backdrop-saturate-[1.8] sm:inset-x-[max(0px,calc(50%-32rem))]"
        style={{ borderRadius: radius, y, scale }}
        // Dragging is allowed only from the top of the body, so a downward
        // swipe mid-article scrolls rather than dismissing.
        drag={atTop ? "y" : false}
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.9 }}
        onDragEnd={(_, info) => {
          const far = info.offset.y > DISMISS_DISTANCE * DISMISS_THRESHOLD;
          const flicked = info.velocity.y > DISMISS_VELOCITY;
          if (far || flicked) onClose();
        }}
      >
        <MorphIdContext.Provider value={morphId}>
          <div
            className="h-full overflow-y-auto overscroll-contain"
            onScroll={(e) => setAtTop(e.currentTarget.scrollTop <= 0)}
          >
            {children}
          </div>
        </MorphIdContext.Provider>

        {/* Chrome sits outside the scroller so it stays put, and arrives with
            the first revealed row rather than with the plate. */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4"
          style={{ paddingTop: "max(1rem, var(--safe-top))" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ ...morphRevealSpring, delay: MORPH_REVEAL_DELAY }}
        >
          <span
            aria-hidden="true"
            className="mx-auto h-1 w-9 rounded-full bg-gray-400/50 dark:bg-white/30 sm:hidden"
          />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pointer-events-auto absolute right-4 grid h-9 w-9 place-items-center rounded-full border border-[var(--glass-edge)] bg-[var(--glass-fill)] text-gray-700 backdrop-blur-xl transition-colors hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] dark:text-gray-300 dark:hover:text-white"
          >
            <XMarkIcon className="h-4.5 w-4.5" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Shared and revealed parts                                           */
/* ------------------------------------------------------------------ */

/**
 * A title that physically grows.
 *
 * `layout="position"` moves it without letting the layout animation scale the
 * glyphs, which is what smears text in a naive shared-element transition. The
 * point size is animated separately, on the same spring, so the two read as one
 * movement.
 */
export const MorphTitle: React.FC<{
  children: React.ReactNode;
  /** Card size, in px. */
  from?: number;
  /** Screen size, in px. Omit inside a card. */
  to?: number;
  as?: "h1" | "h2" | "h3" | "span";
  className?: string;
}> = ({ children, from = 16, to, as = "span", className = "" }) => {
  const morphId = useMorphId("MorphTitle");
  const Tag = motion[as] as typeof motion.span;
  const size = to ?? from;

  return (
    <Tag
      layoutId={`morph-title-${morphId}`}
      layout="position"
      initial={{ fontSize: from }}
      animate={{ fontSize: size }}
      transition={morphSpring}
      className={className}
      style={{ fontSize: size }}
    >
      {children}
    </Tag>
  );
};

/**
 * Artwork, an avatar, a chart - anything the card and the screen both show.
 *
 * Keep the content fluid (a background, an SVG with a viewBox, an img with
 * object-cover) so it stretches with the box instead of re-laying out at the
 * destination size.
 */
export const MorphHero: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const morphId = useMorphId("MorphHero");
  return (
    <motion.div
      layoutId={`morph-hero-${morphId}`}
      transition={morphSpring}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Content the card never had.
 *
 * Arrives once the morph has mostly settled, staggered by `index`, and leaves
 * immediately on dismiss so the collapse is never carrying a screenful of text
 * back into the card.
 */
export const MorphReveal: React.FC<{
  children: React.ReactNode;
  index?: number;
  className?: string;
}> = ({ children, index = 0, className = "" }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 16, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 8, transition: { duration: 0.1 } }}
    transition={{
      ...morphRevealSpring,
      delay: MORPH_REVEAL_DELAY + index * MORPH_REVEAL_STAGGER,
    }}
    style={{ originX: 0 }}
  >
    {children}
  </motion.div>
);

/** Convenience wrapper: the padded column a screen's body usually wants. */
export const MorphScreenBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`mx-auto w-full max-w-3xl px-5 pb-16 sm:px-8 ${className}`}
    style={{ paddingTop: "calc(max(1rem, var(--safe-top)) + 3.5rem)" }}
  >
    {children}
  </div>
);

export default MorphTrigger;
