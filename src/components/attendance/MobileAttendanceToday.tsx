import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import StatusBadge from "./StatusBadge";
import { LateDayTimeChange } from "./TimeChangeAction";
import type { RosterDayRow, RosterTotals } from "./RosterTables";
import { byArrival, groupByStatus } from "./rosterGrouping";
import { spring } from "../../lib/motion";
import { statusColor } from "../../lib/themeTokens";

/**
 * Today's attendance, for a phone.
 *
 * The desktop answer to "who is in today" is a table, and a table is the wrong
 * shape here: five columns on a 390px screen leaves no room for the thing the
 * roster is actually scanned for - who arrived late, and by how much. This is
 * the same data as a list.
 *
 * Three decisions carry it:
 *
 *   1. Rows are grouped by status, not sorted into one flat run. "Three people
 *      are late" is a fact an admin wants without counting, and a section
 *      header states it for free. Within a group the order is still arrival
 *      order, so the group headings fall in the order the day happened.
 *   2. The arrival time takes the status colour. It is the one figure on the
 *      row that the status is a judgement *of*, so tinting it means the status
 *      can be read without reading the pill - which matters when the pill is
 *      the narrowest thing on the row.
 *   3. Minutes late sit on the right, aligned, in a column of their own. They
 *      are the only numbers on the screen worth comparing down the list.
 *
 * An employee sees the same row without the roster chrome around it - see
 * below.
 */

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

/**
 * Per-status ink for text drawn straight onto the card.
 *
 * Class pairs rather than the hex values StatusBadge uses. The badge can use
 * one fixed colour because it paints its own pale background under it; text on
 * the card has the theme's ground behind it, and #0f7a4c on a #1b1e27 card is
 * about 2:1. Each pair is the same hue a step either side of the divide.
 */
const TONE: Record<string, string> = {
  "On time": "text-emerald-700 dark:text-emerald-400",
  Present: "text-emerald-700 dark:text-emerald-400",
  Late: "text-amber-700 dark:text-amber-400",
  Absent: "text-red-700 dark:text-red-400",
  "No record": "text-red-700 dark:text-red-400",
  "On leave": "text-cyan-700 dark:text-cyan-400",
  "Work from home": "text-indigo-700 dark:text-indigo-400",
  Weekend: "text-gray-500 dark:text-gray-400",
};

const toneOf = (status: string) =>
  TONE[status] || "text-gray-500 dark:text-gray-400";

/** The amber the late delta is always drawn in, on either ground. */
const LATE_INK = "text-amber-700 dark:text-amber-400";

const initialsOf = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/* ------------------------------------------------------------------ */
/* Filter chips                                                        */
/* ------------------------------------------------------------------ */

interface Chip {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Which row statuses this chip stands for. */
  statuses: string[];
}

/** The tab that is selected when nothing is being filtered out. */
const ALL_TAB = "all";

/**
 * The counts, as tabs.
 *
 * They began as a wrapping row of dot-label-number, which on a phone became
 * three lines of small text that could be read and not used, and then as
 * toggle chips, which could filter but never said so: a chip that is off looks
 * the same whether tapping it will narrow the list or widen it, and the only
 * way back to the whole day was to guess that tapping the lit one again
 * cleared it.
 *
 * Tabs say both things for free. One is always selected, so the strip states
 * which day you are looking at rather than which buttons happen to be pressed,
 * and "All" is a visible way back rather than a gesture you have to discover.
 * The count stays in the label, because a count is more useful when it is also
 * the way to see what it is counting.
 *
 * The strip scrolls sideways instead of wrapping. Six tabs do not fit across a
 * 360px phone, and wrapping them to a second line pushes the first person of
 * the day below the fold - which is the one thing this card is opened to read.
 * A tab that starts off-screen is still reachable; a list that starts
 * off-screen is not.
 */
