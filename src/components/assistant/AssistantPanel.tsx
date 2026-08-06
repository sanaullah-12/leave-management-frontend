/**
 * Nexora Assistant - the panel.
 *
 * A docked conversation surface: header, transcript, suggestions and the
 * question input. It renders whatever the state hook gives it and knows
 * nothing about where answers come from.
 *
 * Responsive by construction - a floating card anchored to the launcher on
 * desktop, a full-height sheet under {@link MOBILE_BREAKPOINT}.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AppLogo from "../AppLogo";
import { MOBILE_BREAKPOINT, STRINGS } from "./config";
import { iconFor } from "./icons";
import { resolveActions } from "./navigation";
import { quickActionsFor } from "./providers";
import AssistantTurn from "./AssistantMessage";
import TypingDots from "./TypingDots";
import { useAssistant } from "./useAssistant";

interface Props {
  open: boolean;
  closePanel: () => void;
}

const AssistantPanel: React.FC<Props> = ({ open, closePanel }) => {
  // Conversation state lives with the panel rather than the launcher, so the
  // knowledge base is only downloaded once someone actually opens it.
  const { context, messages, typing, suggestions, ask, reset } = useAssistant();

  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickActions = useMemo(
    () => resolveActions(quickActionsFor(context), context.role),
    [context]
  );

  /* Focus the input on open - the panel exists to be typed into. */
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 220);
    return () => window.clearTimeout(id);
  }, [open]);

  /* Escape closes, matching the app's other overlays. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePanel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  /* On phones the panel is a full-screen sheet, so the page behind it must
     not scroll underneath. Desktop keeps the app usable alongside it. */
  useEffect(() => {
    if (!open || window.innerWidth >= MOBILE_BREAKPOINT) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* Keep the newest turn in view as the conversation grows. */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    ask(text);
    setDraft("");
  };

  const goTo = (to: string) => {
    closePanel();
    navigate(to);
  };

  const askEntry = (entryId: string, question: string) =>
    ask(question, entryId);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim: mobile only. On desktop the panel is a companion to the
              page, not a modal - the app stays visible and clickable. */}
          <motion.div
            className="fixed inset-0 z-[85] bg-gray-900/40 backdrop-blur-sm sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
          />

          <motion.section
            role="dialog"
            aria-label={STRINGS.name}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{ transformOrigin: "bottom right" }}
            className={
              "fixed z-[90] flex flex-col overflow-hidden border border-gray-200/80 bg-gray-50/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/95 " +
              // Mobile: a sheet filling the screen. Desktop: a card sitting
              // just above the launcher.
              "inset-x-0 bottom-0 top-0 rounded-none " +
              "sm:inset-auto sm:bottom-24 sm:end-6 sm:top-auto sm:h-[min(38rem,calc(100vh-8rem))] sm:w-[24.5rem] sm:rounded-3xl"
            }
          >
            {/* ---------------- Header ---------------- */}
            <header
              className="flex items-center gap-3 border-b border-black/5 px-4 py-3.5 dark:border-white/10"
              style={{ backgroundColor: "var(--accent-wash)" }}
            >
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl text-blue-600 dark:text-blue-400">
                <AppLogo size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                  {STRINGS.name}
                </p>
                <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {context.module
                    ? `${STRINGS.contextTitle}: ${context.module.name}`
                    : STRINGS.tagline}
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  title={STRINGS.resetLabel}
                  aria-label={STRINGS.resetLabel}
                  className="grid h-8 w-8 place-items-center rounded-xl text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closePanel}
                aria-label={STRINGS.closeLabel}
                className="grid h-8 w-8 place-items-center rounded-xl text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            {/* ---------------- Transcript ---------------- */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-800/80">
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      {STRINGS.emptyGreeting(context.userName)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {STRINGS.emptyBody}
                    </p>
                  </div>

                  {!!quickActions.length && (
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {STRINGS.quickActionsTitle}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {quickActions.map((action, i) => {
                          const Icon = iconFor(action.action.icon);
                          return (
                            <button
                              key={`${action.action.label}-${i}`}
                              type="button"
                              onClick={() => {
                                if (action.kind === "route") goTo(action.to);
                                else if (action.kind === "entry")
                                  askEntry(action.entryId, action.action.label);
                                else
                                  window.open(
                                    action.href,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200"
                            >
                              <Icon
                                className="h-3.5 w-3.5"
                                style={{ color: "var(--accent)" }}
                              />
                              {action.action.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      <SparklesIcon className="h-3.5 w-3.5" />
                      {STRINGS.suggestionsTitle}
                    </p>
                    <div className="space-y-1.5">
                      {suggestions.map((s) => (
                        <button
                          key={s.entryId}
                          type="button"
                          onClick={() => askEntry(s.entryId, s.question)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-start text-sm font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-md dark:border-white/10 dark:bg-gray-800 dark:text-gray-200"
                        >
                          <span>{s.question}</span>
                          <span
                            className="text-base leading-none"
                            style={{ color: "var(--accent)" }}
                          >
                            ›
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {messages.map((m) => (
                <AssistantTurn
                  key={m.id}
                  message={m}
                  role={context.role}
                  pathname={context.pathname}
                  onNavigate={goTo}
                  onAskEntry={askEntry}
                />
              ))}

              {typing && <TypingDots />}
            </div>

            {/* ---------------- Composer ---------------- */}
            <form
              onSubmit={submit}
              className="flex items-center gap-2 border-t border-black/5 bg-white/80 px-3 py-3 dark:border-white/10 dark:bg-gray-900/70"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={STRINGS.inputPlaceholder}
                aria-label={STRINGS.inputPlaceholder}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[var(--accent)] dark:border-white/10 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label={STRINGS.send}
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <PaperAirplaneIcon className="h-5 w-5 rtl:-scale-x-100" />
              </button>
            </form>
          </motion.section>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AssistantPanel;
