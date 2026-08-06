import React from "react";

/**
 * Card accents - the app's signature card details.
 *
 * A plain bordered rectangle is forgettable, and stacking colour back into it
 * is what made the old icon plates read as noise. These give a card identity
 * using the theme accent only, at low opacity, behind the content:
 *
 *   AccentEdge  a hairline across the top edge that fades out
 *   AccentGlow  a soft radial wash in one corner
 *   AccentRail  a vertical bar down the leading edge, for list sections
 *
 * All three take the accent as a hex, because these are inline gradients that
 * cannot read the themed `blue-*` utility classes.
 */

export const AccentEdge: React.FC<{ color: string; className?: string }> = ({
  color,
  className = "",
}) => (
  <span
    aria-hidden
    className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] ${className}`}
    style={{
      background: `linear-gradient(90deg, ${color} 0%, ${color}66 35%, transparent 85%)`,
    }}
  />
);

export const AccentGlow: React.FC<{
  color: string;
  className?: string;
}> = ({ color, className = "-right-16 -top-20 h-48 w-48" }) => (
  <span
    aria-hidden
    className={`pointer-events-none absolute rounded-full blur-3xl opacity-[0.13] dark:opacity-20 ${className}`}
    style={{ background: color }}
  />
);

export const AccentRail: React.FC<{ color: string }> = ({ color }) => (
  <span
    aria-hidden
    className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
    style={{
      background: `linear-gradient(180deg, ${color} 0%, ${color}55 50%, transparent 100%)`,
    }}
  />
);
