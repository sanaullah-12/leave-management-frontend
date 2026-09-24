import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Two axes: light/dark, and a three-value accent.
 *
 * This context used to carry ten selectable accents (blue, purple, pink,
 * violet, indigo, orange, teal, bronze, mint, black). Ten is a palette someone
 * has to maintain; three is part of the identity. Orange is the default, and
 * the other two are the brand mark's own gradient stops (see
 * NexoraLoaderMark), so the accent and the logo are never two unrelated
 * colours. Each is an `accent-<name>` class on <html> that swaps the brand ramp
 * in styles/tokens.css - nothing else in the app knows which one is active.
 *
 * The old `theme-<name>` classes are stripped from <html> on load and the old
 * `colorScheme` key deleted, so a browser that last ran the previous build does
 * not keep painting a stale ramp from a class nothing removes any more.
 */
export const ACCENTS = ["orange", "blue", "green"] as const;

type Accent = (typeof ACCENTS)[number];
type ThemeMode = "light" | "dark" | "auto";

export type { Accent, ThemeMode };

/**
 * Every class the previous theme system could have left on <html>, plus the
 * two schemes (`theme-green`, `theme-custom`) that were themselves already
 * legacy before the rest were retired.
 */
const LEGACY_THEME_CLASSES = [
  "theme-black",
  "theme-purple",
  "theme-blue",
  "theme-pink",
  "theme-violet",
  "theme-indigo",
  "theme-orange",
  "theme-teal",
  "theme-bronze",
  "theme-mint",
  "theme-green",
  "theme-custom",
];

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("themeMode");
      if (saved === "light" || saved === "dark" || saved === "auto") {
        return saved;
      }
    }
    return "auto";
  });

  const [accent, setAccentState] = useState<Accent>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("accent");
      if (saved && (ACCENTS as readonly string[]).includes(saved)) {
        return saved as Accent;
      }
    }
    return "orange";
  });

  const [systemDark, setSystemDark] = useState<boolean>(prefersDark);

  // Track the OS preference so "auto" stays live.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // One-time cleanup of what the previous theme system left behind. Runs
  // before the effect below so a stale ramp is never painted.
  useEffect(() => {
    window.document.documentElement.classList.remove(...LEGACY_THEME_CLASSES);
    localStorage.removeItem("colorScheme");
  }, []);

  const isDark = themeMode === "dark" || (themeMode === "auto" && systemDark);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.toggle("dark", isDark);
    ACCENTS.forEach((a) => root.classList.remove(`accent-${a}`));
    root.classList.add(`accent-${accent}`);

    localStorage.setItem("themeMode", themeMode);
    localStorage.setItem("accent", accent);
  }, [isDark, themeMode, accent]);

  const toggleTheme = () =>
    setThemeModeState((prev) => (prev === "dark" ? "light" : "dark"));

  const setThemeMode = (mode: ThemeMode) => setThemeModeState(mode);
  const setAccent = (next: Accent) => setAccentState(next);

  return (
    <ThemeContext.Provider
      value={{ isDark, toggleTheme, themeMode, setThemeMode, accent, setAccent }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
