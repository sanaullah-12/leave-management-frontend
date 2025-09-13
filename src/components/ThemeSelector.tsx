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
      borderClass: "border-blue-500",
      bgClass: "bg-blue-50 dark:bg-blue-900",
    },
    {
      id: "purple" as ColorScheme,
      name: "Purple",
      description: "Creative & Modern",
      color: "#a855f7",
      borderClass: "border-purple-500",
      bgClass: "bg-purple-50 dark:bg-purple-900",
    },
    {
      id: "green" as ColorScheme,
      name: "Green",
      description: "Natural & Fresh",
      color: "#22c55e",
      borderClass: "border-green-500",
      bgClass: "bg-green-50 dark:bg-green-900",
    },
    {
      id: "custom" as ColorScheme,
      name: "Custom",
      description: "Unique & Distinctive",
      color: "#3396D3",
      borderClass: "border-blue-400",
      bgClass: "bg-blue-50 dark:bg-blue-900",
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
          <SwatchIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Theme Mode
          </h3>
        </div>
        <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
          Choose between light and dark appearance
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themeModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = themeMode === mode.id;
            const selectedScheme = colorSchemes.find(s => s.id === colorScheme);
            return (
              <button
                key={mode.id}
                onClick={() => setThemeMode(mode.id)}
                className={`p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${
                  isSelected
                    ? `${selectedScheme?.borderClass} ${selectedScheme?.bgClass}`
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
                          ? "text-gray-600 dark:text-gray-300"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <div
                      className={`font-medium ${
                        isSelected
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {mode.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-300">
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
        <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
          Choose your preferred color scheme for the interface
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {colorSchemes.map((scheme) => {
            const isSelected = colorScheme === scheme.id;
            return (
              <button
                key={scheme.id}
                onClick={() => setColorScheme(scheme.id)}
                className={`p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${
                  isSelected
                    ? `${scheme.borderClass} ${scheme.bgClass}`
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {scheme.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">
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
          <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
            See how your selected theme looks
          </p>

          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Sample Interface
              </h4>
              <span className="px-2 py-1 text-xs font-medium rounded bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-white">
                {colorSchemes.find((s) => s.id === colorScheme)?.name} •{" "}
                {themeMode === "dark" ? "Dark" : "Light"}
              </span>
            </div>
            <p className="text-sm mb-4 text-gray-600 dark:text-gray-300">
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
                <div className="text-xs text-gray-600 dark:text-gray-300">
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
