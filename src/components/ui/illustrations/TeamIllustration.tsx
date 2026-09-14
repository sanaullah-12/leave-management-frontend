import React from "react";
import "../../../styles/section-header.css";

/**
 * Team collaboration, for the Team banner.
 *
 * Three figures around a shared board: a group rather than a portrait, since
 * the section is about the team and not about any one person.
 *
 * Drawn rather than imported. It is a few hundred bytes of markup against
 * ~60kB for a Lottie player plus its JSON, and a banner's artwork is not
 * worth that on a screen the user opens constantly. Swap in a
 * `LottieIllustration` here if a section ever needs real character motion.
 *
 * Everything is white at low opacity so it sits on the banner gradient in any
 * theme, and it carries no colour of its own to clash with the accent.
 *
 * The bob is CSS (see section-header.css) and stops under
 * prefers-reduced-motion.
 */
const TeamIllustration: React.FC<{ className?: string }> = ({
  className = "h-44 w-64",
}) => (
  <svg
    viewBox="0 0 208 128"
    className={className}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {/* Ground shadow, so the group is standing on something. */}
    <ellipse cx="104" cy="116" rx="72" ry="6" fill="#fff" fillOpacity="0.08" />

    {/* The board the group is gathered around. Drifts on its own period so
        the scene never moves as one rigid block. */}
    <g className="sh-float-slow">
      <rect
        x="118"
        y="24"
        width="74"
        height="54"
        rx="7"
        fill="#fff"
        fillOpacity="0.16"
      />
      <rect x="128" y="36" width="38" height="4" rx="2" fill="#fff" fillOpacity="0.5" />
      <rect x="128" y="46" width="54" height="4" rx="2" fill="#fff" fillOpacity="0.3" />
      {/* A small rising bar chart - the thing a team gathers around. */}
      <rect x="128" y="66" width="7" height="6" rx="1.5" fill="#fff" fillOpacity="0.4" />
      <rect x="139" y="60" width="7" height="12" rx="1.5" fill="#fff" fillOpacity="0.55" />
      <rect x="150" y="54" width="7" height="18" rx="1.5" fill="#fff" fillOpacity="0.7" />
    </g>

    {/* Centre figure, closest to the viewer. */}
    <g className="sh-float">
      <circle cx="72" cy="42" r="15" fill="#fff" fillOpacity="0.9" />
      <path
        d="M72 62c-16 0-28 10-28 23v23h56V85c0-13-12-23-28-23Z"
        fill="#fff"
        fillOpacity="0.8"
      />
    </g>

    {/* Two figures behind, at lower opacity so the group has depth. */}
    <g className="sh-float-slow">
      <circle cx="34" cy="52" r="12" fill="#fff" fillOpacity="0.55" />
      <path
        d="M34 68c-13 0-23 8-23 18v22h46V86c0-10-10-18-23-18Z"
        fill="#fff"
        fillOpacity="0.45"
      />
    </g>
    <g className="sh-float">
      <circle cx="110" cy="54" r="11" fill="#fff" fillOpacity="0.45" />
      <path
        d="M110 69c-12 0-21 7-21 16v23h42V85c0-9-9-16-21-16Z"
        fill="#fff"
        fillOpacity="0.35"
      />
    </g>
  </svg>
);

export default TeamIllustration;
