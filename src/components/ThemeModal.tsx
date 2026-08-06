import React from "react";
import Modal from "./ui/Modal";
import { useTheme, COLOR_SCHEMES } from "../context/ThemeContext";
import type { ThemeMode } from "../context/ThemeContext";
// Accent hex per scheme - single source in lib/themeTokens.
import { ACCENT_HEX as ACCENT } from "../lib/themeTokens";
import {
  SwatchIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

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
  const { colorScheme, setColorScheme, themeMode, setThemeMode } = useTheme();

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
        {/* Mode */}
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
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
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

        {/* Accent color */}
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Accent color
          </p>
          <div className="grid grid-cols-5 gap-x-3 gap-y-4">
            {COLOR_SCHEMES.map((s) => {
              const sel = colorScheme === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setColorScheme(s)}
                  title={s}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className="relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: ACCENT[s],
                      boxShadow: sel
                        ? `0 0 0 2px var(--card-surface), 0 0 0 4px ${ACCENT[s]}`
                        : undefined,
                    }}
                  >
                    {sel && (
                      <CheckIcon className="h-4 w-4 text-white" strokeWidth={3} />
                    )}
                  </span>
                  <span className="text-[10px] font-medium capitalize text-gray-500 dark:text-gray-400">
                    {s}
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
