/**
 * Nexora Assistant - launcher and greeting bubble.
 *
 * Two pieces of one control: a permanent floating button, and a speech bubble
 * that appears beside it a few seconds after load. The bubble is the only part
 * of the assistant that speaks first, so it is also the only part with a
 * dismissal - the rules for when it may appear live in `assistantService`.
 */
import React, { useCallback } from "react";
import { useDraggableWidget } from "../../hooks/useDraggableWidget";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { STRINGS } from "./config";

interface Props {
  open: boolean;
  greetingVisible: boolean;
  greeting: string;
  onOpen: () => void;
  onDismissGreeting: () => void;
}

const AssistantBubble: React.FC<Props> = ({
  open,
  greetingVisible,
  greeting,
  onOpen,
  onDismissGreeting,
}) => {
  const reduce = useReducedMotion();

  /**
   * The launcher floats above the whole shell, so wherever it is parked it
   * takes the taps aimed at whatever is underneath. Dragged into the mobile
   * app bar it covered the notification bell, install and menu buttons, and
   * because the position is remembered it stayed there across reloads - the
   * navbar simply stopped responding. These bands keep it off both pieces of
   * chrome, measured live so they follow the breakpoint and the safe areas.
   */
  const keepClear = useCallback(() => {
    const read = (name: string) => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
      const px = parseFloat(value);
      return Number.isFinite(px) ? px : 0;
    };

    // From lg up the chrome is a sidebar and a desktop header the launcher
    // never reaches, so only the viewport edges apply.
    if (window.innerWidth >= 1024) return {};

    return {
      top: read("--safe-top") + read("--app-bar-h"),
      bottom: read("--safe-bottom") + read("--tab-bar-h"),
    };
  }, []);

  const drag = useDraggableWidget("assistantLauncherPosition", { keepClear });

  return (
    // On phones the bubble must clear the bottom tab bar (52px + safe area)
    // or it sits on top of the Attendance/More tabs and swallows their taps.
    // From lg up there is no tab bar, so the original offset applies.
    <motion.div
      {...drag.containerProps}
      className="pointer-events-none fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] end-4 z-[80] flex flex-col items-end gap-3 lg:bottom-6 lg:end-6"
    >
      {/* ---------------- Greeting ---------------- */}
      <AnimatePresence>
        {greetingVisible && !open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            style={{ transformOrigin: "bottom right" }}
            className="glass-panel pointer-events-auto relative max-w-[16.5rem] rounded-2xl rounded-ee-md p-3.5 pe-9"
          >
            <button
              type="button"
              onClick={onOpen}
              className="text-start text-sm font-medium leading-snug text-gray-800 dark:text-gray-100"
            >
              {greeting}
              <span
                className="mt-1.5 block text-xs font-semibold"
                style={{ color: "var(--accent)" }}
              >
                Ask me anything →
              </span>
            </button>
            <button
              type="button"
              onClick={onDismissGreeting}
              aria-label={STRINGS.dismissGreetingLabel}
              className="absolute end-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Launcher ---------------- */}
      <div className="pointer-events-auto" {...drag.handleProps}>
      <motion.button
        type="button"
        onClick={() => {
          // Releasing after a drag must not also open the panel.
          if (drag.didDrag()) return;
          onOpen();
        }}
        aria-label={STRINGS.launcherLabel}
        aria-expanded={open}
        title="Drag to move"
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 22, delay: 0.4 }}
        whileHover={drag.dragging ? undefined : { scale: 1.06 }}
        whileTap={drag.dragging ? undefined : { scale: 0.94 }}
        className="pointer-events-auto relative grid h-14 w-14 place-items-center rounded-full text-white shadow-lg shadow-black/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)]"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {/* A single slow pulse while the greeting is up, so the eye is drawn
            to the launcher rather than left with a permanently animating dot. */}
        <AnimatePresence>
          {greetingVisible && !open && !reduce && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: "var(--accent)" }}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>
        <ChatBubbleLeftRightIcon className="relative h-6 w-6" />
      </motion.button>
      </div>
    </motion.div>
  );
};

export default AssistantBubble;
