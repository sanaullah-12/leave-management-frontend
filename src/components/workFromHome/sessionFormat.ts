/**
 * How a work-from-home day is written down.
 *
 * Shared by the employee card, the summary, the admin monitor and the history
 * drawer, so the same session can never be described two different ways
 * depending on which screen is open.
 */

/** "03:24:18" - the running timer. Fixed width, so it does not jitter. */
export function formatStopwatch(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(
    Math.floor((total % 3600) / 60)
  )}:${pad(total % 60)}`;
}

/**
 * "3h 24m" - a duration in a table or a summary row.
 *
 * Matches how the attendance module writes hours, so worked time reads the same
 * whether it came from the office device or from a timer at home.
 */
export function formatHm(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return `${hours}h ${rest}m`;
}

/**
 * "10:07 AM" - an instant, in the reader's own timezone.
 *
 * The browser's zone is the right one here and the wrong one on the server:
 * this is a person reading their own day, and their clock is the one they
 * checked when they sat down.
 */
export function formatClock(value?: string | Date | null): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * "6:00 PM" from "18:00".
 *
 * A planned time is wall-clock text the employee typed, never an instant, so it
 * is reformatted rather than converted - putting it through a Date would attach
 * a timezone it never had.
 */
export function formatPlannedTime(hhmm?: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "10:00 AM - 6:00 PM", or an em dash when no plan was given. */
export function formatPlannedWindow(start?: string, end?: string): string {
  if (!start || !end) return "-";
  return `${formatPlannedTime(start)} - ${formatPlannedTime(end)}`;
}

/** The planned day in milliseconds, for the "how far through" progress bar. */
export function plannedDurationMs(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
  };
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return 0;
  return (to - from) * 60000;
}
