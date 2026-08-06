/**
 * Nexora Assistant - launcher state.
 *
 * Owns only what the always-mounted launcher needs: whether the panel is open,
 * whether the assistant may greet, and whether it belongs on this route.
 *
 * Deliberately free of any import that reaches the knowledge base or the
 * answer engine - that is what lets `NexoraAssistant` keep the whole panel in
 * a lazily-loaded chunk that costs nothing until someone asks for help.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { GREETING_AUTOHIDE_MS, GREETING_DELAY_MS } from "./config";
import {
  greetingFor,
  isAssistantHiddenOn,
  loadPreferences,
  shouldGreet,
  updatePreferences,
} from "./assistantService";

export interface UseAssistantLauncher {
  open: boolean;
  openPanel: () => void;
  closePanel: () => void;

  greetingVisible: boolean;
  greeting: string;
  /** Permanent: never auto-greet again. */
  dismissGreeting: () => void;

  /** True on routes where the assistant must not render at all. */
  hidden: boolean;
}

export function useAssistantLauncher(): UseAssistantLauncher {
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(false);
  const [greeting, setGreeting] = useState("");
  const timers = useRef<number[]>([]);

  const hidden = isAssistantHiddenOn(location.pathname);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    },
    []
  );

  useEffect(() => {
    if (hidden) return;
    const prefs = loadPreferences();
    if (!shouldGreet(prefs)) return;

    const showAt = window.setTimeout(() => {
      setGreeting(greetingFor(prefs));
      setGreetingVisible(true);
      updatePreferences({
        greetingCount: prefs.greetingCount + 1,
        lastGreetedAt: Date.now(),
      });
      // Retract on its own so an ignored bubble never becomes furniture.
      timers.current.push(
        window.setTimeout(() => setGreetingVisible(false), GREETING_AUTOHIDE_MS)
      );
    }, GREETING_DELAY_MS);
    timers.current.push(showAt);

    return () => window.clearTimeout(showAt);
    // Mount-only by design: the greeting is a per-session welcome, not
    // something to re-evaluate on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismissGreeting = useCallback(() => {
    setGreetingVisible(false);
    updatePreferences({ greetingDismissed: true });
  }, []);

  const openPanel = useCallback(() => {
    setGreetingVisible(false);
    setOpen(true);
    updatePreferences({ openCount: loadPreferences().openCount + 1 });
  }, []);

  const closePanel = useCallback(() => setOpen(false), []);

  return {
    open,
    openPanel,
    closePanel,
    greetingVisible: greetingVisible && !open && !hidden,
    greeting,
    dismissGreeting,
    hidden,
  };
}
