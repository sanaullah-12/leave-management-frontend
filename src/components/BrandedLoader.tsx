import React, { useEffect, useState } from "react";
import AppLogo from "./AppLogo";

interface BrandedLoaderProps {
  /** Fixed message (disables cycling). */
  message?: string;
  /** Rotating messages used when `message` is not provided. */
  messages?: string[];
  /** Full-viewport overlay (default) or inline block. */
  fullScreen?: boolean;
  className?: string;
}

const DEFAULT_MESSAGES = [
  "Preparing your workspace...",
  "Loading your team's data...",
  "Fetching employee information...",
  "Building your dashboard...",
  "Syncing your calendar...",
  "Almost ready...",
];

// Fixed particle layout so the field looks intentional (no per-render jitter).
const PARTICLES = [
  { left: "12%", size: 6, delay: "0s", dur: "5.5s" },
  { left: "26%", size: 4, delay: "1.4s", dur: "6.5s" },
  { left: "44%", size: 8, delay: "0.6s", dur: "5s" },
  { left: "62%", size: 5, delay: "2.1s", dur: "7s" },
  { left: "78%", size: 6, delay: "1s", dur: "6s" },
  { left: "88%", size: 4, delay: "2.6s", dur: "5.8s" },
];

const BrandedLoader: React.FC<BrandedLoaderProps> = ({
  message,
  messages = DEFAULT_MESSAGES,
  fullScreen = true,
  className = "",
}) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (message) return; // fixed message → no cycling
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % messages.length),
      2200
    );
    return () => window.clearInterval(id);
  }, [message, messages.length]);

  const current = message ?? messages[idx];

  return (
    <div
      className={`${
        fullScreen
          ? "fixed inset-0 z-[100]"
          : "relative w-full min-h-[60vh] rounded-2xl"
      } flex flex-col items-center justify-center overflow-hidden bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl ${className}`}
    >
      {/* Soft blurred brand gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px circle at 30% 30%, rgba(59,130,246,0.16), transparent 60%), radial-gradient(600px circle at 70% 70%, rgba(16,185,129,0.14), transparent 60%)",
        }}
      />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute bottom-1/3 rounded-full bg-gradient-to-br from-blue-400 to-emerald-400"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animation: `float-particle ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Logo mark */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="animate-breathe">
          <AppLogo size={80} />
        </div>

        {/* Wordmark */}
        <p className="mt-5 text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          Leave<span className="font-medium text-blue-600 dark:text-blue-400">Flow</span>
        </p>

        {/* Rotating message */}
        <p
          key={current}
          className="animate-enter mt-1.5 text-sm text-gray-500 dark:text-gray-400"
        >
          {current}
        </p>

        {/* Indeterminate progress */}
        <div className="relative mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-gray-200/80 dark:bg-gray-700/60">
          <span className="animate-indeterminate bg-gradient-to-r from-blue-500 to-emerald-500" />
        </div>
      </div>
    </div>
  );
};

export default BrandedLoader;
