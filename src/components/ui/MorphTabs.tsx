import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { morphSpring } from "../../lib/motion";

/**
 * Tabs that move on the same spring as the card morph.
 *
 * The product already had three different tab strips, each animating its own
 * way or not at all, which is why switching a tab felt unrelated to opening a
 * card even though both are the same gesture: you picked a thing, and the
 * screen became it. One curve across both is what makes an app feel built
 * rather than assembled.
 *
 * Two things move. The selected pill is a single element that travels between
 * tabs via `layoutId` rather than a background that fades on one button and off
 * another - so the eye follows the selection instead of re-finding it. The
 * panel then slides in from the side the new tab sits on, which keeps the tab
 * strip readable as a horizontal axis rather than a row of unrelated buttons.
 *
 *   const [tab, setTab] = useState("overview");
 *
 *   <MorphTabs value={tab} onChange={setTab} ariaLabel="Dashboard screens"
 *     options={[
 *       { value: "overview", label: "Overview" },
 *       { value: "charts", label: "Charts" },
 *     ]} />
 *   <MorphTabPanels value={tab} order={["overview", "charts"]}>
 *     {tab === "overview" ? <Overview /> : <Charts />}
 *   </MorphTabPanels>
 */

export interface MorphTabOption<T extends string> {
  value: T;
  label: string;
  /** Optional leading glyph. Sized by the caller. */
  icon?: React.ReactNode;
}

export interface MorphTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<MorphTabOption<T>>;
  ariaLabel: string;
  /**
   * `well` is the full-width strip the mobile dashboard uses; `inline` is the
   * compact control that sits beside a chart heading.
   */
  variant?: "well" | "inline";
  className?: string;
}

export function MorphTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  variant = "well",
  className = "",
}: MorphTabsProps<T>) {
  // Scoped so two tab strips on one page do not hand the pill to each other.
  const group = React.useId();
  const well = variant === "well";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex ${
        well
          ? // Raised off the page, not sunk into it: the strip is what the
            // screen below answers to, so it reads as a card of its own.
            "gap-1 rounded-[14px] border border-[var(--border-default)] bg-[var(--surface-raised)] p-1 shadow-[var(--shadow-md)]"
          : "inline-flex gap-0.5 rounded-lg bg-[var(--surface-sunken)] p-0.5"
      } ${className}`}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(option.value)}
            className={`relative ${
              well
                ? "min-h-[34px] flex-1 rounded-[11px] px-1 text-[12px]"
                : "rounded-full px-2.5 py-1 text-xs"
            } font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              on
                ? well
                  ? "text-white"
                  : "text-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {on && (
              <motion.span
                layoutId={`morph-tab-pill-${group}`}
                transition={morphSpring}
                aria-hidden="true"
                className={`absolute inset-0 ${
                  well ? "rounded-[11px]" : "rounded-full"
                } ${
                  well
                    ? ""
                    : "bg-[var(--surface-raised)] shadow-sm"
                }`}
                style={
                  well
                    ? {
                        backgroundImage:
                          "linear-gradient(135deg, color-mix(in srgb, var(--accent) 78%, white), var(--accent))",
                        // Tinted with the accent so the selected tab stands off
                        // the strip rather than sitting flush in it.
                        boxShadow:
                          "0 4px 12px -2px color-mix(in srgb, var(--accent) 45%, transparent)",
                      }
                    : undefined
                }
              />
            )}
            {/* Above the pill, which is painted behind it. */}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The panel under a {@link MorphTabs} strip.
 *
 * `order` is what lets the panel know which way to travel; without it every
 * switch would slide the same direction and the strip would stop reading as an
 * axis. `mode="wait"` keeps the two panels from overlapping mid-switch, which
 * on a tall dashboard means the page height never jumps.
 */
export function MorphTabPanels<T extends string>({
  value,
  order,
  children,
  className = "",
}: {
  value: T;
  order: ReadonlyArray<T>;
  children: React.ReactNode;
  className?: string;
}) {
  const index = Math.max(0, order.indexOf(value));
  const previous = React.useRef(index);
  const forward = index >= previous.current;
  React.useEffect(() => {
    previous.current = index;
  }, [index]);

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={value}
          initial={{ opacity: 0, x: forward ? 18 : -18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: forward ? -12 : 12 }}
          transition={morphSpring}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default MorphTabs;
