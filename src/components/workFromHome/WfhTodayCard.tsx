import React, { useMemo, useState } from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { CARD } from "../../lib/surfaces";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { AccentEdge } from "../ui/CardAccents";
import { useThemeAccent } from "../../hooks/useThemeAccent";
import WfhSessionStatusBadge from "./WfhSessionStatusBadge";
import WfhSessionSummary from "./WfhSessionSummary";
import WfhTimerRing, { type RingTone } from "./WfhTimerRing";
import WfhTaskPanel from "./WfhTaskPanel";
import {
  formatStopwatch,
  formatHm,
  formatClock,
  formatPlannedWindow,
  plannedDurationMs,
} from "./sessionFormat";
import {
  useWfhToday,
  useWfhSessionActions,
  useWfhHeartbeat,
  useActivityPulse,
  displayedActiveMs,
} from "../../hooks/useWfhSession";
import { showErrorToast, showSuccessToast } from "../../utils/toastHelpers";
import { requestDesktopNotices } from "../../services/desktopNotifications";

/**
 * WFH - Today
 * -----------
 * The employee's one card for the working day: what they planned, what the
 * server has counted, what they are working on, and the single action that
 * makes sense right now.
 *
 * One action at a time is the point. A card offering Start, Pause, Resume and
 * Finish together would make three of them errors at any given moment; the
 * state decides which one is on screen, so there is nothing to get wrong. The
 * ring carries the same idea into the shape of the thing - the control sits
 * inside the clock it controls, and the day's one irreversible action sits
 * outside it.
 *
 * The number is a rendering of the server's figure moving, not a timer of its
 * own - see hooks/useWfhSession. It runs from Start until the employee pauses
 * or finishes the day: the inactivity rule that used to stop it is off, and the
 * server is not counting on any other basis either.
 */

