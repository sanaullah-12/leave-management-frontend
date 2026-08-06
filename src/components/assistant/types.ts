/**
 * Nexora Assistant - domain types.
 *
 * These types are the contract between the four layers of the assistant:
 *
 *   knowledge/  →  what the assistant knows      (data)
 *   providers/  →  how an answer is produced     (strategy)
 *   useAssistant→  conversation state            (state)
 *   Assistant*  →  how an answer is rendered     (UI)
 *
 * The UI never imports the knowledge base directly - it only ever sees an
 * {@link AssistantReply}. That indirection is what makes a future swap to a
 * real LLM a one-file change: a new provider that returns the same shape.
 */

/* ------------------------------------------------------------------ */
/* Audience                                                            */
/* ------------------------------------------------------------------ */

/** Mirrors `User["role"]` in AuthContext. */
export type AssistantRole = "admin" | "employee";

/**
 * Stable identifiers for the product areas the assistant can talk about.
 * Adding a module means adding an id here and a pack under `knowledge/modules`.
 */
export type ModuleId =
  | "general"
  | "leave"
  | "attendance"
  | "people"
  | "payroll"
  | "announcements"
  | "voice"
  | "documents"
  | "reports"
  | "account";

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/**
 * Semantic icon name. The knowledge base stays free of React imports, so it
 * names an intent and {@link ACTION_ICONS} in the UI layer resolves the glyph.
 */
export type ActionIcon =
  | "navigate"
  | "create"
  | "search"
  | "settings"
  | "calendar"
  | "money"
  | "document"
  | "chart"
  | "megaphone"
  | "question";

/**
 * A button rendered under an answer. Exactly one destination should be set:
 *
 * - `to` - an in-app route; validated against the route registry before
 *               it is rendered, so a typo can never navigate into a 404.
 * - `href` - an external URL, opened in a new tab.
 * - `entryId` - asks another knowledge entry, keeping the user in the panel.
 */
export interface AssistantAction {
  label: string;
  to?: string;
  href?: string;
  entryId?: string;
  icon?: ActionIcon;
  /** Hide the action from users who cannot reach the destination. */
  roles?: AssistantRole[];
}

/* ------------------------------------------------------------------ */
/* Knowledge base                                                      */
/* ------------------------------------------------------------------ */

/** One answerable question. The atom of the knowledge base. */
export interface KnowledgeEntry {
  /** Globally unique, `<module>.<slug>` by convention. */
  id: string;
  module: ModuleId;
  /** Canonical phrasing, shown as the suggestion label. */
  question: string;
  /** Alternate phrasings users actually type. Matched verbatim-ish. */
  aliases?: string[];
  /** Extra matching signal - single words or short phrases. */
  keywords?: string[];
  /** One or two sentences of context, rendered above the steps. */
  answer: string;
  /** Ordered, imperative instructions. Rendered as a numbered list. */
  steps?: string[];
  /** Short asides rendered as a callout under the steps. */
  tips?: string[];
  actions?: AssistantAction[];
  /** Ids of related entries offered as follow-up chips. */
  related?: string[];
  /** Who may see this entry. Omitted means everyone. */
  roles?: AssistantRole[];
  /** Eligible to appear in the suggested-questions list. */
  featured?: boolean;
  /** Tie-breaker when several entries score equally. Higher wins. */
  weight?: number;
}

/** A product area: its identity, the routes it owns, and what it knows. */
export interface KnowledgeModule {
  id: ModuleId;
  /** Human label, e.g. "Payroll". */
  name: string;
  /** Answer to "what does this page do?" while inside the module. */
  summary: string;
  /**
   * Route prefixes owned by this module, most specific first. Used both for
   * context detection and to validate {@link AssistantAction.to} targets.
   */
  routes: string[];
  /** Where "Open <module>" sends the user. */
  primaryRoute: string;
  icon: ActionIcon;
  roles?: AssistantRole[];
  /** Buttons offered when the assistant is opened inside this module. */
  quickActions?: AssistantAction[];
  entries: KnowledgeEntry[];
}

/* ------------------------------------------------------------------ */
/* Conversation                                                        */
/* ------------------------------------------------------------------ */

/** Everything a provider needs to know about where the user is standing. */
export interface AssistantContext {
  /** Current router pathname. */
  pathname: string;
  /** Module owning `pathname`, or null on an unmapped route. */
  module: KnowledgeModule | null;
  role: AssistantRole;
  userName?: string;
  /** Active i18n language code, for providers that localise. */
  locale?: string;
}

/** What the user asked. `entryId` short-circuits matching for chip clicks. */
export interface AssistantQuery {
  text: string;
  entryId?: string;
}

/** Where an answer came from - surfaced as a small badge in the UI. */
export type ReplySource = "knowledge" | "context" | "fallback" | "ai";

/** A rendered answer. The only assistant shape the UI layer understands. */
export interface AssistantReply {
  id: string;
  title?: string;
  body: string;
  steps?: string[];
  tips?: string[];
  actions?: AssistantAction[];
  /** Suggested next questions, rendered as clickable chips. */
  followUps?: Array<{ id: string; question: string }>;
  source: ReplySource;
  /** 0-1. Below {@link LOW_CONFIDENCE} the UI offers alternatives instead. */
  confidence: number;
  /** Set when the reply came from a specific knowledge entry. */
  entryId?: string;
  moduleId?: ModuleId;
}

/** One turn in the transcript. */
export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  /** Present on user turns. */
  text?: string;
  /** Present on assistant turns. */
  reply?: AssistantReply;
  at: number;
}

/** A suggested question chip. */
export interface Suggestion {
  entryId: string;
  question: string;
  moduleId: ModuleId;
}

/* ------------------------------------------------------------------ */
/* Provider strategy                                                   */
/* ------------------------------------------------------------------ */

/**
 * The answer engine.
 *
 * Today the only implementation is `localKnowledgeProvider`, which matches
 * against the static knowledge base. An `aiProvider` calling Claude, OpenAI or
 * Gemini implements this same interface - the panel, the bubble and the state
 * hook are unaware of which one is mounted. See `docs/AI_HELPER.md`.
 */
export interface AssistantProvider {
  readonly id: string;
  readonly label: string;
  /** True once a provider can emit partial answers (reserved for AI). */
  readonly streaming?: boolean;
  /** Produce an answer. `signal` aborts an in-flight request. */
  ask(
    query: AssistantQuery,
    context: AssistantContext,
    signal?: AbortSignal
  ): Promise<AssistantReply>;
  /** Context-ranked starter questions shown on the empty state. */
  suggest(context: AssistantContext, limit?: number): Suggestion[];
}

/* ------------------------------------------------------------------ */
/* Persisted preferences                                               */
/* ------------------------------------------------------------------ */

/**
 * The "don't be annoying" ledger. Persisted so a dismissal survives reloads.
 */
export interface AssistantPreferences {
  /** User closed the greeting bubble - never auto-greet again. */
  greetingDismissed: boolean;
  /** How many times the greeting has been shown. */
  greetingCount: number;
  /** Epoch ms of the last greeting, for the cooldown window. */
  lastGreetedAt: number | null;
  /** How many times the panel has been opened. */
  openCount: number;
}
