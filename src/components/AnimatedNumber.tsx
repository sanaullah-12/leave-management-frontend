import React, { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  /** animation length in ms */
  duration?: number;
  /** decimal places to show (default 0) */
  decimals?: number;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts up to `value` on mount and whenever `value` changes, easing out.
 * Falls back to the final value instantly when reduced motion is preferred.
 */
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 900,
  decimals = 0,
}) => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion() || duration <= 0) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <>{formatted}</>;
};

export default AnimatedNumber;
