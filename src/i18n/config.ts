/**
 * i18n - configuration and language registry.
 *
 * This file is the single source of truth for *which* languages exist and
 * *which* namespaces a language can provide. Nothing else in the application
 * hard-codes a language code.
 *
 * ## Adding a language requires no code change
 *
 * The registry is discovered at build time from the filesystem via Vite's
 * `import.meta.glob`. Dropping a new folder under `locales/` - containing a
 * `_meta.json` plus its namespace files - is enough: the language appears in
 * the switcher, gets its own lazily-loaded chunks and inherits English for any
 * key it has not translated yet. No registry edit, no logic edit.
 *
 * `_meta.json` carries the two facts that cannot be inferred from a folder
 * name: how the language writes its own name, and which direction it reads.
 */
/** Text direction. Urdu (and future Arabic/Hebrew) read right-to-left. */
export type TextDirection = "ltr" | "rtl";

/** Shape of every `locales/<code>/_meta.json`. */
export interface LanguageMeta {
  /** BCP-47 code, must match the folder name. */
  code: string;
  /** English name, for developer-facing surfaces and sorting. */
  name: string;
  /** The language's name in its own script - what users actually recognise. */
  nativeName: string;
  dir: TextDirection;
  /** Regional flag emoji used as a lightweight glyph in the switcher. */
  flag: string;
  /**
   * Sort order in the language switcher. Lower comes first; English is 0 so it
   * always leads. Ties fall back to alphabetical by `name`.
   */
  order?: number;
}

/* ------------------------------------------------------------------ */
/* Language discovery                                                  */
/* ------------------------------------------------------------------ */

// Eager: the registry is needed synchronously to render the switcher and to
// resolve the initial direction before first paint. These files are a few
// hundred bytes each, so eager loading all of them is cheaper than the
// round-trip a lazy load would cost.
const metaModules = import.meta.glob<{ default: LanguageMeta }>(
  "./locales/*/_meta.json",
  { eager: true },
);

/** Every language the app ships, keyed by code. */
export const LANGUAGES: Record<string, LanguageMeta> = Object.entries(
  metaModules,
).reduce<Record<string, LanguageMeta>>((acc, [path, mod]) => {
  // "./locales/de/_meta.json" → "de"
  const code = path.split("/")[2];
  acc[code] = { ...mod.default, code };
  return acc;
}, {});

/** Language codes, ordered for display. */
export const SUPPORTED_LANGUAGES: string[] = Object.values(LANGUAGES)
  .sort(
    (a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name),
  )
  .map((l) => l.code);

/** The language every other language falls back to, key by key. */
export const FALLBACK_LANGUAGE = "en";

/** Safe metadata lookup - unknown codes resolve to the fallback language. */
export const languageMeta = (code?: string | null): LanguageMeta =>
  (code && LANGUAGES[code]) || LANGUAGES[FALLBACK_LANGUAGE];

/** Direction for a language code. */
export const directionOf = (code?: string | null): TextDirection =>
  languageMeta(code).dir;

export const isRTL = (code?: string | null): boolean =>
  directionOf(code) === "rtl";

/* ------------------------------------------------------------------ */
/* Namespaces                                                          */
/* ------------------------------------------------------------------ */

/**
 * Translations are split per module rather than kept in one file, so a screen
 * downloads only the strings it actually renders. Namespace names match the
 * JSON filenames inside each locale folder.
 */
export const NAMESPACES = [
  "common", // buttons, states, validation, units - shared by everything
  "nav", // sidebar, rail, header chrome
  "auth", // login, register, invitations, password reset
  "dashboard",
  "employees",
  "leave",
  "attendance",
  "payroll",
  "announcements",
  "voice", // Employee Voice
  "documents", // Document Studio
  "notifications",
  "reports",
  "settings",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

/**
 * Namespaces loaded up-front, before the app renders. Everything else is
 * fetched on demand by the first component that asks for it.
 *
 * Keep this list minimal - it is the only i18n cost on the critical path.
 * `common` and `nav` qualify because the app shell renders them immediately on
 * every route.
 */
export const PRELOADED_NAMESPACES: Namespace[] = ["common", "nav"];

/** The namespace used when a component does not name one. */
export const DEFAULT_NAMESPACE: Namespace = "common";

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

/**
 * localStorage key holding the chosen language.
 *
 * Namespaced to match the app's other persisted keys (`nexora.payroll.v1`,
 * `nexora.documentStudio.v1`). To move the preference server-side later,
 * change the detection order in `i18n/index.ts` and hydrate from the user
 * profile - no component needs to change.
 */
export const LANGUAGE_STORAGE_KEY = "nexora.language";
