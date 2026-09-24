import type { RosterTotals } from "./RosterTables";

/**
 * One colour per attendance state, and the two readings a day's counts have.
 *
 * The colours are CSS custom properties rather than resolved hexes. Both other
 * per-status maps in this folder resolve early - StatusBadge bakes Tailwind
 * classes, `statusColor()` reads the computed value at call time - and neither
 * suits a bar or a rail drawn with an inline `style`, where a resolved hex is
 * frozen at the render that produced it and a theme switch leaves it stale.
 * A `var()` follows the theme with no re-render at all.
 */

export interface Tone {
  /** The state's colour: rails, dots, bar segments. */
  ink: string;
  /** The same colour as a wash, for a tile or a chip behind text. */
  soft: string;
}

const TONE: Record<string, Tone> = {
  "On time": { ink: "var(--success)", soft: "var(--success-soft)" },
  Present: { ink: "var(--success)", soft: "var(--success-soft)" },
  Late: { ink: "var(--warning)", soft: "var(--warning-soft)" },
  Absent: { ink: "var(--danger)", soft: "var(--danger-soft)" },
  "No record": { ink: "var(--danger)", soft: "var(--danger-soft)" },
  "On leave": { ink: "var(--tone-leave)", soft: "var(--tone-leave-soft)" },
  "Work from home": { ink: "var(--tone-remote)", soft: "var(--tone-remote-soft)" },
  Weekend: { ink: "var(--text-muted)", soft: "var(--surface-hover)" },
};

export const toneOf = (status: string): Tone => TONE[status] || TONE["No record"];

/* ------------------------------------------------------------------ */
/* A day's counts                                                      */
/* ------------------------------------------------------------------ */

export interface DaySlice {
  /** The row status this count stands for, so a filter can match on it. */
  status: string;
  label: string;
  value: number;
  ink: string;
}

/** The five states a working day is read as, in the order the day happens in. */
export const daySlices = (
  totals: RosterTotals,
  isSelfView = false
): DaySlice[] => {
  const present = isSelfView ? "On time" : "Present";
  return [
    { status: present, label: present, value: totals.onTime, ink: toneOf("On time").ink },
    { status: "Late", label: "Late", value: totals.late, ink: toneOf("Late").ink },
    { status: "Absent", label: "Absent", value: totals.absent, ink: toneOf("Absent").ink },
    { status: "On leave", label: "On leave", value: totals.onLeave, ink: toneOf("On leave").ink },
    {
      status: "Work from home",
      label: "Work from home",
      value: totals.workFromHome,
      ink: toneOf("Work from home").ink,
    },
  ];
};

/**
 * How much of the day was actually attended, as a percentage.
 *
 * Approved leave is in neither half. Someone whose day off was signed for did
 * not fail to turn up, and counting them against the office would mean a team
 * could only reach 100% by nobody ever taking leave. So the denominator is the
 * people who were expected at work - present, late, absent and remote - and
 * the numerator is those of them who worked, from the office or from home.
 *
 * A day nobody was expected on has no rate rather than a zero: 0% reads as a
 * failure, and a public holiday is not one.
 */
export const attendanceRate = (totals: RosterTotals): number | null => {
  const expected =
    totals.onTime + totals.late + totals.absent + totals.workFromHome;
  if (!expected) return null;
  const attended = totals.onTime + totals.late + totals.workFromHome;
  return Math.round((attended / expected) * 100);
};
