/**
 * Nexora Assistant - provider registry.
 *
 * One place decides which engine answers questions. Today that is always the
 * local knowledge base; tomorrow it can be an LLM, chosen per environment, per
 * tenant or per feature flag - and nothing above this file changes, because
 * every engine satisfies the same {@link AssistantProvider} interface.
 *
 * Adding an AI engine:
 *
 *   1. Write `providers/aiProvider.ts` implementing `AssistantProvider`.
 *      `ask()` calls your backend (never the model directly - API keys do not
 *      belong in a bundle) and maps the response onto `AssistantReply`.
 *   2. Register it in `PROVIDERS` below.
 *   3. Point `resolveProvider` at it - typically behind an env flag, with the
 *      local provider as the offline/error fallback.
 *
 * See `docs/AI_HELPER.md` for the full walkthrough, including the recommended
 * hybrid mode where the knowledge base grounds the model's answers.
 */
import type { AssistantProvider } from "../types";
import { localKnowledgeProvider } from "./localKnowledgeProvider";

/** Every engine the build knows about, keyed by id. */
export const PROVIDERS: Record<string, AssistantProvider> = {
  [localKnowledgeProvider.id]: localKnowledgeProvider,
};

/** The engine used when nothing else is configured. */
export const DEFAULT_PROVIDER_ID = localKnowledgeProvider.id;

/**
 * The active engine.
 *
 * `VITE_ASSISTANT_PROVIDER` lets a deployment opt into a different engine
 * without a code change; an unknown or missing value falls back to the local
 * provider, so a misconfigured environment degrades to working help rather
 * than a broken panel.
 */
export function resolveProvider(): AssistantProvider {
  const configured = import.meta.env?.VITE_ASSISTANT_PROVIDER as
    | string
    | undefined;
  return (
    (configured && PROVIDERS[configured]) || PROVIDERS[DEFAULT_PROVIDER_ID]
  );
}

export { localKnowledgeProvider, quickActionsFor } from "./localKnowledgeProvider";
