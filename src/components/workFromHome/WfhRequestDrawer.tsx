import React from "react";
import { HomeIcon } from "@heroicons/react/24/outline";
import Drawer from "../ui/Drawer";
import WfhStatusBadge from "./WfhStatusBadge";
import WfhSessionStatusBadge from "./WfhSessionStatusBadge";
import WfhSessionSummary from "./WfhSessionSummary";
import WfhTaskReport from "./WfhTaskReport";
import { formatHm, formatPlannedWindow } from "./sessionFormat";
import { useWfhSessionHistory } from "../../hooks/useWfhSession";
import type { WfhRequest } from "../../hooks/useWorkFromHome";

/**
 * One request, and everything that came of it.
 *
 * The list answers "what was asked for"; this answers "and what happened". The
 * two halves are the point: what the employee said they would do, above what
 * the server recorded them actually doing, day by day - so approving, querying
 * or simply understanding a request needs one click rather than a hunt through
 * the monitor for the right row on the right date.
 *
 * The days are read from the session history rather than from a route of their
 * own. A request is permission for a range of dates and a session is one day
 * inside it, so the days that belong to a request are exactly the sessions that
 * cite it - which is what the filter below asks for, rather than assuming the
 * range and the sessions agree.
 *
 * Nothing here is recomputed. Every figure is the server's, rendered by the
 * same two components the employee's own card and the day drawer use.
 */

interface Props {
  request: WfhRequest | null;
  onClose: () => void;
}

const dayLabel = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const isoDay = (value: string) => String(value).slice(0, 10);

const employeeOf = (request: WfhRequest) =>
  typeof request.employee === "object" && request.employee
    ? request.employee
    : null;

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-gray-100 py-2 last:border-0 dark:border-white/10">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-right text-sm text-gray-700 dark:text-gray-200">
      {children}
    </span>
  </div>
);

const WfhRequestDrawer: React.FC<Props> = ({ request, onClose }) => {
  const employee = request ? employeeOf(request) : null;

  // Only an approved request can have produced work, so nothing else is asked
  // for - a pending request would fetch a range of days to prove an empty list.
  const { data: sessions = [], isLoading } = useWfhSessionHistory(
    request
      ? {
          employeeId: employee?._id,
          from: isoDay(request.startDate),
          to: isoDay(request.endDate),
        }
      : {},
    !!request && request.status === "approved"
  );

  const days = request
    ? sessions.filter((session) => String(session.request) === request._id)
    : [];

  const workedMs = days.reduce((total, day) => total + day.activeMs, 0);
  const tasksDone = days.reduce(
    (total, day) =>
      total + day.tasks.filter((task) => task.status === "completed").length,
    0
  );
  const tasksTotal = days.reduce((total, day) => total + day.tasks.length, 0);
  /** Everything still to do across every day this request covers. */
  const tasksLeft = days.reduce(
    (total, day) =>
      total + day.tasks.filter((task) => task.status !== "completed").length,
    0
  );

  return (
    <Drawer
      open={!!request}
      onClose={onClose}
      title={
        employee?.name
          ? `${employee.name} - work from home`
          : "Work from home request"
      }
      description={
        request
          ? isoDay(request.startDate) === isoDay(request.endDate)
            ? dayLabel(request.startDate)
            : `${dayLabel(request.startDate)} to ${dayLabel(request.endDate)}`
          : undefined
      }
      icon={<HomeIcon className="h-5 w-5" />}
    >
      {!request ? null : (
        /* The drawer body ships without padding, so the panel owns its gutters. */
        <div className="space-y-6 p-5">
          {/* -- What was asked for ------------------------------------- */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              The request
            </p>
            <div className="rounded-xl border border-gray-100 px-4 py-1 dark:border-white/10">
              <Row label="Status">
                <WfhStatusBadge status={request.status} />
              </Row>
              <Row label="Days requested">{request.totalDays}</Row>
              <Row label="Planned hours">
                {formatPlannedWindow(
                  request.plannedStartTime,
                  request.plannedEndTime
                )}
              </Row>
              <Row label="Reason">{request.reason}</Row>
              {request.note && <Row label="Note">{request.note}</Row>}
              {request.status !== "pending" && request.reviewComments && (
                <Row label="Review comment">{request.reviewComments}</Row>
              )}
            </div>

            {request.isBackdated && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                Raised after the days had passed. Approving it corrects those
                days from absent to work from home.
              </p>
            )}
          </div>

          {/* -- What was planned --------------------------------------- */}
          {request.plannedTasks && request.plannedTasks.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Planned tasks
              </p>
              <ul className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/10">
                {request.plannedTasks.map((task, index) => (
                  <li
                    key={`${task}-${index}`}
                    className="flex items-center gap-2.5 border-b border-gray-100 px-3 py-2 text-sm text-gray-800 last:border-b-0 dark:border-white/10 dark:text-gray-100"
                  >
                    <span className="w-4 shrink-0 text-center text-xs font-semibold text-gray-400">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* -- What actually happened --------------------------------- */}
          <div>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Work recorded
              </p>
              {days.length > 0 && (
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {formatHm(workedMs)} across {days.length} day
                    {days.length === 1 ? "" : "s"}
                  </span>
                  {tasksTotal > 0 && (
                    <span>
                      - {tasksDone} of {tasksTotal} tasks completed
                    </span>
                  )}
                  {tasksLeft > 0 && (
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                      {tasksLeft} left
                    </span>
                  )}
                </p>
              )}
            </div>

            {request.status !== "approved" ? (
              <p className="rounded-xl border border-gray-100 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                Work is only recorded once a request is approved.
              </p>
            ) : isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700"
                  />
                ))}
              </div>
            ) : days.length === 0 ? (
              <p className="rounded-xl border border-gray-100 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                No work timer was started on these days.
              </p>
            ) : (
              <div className="space-y-5">
                {days.map((day) => (
                  <div key={day._id} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {dayLabel(day.date)}
                      </p>
                      <WfhSessionStatusBadge status={day.status} compact />
                    </div>
                    <WfhSessionSummary session={day} bare />
                    <WfhTaskReport tasks={day.tasks} title="" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default WfhRequestDrawer;
