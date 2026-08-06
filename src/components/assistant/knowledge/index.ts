/**
 * Nexora Assistant - knowledge base registry.
 *
 * ## Adding help for a new feature requires no edit here
 *
 * Packs are discovered at build time with Vite's `import.meta.glob`, exactly
 * like the i18n language registry. Dropping a `knowledge/modules/<name>.ts`
 * that default-exports a {@link KnowledgeModule} is enough - it is indexed,
 * searchable, route-aware and eligible for suggestions from that moment on.
 *
 * This module owns the *shape* of the knowledge base (indexes, lookups, role
 * filtering). How a question is matched to an entry lives in `../search.ts`;
 * how an answer is produced lives in `../providers/`.
 */
import type {
  AssistantRole,
  KnowledgeEntry,
  KnowledgeModule,
  ModuleId,
} from "../types";
import { normalisePath } from "../paths";

export { normalisePath };

/* ------------------------------------------------------------------ */
/* Discovery                                                           */
/* ------------------------------------------------------------------ */

const packs = import.meta.glob<{ default: KnowledgeModule }>(
  "./modules/*.ts",
  { eager: true }
);

/**
 * Display order for module lists (suggestions, the "what I can help with"
 * fallback). Anything not named here sorts last, alphabetically - so a new
 * pack still works before anyone thinks about where it belongs.
 */
const DISPLAY_ORDER: ModuleId[] = [
  "general",
  "leave",
  "attendance",
  "people",
  "payroll",
  "announcements",
  "voice",
  "documents",
  "reports",
  "account",
];

const orderOf = (id: ModuleId) => {
  const i = DISPLAY_ORDER.indexOf(id);
  return i === -1 ? DISPLAY_ORDER.length : i;
};

/** Every knowledge module the app ships, in display order. */
export const MODULES: KnowledgeModule[] = Object.values(packs)
  .map((m) => m.default)
  .sort((a, b) => orderOf(a.id) - orderOf(b.id) || a.name.localeCompare(b.name));

/** Modules keyed by id. */
export const MODULE_BY_ID: Record<string, KnowledgeModule> = MODULES.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<string, KnowledgeModule>
);

/** Flat list of every entry across every module. */
export const ENTRIES: KnowledgeEntry[] = MODULES.flatMap((m) => m.entries);

/** Entries keyed by id - the lookup behind follow-up chips and quick actions. */
export const ENTRY_BY_ID: Record<string, KnowledgeEntry> = ENTRIES.reduce(
  (acc, e) => {
    acc[e.id] = e;
    return acc;
  },
  {} as Record<string, KnowledgeEntry>
);

/* ------------------------------------------------------------------ */
/* Route → module                                                      */
/* ------------------------------------------------------------------ */

/**
 * Route claims, most specific first. Sorting by length means `/payroll/run`
 * is tested before `/payroll`, and `/leave-policies` before `/leaves` - so a
 * module never steals a sibling's route by being registered earlier.
 */
const ROUTE_CLAIMS: Array<{ route: string; module: KnowledgeModule }> = MODULES
  .flatMap((m) => m.routes.map((route) => ({ route, module: m })))
  .sort((a, b) => b.route.length - a.route.length);

/**
 * The module that owns a pathname - the basis of every context-aware answer.
 * `/` is matched exactly so the dashboard does not swallow the whole app.
 */
export function moduleForPath(pathname: string): KnowledgeModule | null {
  const path = normalisePath(pathname);
  if (path === "/") return MODULE_BY_ID.general ?? null;
  const hit = ROUTE_CLAIMS.find(
    ({ route }) =>
      route !== "/" && (path === route || path.startsWith(`${route}/`))
  );
  return hit?.module ?? null;
}

/* ------------------------------------------------------------------ */
/* Role filtering                                                      */
/* ------------------------------------------------------------------ */

/** `roles` omitted means "everyone". */
export const allowsRole = (
  roles: AssistantRole[] | undefined,
  role: AssistantRole
): boolean => !roles || roles.includes(role);

/**
 * Entries a role may see. A module-level restriction cascades to its entries,
 * so an employee can never be handed payroll instructions they cannot follow.
 */
export function entriesForRole(role: AssistantRole): KnowledgeEntry[] {
  return MODULES.filter((m) => allowsRole(m.roles, role)).flatMap((m) =>
    m.entries.filter((e) => allowsRole(e.roles, role))
  );
}

/** Modules a role may see. */
export function modulesForRole(role: AssistantRole): KnowledgeModule[] {
  return MODULES.filter((m) => allowsRole(m.roles, role));
}

/** Safe lookup honouring role visibility. */
export function entryById(
  id: string,
  role: AssistantRole
): KnowledgeEntry | null {
  const entry = ENTRY_BY_ID[id];
  if (!entry) return null;
  const module = MODULE_BY_ID[entry.module];
  if (module && !allowsRole(module.roles, role)) return null;
  return allowsRole(entry.roles, role) ? entry : null;
}
