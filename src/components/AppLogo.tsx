import React from "react";
import NexoraLoaderMark from "./NexoraLoaderMark";

interface AppLogoProps {
  /** Pixel size of the (square) logo. Default 36. */
  size?: number;
  className?: string;
  /** Deprecated (kept for API compatibility). The mark always animates. */
  loop?: boolean;
}

/**
 * Nexora brand mark — the official animated monogram. The blue and green
 * marks continuously exchange positions along a smooth circular orbit
 * (see {@link NexoraLoaderMark}), so the logo feels alive everywhere it
 * appears — sidebar, header, auth and loading states. Falls back to a clean
 * static mark under prefers-reduced-motion.
 */
const AppLogo: React.FC<AppLogoProps> = ({ size = 36, className = "" }) => (
  <NexoraLoaderMark size={size} className={className} />
);

export default AppLogo;
