import type { RosterDayRow } from "./RosterTables";

/**
 * How a day's roster is ordered and grouped.
 *
 * Shared by every list that shows one day of the roster, so the order a phone
 * reads in and the order a laptop reads in cannot drift apart.
 */

/** Arrivals first and in order, then everyone the device did not see. */
export const byArrival = (a: RosterDayRow, b: RosterDayRow) => {
  if (a.checkInAt && b.checkInAt) return a.checkInAt.localeCompare(b.checkInAt);
  if (a.checkInAt) return -1;
  if (b.checkInAt) return 1;
  return a.name.localeCompare(b.name);
};

/**
 * The order the groups appear in, which is the order the day happens in: the
 * people who were on time arrived before the people who were late. Everything
 * that is not an arrival follows.
 */
export const GROUP_ORDER = [
  "On time",
  "Present",
  "Late",
  "Work from home",
  "On leave",
  "Absent",
  "No record",
  "Weekend",
];

export interface RosterGroup {
  status: string;
  rows: RosterDayRow[];
}

/** Rows filed under their status, in the order above. */
export function groupByStatus(rows: RosterDayRow[]): RosterGroup[] {
  const byStatus = new Map<string, RosterDayRow[]>();
  for (const row of rows) {
    const list = byStatus.get(row.status);
    if (list) list.push(row);
    else byStatus.set(row.status, [row]);
  }

  const known = GROUP_ORDER.filter((status) => byStatus.has(status));
  // Anything the server sends that this file has not been told about still
  // gets a section rather than disappearing.
  const rest = [...byStatus.keys()].filter(
    (status) => !GROUP_ORDER.includes(status)
  );

  return [...known, ...rest].map((status) => ({
    status,
    rows: byStatus.get(status) as RosterDayRow[],
  }));
}
