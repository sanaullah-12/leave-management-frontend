/**
 * Document Studio — shared visual tokens.
 *
 * Centralises the neumorphic card surface and category tints so every Studio
 * surface matches the existing dashboard language exactly. Import these instead
 * of re-typing long shadow strings.
 */

/** Neumorphic card surface — identical to the dashboard KPI tiles. */
export const CARD =
  "rounded-2xl bg-[var(--card-surface)] " +
  "shadow-[7px_7px_16px_rgba(174,186,204,0.5),-7px_-7px_16px_rgba(255,255,255,0.95)] " +
  "dark:shadow-[7px_7px_18px_rgba(0,0,0,0.55),-6px_-6px_16px_rgba(255,255,255,0.045)]";

/** Interactive lift used on clickable cards. */
export const CARD_HOVER =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 " +
  "hover:shadow-[12px_12px_24px_rgba(174,186,204,0.6),-12px_-12px_24px_rgba(255,255,255,1)] " +
  "dark:hover:shadow-[12px_12px_28px_rgba(0,0,0,0.7),-10px_-10px_24px_rgba(255,255,255,0.06)]";

/** Flat bordered surface for panels/side rails — solid so overlays read clearly. */
export const PANEL =
  "rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";

/** Tailwind class sets for category tints (light + dark). */
export const TINT: Record<
  string,
  { chip: string; ring: string; icon: string }
> = {
  emerald: {
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    ring: "ring-emerald-200/60 dark:ring-emerald-500/20",
    icon: "bg-emerald-500",
  },
  blue: {
    chip: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    ring: "ring-blue-200/60 dark:ring-blue-500/20",
    icon: "bg-blue-500",
  },
  amber: {
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    ring: "ring-amber-200/60 dark:ring-amber-500/20",
    icon: "bg-amber-500",
  },
  red: {
    chip: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    ring: "ring-red-200/60 dark:ring-red-500/20",
    icon: "bg-red-500",
  },
  slate: {
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
    ring: "ring-slate-200/60 dark:ring-slate-500/20",
    icon: "bg-slate-500",
  },
  violet: {
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    ring: "ring-violet-200/60 dark:ring-violet-500/20",
    icon: "bg-violet-500",
  },
  cyan: {
    chip: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
    ring: "ring-cyan-200/60 dark:ring-cyan-500/20",
    icon: "bg-cyan-500",
  },
  indigo: {
    chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    ring: "ring-indigo-200/60 dark:ring-indigo-500/20",
    icon: "bg-indigo-500",
  },
  gray: {
    chip: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300",
    ring: "ring-gray-200/60 dark:ring-gray-500/20",
    icon: "bg-gray-500",
  },
};

export const tintFor = (key: string) => TINT[key] ?? TINT.gray;

/** Human "x days ago" relative label used across cards/history. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
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
