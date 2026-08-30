import React from "react";
import { MODULES_BY_ORDER, connectorGeometry } from "./ecosystem";

/**
 * The connective tissue of the ecosystem: one line from the Nexora core out to
 * each module, plus the dot that travels along it.
 *
 * Drawn in a normalised 0-100 viewBox so it lines up exactly with the
 * percentage-anchored cards on top of it. Lines are declared with
 * `pathLength="1"`, which lets the timeline draw them with a plain
 * 0-to-1 `strokeDashoffset` tween instead of measuring geometry at runtime.
 */
const ConnectionLines: React.FC = () => (
  <svg
    className="pointer-events-none absolute inset-0 h-full w-full"
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      {MODULES_BY_ORDER.map((m) => {
        const g = connectorGeometry(m);
        return (
          <linearGradient
            key={m.id}
            id={`nx-conn-${m.id}`}
            gradientUnits="userSpaceOnUse"
            x1={g.x1}
            y1={g.y1}
            x2={g.x2}
            y2={g.y2}
          >
            <stop offset="0%" stopColor={m.accent} stopOpacity="0.06" />
            <stop offset="55%" stopColor={m.accent} stopOpacity="0.42" />
            <stop offset="100%" stopColor={m.accent} stopOpacity="0.78" />
          </linearGradient>
        );
      })}
    </defs>

    {MODULES_BY_ORDER.map((m) => {
      const g = connectorGeometry(m);
      return (
        <line
          key={m.id}
          data-hero="line"
          x1={g.x1}
          y1={g.y1}
          x2={g.x2}
          y2={g.y2}
          stroke={`url(#nx-conn-${m.id})`}
          strokeWidth={0.22}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
        />
      );
    })}

    {MODULES_BY_ORDER.map((m) => {
      const g = connectorGeometry(m);
      return (
        <circle
          key={m.id}
          data-hero="pulse"
          data-x1={g.x1}
          data-y1={g.y1}
          data-x2={g.x2}
          data-y2={g.y2}
          cx={g.x1}
          cy={g.y1}
          r={0.55}
          fill={m.accent}
          opacity={0}
        />
      );
    })}
  </svg>
);

export default React.memo(ConnectionLines);
