import { useQuery } from "@tanstack/react-query";
import { attendanceAPI } from "../services/api";

/**
 * useLateHours
 * ------------
 * One employee's late total and the daily record behind it.
 *
 * Every screen that shows late hours - the employee's own attendance page, the
 * admin's employee record, the leave review sheet - reads through this hook,
 * so they share a cache entry and cannot show two different totals for the
 * same person and range.
 *
 * Nothing here accumulates. The backend derives the total from the attendance
 * records on each read; this only fetches it.
 */

export interface LateEntry {
  date: string;
  dateDisplay: string;
  /** The start time the day was judged against, "HH:MM". */
  expected: string;
  officeCutoff: string;
  graceMinutes: number;
  punchIn: string;
  punchInDisplay: string;
  isLate: boolean;
  lateMinutes: number;
  lateDisplay: string | null;
}

export interface LateSummary {
  totalLateMinutes: number;
  lateHours: number;
  remainderMinutes: number;
  decimalHours: number;
  totalLateDisplay: string;
  lateDays: number;
  averageLateMinutes: number;
  averageLateDisplay: string;
  worstDay: {
    date: string;
    dateDisplay: string;
    lateMinutes: number;
    lateDisplay: string | null;
  } | null;
  daysConsidered: number;
  onTimeDays: number;
}

export interface LateHoursResult {
  employeeId: string;
  employee?: { employeeId: string; name?: string; department?: string } | null;
  dateRange: { from: string; to: string };
  policy: {
    cutoffTime: string;
    policy: string;
    graceMinutes: number;
    isPreview?: boolean;
    officialCutoffTime?: string;
  };
  summary: LateSummary;
  entries: LateEntry[];
  lateEntries: LateEntry[];
}

interface Options {
  startDate?: string;
  endDate?: string;
  /** Skip the request entirely - a sheet that is closed should not fetch. */
  enabled?: boolean;
}

export function useLateHours(
  employeeId?: string | number | null,
  { startDate, endDate, enabled = true }: Options = {}
) {
  const id = employeeId == null ? "" : String(employeeId);

  const query = useQuery({
    queryKey: ["late-hours", id, startDate ?? null, endDate ?? null],
    queryFn: () => attendanceAPI.getLateHours(id, startDate, endDate),
    enabled: Boolean(id) && enabled,
    // The punches behind it only move when the agent syncs, so a short cache
    // keeps three panels on one screen from making three requests.
    staleTime: 60 * 1000,
    retry: 1,
  });

  const data = (query.data?.data || null) as LateHoursResult | null;

  return {
    data,
    summary: data?.summary || null,
    entries: data?.entries || [],
    lateEntries: data?.lateEntries || [],
    policy: data?.policy || null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Admin: late hours across the roster for a range. */
export function useLateHoursOverview({
  startDate,
  endDate,
  limit = 20,
  enabled = true,
}: Options & { limit?: number } = {}) {
  const query = useQuery({
    queryKey: ["late-hours-overview", startDate ?? null, endDate ?? null, limit],
    queryFn: () => attendanceAPI.getLateHoursOverview(startDate, endDate, limit),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const data = query.data?.data || null;

  return {
    summary: (data?.summary || null) as
      | (LateSummary & { employeesLate: number; employeesConsidered: number })
      | null,
    employees: (data?.employees || []) as Array<
      LateSummary & { employeeId: string; name: string | null; department: string | null }
    >,
    recentLateEntries: (data?.recentLateEntries || []) as Array<
      LateEntry & { employeeId: string; name: string | null }
    >,
    policy: data?.policy || null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
