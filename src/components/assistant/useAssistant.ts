/**
 * Nexora Assistant - conversation state.
 *
 * Owns the transcript, the typing indicator and the derived context. It talks
 * to the answer engine only through the {@link AssistantProvider} interface,
 * so the UI it feeds is identical whether replies come from the local
 * knowledge base or a model.
 *
 * Used by `AssistantPanel`, which is lazily loaded - importing this hook pulls
 * in the knowledge base, and that cost is paid on first open, not on boot.
 * Launcher-only state lives in `useAssistantLauncher`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { MAX_TRANSCRIPT } from "./config";
import { typingDelayFor, uid } from "./assistantService";
import { moduleForPath } from "./knowledge";
import { resolveProvider } from "./providers";
import type {
  AssistantContext,
  AssistantMessage,
  AssistantRole,
  Suggestion,
} from "./types";

export interface UseAssistant {
  context: AssistantContext;
  messages: AssistantMessage[];
  typing: boolean;
  suggestions: Suggestion[];
  /** Ask a question, or replay a known entry by id. */
  ask: (text: string, entryId?: string) => void;
  reset: () => void;
}

export function useAssistant(): UseAssistant {
  const location = useLocation();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const provider = useMemo(() => resolveProvider(), []);

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [typing, setTyping] = useState(false);

  /**
   * Guards against a stale answer landing after a newer question. Every ask
   * claims a ticket; only the current holder may write to state.
   */
  const requestId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    },
    []
  );

  const role: AssistantRole = (user?.role as AssistantRole) ?? "employee";

  const context: AssistantContext = useMemo(
    () => ({
      pathname: location.pathname,
      module: moduleForPath(location.pathname),
      role,
      userName: user?.name,
      locale: i18n.language,
    }),
    [location.pathname, role, user?.name, i18n.language]
  );

  const suggestions = useMemo(
    () => provider.suggest(context),
    [provider, context]
  );

  const ask = useCallback(
    (text: string, entryId?: string) => {
      const question = text.trim();
      if (!question && !entryId) return;

      const ticket = ++requestId.current;

      setMessages((prev) =>
        [
          ...prev,
          { id: uid("user"), role: "user" as const, text: question, at: Date.now() },
        ].slice(-MAX_TRANSCRIPT)
      );
      setTyping(true);

      void provider
        .ask({ text: question, entryId }, context)
        .then((reply) => {
          if (ticket !== requestId.current) return;
          // The pause is what makes an instant lookup read as a response -
          // and it is the slot a real model's latency will occupy later.
          const wait = typingDelayFor(
            [reply.body, ...(reply.steps ?? [])].join(" ")
          );
          timers.current.push(
            window.setTimeout(() => {
              if (ticket !== requestId.current) return;
              setTyping(false);
              setMessages((prev) =>
                [
                  ...prev,
                  {
                    id: uid("assistant"),
                    role: "assistant" as const,
                    reply,
                    at: Date.now(),
                  },
                ].slice(-MAX_TRANSCRIPT)
              );
            }, wait)
          );
        })
        .catch(() => {
          if (ticket !== requestId.current) return;
          setTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: uid("assistant"),
              role: "assistant" as const,
              reply: {
                id: uid("reply"),
                body: "Something went wrong finding that answer. Please try again.",
                source: "fallback",
                confidence: 0,
              },
              at: Date.now(),
            },
          ]);
        });
    },
    [provider, context]
  );

  const reset = useCallback(() => {
    requestId.current += 1;
    setTyping(false);
    setMessages([]);
  }, []);

  return { context, messages, typing, suggestions, ask, reset };
}
