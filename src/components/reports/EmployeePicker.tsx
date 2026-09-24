import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";
import { usersAPI } from "../../services/api";
import Avatar from "../Avatar";
import Input from "../ui/Input";
import { CARD } from "../../lib/surfaces";

/**
 * Who the report is about, chosen inside Reports.
 *
 * Reports used to have no way to answer that question: the page read a
 * selection out of localStorage and redirected to the employee list when it
 * found none, so opening Reports threw you into a different section and the
 * only route to a report ran through a button on another screen.
 *
 * The roster is fetched under the shared "employees" key, so arriving here
 * from a screen that already listed people costs no second request.
 */

interface Props {
  onSelect: (employee: any) => void;
  /** Shown above the list, e.g. when returning from a report. */
  note?: string;
}

const deptName = (employee: any): string =>
  typeof employee?.department === "object" && employee.department?.name
    ? employee.department.name
    : employee?.department || "";

const EmployeePicker: React.FC<Props> = ({ onSelect, note }) => {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["employees"],
    queryFn: () => usersAPI.getEmployees(1, 100),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const employees: any[] = useMemo(
    () => (data as any)?.data?.employees || [],
    [data]
  );

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(
      (employee) =>
        (employee.name || "").toLowerCase().includes(query) ||
        (employee.employeeId || "").toLowerCase().includes(query) ||
        (employee.email || "").toLowerCase().includes(query) ||
        deptName(employee).toLowerCase().includes(query)
    );
  }, [employees, search]);

  return (
    <div className={`overflow-hidden ${CARD}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 p-5 dark:border-gray-700">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Choose an employee
          </h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {note || "Their leave report opens here, on this page."}
          </p>
        </div>

        <Input
          icon={MagnifyingGlassIcon}
          inputSize="sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          clearable
          placeholder="Search by name, ID or department"
          aria-label="Search employees"
          className="min-w-[200px] max-w-xs flex-1"
        />
      </div>

      {isLoading ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, row) => (
            <li key={row} className="flex items-center gap-3 px-5 py-3.5">
              <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              </div>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-[var(--danger-text)]">Could not load the roster.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Try again
          </button>
        </div>
      ) : !matches.length ? (
        <div className="px-5 py-12 text-center">
          <DocumentChartBarIcon className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            {employees.length
              ? "No employee matches that search."
              : "No employees to report on yet."}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {employees.length
              ? "Try a different name, ID or department."
              : "Invite people first, then their reports appear here."}
          </p>
        </div>
      ) : (
        <ul className="max-h-[28rem] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
          {matches.map((employee) => (
            <li key={employee._id}>
              <button
                type="button"
                onClick={() => onSelect(employee)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-700/30"
              >
                <Avatar
                  src={employee.profilePicture}
                  name={employee.name || "Unknown"}
                  size="md"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {employee.name || "Unknown"}
                  </span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                    {[employee.position, deptName(employee)]
                      .filter(Boolean)
                      .join(" - ") || "Employee"}
                  </span>
                </span>
                {employee.employeeId && (
                  <span className="hidden shrink-0 text-xs tabular-nums text-gray-400 sm:block">
                    {employee.employeeId}
                  </span>
                )}
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmployeePicker;
