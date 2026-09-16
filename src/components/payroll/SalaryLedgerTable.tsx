/**
 * Payroll - the salary ledger table.
 *
 * One table serves both Salary Management and Payroll Processing: they show the
 * identical money columns and differ only in chrome (row selection vs. row
 * actions). Keeping it single-sourced means a column added for one screen is
 * automatically correct on the other, and the money always renders the same way.
 *
 * Rows are individually memoised, so selecting one row in a 2,000-employee
 * roster re-renders one row - not the table.
 *
 * Below `lg` the same rows are cards. Nine money columns need 900px, and the
 * two that matter on a phone - who, and what they take home - are at opposite
 * ends of it. The card leads with the person and the net figure, puts basic,
 * allowances and deductions on the line beneath as the sum they add up to, and
 * keeps selection and actions where a thumb can reach them.
 */
import React, { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import Avatar from "../Avatar";
import { StatusPill, PayrollEmptyState } from "./PayrollUI";
import { SALARY_STATUS } from "./constants";
import { formatMoney } from "./formatters";
import type { SalaryRow } from "./types";

export type SortKey = "name" | "department" | "basic" | "net" | "status";
type SortDir = "asc" | "desc";

interface Props {
  rows: SalaryRow[];
  currency: string;
  /** Show the leading checkbox column. */
  selectable?: boolean;
  /** Ids of selected employees (only used when `selectable`). */
  selectedIds?: Set<string>;
  onToggle?: (employeeId: string) => void;
  onToggleAll?: (selectAll: boolean) => void;
  /** Trailing per-row actions. */
  renderActions?: (row: SalaryRow) => React.ReactNode;
  /** Click anywhere on the row. */
  onRowClick?: (row: SalaryRow) => void;
  emptyHeadline?: string;
  emptySub?: string;
  emptyCta?: string;
  onEmptyAction?: () => void;
}

/** Comparators live outside the component so they're never re-created. */
const COMPARATORS: Record<SortKey, (a: SalaryRow, b: SalaryRow) => number> = {
  name: (a, b) => a.employee.name.localeCompare(b.employee.name),
  department: (a, b) => a.employee.department.localeCompare(b.employee.department),
  basic: (a, b) => (a.structure?.basicSalary ?? 0) - (b.structure?.basicSalary ?? 0),
  net: (a, b) => (a.computation?.netSalary ?? 0) - (b.computation?.netSalary ?? 0),
  status: (a, b) => a.status.localeCompare(b.status),
};

const SalaryLedgerTable: React.FC<Props> = ({
  rows,
  currency,
  selectable = false,
  selectedIds,
  onToggle,
  onToggleAll,
  renderActions,
  onRowClick,
  emptyHeadline = "No employees match your filters",
  emptySub = "Try clearing the search or switching the status filter.",
  emptyCta,
  onEmptyAction,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const cmp = COMPARATORS[sortKey];
    const factor = sortDir === "asc" ? 1 : -1;
    // Copy before sorting - never mutate the memoised rows from the provider.
    return [...rows].sort((a, b) => cmp(a, b) * factor);
  }, [rows, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const allSelected =
    selectable && rows.length > 0 && rows.every((r) => selectedIds?.has(r.employee.id));

  if (rows.length === 0) {
    return (
      <PayrollEmptyState
        compact
        headline={emptyHeadline}
        sub={emptySub}
        ctaLabel={emptyCta}
        onAction={onEmptyAction}
      />
    );
  }

  const columns: { key: SortKey | null; label: string; align?: string }[] = [
    { key: "name", label: "Employee" },
    { key: "department", label: "Department" },
    { key: null, label: "Designation" },
    { key: "basic", label: "Basic", align: "text-right" },
    { key: null, label: "Allowances", align: "text-right" },
    { key: null, label: "Deductions", align: "text-right" },
    { key: "net", label: "Net Salary", align: "text-right" },
    { key: "status", label: "Status" },
  ];

  const money = (value?: number) => formatMoney(value ?? 0, currency);

  return (
    <>
    {/* ---------------- Phones and small tablets ---------------- */}
    <ul className="divide-y divide-gray-100 lg:hidden dark:divide-gray-800">
      {sorted.map((row) => {
        const { employee, structure, computation, status } = row;
        const selected = Boolean(selectedIds?.has(employee.id));
        const actions = renderActions?.(row);
        return (
          <li
            key={`m-${employee.id}`}
            className={`px-1 py-3 ${selected ? "bg-[var(--accent-soft)]" : ""}`}
          >
            <div className="flex items-start gap-3">
              {selectable && (
                <label className="flex h-11 w-6 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggle?.(employee.id)}
                    aria-label={`Select ${employee.name}`}
                    className="h-[18px] w-[18px] cursor-pointer rounded border-gray-300 accent-[var(--accent)]"
                  />
                </label>
              )}

              <button
                type="button"
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                disabled={!onRowClick}
                className="press-scale flex min-w-0 flex-1 items-start gap-3 text-start disabled:cursor-default"
              >
                <Avatar
                  src={employee.profilePicture}
                  name={employee.name}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-gray-900 dark:text-white">
                    {employee.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-gray-400">
                    {employee.designation}
                    {employee.department ? ` - ${employee.department}` : ""}
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-gray-400">
                    {money(structure?.basicSalary)} basic
                    {computation
                      ? ` + ${money(computation.totalAllowances)} - ${money(
                          computation.totalDeductions
                        )}`
                      : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[15px] font-bold tabular-nums text-gray-900 dark:text-white">
                    {money(computation?.netSalary)}
                  </span>
                  <StatusPill status={SALARY_STATUS[status]} />
                </span>
              </button>
            </div>

            {actions !== undefined && actions !== null && (
              <div className="mt-2 flex items-center justify-end gap-1">
                {actions}
              </div>
            )}
          </li>
        );
      })}
    </ul>

    {/* ---------------- Desktop ---------------- */}
    <div className="hidden table-scroll lg:block">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200/70 text-left dark:border-gray-700/50">
            {selectable && (
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={!!allSelected}
                  onChange={(e) => onToggleAll?.(e.target.checked)}
                  aria-label="Select all employees"
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[var(--accent)]"
                />
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.label}
                className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 ${
                  c.align ?? ""
                }`}
              >
                {c.key ? (
                  <button
                    onClick={() => toggleSort(c.key!)}
                    className={`inline-flex items-center gap-1 transition-colors hover:text-gray-700 dark:hover:text-gray-300 ${
                      c.align === "text-right" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {c.label}
                    <SortGlyph active={sortKey === c.key} dir={sortDir} />
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
            {renderActions && <th className="w-24 px-3 py-2" />}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <LedgerRow
              key={row.employee.id}
              row={row}
              currency={currency}
              selectable={selectable}
              selected={!!selectedIds?.has(row.employee.id)}
              onToggle={onToggle}
              onRowClick={onRowClick}
              actions={renderActions?.(row)}
            />
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
};

const SortGlyph: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => {
  if (!active) return <ChevronUpDownIcon className="h-3.5 w-3.5 opacity-50" />;
  return dir === "asc" ? (
    <ChevronUpIcon className="h-3.5 w-3.5" />
  ) : (
    <ChevronDownIcon className="h-3.5 w-3.5" />
  );
};

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

interface RowProps {
  row: SalaryRow;
  currency: string;
  selectable: boolean;
  selected: boolean;
  onToggle?: (employeeId: string) => void;
  onRowClick?: (row: SalaryRow) => void;
  actions?: React.ReactNode;
}

const LedgerRow: React.FC<RowProps> = React.memo(
  ({ row, currency, selectable, selected, onToggle, onRowClick, actions }) => {
    const { employee, structure, computation, status } = row;
    const money = (v: number | undefined) =>
      computation ? formatMoney(v ?? 0, currency) : "-";

    return (
      <motion.tr
        layout="position"
        className={`group border-b border-gray-100 transition-colors dark:border-gray-800 ${
          selected
            ? "bg-[var(--accent-soft)]"
            : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
        } ${onRowClick ? "cursor-pointer" : ""}`}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
      >
        {selectable && (
          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggle?.(employee.id)}
              aria-label={`Select ${employee.name}`}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-[var(--accent)]"
            />
          </td>
        )}

        <td className="px-3 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar src={employee.profilePicture} name={employee.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900 dark:text-white">
                {employee.name}
              </p>
              <p className="truncate text-xs text-gray-400">
                {employee.employeeCode}
              </p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
          {employee.department}
        </td>
        <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
          {employee.designation}
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
          {money(structure?.basicSalary)}
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
          {computation ? `+${money(computation.totalAllowances)}` : "-"}
        </td>
        <td className="px-3 py-3 text-right tabular-nums text-rose-600 dark:text-rose-400">
          {computation && computation.totalDeductions > 0
            ? `−${money(computation.totalDeductions)}`
            : money(0)}
        </td>
        <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
          {money(computation?.netSalary)}
        </td>
        <td className="px-3 py-3">
          <StatusPill status={SALARY_STATUS[status]} />
        </td>

        {actions !== undefined && (
          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {actions}
            </div>
          </td>
        )}
      </motion.tr>
    );
  }
);
LedgerRow.displayName = "LedgerRow";

export default SalaryLedgerTable;
