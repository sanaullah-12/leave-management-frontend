import React, { useRef } from "react";
import { BellAlertIcon } from "@heroicons/react/24/outline";
import PlatformCore from "./PlatformCore";
import ConnectionLines from "./ConnectionLines";
import ModuleCard from "./ModuleCard";
import { MODULES_BY_ORDER, NOTIFICATION_ANCHOR } from "./ecosystem";
import useEcosystemTimeline from "./useEcosystemTimeline";
import "./auth-hero.css";

/**
 * The Nexora ecosystem, animated.
 *
 * This is the whole hero: a Nexora core, a connector out to every module, a
 * floating card per module, and a notification pill. Cards are rendered in
 * reveal order (not visual order) so the timeline can simply stagger over them
 * in DOM order; their position comes from the anchor in `ecosystem.ts`.
 *
 * The stage is a square sized by `min(available width, available height)`, and
 * everything inside is anchored in percentages, so the composition survives
 * every panel size without a resize listener.
 *
 * Marked `aria-hidden`: it is product illustration with sample figures, and the
 * panel states the same message in real text beneath it.
 *
 * Loaded lazily and only above `lg` - phones never download GSAP.
 */
const EcosystemVisual: React.FC = () => {
  const stage = useRef<HTMLDivElement>(null);
  useEcosystemTimeline(stage);

  return (
    <div
      ref={stage}
      className="nx-stage relative"
      style={{
        width: "min(100%, 560px)",
        maxHeight: "100%",
        aspectRatio: "1 / 1",
      }}
      aria-hidden="true"
    >
      <ConnectionLines />
      <PlatformCore />

      {MODULES_BY_ORDER.map((m) => (
        <ModuleCard key={m.id} module={m} />
      ))}

      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${NOTIFICATION_ANCHOR.x}%`,
          top: `${NOTIFICATION_ANCHOR.y}%`,
        }}
      >
        <div
          data-hero="notification"
          className="nx-notification flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.07] shadow-lg shadow-black/40 backdrop-blur-md"
        >
          <span className="nx-notification__icon flex shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <BellAlertIcon />
          </span>
          <span className="font-medium text-white/80">
            Payroll approved
            <span className="text-white/40"> · just now</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default EcosystemVisual;
