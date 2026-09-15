import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wfhSessionAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { NOTIF_KEY } from "./useNotifications";

/**
 * useWfhSession
 * -------------
 * The work timer on an approved work-from-home day.
 *
 * Matches the shape the rest of the module uses - one exported key per cache
 * entry so useSocket can invalidate it, mutations that invalidate on success -
 * with one addition the other hooks do not need: the browser has to tell the
 * server it is still there.
 *
 * -- What is watched, and what is not -------------------------------------
 *
 * `useActivityPulse` listens for one thing: a person operating an input device.
 * Mouse movement, mouse buttons, the wheel, key presses, and their touch
 * equivalents. Nothing else counts - not a screen that is on, not an open or
 * focused tab, not a video playing, not a page updating itself, not an
 * animation, not a request in flight. None of those can produce any of the
 * events it listens for, so a machine nobody is sitting at goes quiet on its
 * own rather than being kept alive by whatever is on screen.
 *
 * It reads NOTHING from the events themselves. Which key, where the pointer
 * went, what is on screen, what is in the page - none of it is inspected,
 * stored or sent. What is kept is a single timestamp meaning "input happened",
 * and the only thing that leaves the browser is an empty request saying the
 * same, at most once per heartbeat interval.
 *
 * -- Why the timer on screen is not the timer -----------------------------
 *
 * Worked time is whatever the server says it is. The count-up here starts from
 * the server's own figure and its own "counted up to" instant, so it renders
 * that number moving rather than a number of its own; every heartbeat replaces
 * it with a fresh one. Editing anything in this file changes what the employee
 * SEES and nothing about what is recorded.
 */

export const WFH_SESSION_KEY = ["wfh-session-today"] as const;
export const WFH_SESSION_LIVE_KEY = ["wfh-session-live"] as const;
export const WFH_SESSION_HISTORY_KEY = ["wfh-session-history"] as const;

export type WfhSessionStatus = "working" | "paused" | "completed";
/** What the monitor shows for someone who has an approved day but no session. */
export type WfhRowStatus = WfhSessionStatus | "not_started";

export interface WfhSessionSegment {
  startedAt: string;
  endedAt: string | null;
  endedBy: "employee" | "inactivity" | "system" | null;
  durationMs: number;
}

export interface WfhSessionEvent {
  type:
    | "started"
    | "paused"
    | "auto_paused"
    | "resumed"
    | "finished"
    | "auto_finished"
    | "task_added"
    | "task_started"
    | "task_completed";
  at: string;
  actor: "employee" | "system";
  note?: string;
}

/**
 * One piece of work inside the day.
 *
 * `activeMs` is the server's own arithmetic - the overlap of the stretches this
 * task was in hand with the stretches that were actually worked - so the task
 * figures on a card always add up to the day's total and never past it.
 */
export interface WfhSessionTaskSpan {
  from: string;
  /** Null while this is the task in hand. */
  to: string | null;
  /** Worked time inside this stretch - it excludes any pause within it. */
  activeMs: number;
}

export interface WfhSessionTask {
  _id: string;
  title: string;
  status: "pending" | "active" | "completed";
  startedAt: string | null;
  completedAt: string | null;
  /** Whether it came from the request or was added during the day. */
  source: "planned" | "added";
  activeMs: number;
  /** When it was worked on. Each stretch carries its own counted time. */
  spans: WfhSessionTaskSpan[];
}

export interface WfhSession {
  _id: string;
  employee: string | { _id: string; name?: string; employeeId?: string; department?: string };
  /** The approved request that permitted this day. */
  request?: string;
  date: string;
  status: WfhSessionStatus;
  plannedStartTime: string;
  plannedEndTime: string;
  startedAt: string;
  finishedAt: string | null;
  finishedBy: "employee" | "system" | null;
  /** When work actually stopped, which is not when Finish was pressed. */
  lastWorkedAt: string | null;
  lastActivityAt: string;
  activeMs: number;
  idleMs: number;
  segmentCount: number;
  /** The instant `activeMs` is counted up to while the timer runs. */
  countingSince: string | null;
  /** When the server will stop counting if nothing else arrives. */
  idleDeadline: string | null;
  segments: WfhSessionSegment[];
  tasks: WfhSessionTask[];
  /** The one task in hand, lifted out so no screen has to search for it. */
  currentTask: { _id: string; title: string; activeMs: number } | null;
  events: WfhSessionEvent[];
}

