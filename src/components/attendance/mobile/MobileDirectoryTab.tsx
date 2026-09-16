import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Select from "../../ui/Select";
import StatusBadge from "../StatusBadge";
import type { RosterEmployee, RosterRow } from "../EmployeeTable";
import { CardSkeleton, EmptyNote, SHEET, Tile, WELL } from "../../mobile/primitives";

/**
 * Everyone enrolled on the device, as an index.
 *
 * The desktop roster is a sortable seven-column table. On a phone it is a thin
 * index instead: enough to find a person - their name, the slot and user ID
 * printed on their badge, and whether the device saw them in this range - with
 * the punches themselves one tap away in the detail sheet.
 *
 * Paged rather than endlessly scrolled. Twenty-six rows is not a feed, and a
 * page number is the cheapest way to know where in the roster you are.
 */

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: "All", label: "All statuses" },
  { value: "On time", label: "On time" },
  { value: "Late", label: "Late" },
  { value: "Absent", label: "Absent" },
];

interface Props {
  rows: RosterRow[];
  loading: boolean;
  onSelect: (employee: RosterEmployee) => void;
  /** Shared with the breakdown panel, so a tap there lands here. */
  statusFilter: string;
  onStatusFilterChange: (next: string) => void;
}

const MobileDirectoryTab: React.FC<Props> = ({
  rows,
  loading,
  onSelect,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [page, setPage] = useState(1);

  const departments = useMemo(
    () => [
      { value: "All", label: "All departments" },
      ...Array.from(
        new Set(
          rows.map((r) => r.employee.department).filter(Boolean) as string[]
        )
      )
        .sort()
        .map((name) => ({ value: name, label: name })),
    ],
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (
        q &&
        !(row.employee.name || "").toLowerCase().includes(q) &&
        !String(row.employee.employeeId).toLowerCase().includes(q)
      ) {
        return false;
      }
      if (department !== "All" && row.employee.department !== department) {
        return false;
      }
      if (statusFilter !== "All" && row.status !== statusFilter) return false;
      return true;
    });
  }, [rows, search, department, statusFilter]);

  // Any narrowing can shorten the list past the page being read.
  useEffect(() => setPage(1), [search, department, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const shown = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-[13px] px-3 py-2.5 ${WELL}`}
        >
          <MagnifyingGlassIcon className="h-4 w-4 flex-none text-gray-400 dark:text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID"
            aria-label="Search the roster"
            className="w-full min-w-0 bg-transparent text-[12.5px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select
          value={department}
          onChange={setDepartment}
          options={departments}
        />
        <Select
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={STATUS_OPTIONS}
        />
      </div>

      {loading ? (
        <CardSkeleton rows={6} />
      ) : !rows.length ? (
        <div className={SHEET}>
          <EmptyNote
            icon={UserGroupIcon}
            title="No roster loaded"
            body="Connect to the device on the Device tab, then refresh the roster."
          />
        </div>
      ) : !filtered.length ? (
        <div className={SHEET}>
          <EmptyNote
            icon={MagnifyingGlassIcon}
            title="Nobody matches"
            body="Clear the search or the filters to see the whole roster."
          />
        </div>
      ) : (
        <>
          {/* A card per person, the same shape the Today list uses. */}
          <ul className="flex flex-col gap-2.5">
            {shown.map((row) => (
              <li key={String(row.employee.employeeId)}>
                <button
                  type="button"
                  onClick={() => onSelect(row.employee)}
                  className={`${SHEET} flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors active:bg-black/[0.02] dark:active:bg-white/[0.03]`}
                >
                  <Tile name={row.employee.name} size={34} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold leading-tight text-gray-900 dark:text-white">
                      {row.employee.name || "Unnamed"}
                    </p>
                    {/* The identifiers first and the department after it: the
                        slot and user ID are what somebody is looked up by, and
                        putting a long department name in front of them was
                        truncating the only two things on the line that have to
                        survive. */}
                    <p className="mt-[3px] truncate text-[11px] text-gray-400 dark:text-gray-500">
                      <span className="tabular-nums">
                        {row.employee.machineId
                          ? `Slot ${row.employee.machineId} - ID ${row.employee.employeeId}`
                          : `ID ${row.employee.employeeId}`}
                      </span>
                      {row.employee.department
                        ? ` - ${row.employee.department}`
                        : ""}
                    </p>
                  </div>

                  <span className="flex-none">
                    <StatusBadge status={row.status} compact />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between px-1 pt-0.5">
            <span className="text-[11.5px] tabular-nums text-gray-400 dark:text-gray-500">
              {start + 1}-{start + shown.length} of {filtered.length}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label="Previous page"
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
                className={`grid h-8 w-8 place-items-center rounded-[10px] text-gray-500 disabled:opacity-40 dark:text-gray-400 ${WELL}`}
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              <span className="text-[12px] font-semibold tabular-nums text-gray-900 dark:text-white">
                Page {current} of {pages}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={current >= pages}
                onClick={() => setPage(current + 1)}
                className={`grid h-8 w-8 place-items-center rounded-[10px] text-gray-500 disabled:opacity-40 dark:text-gray-400 ${WELL}`}
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileDirectoryTab;
