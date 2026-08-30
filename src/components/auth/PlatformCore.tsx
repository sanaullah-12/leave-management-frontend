import React from "react";
import AppLogo from "../AppLogo";

/**
 * The centre of the visualisation: the Nexora mark, the glow it sits in, and
 * two counter-rotating platform rings.
 *
 * Every animated element is its own node with no layout transform of its own -
 * centring is done by the flex parents - so the timeline owns `transform`
 * outright on each one. Sizes come from `.nx-core*` in auth-hero.css, expressed
 * in stage units, which is what keeps the connectors emerging from the edge of
 * the disc rather than from under it as the stage grows and shrinks.
 */
const Ring: React.FC<{ variant: "outer" | "inner" }> = ({ variant }) => (
  <div
    data-hero="ring"
    data-ring={variant}
    className={`nx-core-ring nx-core-ring--${variant} absolute`}
  >
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="49"
        fill="none"
        stroke={
          variant === "outer"
            ? "rgba(255,255,255,0.16)"
            : "rgba(255,255,255,0.1)"
        }
        strokeWidth={variant === "outer" ? 0.5 : 0.7}
        strokeDasharray={variant === "outer" ? "1.1 4.2" : "15 4"}
        strokeLinecap="round"
      />
    </svg>
  </div>
);

const PlatformCore: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <div className="relative flex items-center justify-center">
      <div
        data-hero="glow"
        className="nx-core-glow absolute rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(62,91,246,0.5) 0%, rgba(8,175,108,0.26) 45%, transparent 72%)",
        }}
      />

      <Ring variant="outer" />
      <Ring variant="inner" />

      <div
        data-hero="core"
        className="nx-core relative flex items-center justify-center rounded-full border border-white/15 bg-white/[0.07] shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        <AppLogo size={62} />
      </div>
    </div>
  </div>
);

export default React.memo(PlatformCore);