export interface WfhSessionConfig {
  idleTimeoutMinutes: number;
  idleTimeoutMs: number;
  heartbeatSeconds: number;
  maxSessionHours: number;
}

export interface WfhTodayState {
  date: string;
  /** An approved day is the only thing that lets the timer be started. */
  eligible: boolean;
  request: {
    _id: string;
    startDate: string;
    endDate: string;
    reason: string;
    plannedStartTime: string;
    plannedEndTime: string;
    /** What the employee said they would work on. Seeded onto the session
        when the day starts, so this is only read before that. */
    plannedTasks: string[];
  } | null;
  session: WfhSession | null;
  config: WfhSessionConfig;
}

export interface WfhMonitorRow {
  employee: {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
    profilePicture: string;
  };
  plannedStartTime: string;
  plannedEndTime: string;
  requestId: string | null;
  status: WfhRowStatus;
  session: WfhSession | null;
}

export interface WfhMonitorSummary {
  not_started: number;
  working: number;
  paused: number;
  completed: number;
  total: number;
  activeMs: number;
}

// ------------------------------------------------------------------ Queries

/** The employee's own day: the approval, the plan, and the session if started. */
export function useWfhToday() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: WFH_SESSION_KEY,
    queryFn: async () => {
      const res = await wfhSessionAPI.getToday();
      return res.data as WfhTodayState;
    },
    enabled: isAuthenticated,
    // No polling. The heartbeat writes each fresh server reading straight into
    // this cache entry, and socket events cover everything else.
    refetchInterval: false,
    refetchOnWindowFocus: true,
    staleTime: 15 * 1000,
  });
}

/**
 * Admin: everyone approved to work from home today, and how their day is going.
 *
 * State changes arrive over Socket.IO, as everywhere else in the app. The slow
 * refetch underneath is a net rather than the mechanism: it catches the one case
 * sockets cannot, an event emitted while this tab was disconnected, without
 * which a monitor left open overnight would still be showing yesterday.
 */
export function useWfhLiveMonitor(enabled = true, date?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...WFH_SESSION_LIVE_KEY, date ?? "today"],
    queryFn: async () => {
      const res = await wfhSessionAPI.getLive(date);
      return res.data as {
        date: string;
        rows: WfhMonitorRow[];
        summary: WfhMonitorSummary;
        config: WfhSessionConfig;
      };
    },
    enabled: isAuthenticated && enabled,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    staleTime: 15 * 1000,
  });
}

/** Finished days. Own history for an employee, the company's for an admin. */
export function useWfhSessionHistory(
  filters: { employeeId?: string; from?: string; to?: string; status?: string } = {},
  enabled = true
) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...WFH_SESSION_HISTORY_KEY, filters],
    queryFn: async () => {
      const res = await wfhSessionAPI.getHistory({ ...filters, limit: 100 });
      return (res.data?.sessions ?? []) as WfhSession[];
    },
    enabled: isAuthenticated && enabled,
    refetchInterval: false,
    staleTime: 60 * 1000,
  });
}

/** One day in full: every stretch worked, and the audit trail behind it. */
export function useWfhSessionDetail(id: string | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...WFH_SESSION_HISTORY_KEY, "detail", id],
    queryFn: async () => {
      const res = await wfhSessionAPI.getSession(id!);
      return res.data?.session as WfhSession;
    },
    enabled: isAuthenticated && !!id,
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------- Mutations

/** Everything that changes when a work session does. */
function useWfhSessionInvalidation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: WFH_SESSION_KEY });
    qc.invalidateQueries({ queryKey: WFH_SESSION_LIVE_KEY });
    qc.invalidateQueries({ queryKey: WFH_SESSION_HISTORY_KEY });
    qc.invalidateQueries({ queryKey: NOTIF_KEY });
  };
}

/**
 * The four actions, as one hook.
 *
 * The card needs all of them at once, and each does the same two things with
 * the reply - put the server's session in the cache so the card re-renders on
 * the same frame, then invalidate everything a state change touches - so the
 * options are written once and the four mutations share them.
 */
