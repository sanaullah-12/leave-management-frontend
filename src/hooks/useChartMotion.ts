import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * The entrance for a Recharts series, as props to spread onto it.
 *
 *   const chart = useChartMotion();
 *   <Area dataKey="days" {...chart} />
 *
 * Recharts animates by default, which is the reason charts in this app were
 * the one surface still moving to somebody else's timing: a second and a half,
 * on a plain `ease`, starting the instant the component mounts. Next to a card
 * that has finished arriving in a third of a second, a chart still growing out
 * of the axis reads as the page having stalled rather than as data appearing.
 *
 * 700ms is deliberately past the `DUR` scale's ceiling. That ceiling is about
 * how long a user waits for an interface to respond, and a chart is not a
 * response - it is the content itself, and a line tracing a year of attendance
 * is doing something a card arriving is not. `animationBegin` holds it until
 * the card around it has landed, so the two do not compete.
 *
 * Under `prefers-reduced-motion` the series is drawn at its final state. A
 * chart is the one place where that matters beyond taste: bars growing and
 * lines sweeping is exactly the large-area motion the preference exists to
 * suppress.
 */
export function useChartMotion() {
  const reduce = useReducedMotion();

  return useMemo(
    () =>
      reduce
        ? ({ isAnimationActive: false } as const)
        : ({
            isAnimationActive: true,
            animationBegin: 120,
            animationDuration: 700,
            animationEasing: "ease-out",
          } as const),
    [reduce]
  );
}

export default useChartMotion;
