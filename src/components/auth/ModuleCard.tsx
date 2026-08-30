import React from "react";
import AnimatedMetric from "./AnimatedMetric";
import type { EcosystemModule } from "./ecosystem";

interface ModuleCardProps {
  module: EcosystemModule;
}

/**
 * One module of the Nexora platform, as a floating glass panel.
 *
 * Two nested elements on purpose: the outer one owns the *placement*
 * (a percentage anchor plus the centring translate), the inner one is what
 * GSAP animates. Keeping them apart means the timeline can write `transform`
 * freely without fighting the layout translate.
 *
 * Every dimension comes from `.nx-module-card*` in auth-hero.css, where it is
 * measured against the stage instead of the viewport - see that file for why.
 */
const ModuleCard: React.FC<ModuleCardProps> = ({ module: m }) => {
  const Icon = m.icon;
  const soon = m.status === "soon";

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${m.x}%`, top: `${m.y}%` }}
    >
      <div
        data-hero="card"
        data-drift={m.drift}
        className="nx-module-card relative rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl shadow-black/40 backdrop-blur-md"
      >
        {soon && (
          <span className="absolute -right-1.5 -top-1.5 rounded-full border border-violet-400/30 bg-violet-500/25 px-1.5 py-[3px] text-[8px] font-semibold uppercase tracking-wider text-violet-100 backdrop-blur-sm">
            Soon
          </span>
        )}

        {m.pulse && !soon && (
          <span
            className="nx-activity-dot absolute right-2.5 top-2.5"
            style={{ color: m.accent }}
          />
        )}

        <div className="flex items-center gap-1.5">
          <span
            className="nx-module-card__icon flex shrink-0 items-center justify-center rounded-lg border"
            style={{
              color: m.accent,
              backgroundColor: `${m.accent}24`,
              borderColor: `${m.accent}3d`,
            }}
          >
            <Icon />
          </span>
          <span className="nx-module-card__name truncate font-semibold uppercase text-white/50">
            {m.name}
          </span>
        </div>

        <p className="nx-module-card__value font-semibold leading-none text-white">
          {m.count !== undefined ? (
            <AnimatedMetric
              value={m.count}
              suffix={m.suffix}
              range={m.liveRange}
            />
          ) : (
            m.text
          )}
        </p>
        <p className="nx-module-card__caption truncate leading-tight text-white/45">
          {m.caption}
        </p>
      </div>
    </div>
  );
};

export default React.memo(ModuleCard);