const StatusTabs: React.FC<{
  chips: Chip[];
  active: string;
  onSelect: (key: string) => void;
  loading: boolean;
  /** How many people the unfiltered list holds. */
  total: number;
}> = ({ chips, active, onSelect, loading, total }) => {
  const tabs = [
    { key: ALL_TAB, label: "All", value: total, color: "var(--accent)" },
    ...chips,
  ];

  return (
    /* The well is the fixed frame: it keeps the card's own left and right
       padding and does not move. Only the row of tabs inside it scrolls, so
       the strip reads as one control with more in it than fits rather than as
       a rail that slides off both edges of the card. */
    <div className="rounded-[14px] border border-gray-200 bg-black/[0.03] p-1 dark:border-white/10 dark:bg-white/[0.05]">
      <div
        role="tablist"
        aria-label="Filter by status"
        className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const on = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onSelect(tab.key)}
              className={`relative flex min-h-[34px] flex-none items-center gap-1.5 whitespace-nowrap rounded-[11px] px-2.5 text-[12px] font-semibold transition-colors ${
                on ? "text-white" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {/* One pill travelling between the tabs, not a background
                  switching off one and on to another. Every selection strip in
                  the app now does this on the same spring - the bottom bar's
                  badge, the mobile filter chips, the leave status filter - so
                  choosing a tab, a filter and a screen are recognisably the
                  same gesture. */}
              {/* The fill carries the status colour, so it recolours as it
                  travels rather than after it lands - the tab you picked is
                  the colour it is going to be for the whole trip. */}
              {on && (
                <motion.span
                  layoutId="attendance-status-pill"
                  transition={spring}
                  aria-hidden="true"
                  animate={{ backgroundColor: tab.color }}
                  className="absolute inset-0 rounded-[11px]"
                />
              )}
              {/* The dot carries the status colour while the tab is not
                  selected; selected, the tab itself is that colour, so a dot
                  would be printing it twice. */}
              {!on && (
                <span
                  className="h-[6px] w-[6px] flex-none rounded-full"
                  style={{ backgroundColor: tab.color }}
                />
              )}
              {tab.label}
              <span
                className={`font-bold tabular-nums ${
                  on ? "text-white" : "text-gray-900 dark:text-white"
                }`}
              >
                {loading ? "-" : tab.value}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* One person's day                                                    */
/* ------------------------------------------------------------------ */

const PersonRow: React.FC<{ row: RosterDayRow }> = ({ row }) => {
  const tone = toneOf(row.status);
  /* Whether the device saw this person. It decides the shape of the row, not
     just one line of it - see the two branches below. */
  const hasArrival = Boolean(row.checkIn);
  const lateMinutes = Math.max(0, Math.round(row.lateMinutes || 0));

  return (
    <li className="flex items-center gap-2.5 py-3 sm:gap-3">
      {/* A rounded square, not a circle: it reads as a tile in a list rather
          than as an avatar that failed to load a photo. */}
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-black/[0.04] text-[15px] font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"
        aria-hidden="true"
      >
        {initialsOf(row.name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-gray-900 dark:text-white">
          {row.name}
        </p>
        {row.department && (
          <p className="mt-0.5 truncate text-[12px] text-gray-500 dark:text-gray-400">
            {row.department}
          </p>
        )}

        {/* Arrival and the pill - one line, below the department.

            Only for a row that has an arrival. A day with no punch has no
            time and no lateness, so this line would hold nothing but the pill
            and the column to the right of it would be empty: a third of the
            row's height and half its width spent on one word. Those rows put
            the pill in the free column instead - see below. */}
        {hasArrival && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className={`text-[13px] font-semibold tabular-nums ${tone}`}>
              {row.checkIn}
            </span>
            <StatusBadge status={row.status} compact />
          </div>
        )}

        {/* The viewer's own late day offers the change right under it. */}
        {hasArrival && (
          <div className="mt-2 empty:hidden">
            <LateDayTimeChange
              day={{
                employeeCode: row.employeeId,
                date: row.date,
                dateDisplay: row.dateDisplay,
                isLate: row.status === "Late",
                arrival: row.checkIn,
                lateMinutes: row.lateMinutes,
                corrected: row.timeCorrected,
                machineCheckInDisplay: row.machineCheckInDisplay,
              }}
            />
          </div>
        )}
      </div>

      {/* The trailing column. Minutes late for an arrival, and otherwise the
          status - which is the whole of what this row has to report. */}
      {hasArrival ? (
        <div className="w-[60px] shrink-0 text-right">
          {lateMinutes > 0 && (
            <>
              <p className={`text-[14px] font-bold tabular-nums leading-tight ${LATE_INK}`}>
                {lateMinutes} min
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                late
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="shrink-0">
          <StatusBadge status={row.status} compact />
        </div>
      )}
    </li>
  );
};

/* ------------------------------------------------------------------ */
/* The employee's own day                                              */
/* ------------------------------------------------------------------ */

/*
 * An employee gets the same card as an admin: the same tabs across the top
 * and the same row beneath them, reading their own day instead of the team's.
 * The one piece of roster chrome it drops is the group heading, which over a
 * single row would be naming a group of one.
 */

/* ------------------------------------------------------------------ */
/* The list                                                            */
/* ------------------------------------------------------------------ */

interface Props {
  rows: RosterDayRow[];
  totals: RosterTotals;
  loading?: boolean;
  /** An employee sees their own day, not the roster. */
  isSelfView?: boolean;
  /** Trim the list, for the dashboard where the section is a summary. */
  maxRows?: number;
}

const MobileAttendanceToday: React.FC<Props> = ({
  rows,
  totals,
  loading = false,
  isSelfView = false,
  maxRows,
}) => {
  const [filter, setFilter] = useState<string>(ALL_TAB);

  const chips: Chip[] = useMemo(
    () => [
      {
        key: "present",
        label: "Present",
        value: totals.onTime,
        color: statusColor("success"),
        statuses: ["On time", "Present"],
      },
      {
        key: "late",
        label: "Late",
        value: totals.late,
        color: statusColor("warning"),
        statuses: ["Late"],
      },
      {
        key: "absent",
        label: "Absent",
        value: totals.absent,
        color: statusColor("danger"),
        statuses: ["Absent", "No record"],
      },
      {
        key: "leave",
        label: "Leave",
        value: totals.onLeave,
        color: statusColor("leave"),
        statuses: ["On leave"],
      },
      {
        key: "wfh",
        label: "WFH",
        value: totals.workFromHome,
        color: statusColor("remote"),
        statuses: ["Work from home"],
      },
    ],
    [totals]
  );

  /** Rows in arrival order, narrowed to the selected tab. */
  const visible = useMemo(() => {
    const wanted =
      filter === ALL_TAB
        ? null
        : chips.find((c) => c.key === filter)?.statuses;
    const kept = wanted
      ? rows.filter((row) => wanted.includes(row.status))
      : rows;
    return [...kept].sort(byArrival);
  }, [rows, filter, chips]);

  /** Grouped by status, in the order the day happens in. */
  const groups = useMemo(() => groupByStatus(visible), [visible]);

  /** How many rows a trimmed list shows. */
  const shownCount = maxRows ? Math.min(maxRows, visible.length) : visible.length;

  if (loading) {
    return (
      <div className="px-4 pb-5 lg:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-[14px] bg-gray-100 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ---- The employee's own day ---- */
  if (isSelfView) {
    const own = visible[0] ?? null;
    return (
      <div className="lg:hidden">
        <div className="px-4 pb-3">
          <StatusTabs
            chips={chips}
            active={filter}
            onSelect={setFilter}
            loading={loading}
            total={rows.length}
          />
        </div>

        {own ? (
          <ul className="px-4 pb-3">
            <PersonRow row={own} />
          </ul>
        ) : (
          <p className="px-4 pb-6 text-[13px] text-gray-500 dark:text-gray-400">
            Nobody in this group today.
          </p>
        )}
      </div>
    );
  }

  /* ---- The roster ---- */
  return (
    <div className="lg:hidden">
      <div className="px-4 pb-3">
        <StatusTabs
          chips={chips}
          active={filter}
          onSelect={setFilter}
          loading={loading}
          total={rows.length}
        />
      </div>

      {visible.length === 0 ? (
        /* Only reachable by selecting a tab whose count is zero - the board
           shows its own empty state when the day itself has nothing in it. */
        <p className="px-4 pb-6 text-[13px] text-gray-500 dark:text-gray-400">
          Nobody in this group today.
        </p>
      ) : (
        <div className="px-4 pb-4">
          {(() => {
            // The trim applies across the whole list, not per group, so a
            // dashboard summary shows the first N people of the day rather
            // than the first N of every status.
            let budget = shownCount;
            return groups.map((group) => {
              if (budget <= 0) return null;
              const take = group.rows.slice(0, budget);
              budget -= take.length;
              return (
                <section key={group.status}>
                  <h4 className="pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                    {group.status}
                  </h4>
                  <ul className="divide-y divide-gray-100 dark:divide-white/5">
                    {take.map((row) => (
                      <PersonRow key={`${row.employeeId}-${row.date}`} row={row} />
                    ))}
                  </ul>
                </section>
              );
            });
          })()}

        </div>
      )}
    </div>
  );
};

export default MobileAttendanceToday;
