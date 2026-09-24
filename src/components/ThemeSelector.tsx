import React from "react";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { useTheme } from "../context/ThemeContext";
import type { Accent, ThemeMode } from "../context/ThemeContext";

/**
 * Appearance picker: the mode, then the accent.
 *
 * The accent section used to offer ten arbitrary hues. It offers three now,
 * and all three come from the brand mark, so the app and its logo are never
 * two unrelated colours.
 */
/**
 * The three accents, in the order they are offered. The swatch is a token
 * rather than a hex: the ramps live in styles/tokens.css and a second copy
 * here would be one more thing to keep in step, which is how the previous
 * ten-colour picker ended up painting three swatches that no longer matched
 * the app.
 */
const ACCENT_OPTIONS: { key: Accent; label: string; swatch: string }[] = [
  { key: "orange", label: "Orange", swatch: "var(--swatch-orange)" },
  { key: "blue", label: "Blue", swatch: "var(--swatch-blue)" },
  { key: "green", label: "Green", swatch: "var(--swatch-green)" },
];

const MODES: {
  key: ThemeMode;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "light", name: "Light", icon: SunIcon },
  { key: "dark", name: "Dark", icon: MoonIcon },
  { key: "auto", name: "Auto", icon: ComputerDesktopIcon },
];

// A tiny window mock used inside each appearance card.
const ModePreview: React.FC<{ mode: ThemeMode }> = ({ mode }) => {
  const light = (
    <div className="flex h-full w-full gap-1 bg-[#ffffff] p-1.5">
      <div className="flex w-1/3 flex-col gap-1">
        <div className="h-2 w-2 rounded-sm bg-brand-600" />
        <div className="h-1 w-full rounded-full bg-[#e4e7ee]" />
        <div className="h-1 w-3/4 rounded-full bg-[#e4e7ee]" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="h-1.5 w-full rounded-full bg-[#e4e7ee]" />
        <div className="h-1.5 w-2/3 rounded-full bg-brand-600/60" />
        <div className="h-1.5 w-full rounded-full bg-[#f1f3f7]" />
      </div>
    </div>
  );
  const dark = (
    <div className="flex h-full w-full gap-1 bg-[#0b0b0d] p-1.5">
      <div className="flex w-1/3 flex-col gap-1">
        <div className="h-2 w-2 rounded-sm bg-brand-500" />
        <div className="h-1 w-full rounded-full bg-[#232327]" />
        <div className="h-1 w-3/4 rounded-full bg-[#232327]" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="h-1.5 w-full rounded-full bg-[#232327]" />
        <div className="h-1.5 w-2/3 rounded-full bg-brand-500/60" />
        <div className="h-1.5 w-full rounded-full bg-[#141416]" />
      </div>
    </div>
  );
  if (mode === "light") return light;
  if (mode === "dark") return dark;
  // Auto → split light | dark
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">{light}</div>
      <div
        className="absolute inset-0"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      >
        {dark}
      </div>
    </div>
  );
};

const ThemeSelector: React.FC<{ showPreview?: boolean }> = () => {
  const { themeMode, setThemeMode, accent, setAccent } = useTheme();

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Appearance
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((m) => {
            const active = themeMode === m.key;
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                onClick={() => setThemeMode(m.key)}
                className={`group rounded-xl border-2 p-2 text-left transition-all ${
                  active
                    ? "border-gray-900 dark:border-white"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <div className="aspect-[16/10] overflow-hidden rounded-lg ring-1 ring-gray-200/70 dark:ring-gray-700/60">
                  <ModePreview mode={m.key} />
                </div>
                <div className="mt-2 flex items-center gap-1.5 px-1 pb-0.5">
                  <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span
                    className={`text-sm font-semibold ${
                      active
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {m.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Accent colour
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {ACCENT_OPTIONS.map((a) => {
            const active = accent === a.key;
            return (
              <button
                key={a.key}
                onClick={() => setAccent(a.key)}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                  active
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <span
                  className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: a.swatch }}
                >
                  {active && <CheckIcon className="h-4 w-4 text-white" />}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    active
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ThemeSelector;
