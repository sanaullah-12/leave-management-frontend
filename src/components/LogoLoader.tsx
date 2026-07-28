import React from "react";
import { motion } from "framer-motion";
import NexoraLoaderMark from "./NexoraLoaderMark";

interface LogoLoaderProps {
  /** Mark size in px. Default 76. */
  size?: number;
  /** Caption below the mark. Pass null to hide. Default "Loading…". */
  label?: string | null;
  /** Fill the whole viewport instead of a page section. */
  fullScreen?: boolean;
  /** Min-height utility for the section variant. Default "min-h-[60vh]". */
  minHClass?: string;
  className?: string;
}

/**
 * The canonical Nexora loading state — the animated brand mark, centered, with
 * an optional caption. Used anywhere the app is fetching a page or section, so
 * every load feels unmistakably Nexora.
 */
const LogoLoader: React.FC<LogoLoaderProps> = ({
  size = 76,
  label = "Loading…",
  fullScreen = false,
  minHClass = "min-h-[60vh]",
  className = "",
}) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className={`flex w-full flex-col items-center justify-center gap-4 ${
      fullScreen ? "min-h-screen" : minHClass
    } ${className}`}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{ filter: "drop-shadow(0 10px 26px rgba(37,99,235,0.14))" }}
    >
      <NexoraLoaderMark size={size} />
    </motion.div>
    {label && (
      <p className="animate-pulse-text text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
    )}
    <span className="sr-only">Loading</span>
  </div>
);

export default LogoLoader;
