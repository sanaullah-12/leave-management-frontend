import { useEffect } from "react";

/**
 * Publishes the device's real viewport insets as custom properties:
 * `--safe-top` / `--safe-bottom` / `--safe-left` / `--safe-right` for the
 * hardware safe areas, and `--keyboard-inset` for the software keyboard.
 *
 * ## Why the safe areas are measured rather than left to CSS
 *
 * `styles/mobile-app.css` seeds the four tokens from `env(safe-area-inset-*)`
 * so the shell is laid out correctly on first paint. That is the right
 * default, but it is not reliable on iOS: WebKit does not always substitute
 * `env()` through a custom property, and on an installed home-screen app with
 * `apple-mobile-web-app-status-bar-style: black-translucent` the inset is also
 * not known at the moment `:root` is first evaluated. Either way the token
 * resolves to 0, the mobile app bar is drawn *underneath* the status bar, and
 * its buttons land in the strip iOS reserves for itself - which is why tapping
 * the notification bell or the menu did nothing on an iPhone while the same
 * build was fine everywhere else.
 *
 * A probe element reads `env()` where it is actually written - the one place
 * WebKit always honours it - and the measured pixels are written back over the
 * tokens. Every surface that already reserves `var(--safe-top)` then gets the
 * true value with no further change.
 *
 * ## Why the keyboard is a custom property too
 *
 * On iOS the keyboard does not resize the layout viewport: the page keeps its
 * full height and the keyboard is drawn on top of the bottom of it. Anything
 * anchored to the bottom edge - a sheet's action row, a sticky submit button -
 * ends up underneath it. `window.visualViewport` is the only API that reports
 * what is actually visible.
 *
 * Both values are exposed as custom properties rather than as React state on
 * purpose. Keyboard show/hide and orientation changes fire a burst of resize
 * events, and driving a re-render from them janks every list on screen; a
 * custom property moves only the elements that care, on the compositor.
 */

/** iPhones without a notch still keep a 20px status bar over the app. */
const STANDALONE_MIN_TOP = 20;

type Insets = { top: number; bottom: number; left: number; right: number };

/**
 * Measures `env(safe-area-inset-*)` by resolving it on a real element.
 *
 * The probe is `position: fixed` and zero-sized so it neither scrolls the page
 * nor affects layout, and it is read back through `getComputedStyle`, which
 * returns the substituted pixel value.
 */
function measureSafeAreaInsets(): Insets | null {
  if (typeof document === "undefined") return null;

  const probe = document.createElement("div");
  probe.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:0",
    "height:0",
    "visibility:hidden",
    "pointer-events:none",
    "padding-top:env(safe-area-inset-top, 0px)",
    "padding-bottom:env(safe-area-inset-bottom, 0px)",
    "padding-left:env(safe-area-inset-left, 0px)",
    "padding-right:env(safe-area-inset-right, 0px)",
  ].join(";");

  document.body.appendChild(probe);
  const computed = getComputedStyle(probe);
  const read = (value: string) => {
    const px = parseFloat(value);
    return Number.isFinite(px) ? px : 0;
  };
  const insets: Insets = {
    top: read(computed.paddingTop),
    bottom: read(computed.paddingBottom),
    left: read(computed.paddingLeft),
    right: read(computed.paddingRight),
  };
  probe.remove();

  return insets;
}

/** True once the app is running from the home screen rather than in a tab. */
function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    // iOS Safari predates the media query and still only reports this.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useViewportInsets(): void {
  /* ---------------- Hardware safe areas ---------------- */
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const insets = measureSafeAreaInsets();
        if (!insets) return;

        // Installed on iOS the app draws under the status bar, so a reported
        // 0 there is a misreport rather than a device without a notch. The
        // floor is the plain status bar height: enough to keep the app bar's
        // 44px targets out of the strip, and invisible on a device that does
        // report its inset.
        const top =
          isStandalone() && insets.top === 0
            ? STANDALONE_MIN_TOP
            : insets.top;

        root.style.setProperty("--safe-top", `${top}px`);
        root.style.setProperty("--safe-bottom", `${insets.bottom}px`);
        root.style.setProperty("--safe-left", `${insets.left}px`);
        root.style.setProperty("--safe-right", `${insets.right}px`);
      });
    };

    sync();
    // Rotating a phone swaps which edges carry an inset, and entering or
    // leaving full screen changes the top one.
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      root.style.removeProperty("--safe-top");
      root.style.removeProperty("--safe-bottom");
      root.style.removeProperty("--safe-left");
      root.style.removeProperty("--safe-right");
    };
  }, []);

  /* ---------------- Software keyboard ---------------- */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;
    let frame = 0;

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // How much of the layout viewport the visual viewport no longer
        // covers at the bottom. `offsetTop` keeps a scrolled page from being
        // read as a keyboard.
        const covered =
          window.innerHeight - vv.height - Math.max(0, vv.offsetTop);

        // Below ~80px this is browser chrome collapsing (the URL bar), not a
        // keyboard, and reacting to it makes the page twitch while scrolling.
        const inset = covered > 80 ? Math.round(covered) : 0;
        root.style.setProperty("--keyboard-inset", `${inset}px`);
        root.classList.toggle("keyboard-open", inset > 0);
      });
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      root.style.removeProperty("--keyboard-inset");
      root.classList.remove("keyboard-open");
    };
  }, []);
}

export default useViewportInsets;
