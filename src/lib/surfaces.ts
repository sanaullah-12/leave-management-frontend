/**
 * Shared surface tokens.
 *
 * The glass card language used by the dashboard KPI tiles, Document Studio and
 * Payroll. Centralised here so a surface tweak lands everywhere at once instead
 * of being re-typed per module.
 *
 * The values come from the --glass-* tokens in design-system.css, so these
 * strings and the .surface-card/.card CSS classes stay the same material.
 */

/** Frosted card surface - identical to the dashboard KPI tiles. */
export const CARD =
  "rounded-2xl bg-[var(--glass-fill)] backdrop-blur-[18px] backdrop-saturate-[1.8] " +
  "border border-[var(--glass-edge)] " +
  "shadow-[shadow:var(--glass-sheen),var(--glass-drop)]";

/** Interactive lift used on clickable cards. The fill steps up with the lift. */
export const CARD_HOVER =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 " +
  "hover:bg-[var(--glass-fill-strong)] " +
  "hover:shadow-[shadow:var(--glass-sheen),var(--glass-drop-lifted)]";

/** Denser glass for panels and side rails - more fill, so overlaid text holds up. */
export const PANEL =
  "rounded-2xl bg-[var(--glass-fill-strong)] backdrop-blur-[18px] backdrop-saturate-[1.8] " +
  "border border-[var(--glass-edge)] " +
  "shadow-[shadow:var(--glass-sheen),var(--glass-drop)]";

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
