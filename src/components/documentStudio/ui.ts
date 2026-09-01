/**
 * Document Studio - shared visual tokens.
 *
 * The card surfaces now live in `lib/surfaces` (shared with Payroll and the
 * dashboard) and are re-exported here so existing Studio imports keep working.
 * Category tints below stay Studio-specific.
 */
export { CARD, CARD_HOVER, PANEL, relativeTime } from "../../lib/surfaces";

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
  teal: {
    chip: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
    ring: "ring-teal-200/60 dark:ring-teal-500/20",
    icon: "bg-teal-500",
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
