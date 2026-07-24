import React from "react";
import logoUrl from "../assets/leaveflowapplogo.png";

interface AppLogoProps {
  /** Pixel size of the (square) logo. Default 36. */
  size?: number;
  /** Show the pulsing glow halo behind the mark. Default true. */
  halo?: boolean;
  /** Show the periodic light sweep across the mark. Default true. */
  shine?: boolean;
  className?: string;
}

/**
 * Animated LeaveFlow brand mark.
 * Renders the app logo (leaveflowapplogo.png) with a gentle floating bob,
 * a soft brand-gradient halo, and a periodic shine sweep.
 * Animations respect `prefers-reduced-motion`.
 */
const AppLogo: React.FC<AppLogoProps> = ({
  size = 36,
  halo = true,
  shine = true,
  className = "",
}) => {
  return (
    <span
      className={`app-logo ${className}`}
      style={{ width: size, height: size }}
    >
      {halo && <span className="app-logo__halo" aria-hidden="true" />}
      <img
        src={logoUrl}
        alt="LeaveFlow"
        className="app-logo__img"
        draggable={false}
      />
      {shine && <span className="app-logo__shine" aria-hidden="true" />}
    </span>
  );
};

export default AppLogo;
