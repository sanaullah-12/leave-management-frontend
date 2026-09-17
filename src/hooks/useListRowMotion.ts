import { useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import { DUR, EASE, listItem, listItemWide } from "../lib/motion";

/**
 * The list-row entrance, as a set of props to spread onto each row.
 *
 * Returns a factory rather than the props themselves because the props differ
 * per row (each carries its own index) while the reduced-motion check must not.
 * Hooks cannot be called inside a `.map()` - the number of rows changes between
 * renders and the hook order would change with it - so the hook runs once in
 * the list component and the function it returns is what the map calls:
 *
 *   const row = useListRowMotion();
 *   ...
 *   {items.map((item, i) => (
 *     <motion.tr key={item.id} {...row(i)}>
 *   ))}
 *
 * Under `prefers-reduced-motion` it returns nothing at all, so the row renders
 * as a plain element with no variants attached and no entrance to sit through.
 *
 * @param wide Use the flattened scale meant for full-width desktop table rows.
 *             See `listItemWide` for why a wide row cannot take the phone's.
 * @param removable Also animate the row leaving, and let the rows below it
 *             close the gap. See {@link useListRowMotion} notes on cost.
 */
export function useListRowMotion(wide = false, removable = false) {
  const reduce = useReducedMotion();

  return useCallback(
    (index: number) => {
      if (reduce) return {};

      const base = {
        variants: wide ? listItemWide : listItem,
        custom: index,
        initial: "initial" as const,
        animate: "animate" as const,
      };

      if (!removable) return base;

      return {
        ...base,
        /* The row shrinks out of the column rather than blinking off. What
           makes a deletion legible is not the row disappearing - that happens
           either way - but the rows below it closing over the gap, which is
           what `layout` buys and why it is opt-in: layout projection is
           measured per row per frame, and a 200-row roster that never deletes
           anything should not be paying for it. */
        layout: true,
        exit: {
          opacity: 0,
          scale: 0.94,
          transition: { duration: DUR.fast, ease: EASE.in },
        },
      };
    },
    [reduce, wide, removable]
  );
}

export default useListRowMotion;