export function useWfhSessionActions() {
  const invalidate = useWfhSessionInvalidation();
  const qc = useQueryClient();

  const settle = (session: WfhSession) => {
    qc.setQueryData(WFH_SESSION_KEY, (prev: WfhTodayState | undefined) =>
      prev ? { ...prev, session } : prev
    );
    invalidate();
  };

  const unwrap = async (res: { data: { session: WfhSession } }) =>
    res.data.session;

  /**
   * The three task actions, alongside the four timer ones.
   *
   * They settle the same way - the server's session straight into the cache,
   * then the usual invalidation - because a task change and a pause are the
   * same kind of event to every screen reading this: the session moved on.
   */
  const addTask = useMutation({
    mutationFn: async (title: string) =>
      unwrap(await wfhSessionAPI.addTask(title)),
    onSuccess: settle,
  });
  const startTask = useMutation({
    mutationFn: async (taskId: string) =>
      unwrap(await wfhSessionAPI.startTask(taskId)),
    onSuccess: settle,
  });
  const completeTask = useMutation({
    mutationFn: async (taskId: string) =>
      unwrap(await wfhSessionAPI.completeTask(taskId)),
    onSuccess: settle,
  });

  const start = useMutation({
    mutationFn: async () => unwrap(await wfhSessionAPI.start()),
    onSuccess: settle,
  });
  const pause = useMutation({
    mutationFn: async () => unwrap(await wfhSessionAPI.pause()),
    onSuccess: settle,
  });
  const resume = useMutation({
    mutationFn: async () => unwrap(await wfhSessionAPI.resume()),
    onSuccess: settle,
  });
  const finish = useMutation({
    mutationFn: async () => unwrap(await wfhSessionAPI.finish()),
    onSuccess: settle,
  });

  return { start, pause, resume, finish, addTask, startTask, completeTask };
}

// ------------------------------------------------------------ Activity pulse

/**
 * The events that mean a person physically operated an input device.
 *
 * The list is deliberately short, and what is NOT in it is the point. A screen
 * that is on, a tab that is open, a window that has focus, a video playing, a
 * page updating itself, an animation running - none of them are a person, and
 * none of them can produce any of these events. `visibilitychange` is
 * excluded for exactly that reason: a tab becoming visible again says a window
 * was switched to, not that anybody is at the keyboard, and the mouse movement
 * or key press of somebody who really is there arrives on its own a moment
 * later. `scroll` is excluded too - a page can scroll itself, and a timer must
 * never be kept alive by the page it is running on.
 *
 * `wheel` and the touch events stay: both require a hand on a device, which is
 * the whole test. Touch is how the same person uses the same page on a tablet.
 *
 * Passive listeners on the whole document, so they cost nothing and never
 * interfere with the page.
 */
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "mouseup",
  "wheel",
  "keydown",
  "keyup",
  "touchstart",
  "touchmove",
] as const;

export interface ActivityPulse {
  /** True while the browser has seen input recently enough to still count. */
  locallyActive: boolean;
  /** Local clock, ticking once a second, for the count-up display. */
  now: number;
}

/**
 * Keeps the server informed that the employee is present, and tells the caller
 * when the browser thinks they are not.
 *
 * Two rules make this honest rather than decorative:
 *
 *   1. A heartbeat is sent ONLY when there has been input since the last one.
 *      A loop that pinged unconditionally would mean a forgotten open tab
 *      reported a full working day, which is the exact failure this feature
 *      exists to prevent.
 *
 *   2. Crossing the idle threshold sends one final heartbeat immediately. The
 *      server has been waiting on a signal that never came, and this is what
 *      makes it pause the timer and tell the admin now rather than on the next
 *      sweep.
 *
 * Nothing is sent while the session is paused or finished. A resume is a
 * deliberate act, never something a stray pointer movement can cause.
 */
