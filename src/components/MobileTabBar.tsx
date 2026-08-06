import React from "react";

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

  const renderTab = (item: MobileTabItem) => (
    <button
      key={item.key}
      type="button"
      onClick={item.onClick}
      aria-current={item.active ? "page" : undefined}
      className="group flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 select-none"
    >
      <span
        className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-[background-color,transform] duration-200 group-active:scale-90 ${
          item.active ? "" : "bg-transparent"
        }`}
        style={item.active ? { backgroundColor: "var(--accent)" } : undefined}
      >
        <item.icon
          className={`h-[19px] w-[19px] transition-colors ${
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto mx-3 mb-2 flex items-stretch rounded-[26px] border border-black/5 bg-[var(--card-surface)] px-1.5 shadow-[0_8px_28px_rgba(15,20,32,0.16),0_2px_8px_rgba(15,20,32,0.08)] backdrop-blur-xl dark:border-white/10 dark:shadow-[0_8px_28px_rgba(0,0,0,0.55)]"
      >
        {left.map(renderTab)}

        {/* Centre action. It sits in the flow so the two tab pairs stay evenly
            balanced, and lifts out of the bar with a negative margin. */}
        <div className="flex w-[74px] shrink-0 items-start justify-center">
          <button
            type="button"
            onClick={center.onClick}
            aria-label={center.label}
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full ring-4 ring-[var(--card-surface)] transition-transform duration-200 active:scale-90"
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
          </button>
        </div>

        {right.map(renderTab)}
      </nav>
    </div>
  );
};

export default MobileTabBar;
