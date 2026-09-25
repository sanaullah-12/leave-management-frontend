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

import Input from "../ui/Input";
import { panelSpring } from "../../lib/motion";
interface Props {
  open: boolean;
  closePanel: () => void;
  /** The launcher's viewport rect; the desktop card opens beside it. */
  anchor?: DOMRect | null;
}

const PANEL_WIDTH = 392; // 24.5rem
const PANEL_MAX_HEIGHT = 608; // 38rem
const PANEL_GAP = 12;
const VIEWPORT_MARGIN = 16;

/**
 * Where the desktop card goes relative to a launcher that can be dragged
 * anywhere. Above it when there is room, then below, then to whichever side
 * is free, clamped so the card never leaves the viewport. The transform
 * origin points back at the launcher so the card grows out of it.
 */
function placePanel(anchor: DOMRect): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const height = Math.min(PANEL_MAX_HEIGHT, vh - 2 * VIEWPORT_MARGIN);
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(v, max));

  const onRight = anchor.left + anchor.width / 2 > vw / 2;
  const spaceAbove = anchor.top - PANEL_GAP - VIEWPORT_MARGIN;
  const spaceBelow = vh - anchor.bottom - PANEL_GAP - VIEWPORT_MARGIN;

  let top: number;
  let left: number;
  let originY: string;
  let originX = onRight ? "right" : "left";

  if (spaceAbove >= height || spaceBelow >= height) {
    const above = spaceAbove >= height;
    top = above ? anchor.top - PANEL_GAP - height : anchor.bottom + PANEL_GAP;
    originY = above ? "bottom" : "top";
    left = onRight ? anchor.right - PANEL_WIDTH : anchor.left;
  } else {
    // Launcher is mid-height on a short screen: open to the side instead.
    top = anchor.top + anchor.height / 2 - height / 2;
    originY = "center";
    const goLeft = anchor.left >= vw - anchor.right;
    left = goLeft ? anchor.left - PANEL_GAP - PANEL_WIDTH : anchor.right + PANEL_GAP;
    originX = goLeft ? "right" : "left";
  }

  return {
    top: clamp(top, VIEWPORT_MARGIN, vh - height - VIEWPORT_MARGIN),
    left: clamp(left, VIEWPORT_MARGIN, vw - PANEL_WIDTH - VIEWPORT_MARGIN),
    right: "auto",
    bottom: "auto",
    height,
    transformOrigin: `${originY} ${originX}`,
  };
}