const WfhTodayCard: React.FC = () => {
  const accent = useThemeAccent(600);
  // Drives the one piece of layout that differs by screen: whether the privacy
  // note starts folded. See the note beside the <details> below.
  const isPhone = useMediaQuery("(max-width: 639px)");
  const accentSoft = useThemeAccent(400);
  const { data, isLoading } = useWfhToday();
  const actions = useWfhSessionActions();
  const beat = useWfhHeartbeat();
  // Null until the reader has an opinion, so the panel can default to open on a
  // day that has tasks and stay shut on one that does not.
  const [tasksOpen, setTasksOpen] = useState<boolean | null>(null);

  const session = data?.session ?? null;
  const config = data?.config;
  const working = session?.status === "working";

  /**
   * Whether input decides anything at all, which is the server's call and not
   * this card's. It is currently off, so the pulse attaches no listeners and
   * only keeps the heartbeat going; see hooks/useWfhSession.
   */
  const watchesInput = config?.inactivityAutoPause ?? false;

  // Only a running timer needs the heartbeat. A paused or finished day has
  // nothing to report, and a resume must be a deliberate act rather than
  // something a stray pointer movement can cause.
  const pulse = useActivityPulse({
    enabled: working,
    watchInput: watchesInput,
    heartbeatSeconds: config?.heartbeatSeconds ?? 60,
    idleTimeoutMs: config?.idleTimeoutMs ?? 5 * 60 * 1000,
    onBeat: beat,
  });

  const shownMs = displayedActiveMs(session, pulse);
  /**
   * The part of the clock this browser has advanced past the server's figure.
   *
   * The task in hand is the only thing that could have been worked on in those
   * seconds, so it is the only task they are shown against - which keeps the
   * task times on the panel adding up to the clock above them.
   */
  const liveExtraMs = Math.max(0, shownMs - (session?.activeMs ?? 0));

  const tasks = session?.tasks ?? [];
  const currentTask = session?.currentTask ?? null;
  const plannedTasks = data?.request?.plannedTasks ?? [];

  /** How far through the planned day they are. Absent when nothing was planned. */
  const progress = useMemo(() => {
    const planned = plannedDurationMs(
      session?.plannedStartTime || data?.request?.plannedStartTime,
      session?.plannedEndTime || data?.request?.plannedEndTime
    );
    if (!planned) return null;
    return Math.min(1, shownMs / planned);
  }, [session, data?.request, shownMs]);

  const run = async (
    mutation: { mutateAsync: (input?: never) => Promise<unknown> },
    success: string
  ) => {
    try {
      await mutation.mutateAsync();
      showSuccessToast(success);
    } catch (error: any) {
      showErrorToast(
        error?.response?.data?.message || "Could not update your work session"
      );
    }
  };

  /**
   * Starting the day is also the moment to ask about desktop alerts.
   *
   * It is the one click in this feature that is certain to be followed by hours
   * away from the page, which is exactly when a notification is worth having -
   * and a browser only allows the prompt from a gesture like this one. It is
   * asked once per device and never repeated; see services/desktopNotifications.
   */
  const startWork = () => {
    void requestDesktopNotices();
    void run(actions.start, "Work session started");
  };

  /** The three task actions. Each reports its own failure and nothing else. */
  const runTask = async (promise: Promise<unknown>, success: string) => {
    try {
      await promise;
      showSuccessToast(success);
    } catch (error: any) {
      showErrorToast(
        error?.response?.data?.message || "Could not update your tasks"
      );
    }
  };

  const busy =
    actions.start.isPending ||
    actions.pause.isPending ||
    actions.resume.isPending ||
    actions.finish.isPending;

  const taskBusy =
    actions.addTask.isPending ||
    actions.startTask.isPending ||
    actions.completeTask.isPending;

  if (isLoading) {
    return (
      <div className={`relative overflow-hidden ${CARD} p-5 sm:p-6`}>
        <AccentEdge color={accent} />
        <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
      </div>
    );
  }

  // No approved day means no timer. Said plainly rather than shown as a
  // disabled button, which would leave the reader guessing why.
  if (!data?.eligible && !session) return null;

  const planned = formatPlannedWindow(
    session?.plannedStartTime || data?.request?.plannedStartTime,
    session?.plannedEndTime || data?.request?.plannedEndTime
  );

  const status = session?.status ?? "not_started";
  // Paused after walking away reads differently from paused on purpose, and the
  // difference is the whole reason the resume step exists.
  const pausedByInactivity =
    session?.status === "paused" &&
    session.segments.at(-1)?.endedBy === "inactivity";

  const tone: RingTone =
    status === "working"
      ? "working"
      : status === "paused"
      ? "paused"
      : status === "completed"
      ? "done"
      : "idle";

  const ringLabel =
    status === "working"
      ? "Working"
      : status === "paused"
      ? "Paused"
      : "Not started";

  const showPanel = tasksOpen ?? tasks.length > 0;

  /** The control inside the ring: whichever of pause and resume applies. */
  const innerControl =
    status === "working" || status === "paused" ? (
      <button
        type="button"
        disabled={busy}
        aria-label={status === "working" ? "Pause work" : "Resume work"}
        onClick={() =>
          status === "working"
            ? run(actions.pause, "Work session paused")
            : run(actions.resume, "Work session resumed")
        }
        className="grid h-11 w-11 place-items-center rounded-full border border-gray-200 text-gray-700 transition-[background-color,transform] hover:bg-gray-50 active:scale-95 disabled:opacity-50 dark:border-white/15 dark:text-gray-100 dark:hover:bg-white/10"
      >
        {busy ? (
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
        ) : status === "working" ? (
          <PauseIcon className="h-4 w-4" />
        ) : (
          <PlayIcon className="h-4 w-4" />
        )}
      </button>
    ) : null;

  return (
    <section
      className={`relative overflow-hidden ${CARD} p-5 sm:p-6`}
      aria-label="Work from home today"
    >
      <AccentEdge color={accent} />

      {/* Heading */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <HomeIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              WFH - Today
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Planned: {planned}
            </p>
          </div>
        </div>
        <WfhSessionStatusBadge status={status} />
      </div>

      {/* The completed day shows its summary instead of a timer - there is
          nothing left to count, and the totals are what the reader wants. */}
      {session?.status === "completed" ? (
        <>
          <WfhSessionSummary session={session} />
          {tasks.length > 0 && (
            <WfhTaskPanel
              tasks={tasks}
              readOnly
              onStart={() => undefined}
              onComplete={() => undefined}
              onAdd={() => undefined}
            />
          )}
        </>
      ) : (
        <>
          <WfhTimerRing
            progress={status === "not_started" ? null : progress}
            time={formatStopwatch(shownMs)}
            label={ringLabel}
            task={currentTask?.title ?? null}
            tone={tone}
            accent={accent}
            accentSoft={accentSoft}
          >
            {innerControl}
          </WfhTimerRing>

          {/* Paused by the system: say why, and ask before counting again. */}
          {pausedByInactivity && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-500/10">
              <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <p className="font-semibold">Work paused due to inactivity</p>
                <p className="mt-0.5">
                  No mouse or keyboard activity was detected for{" "}
                  {config?.idleTimeoutMinutes ?? 5} minutes, so the timer stopped
                  at {formatClock(session?.lastWorkedAt)}. That time is not
                  counted. Press Resume Work when you are back.
                </p>
              </div>
            </div>
          )}

          {session?.status === "paused" && !pausedByInactivity && (
            <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
              Paused at {formatClock(session.lastWorkedAt)}. Time stops counting
              until you resume.
            </p>
          )}

          {/* The day's one irreversible action, outside the ring. Beside it,
              the way into the task list - the same arrangement as the reference
              this card is built to: a control for the clock, and a control for
              everything around it. */}
          <div className="mt-5 flex items-stretch gap-2.5 sm:gap-3">
            {status !== "not_started" && (
              <button
                type="button"
                aria-expanded={showPanel}
                aria-label="Tasks"
                onClick={() => setTasksOpen(!showPanel)}
                className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full border transition-colors active:scale-95 sm:h-11 sm:w-11 ${
                  showPanel
                    ? "border-transparent bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                <ListBulletIcon className="h-5 w-5" />
                {tasks.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                    {tasks.filter((task) => task.status !== "completed").length}
                  </span>
                )}
              </button>
            )}

            {status === "not_started" ? (
              <button
                type="button"
                disabled={busy || !data?.eligible}
                onClick={startWork}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:text-sm"
              >
                {actions.start.isPending ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
                Start Work
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(actions.finish, "Work session completed")}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-gray-100 px-4 py-3 text-[15px] font-semibold uppercase tracking-wide text-gray-700 transition-[background-color,transform] hover:bg-gray-200 active:scale-[0.98] disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/15 sm:min-h-0 sm:text-sm"
              >
                {actions.finish.isPending ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <StopIcon className="h-4 w-4" />
                )}
                Finish Work
              </button>
            )}
          </div>

          {/* Before the day starts there is no task list yet - the session is
              what holds one. What the request named is shown instead, so the
              employee can see what the timer will open on. */}
          {status === "not_started" && plannedTasks.length > 0 && (
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Starting with{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {plannedTasks[0]}
              </span>
              {plannedTasks.length > 1
                ? ` and ${plannedTasks.length - 1} more task${
                    plannedTasks.length > 2 ? "s" : ""
                  }`
                : ""}
              .
            </p>
          )}

          {status !== "not_started" && showPanel && (
            <WfhTaskPanel
              tasks={tasks}
              liveExtraMs={liveExtraMs}
              busy={taskBusy}
              onStart={(id) =>
                runTask(actions.startTask.mutateAsync(id), "Task started")
              }
              onComplete={(id) =>
                runTask(actions.completeTask.mutateAsync(id), "Task completed")
              }
              onAdd={(title) =>
                runTask(actions.addTask.mutateAsync(title), "Task added")
              }
            />
          )}

          {/* The day so far, for a session that has been paused at least once. */}
          {session && session.segmentCount > 0 && status !== "not_started" && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Started {formatClock(session.startedAt)}</span>
              {session.idleMs > 0 && (
                <span>Paused {formatHm(session.idleMs)}</span>
              )}
            </div>
          )}
        </>
      )}

      {/* What is and is not being watched. Said on the card rather than in a
          policy document, because this is where the question occurs to people.

          Folded on a phone, open on desktop. Six lines of 11px grey directly
          under the day's only control is most of a thumb's reach spent on text
          that is read once and then never again - but it has to stay one tap
          away, because "is this watching me" is the question this card raises
          and a link to a policy page is not an answer. `open` on the desktop
          instance rather than a second copy of the words. */}
      <details className="mt-4" open={!isPhone}>
        <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-[11px] font-medium text-gray-400 marker:hidden dark:text-gray-500 [&::-webkit-details-marker]:hidden">
          <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0" />
          What this page checks while the timer runs
        </summary>
        <p className="mt-1.5 ps-[1.375rem] text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          {watchesInput ? (
            <>
              While the timer runs, this page checks only whether your mouse or
              keyboard is being used, to pause after{" "}
              {config?.idleTimeoutMinutes ?? 5} minutes without it. A screen that
              is on, an open tab or a video playing does not count as activity.
              No screenshots, keystrokes, mouse positions or content are recorded
              - only that an interaction happened. All times are recorded by the
              server.
            </>
          ) : (
            <>
              This page does not check your mouse or keyboard. While the timer
              runs it tells the server only that the timer is still running, and
              the timer stops when you pause or finish it - never on its own. No
              screenshots, keystrokes, mouse positions or content are recorded.
              All times are recorded by the server.
            </>
          )}
        </p>
      </details>
    </section>
  );
};

export default WfhTodayCard;
