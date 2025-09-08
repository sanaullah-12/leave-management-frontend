import React from "react";
import { useTheme } from "../context/ThemeContext";
import { SunIcon, MoonIcon, SwatchIcon } from "@heroicons/react/24/outline";

type ColorScheme = "blue" | "purple" | "green" | "custom";
type ThemeMode = "light" | "dark";

interface ThemeSelectorProps {
  showPreview?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  showPreview = true,
}) => {
  const { colorScheme, setColorScheme, themeMode, setThemeMode } = useTheme();

  const colorSchemes = [
    {
      id: "blue" as ColorScheme,
      name: "Blue",
      description: "Classic & Professional",
      color: "#3b82f6",
    },
    {
      id: "purple" as ColorScheme,
      name: "Purple",
      description: "Creative & Modern",
      color: "#a855f7",
    },
    {
      id: "green" as ColorScheme,
      name: "Green",
      description: "Natural & Fresh",
      color: "#22c55e",
    },
    {
      id: "custom" as ColorScheme,
      name: "Custom",
      description: "Unique & Distinctive",
      color: "#3396D3",
    },
  ];

  const themeModes = [
    {
      id: "light" as ThemeMode,
      name: "Light",
      description: "Bright and clean interface",
      icon: SunIcon,
    },
    {
      id: "dark" as ThemeMode,
      name: "Dark",
      description: "Easy on the eyes in low light",
      icon: MoonIcon,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Theme Mode */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <SwatchIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Theme Mode
          </h3>
        </div>
        <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
          Choose between light and dark appearance
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themeModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = themeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setThemeMode(mode.id)}
                className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900"
                    : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? "bg-primary-100 dark:bg-primary-800"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isSelected
                          ? "text-primary-600 dark:text-primary-300"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <div
                      className={`font-medium ${
                        isSelected
                          ? "text-primary-900 dark:text-primary-200"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {mode.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {mode.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Scheme */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
          Color Scheme
        </h3>
        <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
          Choose your preferred color scheme for the interface
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {colorSchemes.map((scheme) => {
            const isSelected = colorScheme === scheme.id;
            return (
              <button
                key={scheme.id}
                onClick={() => setColorScheme(scheme.id)}
                className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900"
                    : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600"
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: scheme.color }}
                  >
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`font-medium text-sm ${
                        isSelected
                          ? "text-primary-700 dark:text-primary-300"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {scheme.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {scheme.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
            Theme Preview
          </h3>
          <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
            See how your selected theme looks
          </p>

          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Sample Interface
              </h4>
              <span className="px-2 py-1 text-xs font-medium rounded bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {colorSchemes.find((s) => s.id === colorScheme)?.name} •{" "}
                {themeMode === "dark" ? "Dark" : "Light"}
              </span>
            </div>
            <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
              This is how your interface will look with the selected theme and
              mode.
            </p>
            <div className="flex space-x-3 mb-4">
              <button className="btn-primary px-4 py-2 text-sm">
                Primary Button
              </button>
              <button className="btn-secondary px-4 py-2 text-sm">
                Secondary Button
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">AB</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Sample User
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  This shows how profile elements look
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
