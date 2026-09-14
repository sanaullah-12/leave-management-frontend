import React from "react";
import "../../../styles/section-header.css";

/**
 * Analytics, for the dashboard banner.
 *
 * A floating panel with a rising trend and a couple of satellite chips - the
 * dashboard is where the numbers are read, so the artwork is the reading
 * rather than a person.
 *
 * Drawn rather than imported, for the same reason as the other section
 * illustrations: a few hundred bytes of markup against ~60kB for a Lottie
 * player plus its JSON, on the screen the user opens most often. Swap in a
 * `LottieIllustration` here if this section ever needs character motion.
 *
 * White at varying opacity so it sits on the banner gradient in any theme and
 * carries no colour of its own to fight the accent. The drift is CSS (see
 * section-header.css) and stops under prefers-reduced-motion.
 */
const DashboardIllustration: React.FC<{ className?: string }> = ({
  className = "h-44 w-72",
}) => (
  <svg
    viewBox="0 0 224 128"
    className={className}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <ellipse cx="112" cy="118" rx="80" ry="6" fill="#fff" fillOpacity="0.08" />

    {/* The main panel: axis, columns, and a trend line over them. */}
    <g className="sh-float">
      <rect
        x="40"
        y="14"
        width="128"
        height="88"
        rx="9"
        fill="#fff"
        fillOpacity="0.16"
      />

      {/* Title bar, so the panel reads as a screen and not a plain box. */}
      <rect x="52" y="26" width="40" height="4" rx="2" fill="#fff" fillOpacity="0.5" />
      <rect x="52" y="35" width="24" height="3" rx="1.5" fill="#fff" fillOpacity="0.3" />

      {/* Baseline. */}
      <rect x="52" y="86" width="104" height="1.5" rx="0.75" fill="#fff" fillOpacity="0.25" />

      {/* Columns, rising left to right. */}
      <rect x="56" y="70" width="10" height="16" rx="2" fill="#fff" fillOpacity="0.35" />
      <rect x="72" y="62" width="10" height="24" rx="2" fill="#fff" fillOpacity="0.45" />
      <rect x="88" y="66" width="10" height="20" rx="2" fill="#fff" fillOpacity="0.4" />
      <rect x="104" y="52" width="10" height="34" rx="2" fill="#fff" fillOpacity="0.6" />
      <rect x="120" y="58" width="10" height="28" rx="2" fill="#fff" fillOpacity="0.5" />
      <rect x="136" y="44" width="10" height="42" rx="2" fill="#fff" fillOpacity="0.75" />

      {/* The trend across the columns, with a marker on the last point. */}
      <path
        d="M61 66 L77 57 L93 61 L109 47 L125 53 L141 39"
        stroke="#fff"
        strokeOpacity="0.85"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="141" cy="39" r="4" fill="#fff" />
    </g>

    {/* Satellite chips on a different period, so the scene has parallax. */}
    <g className="sh-float-slow">
      <rect x="168" y="30" width="44" height="20" rx="6" fill="#fff" fillOpacity="0.2" />
      <rect x="176" y="38" width="20" height="4" rx="2" fill="#fff" fillOpacity="0.6" />

      <rect x="10" y="56" width="36" height="20" rx="6" fill="#fff" fillOpacity="0.16" />
      <rect x="18" y="64" width="16" height="4" rx="2" fill="#fff" fillOpacity="0.5" />
    </g>
  </svg>
);

export default DashboardIllustration;
