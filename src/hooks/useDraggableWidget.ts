import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Makes a fixed-position widget draggable, remembering where it was left.
 *
 * The gesture is handled with plain pointer events on a wrapper element rather
 * than through Framer Motion. The launcher is a `motion.button` carrying
 * `whileHover`/`whileTap`, and Framer's own gesture handling on that element
 * swallows both hand-rolled listeners placed on it and its own `drag` prop, so
 * neither approach moved anything. A wrapper Framer does not manage receives
 * the events cleanly.
 *
 * The widget keeps its CSS anchor (bottom / inline-end); only a translation is
 * applied on top, so responsive offsets and safe-area insets still apply.
 *
 * A drag and a click are told apart by distance: under DRAG_THRESHOLD pixels
 * the gesture is a click and the button's own onClick runs.
 */

const DRAG_THRESHOLD = 4;
/** Keep at least this much of the widget on screen. */
const EDGE_MARGIN = 8;

/** Bands of the viewport the widget must never come to rest inside. */
export interface KeepClear {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

interface Options {
  /**
   * Chrome the widget must stay out of, measured from each viewport edge and
   * re-read on every clamp so it can follow a breakpoint or a safe-area
   * change. Without it a widget dragged into the app bar sits on top of the
   * header's buttons and silently eats every tap aimed at them - the widget
   * is only 56px, but it is above the whole shell.
   */
  keepClear?: () => KeepClear;
}

export function useDraggableWidget(storageKey: string, options: Options = {}) {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const offsetRef = useRef(offset);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const origin = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const moved = useRef(false);

  // Read through a ref so the callbacks below stay stable while the caller is
  // free to pass a fresh closure on every render.
  const keepClearRef = useRef(options.keepClear);
  keepClearRef.current = options.keepClear;

  /** Nudge the widget back inside the allowed area after a drag or a resize. */
  const clampIntoView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const clear = keepClearRef.current?.() ?? {};
    const minX = EDGE_MARGIN + (clear.left ?? 0);
    const maxX = window.innerWidth - EDGE_MARGIN - (clear.right ?? 0);
    const minY = EDGE_MARGIN + (clear.top ?? 0);
    const maxY = window.innerHeight - EDGE_MARGIN - (clear.bottom ?? 0);

    const rect = el.getBoundingClientRect();
    let dx = 0;
    let dy = 0;

    if (rect.left < minX) dx = minX - rect.left;
    else if (rect.right > maxX) dx = maxX - rect.right;

    // On a short screen the two bands can overlap; keeping the top edge
    // authoritative means the widget is pushed below the app bar rather than
    // wedged under it.
    if (rect.bottom > maxY) dy = maxY - rect.bottom;
    if (rect.top + dy < minY) dy = minY - rect.top;

    if (dx || dy) {
      setOffset((current) => ({ x: current.x + dx, y: current.y + dy }));
    }
  }, []);

  // Restore the saved position, then correct it if it no longer fits.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
          setOffset({ x: parsed.x, y: parsed.y });
        }
      }
    } catch {
      // A blocked or corrupt store just means the default position.
    }
    // After the 160ms settle transition, not on the next frame: the clamp
    // measures the element, and mid-transition it would measure a position the
    // widget is only passing through. The wait also lets a position saved
    // against older chrome - or a larger screen - be corrected on load rather
    // than only after the next drag.
    const id = window.setTimeout(clampIntoView, 220);
    return () => window.clearTimeout(id);
  }, [storageKey, clampIntoView]);

  useEffect(() => {
    window.addEventListener("resize", clampIntoView);
    return () => window.removeEventListener("resize", clampIntoView);
  }, [clampIntoView]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;

      moved.current = false;
      origin.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
      };

      // Listen on window, not the element: the pointer routinely outruns a
      // 56px button, and capture on the button competes with Framer's own
      // gesture handling inside it.
      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - origin.current.x;
        const dy = ev.clientY - origin.current.y;

        if (!moved.current) {
          if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
          moved.current = true;
          setDragging(true);
        }

        ev.preventDefault();
        setOffset({
          x: origin.current.offsetX + dx,
          y: origin.current.offsetY + dy,
        });
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);

        if (!moved.current) return;

        setDragging(false);
        clampIntoView();
        try {
          localStorage.setItem(storageKey, JSON.stringify(offsetRef.current));
        } catch {
          // Position simply is not remembered next time.
        }
        // Cleared after the click that follows pointerup has been suppressed.
        setTimeout(() => {
          moved.current = false;
        }, 0);
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [storageKey, clampIntoView]
  );

  const resetPosition = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* nothing to clean up */
    }
  }, [storageKey]);

  return {
    /** Spread onto the element that should move. */
    containerProps: {
      ref: containerRef,
      style: {
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: dragging ? "none" : "transform 160ms ease-out",
      } as React.CSSProperties,
    },
    /** Spread onto a plain wrapper around the grab handle. */
    handleProps: {
      onPointerDown,
      style: {
        touchAction: "none" as const,
        cursor: dragging ? ("grabbing" as const) : ("grab" as const),
      },
    },
    dragging,
    /** True if the gesture that just ended was a drag, not a click. */
    didDrag: () => moved.current,
    resetPosition,
  };
}
