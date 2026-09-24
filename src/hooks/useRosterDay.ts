import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceAPI } from "../services/api";
import { ROSTER_DAY_ROOT } from "../lib/attendanceCache";
import type {
  RosterDateTotals,
  RosterDayRow,
  RosterEmployeeTotals,
  RosterTotals,
} from "../components/attendance/RosterTables";

/**
 * One period of the roster, as the server judged it.
 *
 * Extracted from AttendanceBoard so the desktop section and the phone's Today
 * screen ask the same question the same way. Two copies of this fetch would be
 * two chances for "today" to mean something different depending on which
 * screen width happened to be rendering it.
 *
 * Nothing here recalculates anything: lateness is decided server-side under the
 * office arrival rule, and this hook only carries the answer.
 */

export interface RosterDayResponse {
  success: boolean;
  detail: "day" | "summary";
  detailTruncated?: boolean;
  /** The arrival time the response was measured against, already in 12h form. */
  cutoffTime?: string;
  days: string[];
  totals: RosterTotals;
  rows: RosterDayRow[];
  byEmployee: RosterEmployeeTotals[];
  byDate: RosterDateTotals[];
  message?: string;
}

export const EMPTY_ROSTER_TOTALS: RosterTotals = {
  employees: 0,
  days: 0,
  onTime: 0,
  late: 0,
  absent: 0,
  workFromHome: 0,
  onLeave: 0,
};

/**
 * How long a roster answer is trusted before it is re-read.
 *
 * Short, because punches land all morning; but long enough that moving between
 * the dashboard and the attendance page inside a minute reuses the answer
 * rather than asking the server the same question again. Past this the cached
 * answer is still shown at once, and the refetch happens behind it.
 */
const ROSTER_STALE_MS = 60 * 1000;

/**
 * The cache key for one period.
 *
 * Exported so the dashboard's availability panel reads today through the same
 * entry the attendance section fills - one request for both, and no chance of
 * the two showing different mornings.
 */
export const rosterDayKey = (
  from: string,
  to: string,
  detail: "day" | "summary"
) => [ROSTER_DAY_ROOT, from, to, detail];

async function fetchRosterDay(
  from: string,
  to: string,
  detail: "day" | "summary"
): Promise<RosterDayResponse> {
  const response = await attendanceAPI.getRosterDay(from, to, detail);
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Could not load attendance");
  }
  return response.data as RosterDayResponse;
}

/**
 * The roster for one period, kept in the app-wide query cache.
 *
 * It used to live in component state, so leaving the page threw it away and
 * coming back started from a spinner and a fresh request. Cached, a return
 * visit draws the last answer immediately and only re-reads it once it is
 * older than ROSTER_STALE_MS.
 *
 * `loading` is true only when there is nothing to show yet; `refreshing` is
 * true whenever a request is in flight, which is what the refresh button spins
 * on. A failed background refresh keeps the answer on screen rather than
 * replacing a good roster with an error - `fetchedAt` still says how old it is.
 */
export function useRosterDay(
  from: string,
  to: string,
  detail: "day" | "summary",
  options: { enabled?: boolean } = {}
) {
  const query = useQuery({
    queryKey: rosterDayKey(from, to, detail),
    queryFn: () => fetchRosterDay(from, to, detail),
    staleTime: ROSTER_STALE_MS,
    enabled: options.enabled ?? true,
  });

  const { refetch } = query;
  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const data = query.data ?? null;
  const failure = query.error as any;
  const error =
    data || !failure
      ? ""
      : failure?.response?.data?.message ||
        failure?.message ||
        "Could not load attendance";

  return {
    data,
    loading: query.isLoading,
    refreshing: query.isFetching,
    error,
    refresh,
    /**
     * When the answer on screen was read from the server. A roster is a live
     * figure, so a screen showing one has to say how old it is.
     */
    fetchedAt: query.dataUpdatedAt
      ? new Date(query.dataUpdatedAt).toISOString()
      : null,
  };
}

export default useRosterDay;
