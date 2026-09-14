import { useCallback, useEffect, useState } from "react";

/**
 * Reading the app's accent at runtime.
 *
 * The app repaints its accent by swapping `--blue-*` on <html>, so components
 * can normally just use the themed `blue-*` utilities. These hooks exist for
 * the places that cannot:
 *
 *   - helpers such as AccentEdge build gradient stops by concatenating an
 *     alpha suffix onto the colour (`${color}66`), which produces invalid CSS
 *     if the colour is `rgb(var(--blue-600))` rather than a hex - the gradient
 *     silently fails and the accent disappears;
 *   - `recolorLottie` needs real channel values to rotate an animation's
 *     palette onto the accent hue.
 *
 * Both read through a MutationObserver rather than off a React value.
 * ThemeContext applies the theme class in an effect, and a parent's effect
 * runs *after* its children's, so anything that reads the variable during
 * render - or even in a child effect - sees the previous theme's accent and
 * stays one switch behind. Watching the attribute is what makes the value
 * correct no matter when it changes.
 */

/** The accent scale is stored as space-separated channels for Tailwind's `<alpha-value>` syntax. */
function readAccentChannels(step: number): [number, number, number] | null {
  if (typeof window === "undefined") return null;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--blue-${step}`)
    .trim();
  const parts = raw.split(/[\s,]+/).map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some((n) => Number.isNaN(n))) {
    return null;
  }
  return [parts[0], parts[1], parts[2]];
}

/** Run `read` now and again on every theme change, until unmounted. */
function useAccentSubscription(read: () => void) {
  useEffect(() => {
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read]);
}

/**
 * The active theme's accent, resolved to a hex string.
 *
 * @param step Which rung of the accent scale, e.g. 600.
 */
export function useThemeAccent(step: number = 600, fallback = "#2563eb") {
  const [hex, setHex] = useState(fallback);

  useAccentSubscription(
    useCallback(() => {
      const channels = readAccentChannels(step);
      if (!channels) return;
      setHex(
        "#" +
          channels
            .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
            .join("")
      );
    }, [step])
  );

  return hex;
}

/**
 * The active theme's accent as 0..1 RGB, the form `recolorLottie` takes.
 *
 * The identity of the returned tuple only changes when the colour does, so it
 * is safe as a dependency of the memo that recolours an animation - a
 * re-render on an unrelated state change will not walk a 500kB JSON again.
 */
export function useThemeAccentRgb(
  step: number = 600,
  fallback: [number, number, number] = [37 / 255, 99 / 255, 235 / 255]
): [number, number, number] {
  const [rgb, setRgb] = useState<[number, number, number]>(fallback);

  useAccentSubscription(
    useCallback(() => {
      const channels = readAccentChannels(step);
      if (!channels) return;
      const next: [number, number, number] = [
        channels[0] / 255,
        channels[1] / 255,
        channels[2] / 255,
      ];
      setRgb((prev) =>
        prev[0] === next[0] && prev[1] === next[1] && prev[2] === next[2]
          ? prev
          : next
      );
    }, [step])
  );

  return rgb;
}
