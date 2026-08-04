/**
 * i18n — locale context.
 *
 * A deliberately thin layer on top of react-i18next. `useTranslation()` already
 * handles re-rendering on a language change, so this provider does not
 * duplicate that. It owns the two things react-i18next does not:
 *
 *  1. Reflecting the active language onto `<html lang>` and `<html dir>`, which
 *     drives RTL layout, browser hyphenation, spell-check and screen readers.
 *  2. Exposing the language registry plus a `setLanguage` action, so UI can
 *     switch languages without importing i18next directly.
 *
 * It mirrors `ThemeContext`'s shape on purpose — same persistence approach,
 * same "write the choice onto <html>" strategy — so the two feel like one
 * system to anyone reading the codebase.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  LANGUAGES,
  SUPPORTED_LANGUAGES,
  directionOf,
  languageMeta,
  type LanguageMeta,
  type TextDirection,
} from "./config";

interface LocaleContextValue {
  /** Active language code, e.g. "ur". */
  language: string;
  /** Metadata for the active language. */
  meta: LanguageMeta;
  /** Every shipped language, ordered for display. */
  languages: LanguageMeta[];
  /** Switch language. Persists automatically via the i18next detector cache. */
  setLanguage: (code: string) => void;
  dir: TextDirection;
  isRTL: boolean;
  /** True while a language switch is fetching its resource chunks. */
  isChanging: boolean;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  // i18n.resolvedLanguage collapses regional codes ("de-AT" → "de") and is the
  // value actually used to look resources up, so it is what the UI must show.
  const language = i18n.resolvedLanguage ?? i18n.language;
  const dir = directionOf(language);

  /**
   * Reflect the language onto the document element.
   *
   * `dir` is what makes RTL work: it flips inline layout, flex row order and
   * text alignment natively, and it is the hook every `[dir="rtl"]` rule in
   * `styles/rtl.css` keys off. `lang` drives font selection and accessibility.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", language);
    root.setAttribute("dir", dir);
  }, [language, dir]);

  const setLanguage = useCallback(
    (code: string) => {
      if (!SUPPORTED_LANGUAGES.includes(code) || code === language) return;
      setIsChanging(true);
      // changeLanguage resolves once the new language's already-active
      // namespaces have loaded, so the UI never shows a half-translated frame.
      void i18n.changeLanguage(code).finally(() => setIsChanging(false));
    },
    [i18n, language]
  );

  const languages = useMemo(
    () => SUPPORTED_LANGUAGES.map((code) => LANGUAGES[code]),
    []
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      meta: languageMeta(language),
      languages,
      setLanguage,
      dir,
      isRTL: dir === "rtl",
      isChanging,
    }),
    [language, languages, setLanguage, dir, isChanging]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

/** Access the active locale, the registry and the language switcher action. */
export const useLocale = (): LocaleContextValue => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
};
