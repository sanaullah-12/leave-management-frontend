import React, { useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import StatusBadge from "./StatusBadge";
import { CARD } from "../../lib/surfaces";

/**
 * The employee roster with its filters, sorting and pagination.
 *
 * The status column reports whether the device recorded that person inside the
 * selected range - which is a fact this page already holds. It deliberately does
 * not claim "absent": a person with no punch may be on leave, on another site,
 * or simply not enrolled on this device, and the data cannot tell those apart.
 * Open a row to see that employee's actual punches.
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
}

const PAGE_SIZE = 8;

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
}) => {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  // Default to User ID ascending. The roster arrives in device-enrolment
  // order, which reads as random; people look someone up by the number on
  // their badge, so 1, 2, 3 is the order that matches how the list is used.
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "employeeId",
    dir: "asc",
  });
  const [page, setPage] = useState(1);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          allRows.map((r) => r.employee.department).filter(Boolean) as string[]
        )
      ).sort(),
    [allRows]
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
        className="whitespace-nowrap border-b border-gray-100 bg-gray-50/70 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300"
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
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200/70 p-4 dark:border-gray-700">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or ID"
            aria-label="Search employees by name or ID"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <select
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by department"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="All">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="All">All statuses</option>
          <option value="On time">On time</option>
          <option value="Late">Late</option>
          <option value="No record">No record</option>
        </select>

        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDepartment("All");
              setStatus("All");
              setPage(1);
            }}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Clear filters
          </button>
        )}

        <div className="flex-1" />

      </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              <SortHeader label="Employee" sortKey="name" />
              <SortHeader label="User ID" sortKey="employeeId" />
              <SortHeader label="Department" sortKey="department" />
              <SortHeader label="Check-in" sortKey="checkIn" />
              <th className="whitespace-nowrap border-b border-gray-100 bg-gray-50/70 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300">
                Days present
              </th>
              <SortHeader label="Status" sortKey="status" />
              <th className="border-b border-gray-100 bg-gray-50/70 px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td
                      key={j}
                      className="border-b border-gray-100 px-4 py-3 dark:border-gray-700"
                    >
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
              pageRows.map((row) => (
                <tr
                  key={String(row.employee.employeeId)}
                  onClick={() => onSelect(row.employee)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelect(row.employee);
                  }}
                  className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <td className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        {initialsOf(row.employee.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {row.employee.name || "Unnamed"}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          Slot {row.employee.machineId ?? "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3 font-mono text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
                    {row.employee.employeeId}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                    {row.employee.department || "-"}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3 font-mono text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
                    {row.checkIn || "-"}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                    {row.presentDays ?? "-"}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <StatusBadge status={row.status} />
                    {row.status === "Late" && row.lateDisplay && (
                      <span className="ml-2 text-xs text-gray-400">
                        {row.lateDisplay}
                      </span>
                    )}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3 text-right dark:border-gray-700">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(row.employee);
                      }}
                      aria-label={`View ${row.employee.name || "employee"}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {(safePage - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}{" "}
            employees
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage(safePage - 1)}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium text-gray-700 dark:text-gray-200">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;
