import React from "react";
import NexoraLoaderMark from "./NexoraLoaderMark";

interface AppLogoProps {
  /** Pixel size of the (square) logo. Default 36. */
  size?: number;
  className?: string;
  /**
   * Run the orbit. Off by default - see below. Turn it on only where the mark
   * is reporting progress rather than naming the product.
   */
  animated?: boolean;
  /** Deprecated (kept for API compatibility). Use `animated`. */
  loop?: boolean;
}

/**
 * Nexora brand mark - the monogram, drawn complete and at rest.
 *
 * The orbit (see {@link NexoraLoaderMark}) belongs to the loading states, not
 * to the chrome. The mark used to animate everywhere it appeared, which meant
 * two copies of it - the sidebar rail and the mobile app bar, the second one
 * `display: none` at desktop widths and animating anyway - ran a permanent
 * keyframe loop on `cx`, `cy` and `r` under a Gaussian blur filter, for the
 * whole session, on every screen. SVG geometry under a filter cannot be
 * composited, so each frame cost a layout and a re-rasterisation; on the
 * dashboard the two marks alone were worth about six frames a second.
 *
 * A logo that never stops moving also stops reading as a logo. It is the one
 * fixed point on the screen, and the loaders are where the product still says
 * "working" in motion - `LogoLoader`, `BrandedLoader` and `LoadingSpinner` all
 * keep the orbit.
 */
const AppLogo: React.FC<AppLogoProps> = ({
  size = 36,
  className = "",
  animated = false,
}) => (
  <NexoraLoaderMark size={size} className={className} animated={animated} />
);

export default AppLogo;
