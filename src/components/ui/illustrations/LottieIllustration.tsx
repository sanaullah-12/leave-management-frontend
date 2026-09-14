import React from "react";
import { recolorLottie, stripBackdropLayers } from "../../../lib/lottieTheme";
import { useThemeAccentRgb } from "../../../hooks/useThemeAccent";

/**
 * A Lottie animation in a section banner.
 *
 * Four things it takes care of:
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
 *
 * A reduced-motion preference stops the animation on its first frame rather
 * than hiding it, so the artwork is still there, just still.
 */

const Lottie = React.lazy(() => import("lottie-react"));

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

  return (
    <React.Suspense fallback={<div className={className}>{fallback}</div>}>
      <Lottie
        animationData={animation as never}
        loop={!still}
        autoplay={!still}
        className={className}
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
      />
    </React.Suspense>
  );
};

export default LottieIllustration;
