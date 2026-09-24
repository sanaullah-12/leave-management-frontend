import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import useListRowMotion from "../../hooks/useListRowMotion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
import { CARD } from "../../lib/surfaces";

import Input from "../ui/Input";
import Select from "../ui/Select";
import { statusColor } from "../../lib/themeTokens";
/**
 * The employee roster with its filters, sorting and pagination.
 *
 * The status column reports whether the device recorded that person inside the
 * selected range. "Absent" there means no punch was recorded, not that the
 * person was proven away: they may be on leave, on another site, or not
 * enrolled on this device, and the data cannot tell those apart. Open a row to
 * see that employee's actual punches.
 */

export interface RosterEmployee {
  employeeId: string | number;
  machineId?: string | number;
  name?: string;
  department?: string;
  enrolledAt?: string | Date;
}

export interface RosterRow {
  employee: RosterEmployee;
  /** Most recent arrival in the range, already formatted for display. */
  checkIn: string | null;
  lateDisplay: string | null;
  presentDays: number | null;
  status: string;
}

interface Props {
  rows: RosterRow[];
  loading?: boolean;
  onSelect: (employee: RosterEmployee) => void;
  /**
   * Search and the department/status filters. Off for a single-person view,
   * where every filter can only ever hide the one row there is.
   */
  showFilters?: boolean;
  /**
   * The status filter, when the page drives it - clicking the breakdown panel
   * has to land somewhere the reader can see and undo, and that is this
   * select. Left out, the table keeps its own.
   */
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

const PAGE_SIZE = 8;

/* The same column heading and row tint the leave and work-from-home lists
   use, so every queue in the app reads as one table. */
const TH =
  "px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";
const ROW =
  "bg-blue-50/40 transition-colors hover:bg-blue-50/80 dark:bg-blue-500/[0.04] dark:hover:bg-blue-500/[0.09]";

/* Dots repeat each status pill's colour, so the filter and the column it
   filters name the same three states the same way. */
const STATUS_OPTIONS = [
  { value: "All", label: "All statuses" },
  { value: "On time", label: "On time", dotColor: statusColor("success") },
  { value: "Late", label: "Late", dotColor: statusColor("warning") },
  { value: "Absent", label: "Absent", dotColor: statusColor("danger") },
];

const initialsOf = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

type SortKey = "name" | "employeeId" | "department" | "status" | "checkIn";

const EmployeeTable: React.FC<Props> = ({
  rows: allRows,
  loading = false,
  onSelect,
  showFilters = true,
  statusFilter,
  onStatusFilterChange,
}) => {
  const phoneRow = useListRowMotion();
  const tableRow = useListRowMotion(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [ownStatus, setOwnStatus] = useState("All");
  const status = statusFilter ?? ownStatus;
  const setStatus = (next: string) => {
    if (onStatusFilterChange) onStatusFilterChange(next);
    else setOwnStatus(next);
  };
  // Default to User ID ascending. The roster arrives in device-enrolment
  // order, which reads as random; people look someone up by the number on
  // their badge, so 1, 2, 3 is the order that matches how the list is used.
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "employeeId",
    dir: "asc",
  });
  const [page, setPage] = useState(1);

