import React from "react";
import { useTheme } from "../context/ThemeContext";

const ThemeTest: React.FC = () => {
  const { colorScheme, themeMode } = useTheme();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">
        Theme Test - Current: {colorScheme} ({themeMode})
      </h2>

      {/* Test Primary Colors in Settings Style */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-3">
          Time Settings Panel Test
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              className="text-primary-600 focus:ring-primary-500"
              defaultChecked
            />
            <label className="text-sm text-primary-800 dark:text-primary-200">
              Default option test
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              className="text-primary-600 focus:ring-primary-500"
            />
            <label className="text-sm text-primary-800 dark:text-primary-200">
              Custom option test
            </label>
            <input
              type="time"
              className="px-2 py-1 text-xs border border-primary-300 dark:border-primary-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              defaultValue="09:00"
            />
          </div>
        </div>
      </div>

      {/* Test Form Controls */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          IP Address Input Test
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100">
          <option>192.168.1.201 (Default Machine)</option>
          <option>192.168.1.202</option>
          <option>Custom IP Address</option>
        </select>

        <input
          type="text"
          placeholder="Custom IP"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Color Swatches */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 bg-primary-50 border border-primary-200 rounded text-xs text-center">
          primary-50
        </div>
        <div className="p-2 bg-primary-200 border border-primary-300 rounded text-xs text-center">
          primary-200
        </div>
        <div className="p-2 bg-primary-600 text-white rounded text-xs text-center">
          primary-600
        </div>
        <div className="p-2 bg-primary-900 text-white rounded text-xs text-center">
          primary-900
        </div>
      </div>
    </div>
  );
};

export default ThemeTest;
