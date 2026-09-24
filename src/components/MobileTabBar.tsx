import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { pressSpring, spring } from "../lib/motion";

type Icon = React.ComponentType<{ className?: string }>;

export interface MobileTabItem {
  key: string;
  label: string;
  icon: Icon;
  badge?: string | null;
  active: boolean;
  onClick: () => void;
}

export interface MobileTabCenterAction {
  label: string;
  icon: Icon;
  onClick: () => void;
}

interface MobileTabBarProps {
  /** Exactly four items: two are rendered either side of the centre action. */
  items: MobileTabItem[];
  /** The elevated primary action in the middle of the bar. */
  center: MobileTabCenterAction;
}

/**
 * MobileTabBar
 * ------------
 * A floating bottom bar with an elevated centre action.
 *
 * Three things make this read as a native app bar rather than a web nav:
 *
 *   1. It floats. Insetting the bar and rounding it fully detaches it from the
 *      page, so it reads as system chrome sitting above the content instead of
 *      a strip of the page that happens to be stuck to the bottom.
 *   2. The active tab gets a filled icon badge, not just a colour change. A
 *      solid shape is legible at a glance and at arm's length; a tinted glyph
 *      is not.
 *   3. The primary action is promoted out of the row entirely. Creating a leave
 *      request is the most common thing anyone does here, and it was previously
 *      two taps deep behind a nav group.
 *
 * Colour comes from `--accent`, which the theme system remaps per palette, so
 * the bar follows the user's chosen theme across all ten rather than hardcoding
 * a brand blue.
 */
const MobileTabBar: React.FC<MobileTabBarProps> = ({ items, center }) => {
  const left = items.slice(0, 2);
  const right = items.slice(2, 4);
  const reduce = useReducedMotion();

  const renderTab = (item: MobileTabItem) => (
    <button
      key={item.key}
      type="button"
      onClick={item.onClick}
      aria-current={item.active ? "page" : undefined}
      /* min-h-[52px] rather than padding alone: the label can wrap to nothing
         in some languages, and a tab that shrinks below the thumb-sized
         minimum in Japanese is not a tab anyone can hit. */
      className="group flex min-h-[52px] min-w-0 flex-1 select-none flex-col items-center gap-1 py-2.5"
    >
      <span className="relative flex h-8 w-8 items-center justify-center">
        {/* The filled badge travels between tabs instead of appearing and
            disappearing in place. It is the one piece of motion in the bar,
            and it is what makes a tap read as "the selection moved here"
            rather than "the screen changed". */}
        {item.active && (
          <motion.span
            layoutId={reduce ? undefined : "tab-bar-active"}
            className="absolute inset-0 rounded-xl"
            style={{ backgroundColor: "var(--brand-solid)" }}
            /* The general-purpose spring rather than the press one: the badge
               is travelling the width of a tab, not acknowledging a finger,
               and the press spring is tuned to be over before a finger lifts -
               which across 80px reads as a jump. */
            transition={spring}
          />
        )}
        <item.icon
          className={`relative h-[19px] w-[19px] transition-[color,transform] duration-200 group-active:scale-90 ${
            item.active ? "text-white" : "text-gray-400 dark:text-gray-500"
          }`}
        />
        {item.badge && (
          <span className="absolute -right-1 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-[var(--card-surface)]">
            {item.badge}
          </span>
        )}
      </span>
      <span
        className={`w-full truncate px-0.5 text-center text-[10.5px] leading-none tracking-tight transition-colors ${
          item.active
            ? "font-semibold text-gray-900 dark:text-white"
            : "font-medium text-gray-400 dark:text-gray-500"
        }`}
      >
        {item.label}
      </span>
    </button>
  );

  return (
    <div
      /* pb-safe keeps the bar above the home indicator. `hidden` while the
         software keyboard is up: a floating bar sitting on top of a keyboard
         covers the field being typed into, and nothing in it is reachable
         anyway. The class is set by useViewportInsets(). */
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-safe pb-safe hide-on-keyboard lg:hidden"
    >
      <nav
        aria-label="Primary"
        className="glass-panel pointer-events-auto mx-3 mb-2 flex items-stretch rounded-[26px] px-1.5"
      >
        {left.map(renderTab)}

        {/* Centre action. It sits in the flow so the two tab pairs stay evenly
            balanced, and lifts out of the bar with a negative margin. */}
        <div className="flex w-[74px] shrink-0 items-start justify-center">
          <motion.button
            type="button"
            onClick={center.onClick}
            aria-label={center.label}
            whileTap={reduce ? undefined : { scale: 0.9 }}
            transition={pressSpring}
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-[var(--card-surface)]"
            style={{
              // Three stops travelling from a lightened accent through the
              // accent itself into the brand green of the Nexora mark. A single
              // flat fill reads as a plain button; the sweep is what makes the
              // centre action look deliberate. Every stop is derived from
              // --accent, so it re-tints with the user's theme instead of
              // pinning a brand blue.
              backgroundImage:
                "linear-gradient(140deg, color-mix(in srgb, var(--accent) 78%, white) 0%, var(--accent) 45%, color-mix(in srgb, var(--accent) 40%, #22c55e) 100%)",
              boxShadow:
                "0 8px 20px color-mix(in srgb, var(--accent) 45%, transparent)",
            }}
          >
            <center.icon className="h-6 w-6 text-white" />
          </motion.button>
        </div>

        {right.map(renderTab)}
      </nav>
    </div>
  );
};

export default MobileTabBar;