const AssistantPanel: React.FC<Props> = ({ open, closePanel, anchor }) => {
  // Conversation state lives with the panel rather than the launcher, so the
  // knowledge base is only downloaded once someone actually opens it.
  const { context, messages, typing, suggestions, ask, reset } = useAssistant();

  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= MOBILE_BREAKPOINT
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The phone sheet fills the screen, so only the desktop card follows the
  // launcher. Without an anchor yet, the CSS default (bottom-right) applies.
  const placement = useMemo<React.CSSProperties>(
    () =>
      isDesktop && anchor
        ? placePanel(anchor)
        : { transformOrigin: "bottom right" },
    [isDesktop, anchor]
  );

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
     not scroll underneath. Desktop keeps the app usable alongside it.

     iOS ignores `overflow: hidden` on <body> once a touch scroll is already
     in flight, so the page is pinned by position instead and its scroll offset
     restored on close - otherwise closing the sheet dumped the user back at
     the top of whatever screen they were on. */
  useEffect(() => {
    if (!open || window.innerWidth >= MOBILE_BREAKPOINT) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
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
    /* Both surfaces are keyed and sit directly under AnimatePresence. Wrapped
       in a fragment they were one untracked child, so neither ran its exit
       animation and the scrim could be left behind over the app. */
    <AnimatePresence>
      {open && [
          /* Scrim: mobile only. On desktop the panel is a companion to the
             page, not a modal - the app stays visible and clickable. */
          <motion.div
            key="assistant-scrim"
            className="fixed inset-0 z-[85] bg-[var(--overlay-scrim)] backdrop-blur-sm sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
          />,

          <motion.section
            key="assistant-panel"
            role="dialog"
            aria-label={STRINGS.name}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={panelSpring}
            style={placement}
            className={
              "assistant-panel-glow fixed z-[90] flex flex-col overflow-hidden border-[var(--border-default)] bg-[var(--surface-overlay)]/95 backdrop-blur-xl " +
              // Mobile: a sheet filling the screen - no border, because there
              // is no edge for one to sit on. Desktop: a card sitting just
              // above the launcher.
              "inset-x-0 bottom-0 top-0 rounded-none " +
              "sm:inset-auto sm:bottom-24 sm:end-6 sm:top-auto sm:h-[min(38rem,calc(100vh-8rem))] sm:w-[24.5rem] sm:rounded-3xl sm:border"
            }
          >
            <span aria-hidden="true" className="assistant-edge" data-active={typing} />

            {/* ---------------- Header ---------------- */}
            {/* The sheet starts at y=0, so on a notched iPhone the header was
                drawn inside the status bar: the close and reset buttons were
                sitting in the strip iOS keeps for itself and tapping them did
                nothing, which left the assistant with no way out. The insets
                are reserved on the sheet layout only - the desktop card floats
                clear of every edge and must not inherit them. */}
            <header
              className="flex items-center gap-3 border-b border-black/5 px-[max(1rem,var(--safe-left))] pb-3.5 pt-[calc(0.875rem+var(--safe-top))] dark:border-white/10 sm:px-4 sm:pt-3.5"
              style={{ backgroundColor: "var(--accent-wash)" }}
            >
              <span className="assistant-logo-glow grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl text-blue-600 dark:text-blue-400">
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
                  className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 active:bg-black/10 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white dark:active:bg-white/20 sm:h-8 sm:w-8"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closePanel}
                aria-label={STRINGS.closeLabel}
                /* 44px on touch, back to 32px next to a mouse. -me-1 keeps the
                   grown target optically aligned with the sheet's edge. */
                className="-me-1 grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 active:bg-black/10 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white dark:active:bg-white/20 sm:me-0 sm:h-8 sm:w-8"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            {/* ---------------- Transcript ---------------- */}
            <div
              ref={scrollRef}
              className="scroll-pane flex-1 space-y-3 px-[max(1rem,var(--safe-left))] py-4 sm:px-4"
            >
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="glass-card rounded-2xl p-4">
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
                              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200"
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
                          className="flex w-full items-center justify-between gap-2 rounded-full border border-gray-200 bg-white px-3 py-2.5 text-start text-sm font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-md dark:border-white/10 dark:bg-gray-800 dark:text-gray-200"
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
            {/* The keyboard does not resize the viewport on iOS, so without the
                inset the field being typed into ends up behind it. --safe-bottom
                clears the home indicator on the full-screen sheet; the desktop
                card sits well above both. */}
            <form
              onSubmit={submit}
              className="flex items-center gap-2 border-t border-black/5 bg-white/80 px-[max(0.75rem,var(--safe-left))] pb-[calc(0.75rem+var(--safe-bottom)+var(--keyboard-inset))] pt-3 dark:border-white/10 dark:bg-gray-900/70 sm:px-3 sm:pb-3"
            >
              <Input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={STRINGS.inputPlaceholder}
                aria-label={STRINGS.inputPlaceholder}
                className="min-w-0 flex-1"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label={STRINGS.send}
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                style={{ backgroundColor: "var(--brand-solid)" }}
              >
                <PaperAirplaneIcon className="h-5 w-5 rtl:-scale-x-100" />
              </button>
            </form>
          </motion.section>,
        ]}
    </AnimatePresence>,
    document.body
  );
};

export default AssistantPanel;
