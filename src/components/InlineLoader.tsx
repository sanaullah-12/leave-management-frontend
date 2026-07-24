import React from "react";

interface InlineLoaderProps {
  /** Optional text shown after the dots (e.g. "Approving Leave..."). */
  label?: string;
  className?: string;
}

/**
 * Three bouncing dots in the current text color — for inside buttons, chips,
 * and inline "…in progress" states. No blocking, no browser spinner.
 */
const InlineLoader: React.FC<InlineLoaderProps> = ({ label, className = "" }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current"
          style={{ animation: `dot-bounce 1s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </span>
    {label && <span>{label}</span>}
  </span>
);

export default InlineLoader;
