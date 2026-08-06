/**
 * Nexora Assistant - intent matching.
 *
 * A small, dependency-free scorer that maps free text onto knowledge entries.
 * It is deliberately transparent rather than clever: exact phrasings win,
 * then aliases, then token coverage across question/alias/keyword text, with
 * a nudge for the module the user is currently standing in.
 *
 * Everything here is pure - no React, no storage, no side effects - so it can
 * be reasoned about and unit-tested on its own, and so the provider layer can
 * decide *what to do* with a weak match rather than having that baked in.
 */
import type { AssistantRole, KnowledgeEntry, ModuleId } from "./types";
import { entriesForRole } from "./knowledge";

/* ------------------------------------------------------------------ */
/* Text normalisation                                                  */
/* ------------------------------------------------------------------ */

/** Words that carry no intent - dropped before scoring. */
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "could", "do",
  "does", "for", "from", "get", "how", "i", "in", "is", "it", "me", "my", "of",
  "on", "or", "please", "the", "to", "want", "was", "what", "when", "where",
  "which", "who", "why", "will", "with", "you", "your", "we", "our", "us",
  "there", "this", "that", "s", "if", "am", "any",
]);

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalise(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Crude singularisation - enough to make "payslips" match "payslip". */
const stem = (word: string): string =>
  word.length > 3 && word.endsWith("s") && !word.endsWith("ss")
    ? word.slice(0, -1)
    : word;

/** Meaningful, stemmed tokens. */
export function tokenise(text: string): string[] {
  return normalise(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .map(stem);
}

/* ------------------------------------------------------------------ */
/* Context intent                                                      */
/* ------------------------------------------------------------------ */

/**
 * Phrasings that mean "explain where I am". Handled before entry matching so
 * the answer can be drawn from the current module rather than the index.
 */
const CONTEXT_PATTERNS = [
  /what (does|is) this (page|screen|module|section)/,
  /what (is|are) this( for)?$/,
  /what am i (looking at|seeing)/,
  /explain this (page|screen|module|section)/,
  /where am i/,
  /what can i do (here|on this page)/,
  /help (me )?(with|on) this (page|screen)/,
  /tell me about this (page|module|screen)/,
];

/** True when the question is about the user's current location. */
export function isContextQuestion(text: string): boolean {
  const n = normalise(text);
  return CONTEXT_PATTERNS.some((re) => re.test(n));
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

export interface ScoredEntry {
  entry: KnowledgeEntry;
  /** 0-1. Compared against `LOW_CONFIDENCE` by the provider. */
  score: number;
}

/** How much a token match is worth, by where it was found. */
const FIELD_WEIGHT = { question: 1, alias: 0.9, keyword: 0.82 } as const;

/** Coverage maps onto this band, leaving room above for exact matches. */
const BASE_SCORE = 0.18;
const COVERAGE_SPAN = 0.72;

/** Being inside the module the entry belongs to is real evidence. */
const CONTEXT_BOOST = 0.07;

function scoreEntry(
  entry: KnowledgeEntry,
  query: string,
  queryTokens: string[],
  contextModule?: ModuleId | null
): number {
  const q = normalise(query);
  if (!q) return 0;

  const question = normalise(entry.question);
  const aliases = (entry.aliases ?? []).map(normalise);

  let score = 0;

  /* --- Tier 1: the user typed (near enough) the canonical phrasing --- */
  if (q === question) score = 1;
  else if (aliases.includes(q)) score = 0.96;
  else if (q.length >= 6 && (question.includes(q) || q.includes(question)))
    score = 0.88;
  else if (
    q.length >= 6 &&
    aliases.some((a) => a.includes(q) || q.includes(a))
  )
    score = 0.84;

  /* --- Tier 2: token coverage across every searchable field --- */
  if (score === 0) {
    if (!queryTokens.length) return 0;

    const questionTokens = new Set(tokenise(entry.question));
    const aliasTokens = new Set((entry.aliases ?? []).flatMap(tokenise));
    const keywordTokens = new Set((entry.keywords ?? []).flatMap(tokenise));

    let matched = 0;
    let hits = 0;
    for (const token of queryTokens) {
      const weight = questionTokens.has(token)
        ? FIELD_WEIGHT.question
        : aliasTokens.has(token)
          ? FIELD_WEIGHT.alias
          : keywordTokens.has(token)
            ? FIELD_WEIGHT.keyword
            : 0;
      if (weight > 0) {
        matched += weight;
        hits += 1;
      }
    }

    // Nothing landed - and a single stray hit out of a long question is noise,
    // not a match, so it needs to represent a real share of what was asked.
    if (!hits) return 0;
    const coverage = matched / queryTokens.length;
    if (hits === 1 && queryTokens.length > 3) return 0;

    score = BASE_SCORE + COVERAGE_SPAN * Math.min(1, coverage);
  }

  /* --- Tier 3: nudges --- */
  if (contextModule && entry.module === contextModule) score += CONTEXT_BOOST;
  score += (entry.weight ?? 0) * 0.008;

  return Math.min(1, score);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface SearchOptions {
  role: AssistantRole;
  /** Module the user is currently viewing, for the context nudge. */
  contextModule?: ModuleId | null;
  limit?: number;
  /** Scores below this are discarded entirely. */
  floor?: number;
}

/** Entries ranked by how well they answer `query`, best first. */
export function searchKnowledge(
  query: string,
  { role, contextModule, limit = 6, floor = 0.2 }: SearchOptions
): ScoredEntry[] {
  const tokens = tokenise(query);
  return entriesForRole(role)
    .map((entry) => ({
      entry,
      score: scoreEntry(entry, query, tokens, contextModule),
    }))
    .filter((r) => r.score >= floor)
    .sort(
      (a, b) => b.score - a.score || (b.entry.weight ?? 0) - (a.entry.weight ?? 0)
    )
    .slice(0, limit);
}

/** The single best match, or null when nothing clears the floor. */
export function bestMatch(
  query: string,
  options: SearchOptions
): ScoredEntry | null {
  return searchKnowledge(query, { ...options, limit: 1 })[0] ?? null;
}
