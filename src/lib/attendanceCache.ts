import type { QueryClient } from "@tanstack/react-query";

/**
 * attendanceCache.ts
 * ------------------
 * Where fetched attendance lives between visits to the attendance screen.
 *
 * Attendance was held in component state, so navigating to any other page
 * destroyed it and coming back showed an empty screen. For one employee that is
 * an annoyance; for the roster it is a request per employee, four at a time,
 * repeated every single time somebody glances at another page and returns.
 *
 * Moving it into the React Query cache - which lives on the QueryClient at the
 * root of the app, not in the page - means a fetch survives navigation for the
 * whole session. The page still decides *when* to fetch; this only decides
 * where the answer is kept.
 *
 * The keys carry every input the answer depends on - who, which range, which
 * arrival rule - so changing any of them looks up a different entry rather than
 * showing figures that were calculated for something else.
 */

/** Namespace roots, so cache defaults and invalidation can match on prefix. */
export const EMPLOYEE_ATTENDANCE_ROOT = "employee-attendance";
export const ROSTER_ATTENDANCE_ROOT = "roster-attendance";

/** "official" rather than undefined, so the admin's saved rule keys stably. */
const policyKey = (policy?: string | null) => policy || "official";

/** One employee's records for one range under one arrival rule. */
export const employeeAttendanceKey = (
  employeeId: string | number,
  from: string,
  to: string,
  policy?: string | null
) => [EMPLOYEE_ATTENDANCE_ROOT, String(employeeId), from, to, policyKey(policy)];

/** Every enrolled employee's records for one range under one arrival rule. */
export const rosterAttendanceKey = (
  from: string,
  to: string,
  policy?: string | null
) => [ROSTER_ATTENDANCE_ROOT, from, to, policyKey(policy)];

/**
 * How long an attendance answer is kept and how long it is trusted.
 *
 * `gcTime` is the one that matters here. These entries are written with
 * setQueryData and read with getQueryData rather than being observed by a
 * mounted useQuery, and an unobserved entry is evicted once gcTime elapses -
 * which on the default five minutes would put us back to refetching the roster
 * every time somebody spent a few minutes elsewhere.
 *
 * Two hours covers a working session without pretending attendance never
 * changes: the punches behind it only move when the agent syncs, and the reader
 * can always fetch again.
 */
const GC_TIME_MS = 2 * 60 * 60 * 1000;
const STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Applied once, at the root, so every attendance entry outlives the page that
 * created it. Called from App.tsx where the QueryClient is built.
 */
export function configureAttendanceCache(client: QueryClient): void {
  for (const root of [EMPLOYEE_ATTENDANCE_ROOT, ROSTER_ATTENDANCE_ROOT]) {
    client.setQueryDefaults([root], {
      gcTime: GC_TIME_MS,
      staleTime: STALE_TIME_MS,
    });
  }
}
