/**
 * Nexora Assistant - local knowledge provider.
 *
 * Answers questions by matching them against the static knowledge base. This
 * is the only provider shipped today; it implements the same
 * {@link AssistantProvider} contract an LLM-backed provider would, which is
 * why swapping engines later touches no UI.
 *
 * Its job is narrow: decide *which* entry answers a question and shape the
 * reply. Matching lives in `../search.ts`; the content lives in `../knowledge`.
 */
import {
  FALLBACK_ALTERNATIVES,
  LOW_CONFIDENCE,
  STRINGS,
  SUGGESTION_LIMIT,
} from "../config";
import {
  allowsRole,
  entriesForRole,
  entryById,
  modulesForRole,
} from "../knowledge";
import { isContextQuestion, searchKnowledge } from "../search";
import { uid } from "../assistantService";
import type {
  AssistantContext,
  AssistantProvider,
  AssistantQuery,
  AssistantReply,
  AssistantRole,
  KnowledgeEntry,
  Suggestion,
} from "../types";

/* ------------------------------------------------------------------ */
/* Reply shaping                                                       */
/* ------------------------------------------------------------------ */

/** Related ids → follow-up chips, dropping anything this role cannot see. */
function followUpsFor(
  entry: KnowledgeEntry,
  role: AssistantRole
): AssistantReply["followUps"] {
  return (entry.related ?? [])
    .map((id) => entryById(id, role))
    .filter((e): e is KnowledgeEntry => e !== null)
    .map((e) => ({ id: e.id, question: e.question }));
}

/** A knowledge entry rendered as a reply. */
function replyFromEntry(
  entry: KnowledgeEntry,
  role: AssistantRole,
  confidence: number
): AssistantReply {
  return {
    id: uid("reply"),
    title: entry.question,
    body: entry.answer,
    steps: entry.steps,
    tips: entry.tips,
    actions: entry.actions,
    followUps: followUpsFor(entry, role),
    source: "knowledge",
    confidence,
    entryId: entry.id,
    moduleId: entry.module,
  };
}

/**
 * "What does this page do?" - answered from the module owning the current
 * route, with that module's own questions offered as follow-ups.
 */
function replyFromContext(context: AssistantContext): AssistantReply {
  const { module, role } = context;

  if (!module) {
    return {
      id: uid("reply"),
      body: "I can't tell which module you're in from here. Open one of the areas in the left rail and ask me again - or pick a question below.",
      followUps: featuredFollowUps(role, FALLBACK_ALTERNATIVES),
      source: "fallback",
      confidence: 0.3,
    };
  }

  const questions = module.entries
    .filter((e) => allowsRole(e.roles, role))
    .slice(0, 3)
    .map((e) => ({ id: e.id, question: e.question }));

  return {
    id: uid("reply"),
    title: module.name,
    body: module.summary,
    actions: module.quickActions,
    followUps: questions,
    source: "context",
    confidence: 0.95,
    moduleId: module.id,
  };
}

/** Featured questions as follow-up chips - the "here's what I know" list. */
function featuredFollowUps(
  role: AssistantRole,
  limit: number
): AssistantReply["followUps"] {
  return entriesForRole(role)
    .filter((e) => e.featured)
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, limit)
    .map((e) => ({ id: e.id, question: e.question }));
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export const localKnowledgeProvider: AssistantProvider = {
  id: "local-knowledge",
  label: "Nexora guide",

  async ask(query: AssistantQuery, context: AssistantContext) {
    const { role } = context;

    // 1. A chip or quick action names its entry outright - no matching needed.
    if (query.entryId) {
      const entry = entryById(query.entryId, role);
      if (entry) return replyFromEntry(entry, role, 1);
    }

    const text = query.text.trim();
    if (!text) return replyFromContext(context);

    // 2. "What does this page do?" is answered from where the user is standing.
    if (isContextQuestion(text)) return replyFromContext(context);

    // 3. Otherwise match against the knowledge base, with a nudge toward the
    //    current module so "how do I add one?" means the right thing.
    const options = {
      role,
      contextModule: context.module?.id ?? null,
      limit: FALLBACK_ALTERNATIVES + 1,
    };
    const ranked = searchKnowledge(text, options);
    const top = ranked[0];

    if (top && top.score >= LOW_CONFIDENCE) {
      const reply = replyFromEntry(top.entry, role, top.score);
      // Confident but not certain: offer the runners-up so a near-miss is one
      // click from the right answer instead of a dead end.
      if (top.score < 0.8) {
        const alternatives = ranked
          .slice(1, 3)
          .map((r) => ({ id: r.entry.id, question: r.entry.question }));
        reply.followUps = [...(reply.followUps ?? []), ...alternatives].slice(0, 4);
      }
      return reply;
    }

    // 4. Weak or no match - say so plainly and hand back the best guesses.
    const alternatives = ranked.length
      ? ranked
          .slice(0, FALLBACK_ALTERNATIVES)
          .map((r) => ({ id: r.entry.id, question: r.entry.question }))
      : featuredFollowUps(role, FALLBACK_ALTERNATIVES);

    return {
      id: uid("reply"),
      body: ranked.length ? STRINGS.lowConfidence : STRINGS.noMatch,
      followUps: alternatives,
      actions: context.module?.quickActions,
      source: "fallback",
      confidence: top?.score ?? 0,
    };
  },

  suggest(context: AssistantContext, limit = SUGGESTION_LIMIT): Suggestion[] {
    const { role, module } = context;
    const toSuggestion = (e: KnowledgeEntry): Suggestion => ({
      entryId: e.id,
      question: e.question,
      moduleId: e.module,
    });

    // Questions about where the user already is lead, then the app-wide
    // favourites - so suggestions feel situational rather than generic.
    const local = (module?.entries ?? [])
      .filter((e) => allowsRole(e.roles, role))
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      .slice(0, 2)
      .map(toSuggestion);

    const global = entriesForRole(role)
      .filter((e) => e.featured)
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      .map(toSuggestion);

    const seen = new Set<string>();
    return [...local, ...global]
      .filter((s) => !seen.has(s.entryId) && seen.add(s.entryId))
      .slice(0, limit);
  },
};

/**
 * Quick actions for the panel header - the current module's, falling back to
 * the primary route of each area this role can reach.
 */
export function quickActionsFor(context: AssistantContext) {
  if (context.module?.quickActions?.length) return context.module.quickActions;
  return modulesForRole(context.role)
    .slice(0, 4)
    .map((m) => ({
      label: m.name,
      to: m.primaryRoute,
      icon: m.icon,
    }));
}
