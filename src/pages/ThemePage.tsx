import React from "react";
import SectionHeader from "../components/ui/SectionHeader";
import { sectionIllustration } from "../components/ui/illustrations";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LanguageIcon } from "@heroicons/react/24/outline";
import ThemeSelector from "../components/ThemeSelector";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AppLogo from "../components/AppLogo";
import { useLocale } from "../i18n/LocaleProvider";
import { staggerContainer, staggerItem } from "../lib/motion";
import "../styles/design-system.css";

import Button from "../components/ui/Button";
const ThemePage: React.FC = () => {
  // "settings" is lazily fetched the first time this page renders.
  const { t: tSettings } = useTranslation("settings");
  const { isRTL } = useLocale();

  return (
    <motion.div
      className="mx-auto max-w-2xl space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header. Its own banner is the live preview of what the controls
          below do: the gradient and the animation both repaint the moment an
          accent is picked. */}
      <motion.div variants={staggerItem}>
        <SectionHeader
          variant="settings"
          eyebrow="Preferences"
          title="Customize"
          description="Personalize the appearance and accent color of your workspace."
          illustration={sectionIllustration("settings")}
        />
      </motion.div>

      {/* Settings card */}
      <motion.div
        variants={staggerItem}
        className="surface-card p-6 sm:p-8"
      >
        <ThemeSelector />
      </motion.div>

      {/* Language - sits alongside theme because both are per-device
          presentation preferences persisted to localStorage. */}
      <motion.div variants={staggerItem} className="surface-card p-6 sm:p-8">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl text-[var(--accent)]">
            <LanguageIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-card-title text-gray-900 dark:text-white">
              {tSettings("language.title")}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {tSettings("language.description")}
            </p>
          </div>
        </div>

        <LanguageSwitcher variant="cards" />

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          {isRTL
            ? tSettings("language.rtlNote")
            : tSettings("language.appliesImmediately")}
        </p>
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
          <Button variant="primary">Primary button</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ThemePage;
