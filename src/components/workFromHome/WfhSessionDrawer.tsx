import React from "react";
import { motion } from "framer-motion";
import useListRowMotion from "../../hooks/useListRowMotion";
import {
  ClockIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  CheckCircleIcon,
  CpuChipIcon,
  ListBulletIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import Drawer from "../ui/Drawer";
import WfhSessionSummary from "./WfhSessionSummary";
import WfhTaskReport from "./WfhTaskReport";
import { formatClock, formatHm } from "./sessionFormat";
import { statusColor } from "../../lib/themeTokens";
import { useThemeAccent } from "../../hooks/useThemeAccent";
import {
  useWfhSessionDetail,
  type WfhSessionEvent,
} from "../../hooks/useWfhSession";

/**
 * One work-from-home day, in full.
 *
 * This is the view a disputed day is settled with, so it shows what was
 * recorded rather than a tidier version of it: every stretch that was worked,
 * why each one ended, and the audit trail of Start, Pause, Resume and Finish
 * underneath.
 *
 * The stretches and the trail are both shown because they answer different
 * questions. The stretches say how the six hours are made up; the trail says
 * who or what caused each change - and "the system noticed nobody was there"
 * is the answer that matters most often. The tasks answer a third: what the
 * six hours were spent on. Their figures come from the server, where each one
 * is the overlap of a task being in hand with work actually being counted, so
 * they always add up to the day's total rather than to something near it.
 */

interface Props {
  sessionId: string | null;
  employeeName?: string;
  onClose: () => void;
}

/**
 * Label, glyph and colour per event type.
 *
 * Built per render rather than once at module scope. Both `statusColor` and
 * the accent resolve a CSS variable off <html>, so a table built at import
 * time holds whichever theme happened to be active when the module first
 * loaded - which was invisible while the accent was fixed and the drawer was
 * rarely open across a mode switch, and wrong the moment either can change.
 */
const eventMeta = (
  accent: string,
): Record<
  WfhSessionEvent["type"],
  { label: string; Icon: typeof ClockIcon; tone: string }
> => ({
  started: { label: "Started work", Icon: PlayCircleIcon, tone: statusColor("success") },
  resumed: { label: "Resumed work", Icon: PlayCircleIcon, tone: statusColor("success") },
  paused: { label: "Paused", Icon: PauseCircleIcon, tone: statusColor("warning") },
  auto_paused: {
    label: "Paused automatically",
    Icon: PauseCircleIcon,
    tone: statusColor("warning"),
  },
  finished: { label: "Finished work", Icon: CheckCircleIcon, tone: accent },
  auto_finished: {
    label: "Closed automatically",
    Icon: CpuChipIcon,
    tone: statusColor("neutral"),
  },
  task_added: { label: "Task added", Icon: PlusCircleIcon, tone: statusColor("neutral") },
  task_started: {
    label: "Started a task",
    Icon: ListBulletIcon,
    tone: accent,
  },
  task_completed: {
    label: "Completed a task",
    Icon: CheckCircleIcon,
    tone: statusColor("success"),
  },
});

/** Why a stretch ended, in the words a reader would use. */
const ENDED_BY_LABEL: Record<string, string> = {
  employee: "Paused",
  inactivity: "No activity",
  system: "Closed by system",
};

const WfhSessionDrawer: React.FC<Props> = ({
  sessionId,
  employeeName,
  onClose,
}) => {
  const { data: session, isLoading } = useWfhSessionDetail(sessionId);
  const listRow = useListRowMotion(true);
  const accent = useThemeAccent(600);
  const META = eventMeta(accent);

  return (
    <Drawer
      open={!!sessionId}
      onClose={onClose}
      title={employeeName ? `${employeeName} - work from home` : "Work session"}
      description={session ? session.date : undefined}
      icon={<ClockIcon className="h-5 w-5" />}
    >
      {isLoading || !session ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700"
            />
          ))}
        </div>
      ) : (
        /* The drawer body ships without padding, so the panel owns its gutters. */
        <div className="space-y-6 p-5">
          <WfhSessionSummary session={session} />

          <WfhTaskReport tasks={session.tasks} />

          {/* The stretches actually worked. */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Work sessions
            </p>
            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/10">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/70 text-left text-xs font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-300">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">From</th>
                    <th className="px-3 py-2">To</th>
                    <th className="px-3 py-2">Duration</th>
                    <th className="px-3 py-2">Ended by</th>
                  </tr>
                </thead>
                <tbody>
                  {session.segments.map((segment, index) => (
                    <motion.tr
                      key={`${segment.startedAt}-${index}`}
                      {...listRow(index)}
                      className="border-t border-gray-100 dark:border-white/10"
                    >
                      <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        {formatClock(segment.startedAt)}
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                        {segment.endedAt ? (
                          formatClock(segment.endedAt)
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            running
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                        {formatHm(segment.durationMs)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {segment.endedBy
                          ? ENDED_BY_LABEL[segment.endedBy] || segment.endedBy
                          : "-"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* The audit trail. Append-only on the server, so this is the whole
              history of the day rather than its current state. */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Activity log
            </p>
            <ol className="space-y-2">
              {session.events.map((event, index) => {
                const meta = META[event.type] || META.started;
                const { Icon } = meta;
                return (
                  <li
                    key={`${event.at}-${index}`}
                    className="flex items-start gap-2.5 rounded-xl border border-gray-100 px-3 py-2 dark:border-white/10"
                  >
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: meta.tone }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {meta.label}
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          {formatClock(event.at)}
                        </span>
                      </p>
                      {event.note && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {event.note}
                        </p>
                      )}
                    </div>
                    {event.actor === "system" && (
                      <span className="shrink-0 rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:border-white/15 dark:text-gray-400">
                        System
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default WfhSessionDrawer;
