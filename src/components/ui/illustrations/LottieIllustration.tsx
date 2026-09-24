import React from "react";
import type { LottieOptions, LottieRefCurrentProps } from "lottie-react";
import { recolorLottie, stripBackdropLayers } from "../../../lib/lottieTheme";
import { useThemeAccentRgb } from "../../../hooks/useThemeAccent";

/**
 * A Lottie animation in a section banner.
 *
 * Six things it takes care of:
 *
 *   - `lottie-react` is loaded lazily. The player is ~60kB and the animation
 *     JSON is usually larger; neither should be in the bundle for a screen
 *     whose banner is decorative. The caller is expected to import the JSON
 *     lazily too - see illustrations/index.tsx.
 *   - The palette is remapped onto the theme accent unless `themed` is turned
 *     off, so a downloaded animation stops carrying its author's colours.
 *     See lib/lottieTheme.
 *   - Any full-canvas solid the animation was exported with is dropped, so
 *     the artwork sits on the banner rather than on its own white card. See
 *     `stripBackdropLayers`.
 *   - The accent comes from `useThemeAccentRgb`, which watches the class on
 *     <html> rather than reading the variable during render. ThemeContext
 *     writes that class in an effect, so a render-time read returns the
 *     previous theme and the artwork lags a switch behind the banner it sits
 *     on.
 *   - It draws to a canvas, not to SVG. Every banner in the app carries one of
 *     these on a permanent loop, and the SVG renderer expresses each frame as
 *     hundreds of attribute writes on live DOM nodes - measured at ~2,200
 *     mutations a second on the dashboard alone, which is style recalc, layout
 *     and paint for the whole document on every frame. The canvas renderer
 *     draws the same frames into one bitmap that the rest of the page never
 *     has to reason about. Subframes are off for the same reason: the
 *     animation then ticks at the frame rate it was authored at rather than at
 *     whatever rate the display offers.
 *   - It runs only while it can actually be seen. Off-screen, on a breakpoint
 *     that hides the banner artwork, or in a background tab, the player is
 *     paused rather than drawing frames nobody is looking at.
 *
 * A reduced-motion preference stops the animation on its first frame rather
 * than hiding it, so the artwork is still there, just still.
 */

/**
 * `lottie-react` types its default export for the SVG renderer only - the
 * component's props are `LottieOptions<"svg">`, which rejects both
 * `renderer="canvas"` and the canvas renderer's own settings. The runtime
 * passes every option straight through to lottie-web, so the cast restates
 * the generic the package hard-codes rather than papering over a mismatch.
 */
const Lottie = React.lazy(() => import("lottie-react")) as React.ComponentType<
  LottieOptions<"canvas">
>;

export interface LottieIllustrationProps {
  /** A parsed Lottie animation. */
  data: unknown;
  /** Recolour to the theme accent. On by default. */
  themed?: boolean;
  /**
   * Floor for lightness when recolouring. Banners are saturated, so artwork
   * needs to sit above the background rather than in it.
   */
  minLightness?: number;
  /** Rendered until the player has loaded, and instead of it on failure. */
  fallback?: React.ReactNode;
  className?: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const LottieIllustration: React.FC<LottieIllustrationProps> = ({
  data,
  themed = true,
  minLightness,
  fallback = null,
  className = "h-32 w-44",
}) => {
  const accent = useThemeAccentRgb();

  const animation = React.useMemo(() => {
    // The backdrop goes whether or not the art is themed: an opaque artboard
    // is wrong on a banner either way.
    const art = stripBackdropLayers(data);
    if (!themed) return art;
    // Walking a 500kB animation is not free, so it happens once per accent
    // rather than on every render. `accent` keeps its identity while the
    // colour is unchanged, which is what makes that hold.
    return recolorLottie(art, accent, { minLightness });
  }, [data, themed, minLightness, accent]);

  const still = prefersReducedMotion();

  const hostRef = React.useRef<HTMLDivElement>(null);
  const lottieRef = React.useRef<LottieRefCurrentProps | null>(null);
  const onScreenRef = React.useRef(true);

  /**
   * Play only while the artwork is both on screen and in a foreground tab.
   *
   * An element hidden by a breakpoint (`hidden lg:block` on the banner's
   * artwork slot) reports an empty rectangle, so a phone pauses on the same
   * path as a scrolled-away banner with no separate media query.
   */
  const sync = React.useCallback(() => {
    const player = lottieRef.current;
    if (!player || still) return;
    if (onScreenRef.current && document.visibilityState === "visible") {
      player.play();
    } else {
      player.pause();
    }
  }, [still]);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host || still) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreenRef.current = entry.isIntersecting;
        sync();
      },
      // Start a beat before the banner is reached, so scrolling up to it does
      // not show a frozen frame catching up.
      { rootMargin: "96px" }
    );
    observer.observe(host);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [still, sync]);

  return (
    <div ref={hostRef} className={className}>
      <React.Suspense fallback={<>{fallback}</>}>
        <Lottie
          lottieRef={lottieRef}
          animationData={animation as never}
          loop={!still}
          autoplay={!still}
          renderer="canvas"
          className="h-full w-full"
          onDOMLoaded={() => {
            // Whole frames only - see the note on subframes above.
            lottieRef.current?.setSubframe(false);
            sync();
          }}
          rendererSettings={{
            preserveAspectRatio: "xMidYMid meet",
            // Without this the canvas is laid out in CSS pixels and drawn at
            // one device pixel each, which is visibly soft on any retina or
            // scaled display.
            dpr: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
          }}
        />
      </React.Suspense>
    </div>
  );
};

export default LottieIllustration;
