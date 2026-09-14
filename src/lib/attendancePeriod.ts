/**
 * The four windows the attendance screens report on.
 *
 * One definition, shared by the dashboard section and the attendance page, so
 * "This month" cannot mean one thing on the home screen and another on the
 * page it links to.
 *
 * Dates are built from the browser's own calendar rather than from an ISO
 * string. toISOString() answers in UTC, which in a positive-offset office names
 * yesterday for the whole of the early morning - and "today" naming yesterday
 * is the one thing this filter must never do.
 */

export type PeriodKey = "today" | "last7" | "month" | "last3m";

export interface PeriodRange {
  key: PeriodKey;
  /** YYYY-MM-DD, inclusive. */
  from: string;
  to: string;
  label: string;
  /**
   * Whether the server should send a row per employee-day, or only the
   * grouped counts. A quarter of employee-days is a report, not a table.
   */
  detail: "day" | "summary";
}

const pad = (n: number) => String(n).padStart(2, "0");

/** A Date as the calendar day it is locally. */
const isoOf = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "last3m", label: "Last 3 months" },
];

export function periodRange(key: PeriodKey): PeriodRange {
  const now = new Date();
  const to = isoOf(now);

  switch (key) {
    case "last7": {
      // Seven days counting today, so the window is the week just worked
      // rather than eight days with one of them half over.
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return {
        key,
        from: isoOf(start),
        to,
        label: "Last 7 days",
        detail: "day",
      };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        key,
        from: isoOf(start),
        to,
        // Month to date, never past today: a working day nobody has lived
        // through yet cannot be attended or missed.
        label: now.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        }),
        detail: "summary",
      };
    }
    case "last3m": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      start.setDate(start.getDate() + 1);
      return {
        key,
        from: isoOf(start),
        to,
        label: "Last 3 months",
        detail: "summary",
      };
    }
    case "today":
    default:
      return {
        key: "today",
        from: to,
        to,
        label: now.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        detail: "day",
      };
  }
}

/** "2026-09-14" as "14 Sep 2026", in the reader's locale. */
export function formatIsoDate(iso: string, withWeekday = false): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  // Built in UTC and read back in UTC, so the weekday cannot shift a day in a
  // negative-offset browser.
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    timeZone: "UTC",
    ...(withWeekday ? { weekday: "short" } : {}),
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
