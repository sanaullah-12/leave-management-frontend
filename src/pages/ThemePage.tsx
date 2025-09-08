import React from "react";
import ThemeSelector from "../components/ThemeSelector";
import ThemeDemo from "../components/ThemeDemo";
import { SwatchIcon } from "@heroicons/react/24/outline";

const ThemePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 -mx-4 lg:-mx-8 px-4 lg:px-8 py-6 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900">
            <SwatchIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="page-title text-2xl font-bold text-gray-900 dark:text-gray-100">
              Theme Settings
            </h1>
            <p className="page-subtitle text-sm mt-1 text-gray-600 dark:text-gray-400">
              Customize the appearance and color scheme of your application
            </p>
          </div>
        </div>
      </div>

      {/* Theme Settings Content */}
      <div className="max-w-4xl">
        <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md">
          <div className="card-body p-8">
            <ThemeSelector showPreview={true} />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="max-w-4xl">
        <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Theme Information
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full mt-2 bg-primary-500"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Theme Persistence
                  </p>
                  <p>
                    Your theme preferences are automatically saved and will be
                    restored when you return to the application.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full mt-2 bg-primary-500"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Dark Mode
                  </p>
                  <p>
                    Each color scheme supports both light and dark modes for
                    comfortable viewing in any lighting condition.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full mt-2 bg-primary-500"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    System-wide Application
                  </p>
                  <p>
                    Theme changes apply to all parts of the application
                    including buttons, navigation, forms, and notifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Demo Section */}
      <div className="max-w-4xl">
        <ThemeDemo />
      </div>
    </div>
  );
};

export default ThemePage;