  // A filter change can shorten the list past the page being viewed, and the
  // filter can now be set from outside this component.
  useEffect(() => setPage(1), [status]);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          allRows.map((r) => r.employee.department).filter(Boolean) as string[]
        )
      ).sort(),
    [allRows]
  );

  const departmentOptions = useMemo(
    () => [
      { value: "All", label: "All departments" },
      ...departments.map((d) => ({ value: d, label: d })),
    ],
    [departments]
  );

  const rows = useMemo(() => {
    let filtered = allRows;
    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (r) =>
          (r.employee.name || "").toLowerCase().includes(q) ||
          String(r.employee.employeeId).toLowerCase().includes(q)
      );
    }
    if (department !== "All") {
      filtered = filtered.filter((r) => r.employee.department === department);
    }
    if (status !== "All") {
      filtered = filtered.filter((r) => r.status === status);
    }

    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sort.key) {
        case "employeeId":
          return (
            (Number(a.employee.employeeId) - Number(b.employee.employeeId) ||
              String(a.employee.employeeId).localeCompare(
                String(b.employee.employeeId)
              )) * dir
          );
        case "department":
          return (
            (a.employee.department || "").localeCompare(
              b.employee.department || ""
            ) * dir
          );
        case "checkIn":
          // Nulls sort last in either direction: "no punch" is not a time.
          if (!a.checkIn) return 1;
          if (!b.checkIn) return -1;
          return a.checkIn.localeCompare(b.checkIn) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        default:
          return (
            (a.employee.name || "").localeCompare(b.employee.name || "") * dir
          );
      }
    });
  }, [allRows, search, department, status, sort]);

  // Any filter change can shorten the list past the current page.
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  const filtersActive =
    !!search || department !== "All" || status !== "All";

  const SortHeader: React.FC<{ label: string; sortKey: SortKey }> = ({
    label,
    sortKey,
  }) => {
    const active = sort.key === sortKey;
    return (
      <th
        className={TH}
        aria-sort={
          active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          className="inline-flex items-center gap-1.5 font-semibold"
        >
          {label}
          {active ? (
            sort.dir === "asc" ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            )
          ) : (
            <ChevronUpDownIcon className="h-3.5 w-3.5 text-gray-400" />
          )}
        </button>
      </th>
    );
  };

  return (
    <div className={`overflow-hidden ${CARD}`}>
      {/* Toolbar */}
      {showFilters && (
      <div className="grid grid-cols-2 items-center gap-2 border-b border-gray-200/70 p-3 dark:border-gray-700 sm:flex sm:flex-wrap sm:p-4">
        <Input
          icon={MagnifyingGlassIcon}
          inputSize="sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          clearable
          placeholder="Search by name or ID"
          aria-label="Search employees by name or ID"
          className="col-span-2 sm:min-w-[180px] sm:max-w-xs sm:flex-1"
        />

        <div className="w-full min-w-0 sm:w-[190px]">
          <Select
            value={department}
            onChange={(next) => {
              setDepartment(next);
              setPage(1);
            }}
            options={departmentOptions}
            placeholder="All departments"
          />
        </div>

        <div className="w-full min-w-0 sm:w-[170px]">
          <Select
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            placeholder="All statuses"
          />
        </div>

        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDepartment("All");
              setStatus("All");
            }}
            className="col-span-2 py-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Clear filters
          </button>
        )}

        <div className="hidden flex-1 sm:block" />

      </div>
      )}

      {/* ---------------- Phones and small tablets ----------------
          Seven columns need 860px. The pair being compared - who, and are
          they in - sat at opposite ends of that, so on a phone checking the
          roster meant scrolling right on every row and losing the name. The
          list puts the person on the left and the status on the right, and
          drops the columns a phone cannot use: department and slot are in the
          sub-line, and the full record is one tap away in the panel the row
          already opened. */}
      <div className="lg:hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3.5">
                <div className="h-9 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
              {allRows.length
                ? "No employees match your filters."
                : "No employees loaded."}
            </p>
            <p className="mx-auto mt-1.5 max-w-[17rem] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
              {allRows.length
                ? "Try a different search or clear the filters."
                : "Connect to the device to load the roster."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {pageRows.map((row, i) => (
              <motion.li key={String(row.employee.employeeId)} {...phoneRow(i)}>
                <button
                  type="button"
                  onClick={() => onSelect(row.employee)}
                  className="press-scale flex w-full items-center gap-3 px-4 py-3 text-start"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {initialsOf(row.employee.name)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                      {row.employee.name || "Unnamed"}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-gray-500 dark:text-gray-400">
                      {row.employee.department || "No department"}
                      {row.checkIn ? ` - in ${row.checkIn}` : ""}
                    </span>
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={row.status} />
                    {row.status === "Late" && row.lateDisplay && (
                      <span className="text-[11px] text-gray-400">
                        {row.lateDisplay}
                      </span>
                    )}
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      {/* ---------------- Desktop ---------------- */}
      <div className="hidden table-scroll lg:block">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700/60">
              <SortHeader label="Employee" sortKey="name" />
              <SortHeader label="User ID" sortKey="employeeId" />
              <SortHeader label="Department" sortKey="department" />
              <SortHeader label="Check-in" sortKey="checkIn" />
              <th className={TH}>Days present</th>
              <SortHeader label="Status" sortKey="status" />
              <th className={`${TH} text-right`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white dark:divide-gray-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className={ROW}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {allRows.length
                      ? "No employees match your filters."
                      : "No employees loaded."}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {allRows.length
                      ? "Try a different search or clear the filters."
                      : "Connect to the device to load the roster."}
                  </p>
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <motion.tr
                  key={String(row.employee.employeeId)}
                  {...tableRow(i)}
                  onClick={() => onSelect(row.employee)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelect(row.employee);
                  }}
                  className={`cursor-pointer ${ROW}`}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100/70 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                        {initialsOf(row.employee.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                          {row.employee.name || "Unnamed"}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          Slot {row.employee.machineId ?? "-"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                    {row.employee.employeeId}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    {row.employee.department ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200/70 dark:bg-gray-700/50 dark:text-gray-200 dark:ring-gray-600/50">
                        {row.employee.department}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                    {row.checkIn || <span className="text-gray-400">-</span>}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    {row.presentDays === null ||
                    row.presentDays === undefined ? (
                      <span className="text-sm text-gray-400">-</span>
                    ) : (
                      <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {row.presentDays}{" "}
                        {row.presentDays === 1 ? "day" : "days"}
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={row.status} dot />
                    {row.status === "Late" && row.lateDisplay && (
                      <span className="ml-2 text-xs tabular-nums text-gray-400">
                        {row.lateDisplay}
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(row.employee);
                      }}
                      aria-label={`View ${row.employee.name || "employee"}`}
                      className="inline-flex items-center rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                      View
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && rows.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-2.5 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {(safePage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}{" "}
            employees
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              aria-label="Previous page"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform active:scale-90 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 sm:h-8 sm:w-8"
            >
              <ChevronLeftIcon className="h-4 w-4 rtl:-scale-x-100" />
            </button>
            <span className="px-1.5 text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Next page"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform active:scale-90 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 sm:h-8 sm:w-8"
            >
              <ChevronRightIcon className="h-4 w-4 rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;
