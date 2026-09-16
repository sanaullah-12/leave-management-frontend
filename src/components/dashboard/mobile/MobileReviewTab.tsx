import React from "react";
import AttendancePieCard from "../AttendancePieCard";
import { SHEET } from "../../mobile/primitives";
import type { DashboardGauge } from "./types";

/**
 * The month as two readings: how it was attended, and what is still waiting.
 *
 * Both are one figure with its share drawn around it, which is why they share
 * a tab. The donut is the shared AttendancePieCard - the same month-to-date
 * read the desktop page shows, not a phone-sized approximation of it.
 */

interface Props {
  role?: string;
  employeeId?: string | number;
  gauges: DashboardGauge[];
  accent: string;
  accentSoft: string;
}

/** A semicircle arc. `pathLength` normalises it to 0..100 so the dash is the percent. */
const SemiGauge: React.FC<{
  gauge: DashboardGauge;
  accent: string;
  accentSoft: string;
  gradientId: string;
}> = ({ gauge, accent, accentSoft, gradientId }) => {
  const percent = Math.max(0, Math.min(100, gauge.percent));
  const ARC = "M8 52 A 42 42 0 0 1 92 52";

  return (
    <div className={`${SHEET} p-4`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
        {gauge.label}
      </p>
      {/* Capped and centred. The arc is drawn from a 100x58 viewBox, so left
          to fill a full-width phone card it grows to about 200px tall - an
          arc that size reads as a piece of furniture rather than as the frame
          around the one number this card exists to show. */}
      <div className="relative mx-auto mt-3 w-full max-w-[220px]">
        <svg viewBox="0 0 100 58" className="w-full" role="presentation">
          <defs>
            {/* Light to full accent along the arc: one hue at two
                brightnesses, so it reads as depth rather than a second
                colour with a meaning of its own. */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accentSoft} />
              <stop offset="100%" stopColor={accent} />
            </linearGradient>
          </defs>
          <path
            className="stroke-black/[0.07] dark:stroke-white/[0.09]"
            d={ARC}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={100}
          />
          <path
            d={ARC}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${percent} 100`}
            style={{ transition: "stroke-dasharray 0.7s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
          <span className="text-[26px] font-bold leading-none tabular-nums text-gray-900 dark:text-white">
            {gauge.big}
          </span>
          {gauge.small && (
            <span className="mt-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              {gauge.small}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const MobileReviewTab: React.FC<Props> = ({
  role,
  employeeId,
  gauges,
  accent,
  accentSoft,
}) => (
  <div className="space-y-3">
    <AttendancePieCard role={role} employeeId={employeeId} />

    {gauges.map((gauge, i) => (
      <SemiGauge
        key={gauge.label}
        gauge={gauge}
        accent={accent}
        accentSoft={accentSoft}
        /* SVG gradient ids are global to the document, so one per instance. */
        gradientId={`mobGaugeArc${i}`}
      />
    ))}
  </div>
);

export default MobileReviewTab;
