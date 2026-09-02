import { useEffect, useState } from "react";

/**
 * The active theme's accent, resolved to a hex string.
 *
 * The app repaints its accent by swapping `--blue-*` on <html>, so components
 * can normally just use the themed `blue-*` utilities. This hook exists for the
 * places that cannot: helpers such as AccentEdge build gradient stops by
 * concatenating an alpha suffix onto the colour (`${color}66`), which produces
 * invalid CSS if the colour is `rgb(var(--blue-600))` rather than a hex - the
 * gradient silently fails and the accent disappears.
 *
 * Re-reads whenever the theme class on <html> changes, so switching themes
 * updates the value without a reload.
 *
 * @param step Which rung of the accent scale, e.g. 600.
 */
export function useThemeAccent(step: number = 600, fallback = "#2563eb") {
  const [hex, setHex] = useState(fallback);

  useEffect(() => {
    const read = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(`--blue-${step}`)
        .trim();

      // The variables hold space-separated RGB channels ("37 99 235") so they
      // can be used with Tailwind's <alpha-value> syntax.
      const parts = raw.split(/[\s,]+/).map(Number);
      if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return;

      setHex(
        "#" +
          parts
            .slice(0, 3)
            .map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0"))
            .join("")
      );
    };

    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => observer.disconnect();
  }, [step]);

  return hex;
}
