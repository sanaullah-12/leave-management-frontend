import React from "react";
import { motion } from "framer-motion";
import { PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { DUR, EASE } from "../../lib/motion";

interface Props {
  onCreate: () => void;
  headline?: string;
  sub?: string;
  ctaLabel?: string;
}

/**
 * Premium empty state - a bespoke floating-document illustration (theme-tinted
 * via --accent) so the Studio never shows a bare page.
 */
const StudioEmptyState: React.FC<Props> = ({
  onCreate,
  headline = "Create your first HR document",
  sub = "Design offer letters, certificates and more - beautifully, without ever leaving Nexora.",
  ctaLabel = "Create Template",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, ease: EASE.out }}
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="relative mb-8 h-44 w-44">
        {/* Soft accent halo */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: "var(--accent-soft)" }}
        />
        {/* Floating back document */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-6, -4, -6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="glass-card absolute left-4 top-6 h-32 w-24 rounded-xl"
        />
        {/* Floating front document */}
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [6, 4, 6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="glass-card absolute right-3 top-8 flex h-36 w-28 flex-col gap-2 rounded-xl p-3"
        >
          <div
            className="h-2 w-10 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600" />
          <div className="h-1.5 w-5/6 rounded-full bg-gray-200 dark:bg-gray-600" />
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-600" />
          <div className="h-1.5 w-2/3 rounded-full bg-gray-200 dark:bg-gray-600" />
          <div className="mt-auto h-1.5 w-1/2 rounded-full bg-gray-200 dark:bg-gray-600" />
        </motion.div>
        {/* Sparkle badge */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-1 top-2 grid h-9 w-9 place-items-center rounded-full text-white shadow-lg"
          style={{ background: "var(--accent)" }}
        >
          <SparklesIcon className="h-5 w-5" />
        </motion.div>
      </div>

      <h3 className="text-section-heading text-gray-900 dark:text-white">
        {headline}
      </h3>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {sub}
      </p>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onCreate}
        className="btn-primary mt-6 inline-flex items-center gap-2"
      >
        <PlusIcon className="h-5 w-5" />
        {ctaLabel}
      </motion.button>
    </motion.div>
  );
};

export default StudioEmptyState;
