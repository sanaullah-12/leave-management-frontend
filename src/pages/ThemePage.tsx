import React from "react";
import { motion } from "framer-motion";
import ThemeSelector from "../components/ThemeSelector";
import AppLogo from "../components/AppLogo";
import { staggerContainer, staggerItem } from "../lib/motion";
import "../styles/design-system.css";

const ThemePage: React.FC = () => {
  return (
    <motion.div
      className="mx-auto max-w-2xl space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Customize
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Personalize the appearance and accent color of your workspace.
        </p>
      </motion.div>

      {/* Settings card */}
      <motion.div
        variants={staggerItem}
        className="surface-card p-6 sm:p-8"
      >
        <ThemeSelector />
      </motion.div>

      {/* Live preview */}
      <motion.div
        variants={staggerItem}
        className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <AppLogo size={44} />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Live preview
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your logo and accents update instantly.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-primary">Accent</span>
          <button className="btn-primary">Primary button</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ThemePage;
