import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * attendanceCache.ts
 * ------------------
 * Where fetched attendance lives between visits to the attendance screen, and
 * between visits to the app.
 *
 * Attendance was held in component state, so navigating to any other page
 * destroyed it and coming back showed an empty table - which the roster renders
 * as every employee absent, because an employee with no record looks exactly
 * like an employee who did not turn up. For one person that is an annoyance;
 * for the roster it is a request per employee, four at a time, repeated every
 * time somebody glances at another page.
 *
 * Three separate things have to survive for the screen to come back intact, and
 * missing any one of them looks identical to the reader:
 *
 *   1. the attendance records          - the answer
 *   2. the device roster               - who the answer is about; without it
 *                                        the table has no rows to draw
 *   3. the range and arrival rule      - which question was asked; without it
 *                                        the lookup asks a different question
 *                                        and misses its own cached answer
 *
 * (1) and (2) live in the React Query cache, which sits on the QueryClient at
 * the root of the app rather than in the page. (3) is small and is kept in
 * localStorage next to it.
 *
 * The cache is also mirrored into localStorage, so a full reload keeps what was
 * fetched instead of starting from nothing.
 */

/** Namespace roots, so cache defaults, persistence and eviction match on prefix. */
export const EMPLOYEE_ATTENDANCE_ROOT = "employee-attendance";
export const ROSTER_ATTENDANCE_ROOT = "roster-attendance";
export const MACHINE_EMPLOYEES_ROOT = "machine-employees";

const PERSISTED_ROOTS = [
  EMPLOYEE_ATTENDANCE_ROOT,
  ROSTER_ATTENDANCE_ROOT,
  MACHINE_EMPLOYEES_ROOT,
];

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
 * Who is enrolled on one device.
 *
 * Cached for the same reason as the attendance, and it matters more than it
 * looks: the roster table renders one row per enrolled employee, so an empty
 * list draws an empty table however much attendance sits behind it. Restoring
 * the records without restoring who they belong to fixes nothing anyone sees.
 */
export const machineEmployeesKey = (ip: string) => [MACHINE_EMPLOYEES_ROOT, ip];

/**
 * How long an attendance answer is kept and how long it is trusted.
 *
 * `gcTime` is the one that matters. These entries are written with setQueryData
 * and read with getQueryData rather than being observed by a mounted useQuery,
 * and an unobserved entry is evicted once gcTime elapses - which on the default
 * five minutes would put us back to refetching the roster every time somebody
 * spent a few minutes elsewhere.
 */
const GC_TIME_MS = 2 * 60 * 60 * 1000;
const STALE_TIME_MS = 5 * 60 * 1000;

/** Applied once, at the root, so entries outlive the page that created them. */
export function configureAttendanceCache(client: QueryClient): void {
  for (const root of PERSISTED_ROOTS) {
    client.setQueryDefaults([root], {
      gcTime: GC_TIME_MS,
      staleTime: STALE_TIME_MS,
    });
  }
}

/* -------------------------------------------------------------------------
 * Which question the screen was asking
 * ---------------------------------------------------------------------- */

const VIEW_STORAGE_PREFIX = "nexora:attendance:view:";

export interface AttendanceView {
  startDate: string;
  endDate: string;
  policy: "flexible" | "strict" | null;
}

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

/**
 * The range and arrival rule this person last looked at.
 *
 * Kept because the cache is keyed by them. A page that comes back on its
 * default range looks up an answer nobody asked for, misses, and shows an empty
 * table - even though the answer to the real question is sitting in the cache.
 */
