import React from "react";
import Modal from "./ui/Modal";
import { useTheme } from "../context/ThemeContext";
import type { Accent, ThemeMode } from "../context/ThemeContext";
import {
  SwatchIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

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

const MODES: { key: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "light", label: "Light", icon: SunIcon },
  { key: "dark", label: "Dark", icon: MoonIcon },
  { key: "auto", label: "System", icon: ComputerDesktopIcon },
];

interface ThemeModalProps {
  open: boolean;
  onClose: () => void;
}

const ThemeModal: React.FC<ThemeModalProps> = ({ open, onClose }) => {
  const { themeMode, setThemeMode, accent, setAccent } = useTheme();

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Appearance"
      description="Personalize how the app looks."
      icon={<SwatchIcon className="h-5 w-5" />}
    >
      <div className="space-y-7 pb-2">
        <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Appearance mode
        </p>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((m) => {
            const sel = themeMode === m.key;
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setThemeMode(m.key)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                  sel
                    ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/30 dark:bg-blue-500/10"
                    : "border-gray-200 hover:-translate-y-0.5 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    sel
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                />
                <span
                  className={`text-xs font-semibold ${
                    sel
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Accent colour
          </p>
          <div className="grid grid-cols-3 gap-3">
            {ACCENT_OPTIONS.map((a) => {
              const sel = accent === a.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAccent(a.key)}
                  className={`flex items-center gap-2.5 rounded-2xl border p-3 transition-all ${
                    sel
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-gray-200 hover:-translate-y-0.5 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20"
                  }`}
                >
                  <span
                    className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: a.swatch }}
                  >
                    {sel && <CheckIcon className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      sel
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
        </div>
      </div>
    </Modal>
  );
};

export default ThemeModal;
