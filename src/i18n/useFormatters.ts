/**
 * Locale-aware date and number formatting.
 *
 * Translating UI strings is only half of i18n — dates, months and weekday names
 * are user-visible content too. Before this existed, the app called
 * `toLocaleDateString("en-US", …)` or `toLocaleDateString(undefined, …)` in 35
 * places: the first pins output to English regardless of the chosen language,
 * the second follows the *browser's* locale, which has nothing to do with the
 * language the user picked in Nexora. Either way, switching to Urdu or Japanese
 * left chart axes, holiday cards and timestamps in English.
 *
 * Everything here derives its locale from the active i18next language, so date
 * output follows the language switcher like every other string.
 */
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

/** Cache formatters — constructing `Intl.*` is expensive relative to reuse. */
const dateCache = new Map<string, Intl.DateTimeFormat>();
const numberCache = new Map<string, Intl.NumberFormat>();

const asDate = (value: string | number | Date): Date | null => {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

function dateFormatter(
  locale: string,
  opts: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(opts);
  let f = dateCache.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(locale, opts);
    } catch {
      f = new Intl.DateTimeFormat("en", opts);
    }
    dateCache.set(key, f);
  }
  return f;
}

function numberFormatter(
  locale: string,
  opts: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const key = locale + JSON.stringify(opts);
  let f = numberCache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, opts);
    } catch {
      f = new Intl.NumberFormat("en", opts);
    }
    numberCache.set(key, f);
  }
  return f;
}

/* ------------------------------------------------------------------ */
/* Non-hook API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Format a date in an explicit locale. Use the hook below inside components;
 * this exists for module-scope helpers that already receive a language.
 */
export const formatDateIn = (
  locale: string,
  value: string | number | Date,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string => {
  const d = asDate(value);
  return d ? dateFormatter(locale, opts).format(d) : "—";
};

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export interface Formatters {
  /** Active BCP-47 locale, e.g. "ur". */
  locale: string;
  /** "12 Aug 2026" — the default medium date. */
  date: (value: string | number | Date, opts?: Intl.DateTimeFormatOptions) => string;
  /** "12 August 2026" */
  dateLong: (value: string | number | Date) => string;
  /** "12 Aug 2026, 14:30" */
  dateTime: (value: string | number | Date) => string;
  /** "Aug" — short month, for chart axes. */
  monthShort: (monthIndex: number) => string;
  /** "August" */
  monthLong: (monthIndex: number) => string;
  /** "Friday" */
  weekday: (value: string | number | Date) => string;
  /** Grouped number in the active locale. */
  number: (value: number, opts?: Intl.NumberFormatOptions) => string;
}

/**
 * Locale-bound formatters for the active language.
 *
 * The returned object is memoised on the language, so it is a stable dependency
 * for `useMemo` — and, like `t`, it *changes* when the language changes, which
 * is what makes dates re-render on a switch.
 */
export function useFormatters(): Formatters {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const date = useCallback(
    (v: string | number | Date, opts?: Intl.DateTimeFormatOptions) =>
      formatDateIn(locale, v, opts),
    [locale]
  );

  return useMemo<Formatters>(
    () => ({
      locale,
      date,
      dateLong: (v) =>
        formatDateIn(locale, v, { year: "numeric", month: "long", day: "numeric" }),
      dateTime: (v) =>
        formatDateIn(locale, v, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      // Month index is 0-based. Day 1 of a fixed year avoids DST edge cases.
      monthShort: (i) =>
        dateFormatter(locale, { month: "short" }).format(new Date(2000, i, 1)),
      monthLong: (i) =>
        dateFormatter(locale, { month: "long" }).format(new Date(2000, i, 1)),
      weekday: (v) => {
        const d = asDate(v);
        return d ? dateFormatter(locale, { weekday: "long" }).format(d) : "—";
      },
      number: (v, opts) =>
        Number.isFinite(v) ? numberFormatter(locale, opts ?? {}).format(v) : "—",
    }),
    [locale, date]
  );
}
