import React from "react";
import AppLogo from "./AppLogo";

const PX: Record<"md" | "lg", number> = { md: 48, lg: 76 };

/**
 * Loading indicator.
 * - `sm` → compact ring (used inside buttons where a logo won't fit).
 * - `md` / `lg` → the Nexora brand mark, used for section- and page-level
 *   loading states across the app.
 */
const LoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "md",
}) => {
  if (size === "sm") {
    return (
      <span
        className="inline-flex items-center justify-center"
        role="status"
        aria-label="Loading"
      >
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400" />
      </span>
    );
  }

  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <AppLogo size={PX[size]} />
    </div>
  );
};

export default LoadingSpinner;
