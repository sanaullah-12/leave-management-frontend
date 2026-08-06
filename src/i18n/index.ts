/**
 * i18n - runtime initialisation.
 *
 * Wires i18next with three plugins:
 *
 *  1. `resourcesToBackend` - resolves a (language, namespace) pair to a dynamic
 *     `import()`. Vite turns every locale JSON into its own chunk, so a visitor
 *     downloads only the languages *and* the modules they actually open.
 *  2. `LanguageDetector` - reads the stored preference, then the browser's
 *     language, then falls back to English.
 *  3. `initReactI18next` - the React bindings.
 *
 * Importing this module has the side effect of initialising i18next. It is
 * imported once from `main.tsx`, before the app renders.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import {
  DEFAULT_NAMESPACE,
  FALLBACK_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  NAMESPACES,
  PRELOADED_NAMESPACES,
  SUPPORTED_LANGUAGES,
} from "./config";

/* ------------------------------------------------------------------ */
/* Lazy resource loading                                               */
/* ------------------------------------------------------------------ */

// Lazy (no `eager`): each entry is a function returning a dynamic import, so
// Rollup emits one chunk per locale file and nothing is fetched until asked
// for. The glob pattern must be a literal for Vite to statically analyse it.
const resourceLoaders = import.meta.glob<{ default: Record<string, unknown> }>(
  "./locales/*/*.json"
);

/**
 * Resolve one namespace of one language.
 *
 * A missing file is not an error: a language is allowed to translate only some
 * modules, and i18next will fall through to `fallbackLng` for anything absent.
 * That is what makes it safe to add a language incrementally.
 */
async function loadResource(
  language: string,
  namespace: string
): Promise<Record<string, unknown>> {
  const key = `./locales/${language}/${namespace}.json`;
  const loader = resourceLoaders[key];
  if (!loader) return {};
  try {
    const mod = await loader();
    return mod.default ?? {};
  } catch {
    // A corrupt or unparseable bundle must degrade to the fallback language,
    // never take the screen down.
    return {};
  }
}

/* ------------------------------------------------------------------ */
/* Initialisation                                                      */
/* ------------------------------------------------------------------ */

/**
 * Resolves once i18next is initialised *and* the shell namespaces are in
 * memory. `main.tsx` awaits this before the first render so the sidebar and
 * header never paint in English and then snap to the user's language.
 *
 * The cost is one same-origin fetch of a sub-kilobyte chunk before paint,
 * which is a better trade than a visible flash of the wrong language.
 */
export const i18nReady: Promise<unknown> = i18n
  .use(resourcesToBackend(loadResource))
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,

    // Treat "de-AT" as "de": we ship language-level bundles, not regional ones.
    load: "languageOnly",
    nonExplicitSupportedLngs: true,

    ns: NAMESPACES as unknown as string[],
    defaultNS: DEFAULT_NAMESPACE,
    // A key missing from its own namespace falls back to `common`, which is
    // where genuinely shared strings ("Save", "Cancel") live.
    fallbackNS: DEFAULT_NAMESPACE,
    // Only these are fetched before the first render; the rest arrive on demand.
    preload: [],
    partialBundledLanguages: true,

    detection: {
      // Explicit user choice wins; otherwise honour the browser, then English.
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },

    interpolation: {
      // React escapes for us; double-escaping would mangle names with & or <.
      escapeValue: false,
    },

    react: {
      // Suspend while a namespace chunk downloads. The app already has Suspense
      // boundaries around every route (see App.tsx / Layout.tsx), so this
      // reuses the existing skeletons instead of introducing a second
      // loading vocabulary.
      useSuspense: true,
    },

    // Keys are human-readable English sentences in `common`, but module
    // namespaces use dotted paths - keep the separators standard.
    keySeparator: ".",
    nsSeparator: ":",

    // Surface missing keys loudly in development, silently in production.
    saveMissing: false,
    missingKeyHandler: import.meta.env.DEV
      ? (lngs, ns, key) => {
          console.warn(`[i18n] missing key "${ns}:${key}" for ${lngs.join(",")}`);
        }
      : undefined,
  })
  // Warm the shell namespaces. A failure here must not block boot - i18next
  // falls back to the key name, which is still a usable (if ugly) screen.
  .then(() => i18n.loadNamespaces(PRELOADED_NAMESPACES as unknown as string[]))
  .catch(() => undefined);

export default i18n;
