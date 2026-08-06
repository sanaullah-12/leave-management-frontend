import React, { createContext, useContext, useEffect, useState } from "react";

export const COLOR_SCHEMES = [
  "black",
  "purple",
  "blue",
  "pink",
  "violet",
  "indigo",
  "orange",
  "teal",
  "bronze",
  "mint",
] as const;

type ColorScheme = (typeof COLOR_SCHEMES)[number];
type ThemeMode = "light" | "dark" | "auto";

export type { ColorScheme, ThemeMode };

// Legacy schemes that may still be in localStorage - cleaned up on load.
const LEGACY_CLASSES = ["theme-green", "theme-custom"];

interface ThemeContextType {
  isDark: boolean;
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
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

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("colorScheme");
      if (saved && (COLOR_SCHEMES as readonly string[]).includes(saved)) {
        return saved as ColorScheme;
      }
    }
    return "blue";
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

  const isDark = themeMode === "dark" || (themeMode === "auto" && systemDark);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.toggle("dark", isDark);

    // Reset every possible color-scheme class, then apply the active one.
    COLOR_SCHEMES.forEach((s) => root.classList.remove(`theme-${s}`));
    LEGACY_CLASSES.forEach((c) => root.classList.remove(c));
    root.classList.add(`theme-${colorScheme}`);

    localStorage.setItem("themeMode", themeMode);
    localStorage.setItem("colorScheme", colorScheme);
  }, [isDark, colorScheme, themeMode]);

  const toggleTheme = () =>
    setThemeModeState((prev) => (prev === "dark" ? "light" : "dark"));

  const setThemeMode = (mode: ThemeMode) => setThemeModeState(mode);
  const setColorScheme = (scheme: ColorScheme) => setColorSchemeState(scheme);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colorScheme,
        toggleTheme,
        setColorScheme,
        themeMode,
        setThemeMode,
      }}
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
