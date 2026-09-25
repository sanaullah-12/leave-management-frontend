import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClockIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
import { LateDayTimeChange } from "./TimeChangeAction";
import type { RosterDayRow } from "./RosterTables";
import { byArrival } from "./rosterGrouping";
import { toneOf } from "./rosterTone";
import useListRowMotion from "../../hooks/useListRowMotion";
import { collapseVariants } from "../../lib/motion";
import Input from "../ui/Input";

/**
 * One day's roster, for a desktop.
 *
 * The same rows the table used to draw, as a list of cards. A four-column
 * table puts the whole day on one baseline, which is the problem: the name,
 * the arrival, the verdict and the lateness are four different kinds of fact,
 * and reading down a column of them tells you nothing that reading across a
 * row does not. The card gives each row a shape instead - a coloured rail on
 * the leading edge that states the verdict before any of it is read.
 *
 * Lateness has a column of its own rather than riding on the arrival time:
 * how late somebody was is what the morning roster is scanned for, and a
 * figure tucked beside another figure is one nobody compares down the list.
 *
 * Nothing is judged here. Status, arrival time and lateness all arrive already
 * decided by the server under the office arrival rule.
 */

/**
 * Identity colours for the initials tile.
 *
 * Categorical, never semantic: these say "a different person", and they are
 * deliberately nothing to do with the status tokens beside them. Mid-tone
 * hues, so white initials hold on both grounds, and picked by hash so a
 * person keeps their colour between renders.
 */
const IDENTITY = [
  "#6366f1",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#0ea5e9",
  "#f43f5e",
];

const identityColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return IDENTITY[hash % IDENTITY.length];
};

const initialsOf = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/** Late minutes as "12 min"; nothing for an arrival that was on time. */
const lateLabel = (minutes: number | null | undefined) => {
  const safe = Math.max(0, Math.round(minutes || 0));
  return safe > 0 ? `${safe} min` : null;
};

/**
 * What the check-in column says when there is no time to say.
 *
 * A dash is the table's answer and it is the wrong one: an approved day off
 * and a no-show are both blank under it, and those are the two cases the
 * column exists to tell apart.
 */
const arrivalNote = (status: string) => {
  if (status === "On leave") return "On approved leave";
  if (status === "Work from home") return "Working remotely";
  if (status === "Weekend") return "Office closed";
  return "Not checked in";
};

/* ------------------------------------------------------------------ */
/* One row                                                             */
/* ------------------------------------------------------------------ */

/**
 * A row's edge is its shadow, not a rule: the same glass drop the dashboard's
 * KPI tiles use, so a roster card and a leave card read as one material.
 */
const ROW_SURFACE = "shadow-[shadow:var(--glass-sheen),var(--glass-drop)]";

const COLS =
  "grid grid-cols-[minmax(0,1fr)_9.5rem_8.5rem_11rem_2.25rem] items-center gap-3";

