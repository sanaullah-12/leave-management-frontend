import React from "react";

interface AnimatedMetricProps {
  /** Final value. Counted up from zero when the owning card is revealed. */
  value: number;
  /** Appended to the number, e.g. "%". */
  suffix?: string;
  /**
   * Range the value gently drifts within once the entrance has finished.
   * Omit for a figure that should sit still.
   */
  range?: [number, number];
}

/**
 * A number the hero timeline animates.
 *
 * The component renders the *final* value, so the figure is correct even if the
 * timeline never runs (reduced motion, a failed chunk load). Everything else is
 * described declaratively through data attributes and driven by
 * `useEcosystemTimeline`, which writes to this text node directly - no state,
 * and therefore no re-render, for sixty updates a second.
 */
const AnimatedMetric: React.FC<AnimatedMetricProps> = ({
  value,
  suffix = "",
  range,
}) => (
  <span
    data-hero="metric"
    data-count={value}
    data-suffix={suffix}
    data-range={range ? range.join(",") : undefined}
    className="tabular-nums"
  >
    {value}
    {suffix}
  </span>
);

export default React.memo(AnimatedMetric);