export function loadAttendanceView(userId?: string | null): AttendanceView | null {
  try {
    const raw = localStorage.getItem(`${VIEW_STORAGE_PREFIX}${userId || "anon"}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isIsoDate(parsed?.startDate) || !isIsoDate(parsed?.endDate)) return null;
    if (parsed.startDate > parsed.endDate) return null;

    return {
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      policy:
        parsed.policy === "flexible" || parsed.policy === "strict"
          ? parsed.policy
          : null,
    };
  } catch {
    return null;
  }
}

export function saveAttendanceView(
  userId: string | null | undefined,
  view: AttendanceView
): void {
  try {
    localStorage.setItem(
      `${VIEW_STORAGE_PREFIX}${userId || "anon"}`,
      JSON.stringify(view)
    );
  } catch {
    /* private mode or full quota - the range simply falls back to the default */
  }
}

/* -------------------------------------------------------------------------
 * Surviving a reload
 * ---------------------------------------------------------------------- */

const CACHE_STORAGE_KEY = "nexora:attendance-cache:v1";

/**
 * Past this the mirror is not written at all.
 *
 * localStorage is a few megabytes for the whole origin and is shared with
 * everything else the app keeps there. Attendance is the largest thing this app
 * caches, so it takes a bounded share and gives up rather than evicting
 * somebody's session to make room for a table they can refetch.
 */
const MAX_PERSISTED_BYTES = 2_000_000;

/**
 * Attendance older than this is refetched rather than shown.
 *
 * Long enough to cover a working day of coming and going, short enough that
 * nobody is shown yesterday's roster this morning without asking for it.
 */
const MAX_PERSISTED_AGE_MS = 12 * 60 * 60 * 1000;

/** How long to wait after a write before mirroring, so a roster load writes once. */
const WRITE_DEBOUNCE_MS = 1500;

interface PersistedEntry {
  key: unknown[];
  data: unknown;
  savedAt: number;
}

const isPersistedRoot = (key: unknown): boolean =>
  Array.isArray(key) && typeof key[0] === "string" && PERSISTED_ROOTS.includes(key[0]);

/**
 * Put the last session's attendance back before anything renders.
 *
 * Entries are written straight into the cache, so the page finds them through
 * exactly the same getQueryData lookup it uses for a fetch made a moment ago -
 * there is no second code path for "restored from disk", and therefore no
 * second way for it to be wrong.
 */
export function hydrateAttendanceCache(client: QueryClient): void {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return;

    const entries: PersistedEntry[] = JSON.parse(raw);
    if (!Array.isArray(entries)) return;

    const cutoff = Date.now() - MAX_PERSISTED_AGE_MS;
    let restored = 0;

    for (const entry of entries) {
      if (!entry || !isPersistedRoot(entry.key)) continue;
      if (!entry.savedAt || entry.savedAt < cutoff) continue;
      client.setQueryData<unknown>(entry.key as QueryKey, entry.data);
      restored += 1;
    }

    if (!restored) localStorage.removeItem(CACHE_STORAGE_KEY);
  } catch {
    // A corrupt or half-written mirror must never stop the app booting.
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {
      /* nothing else to try */
    }
  }
}

/**
 * Mirror attendance entries to localStorage as they are written.
 *
 * Debounced because a roster load writes one entry per employee in quick
 * succession, and serialising the whole set on each of them would be the most
 * expensive thing on the page.
 */
export function startAttendanceCachePersistence(client: QueryClient): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const write = () => {
    timer = null;
    try {
      const entries: PersistedEntry[] = client
        .getQueryCache()
        .getAll()
        .filter((query) => isPersistedRoot(query.queryKey) && query.state.data !== undefined)
        .map((query) => ({
          key: query.queryKey as unknown[],
          data: query.state.data,
          savedAt: query.state.dataUpdatedAt || Date.now(),
        }));

      if (!entries.length) {
        localStorage.removeItem(CACHE_STORAGE_KEY);
        return;
      }

      const payload = JSON.stringify(entries);
      if (payload.length > MAX_PERSISTED_BYTES) {
        // Too big to keep honestly. Drop the mirror rather than persist a
        // partial roster, which would come back as a table full of people
        // wrongly marked absent.
        localStorage.removeItem(CACHE_STORAGE_KEY);
        return;
      }

      localStorage.setItem(CACHE_STORAGE_KEY, payload);
    } catch {
      // Quota exceeded, or private mode. The in-memory cache still works for
      // the rest of the session; only surviving a reload is lost.
      try {
        localStorage.removeItem(CACHE_STORAGE_KEY);
      } catch {
        /* nothing else to try */
      }
    }
  };

  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (!event?.query || !isPersistedRoot(event.query.queryKey)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(write, WRITE_DEBOUNCE_MS);
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}

/** Forget everything cached and mirrored. Used when a different person signs in. */
export function clearAttendanceCache(client: QueryClient): void {
  for (const root of PERSISTED_ROOTS) {
    client.removeQueries({ queryKey: [root] });
  }
  try {
    localStorage.removeItem(CACHE_STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}
