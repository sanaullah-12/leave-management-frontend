/**
 * Nexora Assistant - a single transcript turn.
 *
 * Renders an {@link AssistantReply} and nothing else: it has no idea whether
 * the answer came from the static knowledge base or a model. That is the whole
 * point of the provider seam - this component is already AI-ready.
 */
import React from "react";
import { motion } from "framer-motion";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import { STRINGS } from "./config";
import { iconFor, ExternalIcon } from "./icons";
import { resolveActions, isCurrentRoute } from "./navigation";
import type { AssistantMessage as Turn, AssistantRole } from "./types";

interface Props {
  message: Turn;
  role: AssistantRole;
  pathname: string;
  /** Navigate to an in-app route (the panel closes itself first). */
  onNavigate: (to: string) => void;
  /** Ask another knowledge entry without leaving the panel. */
  onAskEntry: (entryId: string, question: string) => void;
}

const enter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 320, damping: 30 },
};

const AssistantTurn: React.FC<Props> = ({
  message,
  role,
  pathname,
  onNavigate,
  onAskEntry,
}) => {
  /* ---------------- user turn ---------------- */
  if (message.role === "user") {
    return (
      <motion.div {...enter} className="flex justify-end">
        <div
          className="max-w-[85%] rounded-2xl rounded-ee-md px-3.5 py-2.5 text-sm font-medium text-white shadow-sm"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {message.text}
        </div>
      </motion.div>
    );
  }

  /* ---------------- assistant turn ---------------- */
  const reply = message.reply;
  if (!reply) return null;

  const actions = resolveActions(reply.actions, role);
  const badge = STRINGS.sourceBadge[reply.source];

  return (
    <motion.div {...enter} className="flex justify-start">
      <div className="w-full max-w-[92%] rounded-2xl rounded-es-md border border-gray-200/80 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-gray-800/80">
        {reply.title && (
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {reply.title}
            </h4>
            <span
              className="mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              {badge}
            </span>
          </div>
        )}

        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {reply.body}
        </p>

        {!!reply.steps?.length && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {STRINGS.stepsTitle}
            </p>
            <ol className="space-y-1.5">
              {reply.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <span
                    className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold"
                    style={{
                      backgroundColor: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!!reply.tips?.length && (
          <div className="mt-3 space-y-1.5 rounded-xl bg-amber-50/70 p-2.5 dark:bg-amber-400/10">
            {reply.tips.map((tip, i) => (
              <p
                key={i}
                className="flex gap-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200"
              >
                <LightBulbIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{tip}</span>
              </p>
            ))}
          </div>
        )}

        {!!actions.length && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action, i) => {
              const Icon = iconFor(action.action.icon);
              const here =
                action.kind === "route" && isCurrentRoute(action.to, pathname);
              return (
                <button
                  key={`${action.action.label}-${i}`}
                  type="button"
                  onClick={() => {
                    if (action.kind === "route") onNavigate(action.to);
                    else if (action.kind === "external")
                      window.open(action.href, "_blank", "noopener,noreferrer");
                    else onAskEntry(action.entryId, action.action.label);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                  style={{ backgroundColor: "var(--accent)" }}
                  disabled={here}
                  title={here ? "You're already here" : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.action.label}
                  {action.kind === "external" && (
                    <ExternalIcon className="h-3 w-3" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!!reply.followUps?.length && (
          <div className="mt-3 border-t border-gray-100 pt-2.5 dark:border-white/5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {STRINGS.relatedTitle}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {reply.followUps.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onAskEntry(f.id, f.question)}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-transparent hover:bg-[var(--accent)] hover:text-white dark:border-white/10 dark:text-gray-300"
                >
                  {f.question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AssistantTurn;
