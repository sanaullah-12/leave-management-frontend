import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const DarkModeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
    >
      <span className="sr-only">Enable dark mode</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-300 transition-transform ${
          isDark ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      <div className="absolute inset-0 flex items-center justify-between px-1">
        <SunIcon 
          className={`h-3 w-3 transition-opacity ${
            isDark ? 'opacity-40 text-gray-400' : 'opacity-100 text-yellow-500'
          }`} 
        />
        <MoonIcon 
          className={`h-3 w-3 transition-opacity ${
            isDark ? 'opacity-100 text-blue-400' : 'opacity-40 text-gray-400'
          }`} 
        />
      </div>
    </button>
  );
};

export default DarkModeToggle;