export function useActivityPulse({
  enabled,
  heartbeatSeconds,
  idleTimeoutMs,
  onBeat,
}: {
  enabled: boolean;
  heartbeatSeconds: number;
  idleTimeoutMs: number;
  onBeat: () => void;
}): ActivityPulse {
  const lastActivityRef = useRef(Date.now());
  const activitySinceBeatRef = useRef(true);
  const lastBeatRef = useRef(0);
  const idleReportedRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const [locallyActive, setLocallyActive] = useState(true);

  // Re-read on every tick without re-subscribing the interval.
  const onBeatRef = useRef(onBeat);
  onBeatRef.current = onBeat;

  /**
   * Input happened. The event is not looked at beyond one question - did a
   * person cause it - and nothing but the instant is kept.
   *
   * `isTrusted` is that question. It is false for anything a script dispatched,
   * so a page that synthesises its own mouse or key events, deliberately or as
   * part of some widget, cannot hold the timer open. Only input the browser
   * itself generated from a real device sets the flag.
   */
  const markActive = useCallback((event?: Event) => {
    if (event && !event.isTrusted) return;
    lastActivityRef.current = Date.now();
    activitySinceBeatRef.current = true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Starting or resuming is itself the most recent activity there is.
    markActive();
    idleReportedRef.current = false;
    lastBeatRef.current = Date.now();
    setLocallyActive(true);

    const options = { passive: true, capture: true } as const;
    // Capture phase, so input still counts on a page whose own handler stops
    // the event before it bubbles back up to the document.
    ACTIVITY_EVENTS.forEach((event) =>
      document.addEventListener(event, markActive, options)
    );

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        document.removeEventListener(event, markActive, options)
      );
    };
  }, [enabled, markActive]);

  useEffect(() => {
    if (!enabled) {
      setLocallyActive(true);
      return;
    }

    const tick = () => {
      const current = Date.now();
      setNow(current);

      const silentFor = current - lastActivityRef.current;
      const idle = silentFor >= idleTimeoutMs;
      setLocallyActive(!idle);

      if (idle) {
        // One last beat as the threshold is crossed. The server reconciles on
        // it and pauses, so the employee is told why in the same moment the
        // admin is - rather than up to a minute later when the sweep runs.
        if (!idleReportedRef.current) {
          idleReportedRef.current = true;
          onBeatRef.current();
        }
        return;
      }

      idleReportedRef.current = false;
      const dueFor = current - lastBeatRef.current;
      if (dueFor >= heartbeatSeconds * 1000 && activitySinceBeatRef.current) {
        lastBeatRef.current = current;
        activitySinceBeatRef.current = false;
        onBeatRef.current();
      }
    };

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [enabled, heartbeatSeconds, idleTimeoutMs]);

  return { locallyActive, now };
}

/**
 * The heartbeat itself.
 *
 * Kept out of `useActivityPulse` so that hook stays about the browser and this
 * one stays about the server. The reply is written into the cache, which is
 * what makes the card correct itself - a heartbeat that lands after the server
 * has already paused the session comes back saying so, and the card switches to
 * "paused due to inactivity" without a separate request.
 *
 * Failures are swallowed on purpose. A dropped connection must not put an error
 * in front of someone who is working; the server is already treating the
 * silence as inactivity, which is the correct and safe reading of it.
 */
export function useWfhHeartbeat() {
  const qc = useQueryClient();
  const inFlight = useRef(false);

  return useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await wfhSessionAPI.heartbeat();
      const session = res.data?.session as WfhSession | undefined;
      if (!session) return;
      qc.setQueryData(WFH_SESSION_KEY, (prev: WfhTodayState | undefined) =>
        prev ? { ...prev, session } : prev
      );
      if (session.status !== "working") {
        // The server paused or closed the day underneath us; the monitor and
        // the notification bell both have something new to show.
        qc.invalidateQueries({ queryKey: WFH_SESSION_LIVE_KEY });
        qc.invalidateQueries({ queryKey: NOTIF_KEY });
      }
    } catch {
      // Offline, or the session is gone. Either way the server's own reading of
      // the silence is the one that counts.
    } finally {
      inFlight.current = false;
    }
  }, [qc]);
}

/**
 * The number on screen.
 *
 * Starts from the server's `activeMs` and its `countingSince` - the instant
 * that figure is counted up to - and moves it forward locally so the display
 * ticks once a second instead of once a heartbeat. It is a rendering of the
 * server's number, never a second opinion about it: every heartbeat replaces
 * both inputs, and the moment the browser stops seeing activity it stops
 * advancing, which is exactly when the server stops counting too.
 */
export function displayedActiveMs(
  session: WfhSession | null | undefined,
  pulse: ActivityPulse
): number {
  if (!session) return 0;
  if (session.status !== "working" || !session.countingSince) {
    return session.activeMs;
  }
  if (!pulse.locallyActive) return session.activeMs;

  const since = new Date(session.countingSince).getTime();
  return session.activeMs + Math.max(0, pulse.now - since);
}
