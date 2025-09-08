import React, { createContext, useContext, useEffect, useState } from 'react';

type ColorScheme = 'blue' | 'purple' | 'green' | 'custom';
type ThemeMode = 'light' | 'dark';

export type { ColorScheme, ThemeMode };

interface ThemeContextType {
  isDark: boolean;
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('themeMode');
      if (saved && (saved === 'light' || saved === 'dark')) return saved as ThemeMode;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('colorScheme');
      if (saved && ['blue', 'purple', 'green', 'custom'].includes(saved)) {
        return saved as ColorScheme;
      }
    }
    return 'blue';
  });

  const isDark = themeMode === 'dark';

  useEffect(() => {
    const root = window.document.documentElement;
    
    console.log('ThemeContext: Applying theme changes', { themeMode, colorScheme, isDark });
    
    // Apply dark/light mode
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply color scheme classes
    root.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-custom');
    root.classList.add(`theme-${colorScheme}`);
    
    console.log('ThemeContext: Applied classes', {
      classes: root.className,
      isDark,
      colorScheme,
      themeMode
    });
    
    // Store in localStorage
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('colorScheme', colorScheme);
  }, [isDark, themeMode, colorScheme]);

  const toggleTheme = () => {
    setThemeModeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      colorScheme, 
      toggleTheme, 
      setColorScheme, 
      themeMode, 
      setThemeMode 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};