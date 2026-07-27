import React, { useMemo } from "react";
import Lottie from "lottie-react";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import dotAnim from "../assets/leaveflow-dot.lottie.json";
import bodyMask from "../assets/leaveflow-logo-body.png";
import fullMask from "../assets/leaveflow-logo-full.png";

interface AppLogoProps {
  /** Pixel size of the (square) logo. Default 36. */
  size?: number;
  /** Loop the bounce animation. Default true. */
  loop?: boolean;
  className?: string;
}

// Accent per color scheme (matches the tailwind palette each theme applies).
const ACCENT_RGB: Record<string, [number, number, number]> = {
  black: [31, 41, 55],
  purple: [156, 95, 209],
  blue: [37, 99, 235],
  pink: [219, 39, 119],
  violet: [124, 58, 237],
  indigo: [79, 70, 229],
  orange: [234, 88, 12],
  teal: [13, 148, 136],
  bronze: [180, 83, 9],
  mint: [5, 150, 105],
};

/**
 * Animated LeaveFlow brand mark — a single, theme-colored monogram.
 * The logo body is a CSS mask filled with the active theme accent (green and
 * navy removed), and the dot bounces (squash-and-stretch) over it with an
 * impact ring via a lightweight Lottie overlay. Both recolor with the theme.
 * Reduced motion → the static single-color mark.
 */
const AppLogo: React.FC<AppLogoProps> = ({
  size = 36,
  loop = true,
  className = "",
}) => {
  const reduce = useReducedMotion();
  const { colorScheme } = useTheme();
  const [r, g, b] = ACCENT_RGB[colorScheme] || ACCENT_RGB.blue;
  const accentCss = `rgb(${r}, ${g}, ${b})`;

  const maskStyle = (url: string): React.CSSProperties => ({
    backgroundColor: accentCss,
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  });

  // Recolor the vector dot + impact ring to the theme accent.
  const themed = useMemo(() => {
    const c = [r / 255, g / 255, b / 255, 1];
    const data = JSON.parse(JSON.stringify(dotAnim));
    try {
      data.layers[0].shapes[0].it[1].c.k = c; // dot fill
      data.layers[1].shapes[0].it[1].c.k = c; // ring stroke
    } catch {
      /* keep defaults if shape changes */
    }
    return data;
  }, [r, g, b]);

  if (reduce) {
    return (
      <div
        role="img"
        aria-label="LeaveFlow"
        className={className}
        style={{ width: size, height: size, ...maskStyle(fullMask) }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label="LeaveFlow"
      className={className}
      style={{ position: "relative", width: size, height: size }}
    >
      {/* Body — theme-accent fill masked by the logo shape */}
      <div style={{ position: "absolute", inset: 0, ...maskStyle(bodyMask) }} />
      {/* Bouncing dot + impact ring */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Lottie
          key={colorScheme}
          animationData={themed}
          loop={loop}
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
};

export default AppLogo;
