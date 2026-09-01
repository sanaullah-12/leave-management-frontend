import React, { useEffect, useMemo, useState } from "react";
import {
  ClockIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import Modal from "./ui/Modal";
import DatePicker from "./ui/DatePicker";
import InlineLoader from "./InlineLoader";

interface Employee {
  machineId: string;
  name: string;
  employeeId: string;
  cardNumber?: string | null;
  department: string;
  enrolledAt: Date;
  isActive: boolean;
  idMapping?: {
    uid: string | number;
    userId?: string | number;
    cardno?: string | number | null;
    source: string;
  };
}

interface AttendanceRecord {
  id?: string;
  recordId?: string;
  date?: string;
  time?: string;
  status?: string;
  dateDisplay?: string;
  timeDisplay?: string;
  isLate?: boolean;
  lateDisplay?: string;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  /** Fetched payload for this employee (summary + records). */
  data?: any;
  isLoading?: boolean;
  /** Seeds the modal's own from/to pickers. */
  defaultStartDate?: string;
  defaultEndDate?: string;
  onFetchRecords: (
    employee: Employee,
    forceRefresh?: boolean,
    range?: { startDate: string; endDate: string }
  ) => void;
}

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="min-w-0">
    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
      {label}
    </p>
    <p className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
      {value || "-"}
    </p>
  </div>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; tone: string }> = ({
  label,
  value,
  tone,
}) => (
  <div className="rounded-xl border border-gray-100 p-3 text-center dark:border-gray-800">
    <p className={`text-xl font-bold tabular-nums ${tone}`}>{value}</p>
    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
      {label}
    </p>
  </div>
);

/**
 * Built on the shared ui/Modal rather than a bare Headless UI Dialog.
 *
 * The previous version set the dialog to `z-10`, which put it BEHIND the
 * sidebar (z-40) and the mobile drawer (z-50), and hardcoded light-only
 * colours. ui/Modal portals to document.body at z-[100] and carries the dark
 * variants, fixing both by construction.
 *
 * The from/to pickers live here rather than only on the page behind the modal:
 * a range is the first thing you need when asking "what did this person do?",
 * and the fetched payload is rendered here too - it used to be stored in state
 * the modal never received, so pressing Fetch appeared to do nothing.
 */
const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  employee,
  data,
  isLoading = false,
  defaultStartDate,
  defaultEndDate,
  onFetchRecords,
}) => {
  const today = new Date().toISOString().split("T")[0];
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  }, []);

  const [from, setFrom] = useState(defaultStartDate || monthAgo);
  const [to, setTo] = useState(defaultEndDate || today);

  // Re-seed whenever the modal is opened for a different employee, so a stale
  // range from a previous employee never carries over silently.
  useEffect(() => {
    if (!isOpen) return;
    setFrom(defaultStartDate || monthAgo);
    setTo(defaultEndDate || today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employee?.employeeId]);

  if (!employee) return null;

  const rangeInvalid = !!from && !!to && from > to;
  const records: AttendanceRecord[] = data?.records || [];
  const summary = data?.summary;

  const fetch = (forceRefresh: boolean) => {
    if (rangeInvalid) return;
    onFetchRecords(employee, forceRefresh, { startDate: from, endDate: to });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="2xl"
      icon={<ClockIcon className="h-6 w-6" />}
      title={`Attendance - ${employee.name}`}
      description={
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {employee.department || "No department"} &bull; ID{" "}
          {employee.employeeId || employee.machineId}
        </span>
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => fetch(true)}
            disabled={isLoading || rangeInvalid}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <InlineLoader label="Fetching..." />
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4" />
                Fetch records
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Employee summary */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Name" value={employee.name} />
            <Field label="Employee ID" value={employee.employeeId} />
            <Field label="Machine ID" value={employee.machineId} />
            <Field label="Department" value={employee.department} />
          </div>
        </div>

        {/* Date range */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            <CalendarDaysIcon className="h-3.5 w-3.5" />
            Date range
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                From
              </label>
              <DatePicker value={from} onChange={setFrom} max={to || today} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                To
              </label>
              <DatePicker value={to} onChange={setTo} min={from} max={today} />
            </div>
          </div>
          {rangeInvalid && (
            <p className="mt-2 text-xs font-medium text-red-500">
              The start date must be on or before the end date.
            </p>
          )}
        </div>

        {/* Summary tiles - only once a fetch has returned something */}
        {summary && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Working days"
              value={summary.totalDays ?? 0}
              tone="text-gray-900 dark:text-white"
            />
            <Stat
              label="Present"
              value={summary.presentDays ?? 0}
              tone="text-emerald-600 dark:text-emerald-400"
            />
            <Stat
              label="Absent"
              value={summary.absentDays ?? 0}
              tone="text-red-500 dark:text-red-400"
            />
            <Stat
              label="Late"
              value={summary.lateDays ?? 0}
              tone="text-amber-600 dark:text-amber-400"
            />
          </div>
        )}

        {/* Records */}
        {isLoading ? (
          <div className="rounded-xl border border-gray-100 py-12 text-center dark:border-gray-800">
            <InlineLoader label="Loading attendance records..." />
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="max-h-72 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
                <thead className="sticky top-0 bg-gray-50/90 backdrop-blur dark:bg-gray-800/80">
                  <tr>
                    {["Date", "Time", "Type", "Status"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
                  {records.map((r, i) => (
                    <tr
                      key={r.recordId || r.id || i}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-900 dark:text-gray-100">
                        {r.dateDisplay || r.date || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
                        {r.timeDisplay || r.time || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-gray-500 dark:text-gray-400">
                        {r.status || "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        {r.isLate ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            Late {r.lateDisplay}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            On time
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 dark:border-gray-800">
              {records.length} record{records.length === 1 ? "" : "s"}
              {data?.dateRange
                ? ` from ${data.dateRange.from} to ${data.dateRange.to}`
                : ""}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-gray-700">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-blue-500">
              <ClockIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {data ? "No records in this range" : "No records loaded yet"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400">
              {data
                ? "Try widening the date range above."
                : "Pick a date range above, then fetch this employee's punches."}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AttendanceModal;
