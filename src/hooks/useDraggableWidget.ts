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

export function useDraggableWidget(storageKey: string) {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const offsetRef = useRef(offset);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const origin = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const moved = useRef(false);

  /** Nudge the widget back inside the viewport after a drag or a resize. */
  const clampIntoView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let dx = 0;
    let dy = 0;

    if (rect.left < EDGE_MARGIN) dx = EDGE_MARGIN - rect.left;
    else if (rect.right > window.innerWidth - EDGE_MARGIN)
      dx = window.innerWidth - EDGE_MARGIN - rect.right;

    if (rect.top < EDGE_MARGIN) dy = EDGE_MARGIN - rect.top;
    else if (rect.bottom > window.innerHeight - EDGE_MARGIN)
      dy = window.innerHeight - EDGE_MARGIN - rect.bottom;

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
    const id = requestAnimationFrame(clampIntoView);
    return () => cancelAnimationFrame(id);
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
