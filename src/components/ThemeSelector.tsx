import React from "react";
import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/solid";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { useTheme, COLOR_SCHEMES } from "../context/ThemeContext";
import type { ColorScheme, ThemeMode } from "../context/ThemeContext";
import { ACCENT_HEX, SCHEME_LABEL } from "../lib/themeTokens";

interface ColorOption {
  key: ColorScheme;
  name: string;
  color: string;
}

// Derived from the single scheme vocabulary + palette, so a new colour scheme
// appears here automatically instead of needing a second hand-kept list.
const COLORS: ColorOption[] = COLOR_SCHEMES.map((key) => ({
  key,
  name: SCHEME_LABEL[key],
  color: ACCENT_HEX[key],
}));

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
    <div className="flex h-full w-full gap-1 bg-white p-1.5">
      <div className="flex w-1/3 flex-col gap-1">
        <div className="h-2 w-2 rounded-sm bg-amber-700/50" />
        <div className="h-1 w-full rounded-full bg-gray-200" />
        <div className="h-1 w-3/4 rounded-full bg-gray-200" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="h-1.5 w-full rounded-full bg-gray-200" />
        <div className="h-1.5 w-2/3 rounded-full bg-amber-700/40" />
        <div className="h-1.5 w-full rounded-full bg-gray-100" />
      </div>
    </div>
  );
  const dark = (
    <div className="flex h-full w-full gap-1 bg-gray-900 p-1.5">
      <div className="flex w-1/3 flex-col gap-1">
        <div className="h-2 w-2 rounded-sm bg-amber-600/70" />
        <div className="h-1 w-full rounded-full bg-gray-700" />
        <div className="h-1 w-3/4 rounded-full bg-gray-700" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="h-1.5 w-full rounded-full bg-gray-700" />
        <div className="h-1.5 w-2/3 rounded-full bg-amber-600/60" />
        <div className="h-1.5 w-full rounded-full bg-gray-800" />
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
  const { colorScheme, setColorScheme, themeMode, setThemeMode } = useTheme();

  return (
    <div className="space-y-8">
      {/* Appearance */}
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
                className={`group rounded-2xl border-2 p-2 text-left transition-all ${
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

      {/* Color theme */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Theme color
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COLORS.map((c) => {
            const active = colorScheme === c.key;
            return (
              <motion.button
                key={c.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => setColorScheme(c.key)}
                className="relative flex items-center gap-3 rounded-xl border p-3 text-left transition-colors"
                style={{
                  borderColor: active ? c.color : undefined,
                  backgroundColor: active ? `${c.color}14` : undefined,
                }}
              >
                {!active && (
                  <span className="pointer-events-none absolute inset-0 rounded-xl border border-gray-200 dark:border-gray-700" />
                )}
                <span
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${c.color}1f` }}
                >
                  <span
                    className="h-4 w-4 rounded-md"
                    style={{ backgroundColor: c.color }}
                  />
                </span>
                <span
                  className={`text-sm font-medium ${
                    active
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {c.name}
                </span>
                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: c.color }}
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ThemeSelector;
