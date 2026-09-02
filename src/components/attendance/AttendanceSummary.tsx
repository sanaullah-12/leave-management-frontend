import React from "react";
import { CARD, CARD_HOVER } from "../../lib/surfaces";
import { AccentEdge } from "../ui/CardAccents";
import { useThemeAccent } from "../../hooks/useThemeAccent";

/**
 * The summary row.
 *
 * Same shell as the dashboard KPI tiles - the shared CARD surface, an accent
 * hairline across the top edge, an overline label, the value on a fixed-height
 * line so every tile's number shares a baseline, and the caption pinned to the
 * bottom so captions align across the row.
 *
 * During a load the value is a shimmer rather than a zero: a zero is a claim,
 * and "not known yet" is not the same as "nobody".
 */

export interface SummaryItem {
  label: string;
  value: number | string | null;
  caption?: string;
  /** Accent hairline colour. Defaults to the active theme accent. */
  accent?: string;
  icon?: React.ReactNode;
}

interface Props {
  items: SummaryItem[];
  loading?: boolean;
}

const AttendanceSummary: React.FC<Props> = ({ items, loading = false }) => {
  const accent = useThemeAccent(600);

  return (
  <section
    aria-label="Attendance summary"
    className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
  >
    {items.map((item) => (
      <div
        key={item.label}
        className={`group relative overflow-hidden ${CARD} ${CARD_HOVER} flex h-full flex-col p-3.5 sm:p-5`}
      >
        <AccentEdge color={item.accent || accent} />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className="text-overline truncate text-gray-400 dark:text-gray-500"
              title={item.label}
            >
              {item.label}
            </p>
            <p className="mt-2 flex min-h-[2rem] items-end gap-1 sm:min-h-[2.25rem]">
              {loading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <span className="text-2xl font-bold leading-none tabular-nums text-gray-900 dark:text-white sm:text-3xl">
                  {item.value ?? "-"}
                </span>
              )}
            </p>
          </div>

          {item.icon && (
            <div className="hidden h-11 w-11 flex-shrink-0 place-items-center text-blue-600 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 dark:text-blue-400 sm:grid">
              {item.icon}
            </div>
          )}
        </div>

        {item.caption && (
          <p className="mt-auto pt-2 text-[11px] font-medium leading-snug text-gray-500 dark:text-gray-400 sm:pt-3 sm:text-xs">
            {item.caption}
          </p>
        )}
      </div>
      ))}
    </section>
  );
};

export default AttendanceSummary;
