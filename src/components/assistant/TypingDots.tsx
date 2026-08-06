/**
 * Nexora Assistant - typing indicator.
 *
 * Three dots on a staggered loop. Announced politely to screen readers so the
 * pause is legible without sight, and it collapses to a static label under
 * `prefers-reduced-motion` (honoured app-wide via <MotionConfig>).
 */
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { STRINGS } from "./config";

const TypingDots: React.FC = () => {
  const reduce = useReducedMotion();

  return (
    <div
      className="flex justify-start"
      role="status"
      aria-live="polite"
      aria-label={STRINGS.thinking}
    >
      <div className="flex items-center gap-1.5 rounded-2xl rounded-es-md border border-gray-200/80 bg-white px-3.5 py-3 shadow-sm dark:border-white/10 dark:bg-gray-800/80">
        {reduce ? (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {STRINGS.thinking}...
          </span>
        ) : (
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.16,
                ease: "easeInOut",
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TypingDots;