const RosterRow: React.FC<{ row: RosterDayRow }> = ({ row }) => {
  const [open, setOpen] = useState(false);
  const tone = toneOf(row.status);
  const late = lateLabel(row.lateMinutes);

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${ROW_SURFACE} transition-[background-color,box-shadow] hover:bg-[var(--surface-hover)] hover:shadow-[shadow:var(--glass-sheen),var(--glass-drop-lifted)]`}
      style={{ background: "var(--surface-raised)" }}
    >
      {/* The verdict, before anything on the row is read. */}
      <span
        aria-hidden
        className="absolute inset-y-2 left-0 w-[3px] rounded-r"
        style={{ background: tone.ink }}
      />

      <div className={`${COLS} py-2.5 pl-4 pr-2`}>
        {/* ---- Who ---- */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative shrink-0">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-bold text-white"
              style={{ background: identityColor(row.employeeId || row.name) }}
            >
              {initialsOf(row.name)}
            </span>
            {/* The rail again, where a scanning eye lands first. */}
            <span
              aria-hidden
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[color:var(--surface-raised)]"
              style={{ background: tone.ink }}
            />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              {row.name}
            </span>
            {row.department && (
              <span className="mt-0.5 inline-block max-w-full truncate rounded-md border border-[var(--border-default)] px-1.5 py-px text-[11px] text-gray-500 dark:text-gray-400">
                {row.department}
              </span>
            )}
          </span>
        </div>

        {/* ---- Arrival ---- */}
        <div className="flex min-w-0 items-start gap-1.5 text-sm">
          <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          {row.checkIn ? (
            <span className="tabular-nums text-gray-700 dark:text-gray-200">
              {row.checkIn}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">
              {arrivalNote(row.status)}
            </span>
          )}
        </div>

        {/* ---- Verdict ---- */}
        <div className="min-w-0">
          <StatusBadge status={row.status} dot />
        </div>

        {/* ---- Late ---- */}
        {/* On the viewer's own day the time change sits under the late time
            it is about. Anyone else's row shows the minutes alone. */}
        <div className="flex min-w-0 flex-col items-start gap-1.5 text-sm">
          {late ? (
            <span className="font-semibold tabular-nums text-[var(--warning-text)]">
              {late}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">-</span>
          )}
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

        {/* ---- The rest of the row ---- */}
        {/* Check-out and the device code have nowhere to live in four
            columns, and widening to six would make the row a table again.
            They open underneath instead. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`Details for ${row.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[var(--surface-hover)] hover:text-gray-700 dark:hover:text-gray-200"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            variants={collapseVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <dl className="flex flex-wrap gap-x-8 gap-y-2 border-t border-[var(--border-subtle)] px-4 py-3 text-sm">
              {[
                { label: "Employee ID", value: row.employeeId },
                { label: "Checked out", value: row.checkOut || "Not recorded" },
                { label: "Department", value: row.department || "Unassigned" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-gray-700 dark:text-gray-200">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* The list                                                            */
/* ------------------------------------------------------------------ */

interface Props {
  rows: RosterDayRow[];
  loading?: boolean;
  /** Trim the list, for the dashboard where the section is a summary. */
  maxRows?: number;
  emptyMessage?: string;
  /** Set by the summary tiles above; only rows in this state are listed. */
  statusFilter?: string | null;
}

const TodayRoster: React.FC<Props> = ({
  rows,
  loading = false,
  maxRows,
  emptyMessage,
  statusFilter = null,
}) => {
  const listRow = useListRowMotion(true);
  const [query, setQuery] = useState("");

  const ordered = useMemo(() => [...rows].sort(byArrival), [rows]);

  const matched = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ordered.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        row.name.toLowerCase().includes(needle) ||
        (row.department || "").toLowerCase().includes(needle)
      );
    });
  }, [ordered, query, statusFilter]);

  // The cap applies to an unnarrowed list only. Someone who has searched or
  // picked a state has asked a narrower question, and answering eight of it
  // is the one case where a trimmed list is actually wrong.
  const narrowed = !!query.trim() || !!statusFilter;
  const shown = maxRows && !narrowed ? matched.slice(0, maxRows) : matched;
  const hidden = matched.length - shown.length;

  return (
    <div className="px-4 pb-4 sm:px-5">
      {/* ---- How many, and a way to find one ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Employees
          <span className="ml-2 font-normal tabular-nums text-gray-500 dark:text-gray-400">
            {loading ? "-" : `${matched.length} of ${ordered.length}`}
          </span>
        </p>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or department"
          aria-label="Search the roster"
          icon={MagnifyingGlassIcon}
          inputSize="sm"
          className="w-full sm:w-72"
        />
      </div>

      {/* ---- Column labels ---- */}
      {/* Kept even though the rows are cards: four facts per row still need
          naming once, and "9:12 AM" beside "12 min" is ambiguous without it. */}
      {/* Padded exactly as a row is, or the 1fr column resolves to a
          different width here than in the rows under it and every label sits
          a few pixels off the column it names. */}
      <div
        className={`${COLS} pb-2 pl-4 pr-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400`}
        aria-hidden
      >
        <span>Employee</span>
        <span>Check-in</span>
        <span>Status</span>
        <span>Late</span>
        <span />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-[66px] animate-pulse rounded-xl ${ROW_SURFACE}`}
              style={{ background: "var(--surface-hover)" }}
            />
          ))}
        </div>
      ) : !shown.length ? (
        <p className="rounded-xl border border-dashed border-[var(--border-default)] px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          {narrowed
            ? "Nobody on the roster matches that."
            : emptyMessage || "No attendance recorded for this day."}
        </p>
      ) : (
        <div className="space-y-2">
          {shown.map((row, i) => (
            <motion.div key={`${row.employeeId}-${row.date}`} {...listRow(i)}>
              <RosterRow row={row} />
            </motion.div>
          ))}
        </div>
      )}

      {hidden > 0 && (
        <p className="pt-3 text-xs text-gray-500 dark:text-gray-400">
          Showing {shown.length} of {matched.length} employees.
        </p>
      )}
    </div>
  );
};

export default TodayRoster;
