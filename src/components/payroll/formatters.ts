/**
 * Payroll - presentation helpers.
 *
 * Formatting lives strictly outside {@link engine}: the engine produces numbers,
 * this file turns them into strings. Keeping the split means a currency or
 * locale change can never alter a calculation.
 */
import type { PayrollPeriod, PeriodKey } from "./types";

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

// Intl formatters are expensive to construct; cache one per currency.
const formatterCache = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;

  let fmt: Intl.NumberFormat;
  try {
    fmt = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: compact ? 1 : 0,
      notation: compact ? "compact" : "standard",
    });
  } catch {
    // Unknown/invalid ISO code - fall back to plain grouped numbers.
    fmt = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: compact ? 1 : 0,
      notation: compact ? "compact" : "standard",
    });
  }
  formatterCache.set(key, fmt);
  return fmt;
}

/** Full currency string, e.g. "₨ 250,000". Decimals are dropped - payroll
 *  figures read better whole, and the engine already rounds to 2dp. */
export const formatMoney = (amount: number, currency: string): string =>
  formatterFor(currency, false).format(Number.isFinite(amount) ? amount : 0);

/** Compact form for KPI tiles where space is tight, e.g. "₨ 4.2M". */
export const formatMoneyCompact = (amount: number, currency: string): string =>
  formatterFor(currency, true).format(Number.isFinite(amount) ? amount : 0);

// Separate cache: this one keeps the cents, which formatMoney deliberately
// drops. Only the dashboard headline figures use it.
const preciseCache = new Map<string, Intl.NumberFormat>();

function preciseFormatter(currency: string): Intl.NumberFormat {
  const cached = preciseCache.get(currency);
  if (cached) return cached;
  let fmt: Intl.NumberFormat;
  try {
    fmt = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    fmt = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  preciseCache.set(currency, fmt);
  return fmt;
}

/**
 * Split a formatted amount into the part to show large and the trailing cents
 * to show small and muted, e.g. `{ main: "$12,135", cents: ".69" }`.
 *
 * Uses `formatToParts` rather than splitting on ".", because the decimal
 * separator is a comma in most of the locales this app ships with.
 */
export const splitMoney = (
  amount: number,
  currency: string
): { main: string; cents: string } => {
  const safe = Number.isFinite(amount) ? amount : 0;
  const parts = preciseFormatter(currency).formatToParts(safe);
  const cut = parts.findIndex((p) => p.type === "decimal");
  if (cut === -1) return { main: parts.map((p) => p.value).join(""), cents: "" };
  return {
    main: parts.slice(0, cut).map((p) => p.value).join(""),
    cents: parts.slice(cut).map((p) => p.value).join(""),
  };
};

/** Grouped number with no currency - for inputs and exports. */
export const formatNumber = (amount: number): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    Number.isFinite(amount) ? amount : 0
  );

/** Parse a user-typed amount ("1,20,000" / "₨ 50000") back to a number. */
export const parseAmount = (input: string): number => {
  const cleaned = input.replace(/[^\d.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

/* ------------------------------------------------------------------ */
/* Periods                                                             */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Sortable, storage-safe identifier, e.g. { 2026, 8 } → "2026-08". */
export const periodKey = (p: PayrollPeriod): PeriodKey =>
  `${p.year}-${String(p.month).padStart(2, "0")}`;

export const parsePeriodKey = (key: PeriodKey): PayrollPeriod => {
  const [y, m] = key.split("-");
  return { year: Number(y), month: Number(m) };
};

/** "August 2026" */
export const formatPeriod = (p: PayrollPeriod): string =>
  `${MONTHS[Math.min(11, Math.max(0, p.month - 1))]} ${p.year}`;

/** "Aug 2026" - for tight table cells. */
export const formatPeriodShort = (p: PayrollPeriod): string =>
  `${MONTHS[Math.min(11, Math.max(0, p.month - 1))].slice(0, 3)} ${p.year}`;

export const currentPeriod = (): PayrollPeriod => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

export const samePeriod = (a: PayrollPeriod, b: PayrollPeriod): boolean =>
  a.year === b.year && a.month === b.month;

/** Shift a period by ±n months, rolling the year over correctly. */
export const shiftPeriod = (p: PayrollPeriod, delta: number): PayrollPeriod => {
  const zero = p.year * 12 + (p.month - 1) + delta;
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
};

/** The `count` periods ending at `end`, newest first. Drives the period picker. */
export const recentPeriods = (
  count: number,
  end: PayrollPeriod = currentPeriod()
): PayrollPeriod[] =>
  Array.from({ length: count }, (_, i) => shiftPeriod(end, -i));

/**
 * The pay date for a period, clamping the configured day to the month's length
 * so "31" still works in February.
 */
export const payDateFor = (p: PayrollPeriod, salaryDate: number): string => {
  const lastDay = new Date(p.year, p.month, 0).getDate();
  const day = Math.min(Math.max(1, Math.round(salaryDate) || 1), lastDay);
  // Noon avoids the date shifting a day under negative UTC offsets.
  return new Date(p.year, p.month - 1, day, 12).toISOString();
};

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** 1 → "1st", 22 → "22nd". Used for the configured salary day. */
export const ordinal = (n: number): string => {
  const v = Math.round(n);
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${v}th`;
  switch (v % 10) {
    case 1:
      return `${v}st`;
    case 2:
      return `${v}nd`;
    case 3:
      return `${v}rd`;
    default:
      return `${v}th`;
  }
};

/** "40%" / "₨ 5,000" - how a component's raw value should read in a table. */
export const formatComponentValue = (
  mode: string,
  value: number,
  currency: string
): string => (mode === "fixed" ? formatMoney(value, currency) : `${value}%`);
