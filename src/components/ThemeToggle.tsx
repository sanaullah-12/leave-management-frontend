/**
 * Light/dark toggle for the app header.
 *
 * It flips what is on screen rather than stepping through the stored mode:
 * from "auto" resolving to dark, one press means light, not another press of
 * "dark" that changes nothing. That costs the auto setting, which is the
 * trade a one-press control makes - the full three-way picker (light, dark,
 * auto) still lives in the theme modal and on the theme page.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../context/ThemeContext";

interface Props {
  className?: string;
  /** Larger hit area for the mobile app bar, where 44px is the floor. */
  size?: "sm" | "md";
}

const ThemeToggle: React.FC<Props> = ({ className = "", size = "sm" }) => {
  const { t } = useTranslation("nav");
  const { isDark, setThemeMode } = useTheme();
  const Icon = isDark ? SunIcon : MoonIcon;
  const label = t(isDark ? "actions.switchToLight" : "actions.switchToDark");

  // The two sizes are also two idioms: the desktop utilities hover, the
  // mobile app bar has no pointer to hover with and presses instead.
  const shell =
    size === "md"
      ? "h-11 w-11 rounded-full text-gray-600 active:bg-black/5 dark:text-gray-300 dark:active:bg-white/10"
      : "h-9 w-9 rounded-xl border border-transparent text-gray-600 hover:border-gray-200/80 hover:bg-white/60 hover:text-gray-900 dark:text-gray-300 dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-white";
  const glyph = size === "md" ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]";

  return (
    <button
      type="button"
      onClick={() => setThemeMode(isDark ? "light" : "dark")}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className={`inline-flex items-center justify-center transition-colors ${shell} ${className}`}
    >
      {/* Keyed so each state mounts its own icon and the swap animates. */}
      <motion.span
        key={isDark ? "dark" : "light"}
        initial={{ opacity: 0, rotate: -35, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="flex items-center justify-center"
      >
        <Icon className={glyph} />
      </motion.span>
    </button>
  );
};

export default React.memo(ThemeToggle);
