/**
 * Shared surface tokens.
 *
 * The neumorphic card language used by the dashboard KPI tiles, Document Studio
 * and Payroll. Centralised here so a surface tweak lands everywhere at once
 * instead of being re-typed as a long shadow string per module.
 */

/** Neumorphic card surface - identical to the dashboard KPI tiles. */
export const CARD =
  "rounded-2xl bg-[var(--card-surface)] " +
  "shadow-[7px_7px_16px_rgba(174,186,204,0.5),-7px_-7px_16px_rgba(255,255,255,0.95)] " +
  "dark:shadow-[7px_7px_18px_rgba(0,0,0,0.55),-6px_-6px_16px_rgba(255,255,255,0.045)]";

/** Interactive lift used on clickable cards. */
export const CARD_HOVER =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 " +
  "hover:shadow-[12px_12px_24px_rgba(174,186,204,0.6),-12px_-12px_24px_rgba(255,255,255,1)] " +
  "dark:hover:shadow-[12px_12px_28px_rgba(0,0,0,0.7),-10px_-10px_24px_rgba(255,255,255,0.06)]";

/** Flat bordered surface for panels/side rails - solid so overlays read clearly. */
export const PANEL =
  "rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";

/** Human "x days ago" relative label used across cards/history tables. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "-";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
