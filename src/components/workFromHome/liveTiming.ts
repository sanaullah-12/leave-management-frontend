import { useEffect, useState } from "react";
import type { WfhMonitorRow } from "../../hooks/useWfhSession";

/**
 * How a work-from-home day is counted on screen between refetches.
 *
 * Shared by the compact live timers and the full monitor so the two cannot show
 * different numbers for the same person on the same page.
 */

/** One shared clock for every row, so 40 rows do not run 40 timers. */
export function useSecondTick(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

/**
 * How far past the employee's last heartbeat a row may keep counting.
 *
 * The server counts a running stretch only up to the last sign of life, so
 * every second this adds on top is a guess that the employee is still there.
 * The guess is right for as long as a heartbeat is merely due, and wrong the
 * moment one is overdue - which is exactly what an employee who has walked away
 * looks like. Half an interval past the interval is the line: a working timer
 * never reaches it, because a heartbeat lands first and moves the figure on,
 * and a deserted one stops within seconds of being deserted rather than
 * climbing for the whole idle timeout and then jumping backwards.
 *
 * Falls back to 90s when the config has not loaded, matching the server's
 * 60-second default.
 */
export const heartbeatGraceMs = (heartbeatSeconds?: number): number =>
  Math.round((heartbeatSeconds && heartbeatSeconds > 0 ? heartbeatSeconds : 60) * 1500);

/**
 * Worked time for a row.
 *
 * A running session is extrapolated from `countingSince`; anything else already
 * holds its final figure, which is what makes an inactive row's timer stop
 * dead - the server sends no `countingSince` for a session it is not counting.
 * The extrapolation is bounded by `graceMs`, so the number only ever lags the
 * truth and never runs ahead of it - the direction a monitor should be wrong
 * in, since an admin acting on an inflated figure is acting on time nobody
 * worked.
 */
export const workedMs = (
  row: WfhMonitorRow,
  now: number,
  graceMs: number = heartbeatGraceMs()
): number => {
  const session = row.session;
  if (!session) return 0;
  if (session.status !== "working" || !session.countingSince) {
    return session.activeMs;
  }
  const since = new Date(session.countingSince).getTime();
  return session.activeMs + Math.min(Math.max(0, now - since), graceMs);
};

/** Not started first, then working, then inactive - urgency order, not alphabetical. */
export const STATUS_ORDER: Record<string, number> = {
  working: 0,
  paused: 1,
  not_started: 2,
  completed: 3,
};

/** The monitor's own ordering, applied without mutating the query's array. */
export const byUrgency = (rows: WfhMonitorRow[]): WfhMonitorRow[] =>
  [...rows].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
      a.employee.name.localeCompare(b.employee.name)
  );
