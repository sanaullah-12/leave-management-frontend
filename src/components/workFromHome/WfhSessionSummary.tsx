import React from "react";
import WfhSessionStatusBadge from "./WfhSessionStatusBadge";
import {
  formatClock,
  formatHm,
  formatPlannedWindow,
} from "./sessionFormat";
import type { WfhSession } from "../../hooks/useWfhSession";

/**
 * The end-of-day summary.
 *
 * One component for both readers - the employee sees it on their own card the
 * moment they finish, and an admin sees the same block in the history drawer.
 * A separate admin version would be the same six numbers rendered twice, with
 * two chances to disagree about them.
 *
 * Active and paused time sit next to each other on purpose. The active figure
 * is the one that counts, and showing it alone invites the question the paused
 * figure answers.
 */

interface Props {
  session: WfhSession;
  /** Drops the heading, for callers that already have one above it. */
  bare?: boolean;
}

const Row: React.FC<{
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}> = ({ label, children, emphasis = false }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-2 last:border-0 dark:border-white/10">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span
      className={
        emphasis
          ? "text-sm font-semibold text-gray-900 dark:text-gray-100"
          : "text-sm text-gray-700 dark:text-gray-200"
      }
    >
      {children}
    </span>
  </div>
);

const WfhSessionSummary: React.FC<Props> = ({ session, bare = false }) => {
  const planned = formatPlannedWindow(
    session.plannedStartTime,
    session.plannedEndTime
  );
  // When work stopped, not when Finish was pressed. Someone who paused at 5:10
  // and closed the day at 5:15 worked until 5:10, and that is what the record
  // has to say.
  const actualEnd = session.lastWorkedAt || session.finishedAt;

  return (
    <div>
      {!bare && (
        <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          WFH Work Summary
        </p>
      )}

      <div className="rounded-xl border border-gray-100 px-4 py-1 dark:border-white/10">
        <Row label="Planned">{planned}</Row>
        <Row label="Actual start">{formatClock(session.startedAt)}</Row>
        <Row label="Actual end">{formatClock(actualEnd)}</Row>
        <Row label="Active work time" emphasis>
          {formatHm(session.activeMs)}
        </Row>
        <Row label="Inactive / paused time">{formatHm(session.idleMs)}</Row>
        <Row label="Number of sessions">{session.segmentCount}</Row>
        {/* Only on a day that had tasks, which every day since they existed
            does - and no day before it. */}
        {session.tasks && session.tasks.length > 0 && (
          <Row label="Tasks completed">
            {session.tasks.filter((task) => task.status === "completed").length}{" "}
            of {session.tasks.length}
          </Row>
        )}
        <Row label="Status">
          <WfhSessionStatusBadge status={session.status} compact />
        </Row>
      </div>

      {session.finishedBy === "system" && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          This day was closed automatically because the session was left open.
          Only time with recorded activity was counted.
        </p>
      )}
    </div>
  );
};

export default WfhSessionSummary;
