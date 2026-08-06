// ============================================================================
// Public Holidays
// ----------------------------------------------------------------------------
// Two sources of truth:
//   1. RECURRING - fixed-date holidays that fall on the same Gregorian date
//                   every year (e.g. Labour Day → 1 May). Always accurate.
//   2. SPECIFIC - movable / lunar holidays (Eid-ul-Fitr, Eid-ul-Adha, Ashura,
//                   Eid Milad-un-Nabi, etc.) whose Gregorian date shifts each
//                   year. These MUST be maintained per-year - add the confirmed
//                   dates as "YYYY-MM-DD" keys. We intentionally do NOT guess
//                   these, so nothing incorrect is shown.
//
// Default set: Pakistan. Edit the arrays below to localise for your country.
// ============================================================================

export interface Holiday {
  name: string;
  /** "public" = official day off, "observance" = notable but not a day off */
  type: "public" | "observance";
}

interface RecurringHoliday {
  month: number; // 1-12
  day: number; // 1-31
  name: string;
  type?: Holiday["type"];
}

// Fixed-date public holidays (same date every year).
const RECURRING: RecurringHoliday[] = [
  { month: 1, day: 1, name: "New Year's Day" },
  { month: 2, day: 5, name: "Kashmir Solidarity Day" },
  { month: 3, day: 23, name: "Pakistan Day" },
  { month: 5, day: 1, name: "Labour Day" },
  { month: 8, day: 14, name: "Independence Day" },
  { month: 11, day: 9, name: "Iqbal Day" },
  { month: 12, day: 25, name: "Quaid-e-Azam Day / Christmas" },
];

// Movable (lunar) holidays - keyed by exact "YYYY-MM-DD". Dates shift every year
// and are finalised by moon sighting / official government notification, so these
// MUST be reviewed annually.
//
//   2026 → official Government of Pakistan public-holiday schedule.
//   2027 → planning estimates (subject to moon sighting); confirm when notified.
const SPECIFIC: Record<string, Holiday> = {
  // ---- 2026 (official) ----
  // Eid-ul-Fitr (1 Shawwal 1447) - 21-23 Mar; 23 Mar also falls on Pakistan Day
  // (kept as Pakistan Day via the recurring list so both remain visible).
  "2026-03-21": { name: "Eid-ul-Fitr", type: "public" },
  "2026-03-22": { name: "Eid-ul-Fitr", type: "public" },
  // Eid-ul-Adha (10 Zil Haj 1447) - 27-29 May
  "2026-05-27": { name: "Eid-ul-Adha", type: "public" },
  "2026-05-28": { name: "Eid-ul-Adha", type: "public" },
  "2026-05-29": { name: "Eid-ul-Adha", type: "public" },
  // Ashura (9 & 10 Muharram 1448) - 24-25 Jun
  "2026-06-24": { name: "Ashura (9th Muharram)", type: "public" },
  "2026-06-25": { name: "Ashura (10th Muharram)", type: "public" },
  // Eid Milad-un-Nabi (12 Rabi-ul-Awwal 1448) - 25 Aug
  "2026-08-25": { name: "Eid Milad-un-Nabi", type: "public" },

  // ---- 2027 (estimated - confirm nearer the date) ----
  "2027-03-10": { name: "Eid-ul-Fitr", type: "public" },
  "2027-03-11": { name: "Eid-ul-Fitr", type: "public" },
  "2027-03-12": { name: "Eid-ul-Fitr", type: "public" },
  "2027-05-16": { name: "Eid-ul-Adha", type: "public" },
  "2027-05-17": { name: "Eid-ul-Adha", type: "public" },
  "2027-05-18": { name: "Eid-ul-Adha", type: "public" },
  "2027-06-13": { name: "Ashura (9th Muharram)", type: "public" },
  "2027-06-14": { name: "Ashura (10th Muharram)", type: "public" },
  "2027-08-15": { name: "Eid Milad-un-Nabi", type: "public" },
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Local (not UTC) date key, so it matches the calendar's local day cells. */
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Returns the holiday for a given date, or null if it isn't a holiday.
 * Specific (per-year) entries take precedence over recurring ones.
 */
export function getHoliday(date: Date): Holiday | null {
  const specific = SPECIFIC[dateKey(date)];
  if (specific) return specific;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const recurring = RECURRING.find((h) => h.month === month && h.day === day);
  if (recurring) return { name: recurring.name, type: recurring.type || "public" };

  return null;
}

export function isHoliday(date: Date): boolean {
  return getHoliday(date) !== null;
}

/** All holidays within a given year, sorted chronologically (for lists/upcoming). */
export function getHolidaysForYear(
  year: number
): Array<{ date: Date; holiday: Holiday }> {
  const items: Array<{ date: Date; holiday: Holiday }> = [];

  for (const h of RECURRING) {
    items.push({
      date: new Date(year, h.month - 1, h.day),
      holiday: { name: h.name, type: h.type || "public" },
    });
  }
  for (const [key, holiday] of Object.entries(SPECIFIC)) {
    const [y, m, d] = key.split("-").map(Number);
    if (y === year) items.push({ date: new Date(y, m - 1, d), holiday });
  }

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Upcoming holidays starting from `from` (inclusive), across this year and next.
 * Consecutive days of the same multi-day holiday (e.g. the three days of Eid)
 * are collapsed into a single entry using the holiday's base name.
 */
export function getUpcomingHolidays(
  from: Date = new Date(),
  limit = 4
): Array<{ date: Date; holiday: Holiday }> {
  const fromMidnight = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate()
  );
  const pool = [
    ...getHolidaysForYear(from.getFullYear()),
    ...getHolidaysForYear(from.getFullYear() + 1),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const baseName = (n: string) => n.split(" (")[0].trim();
  const out: Array<{ date: Date; holiday: Holiday }> = [];
  let lastBase = "";
  let lastTime = 0;

  for (const item of pool) {
    if (item.date < fromMidnight) continue;
    const t = item.date.getTime();
    const base = baseName(item.holiday.name);
    // Skip further days of the same holiday within a ~week window.
    if (base === lastBase && t - lastTime <= 6 * 24 * 60 * 60 * 1000) {
      lastTime = t;
      continue;
    }
    out.push({ date: item.date, holiday: { ...item.holiday, name: base } });
    lastBase = base;
    lastTime = t;
    if (out.length >= limit) break;
  }

  return out;
}
