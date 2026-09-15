import React, { useState } from "react";
import {
  BellAlertIcon,
  ChevronRightIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import { CARD } from "../../lib/surfaces";
import WfhSessionStatusBadge from "./WfhSessionStatusBadge";
import WfhSessionDrawer from "./WfhSessionDrawer";
import {
  formatClock,
  formatHm,
  formatPlannedWindow,
  plannedDurationMs,
} from "./sessionFormat";
import WfhHourglass, { type HourglassTone } from "./WfhHourglass";
import {
  canAskForDesktopNotices,
  requestDesktopNotices,
  showDesktopNotice,
} from "../../services/desktopNotifications";
import { showErrorToast, showSuccessToast } from "../../utils/toastHelpers";
import {
  byUrgency,
  heartbeatGraceMs,
  useSecondTick,
  workedMs,
} from "./liveTiming";
import {
  useWfhLiveMonitor,
  type WfhMonitorRow,
} from "../../hooks/useWfhSession";

/**
 * Who is working from home right now.
 *
 * Built from the approved requests rather than from the sessions, which is what
 * makes "Not Started" a real row: someone who was approved and has not begun has
 * no session at all, and a list of sessions would simply not contain them - the
 * one person an admin most wants to see.
 *
 * Worked time advances between refetches the same way the employee's own card
 * does: from the server's figure and the instant it is counted to. It is a
 * rendering of the server's number, not a second opinion about it.
 *
 * Worked time is an hourglass rather than a number, with the number inside it.
 * A table of digits all of the same width has to be read row by row; a column of
 * glasses can be taken in at once - how full each one is says how far through
 * the planned day that person is, and the one whose sand has stopped falling is
 * the one an admin is looking for.
 */

interface Props {
  /** The day to show, YYYY-MM-DD. Today when omitted. */
  date?: string;
}

/** Which sand colour a row's state calls for. */
const TONE: Record<string, HourglassTone> = {
  working: "working",
  paused: "paused",
  completed: "done",
  not_started: "idle",
};

/**
 * How far through the planned day a row is, or null when nothing was planned.
 *
 * Null rather than a guess: an hourglass drawn against an invented eight-hour
 * day would look like a measurement and be an assumption. Without a plan the
 * glass stays full and only the falling sand reports anything.
 */
const dayProgress = (row: WfhMonitorRow, worked: number): number | null => {
  const planned = plannedDurationMs(row.plannedStartTime, row.plannedEndTime);
  if (!planned) return null;
  return Math.min(1, worked / planned);
};

const WfhLiveMonitor: React.FC<Props> = ({ date }) => {
  const { data, isLoading } = useWfhLiveMonitor(true, date);
  const [openId, setOpenId] = useState<string | null>(null);
  const [openName, setOpenName] = useState<string>("");
  const [canAsk, setCanAsk] = useState(() => canAskForDesktopNotices());

  const rows = data?.rows ?? [];
  const summary = data?.summary;
  const hasLive = rows.some((row) => row.status === "working");
  const now = useSecondTick(hasLive);
  const grace = heartbeatGraceMs(data?.config?.heartbeatSeconds);

  /**
   * Turn on the desktop alerts for the four moments in a work-from-home day.
   *
   * Offered here and nowhere else in this module: this is the screen an admin
   * is on when they decide they want telling, and a browser only allows the
   * permission prompt from a click like this one.
   */
  const askForNotices = async () => {
    const state = await requestDesktopNotices({ userInitiated: true });
    setCanAsk(canAskForDesktopNotices());
    if (state === "granted") {
      showSuccessToast("Desktop alerts on for work from home sessions");
      // Prove it, now, on the click that turned it on. An alerts setting whose
      // first delivery is hours away is a setting nobody trusts - and if the OS
      // is quietly blocking the browser, this is where that shows up rather
      // than on the day somebody needed the alert.
      void showDesktopNotice({
        tag: "wfh-desktop-alerts-on",
        title: "Nexora alerts are on",
        body: "You will be told here when a work from home timer starts, pauses, resumes or finishes.",
        force: true,
        pushWillDeliver: false,
      });
    } else if (state === "denied") {
      showErrorToast(
        "Your browser is blocking notifications for Nexora. Allow them in your browser's site settings to turn this on."
      );
    }
  };

  const sorted = byUrgency(rows);

  const head =
    "whitespace-nowrap border-b border-gray-100 bg-gray-50/70 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-700/40 dark:text-gray-300";
  const cell = "border-b border-gray-100 px-4 py-3 dark:border-gray-700";

  return (
    <section className="space-y-2" aria-label="Work from home live monitor">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <SignalIcon className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Working from home today
        </h2>
        {summary && (
          <span className="text-xs text-gray-400">
            {summary.working} working - {summary.paused} inactive -{" "}
            {summary.not_started} not started - {summary.completed} completed
          </span>
        )}

        {canAsk && (
          <button
            type="button"
            onClick={askForNotices}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/15 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <BellAlertIcon className="h-3.5 w-3.5" />
            Enable desktop alerts
          </button>
        )}
      </div>

      <div className={`overflow-hidden ${CARD}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr>
                <th className={head}>Employee</th>
                <th className={head}>Planned Time</th>
                <th className={head}>Actual Start</th>
                <th className={head}>Current Status</th>
                <th className={head}>Worked Time</th>
                <th className={`${head} text-right`}>Report</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className={cell}>
                        <div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Nobody is working from home today.
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Approved work from home days appear here with their live
                      status.
                    </p>
                  </td>
                </tr>
              ) : (
                sorted.map((row) => {
                  const session = row.session;
                  const worked = workedMs(row, now, grace);
                  return (
                    <tr
                      key={row.employee._id}
                      onClick={() => {
                        if (!session) return;
                        setOpenId(session._id);
                        setOpenName(row.employee.name);
                      }}
                      className={`transition-colors ${
                        session
                          ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40"
                          : ""
                      }`}
                    >
                      <td className={cell}>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {row.employee.name}
                        </p>
                        {/* What they are on, when they are on something. It
                            replaces the id and department line rather than
                            adding a third: on a monitor, what somebody is
                            doing right now outranks which department they
                            belong to. */}
                        {session?.currentTask ? (
                          <p
                            className="max-w-[220px] truncate text-xs text-gray-500 dark:text-gray-400"
                            title={session.currentTask.title}
                          >
                            {session.currentTask.title}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {row.employee.employeeId || "-"}
                            {row.employee.department
                              ? ` - ${row.employee.department}`
                              : ""}
                          </p>
                        )}
                      </td>
                      <td
                        className={`${cell} text-sm text-gray-700 dark:text-gray-200`}
                      >
                        {formatPlannedWindow(
                          row.plannedStartTime,
                          row.plannedEndTime
                        )}
                      </td>
                      <td
                        className={`${cell} text-sm text-gray-700 dark:text-gray-200`}
                      >
                        {session ? formatClock(session.startedAt) : "-"}
                      </td>
                      <td className={cell}>
                        <WfhSessionStatusBadge status={row.status} />
                      </td>
                      {/* The whole reading in one object: how far through the
                          planned day, how long that is, and - while the timer
                          runs - sand falling. It advances only while the server
                          is counting, so it stops the moment someone goes
                          inactive and carries on from there when they are back,
                          never restarting at zero. */}
                      <td className={cell}>
                        <WfhHourglass
                          progress={dayProgress(row, worked)}
                          tone={TONE[row.status] || "idle"}
                          label={session ? formatHm(worked) : "0m"}
                        />
                        {session && session.idleMs > 0 && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            {formatHm(session.idleMs)} paused
                          </p>
                        )}
                      </td>
                      {/* The way in to the day's report - every stretch
                          worked, every task, and what each one took. The row
                          has been clickable since the monitor existed; this
                          says so, which is the difference between a feature
                          and a feature somebody finds by accident. */}
                      <td className={`${cell} text-right`}>
                        {session ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                            View
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WfhSessionDrawer
        sessionId={openId}
        employeeName={openName}
        onClose={() => setOpenId(null)}
      />
    </section>
  );
};

export default WfhLiveMonitor;
