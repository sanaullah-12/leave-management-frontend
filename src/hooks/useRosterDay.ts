import { useCallback, useEffect, useState } from "react";
import { attendanceAPI } from "../services/api";
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

export function useRosterDay(
  from: string,
  to: string,
  detail: "day" | "summary"
) {
  const [data, setData] = useState<RosterDayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  /** Bumped by refresh(); the fetch effect watches it. */
  const [reloads, setReloads] = useState(0);

  const refresh = useCallback(() => setReloads((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await attendanceAPI.getRosterDay(from, to, detail);
        if (cancelled) return;

        if (!response.data?.success) {
          throw new Error(response.data?.message || "Could not load attendance");
        }
        setData(response.data as RosterDayResponse);
      } catch (err: any) {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Could not load attendance"
        );
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [from, to, detail, reloads]);

  return { data, loading, error, refresh };
}

export default useRosterDay;
