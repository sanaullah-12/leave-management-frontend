/**
 * Nexora Assistant - public surface.
 *
 * The app only needs {@link NexoraAssistant}. Everything else is exported for
 * tooling, tests and future extensions (an AI provider, a "Help" button
 * elsewhere in the UI, a knowledge-coverage audit script).
 *
 * Architecture and extension guide: `docs/AI_HELPER.md`.
 */
export { default as NexoraAssistant } from "./NexoraAssistant";
export { default } from "./NexoraAssistant";

export { useAssistant } from "./useAssistant";
export type { UseAssistant } from "./useAssistant";
export { useAssistantLauncher } from "./useAssistantLauncher";
export type { UseAssistantLauncher } from "./useAssistantLauncher";

export * from "./types";
export * as assistantConfig from "./config";
export { MODULES, ENTRIES, moduleForPath, entryById } from "./knowledge";
export { searchKnowledge, bestMatch, isContextQuestion } from "./search";
export { resolveProvider, PROVIDERS, localKnowledgeProvider } from "./providers";
export {
  loadPreferences,
  updatePreferences,
  clearPreferences,
  shouldGreet,
} from "./assistantService";
export { isNavigableRoute, resolveActions, APP_ROUTES } from "./navigation";
