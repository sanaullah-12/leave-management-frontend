import React from "react";
import { motion } from "framer-motion";
import useListRowMotion from "../../../hooks/useListRowMotion";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import Avatar from "../../Avatar";
import EmployeeVoiceWidget from "../../voice/EmployeeVoiceWidget";
import { EmptyNote, GroupLabel, SHEET } from "../../mobile/primitives";
import type { HolidayEntry, TeamMember } from "./types";

/**
 * Everything the dashboard reports rather than measures: what happened, what
 * is coming, and who is around.
 *
 * Three lists that are read the same way - scanned, not compared - so they
 * share a tab and a row shape. On the desktop page they are a column beside
 * the charts; here they are the screen you open when the figures have already
 * told you something is worth looking into.
 */

const STATUS_PILL: Record<string, string> = {
  approved:
    "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  pending: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  rejected: "bg-red-500/12 text-red-700 dark:text-red-400",
};

const NEUTRAL_PILL = "bg-black/[0.06] text-gray-600 dark:bg-white/10 dark:text-gray-300";

/** The dot down the left of an activity row, in the row's status colour. */
const STATUS_DOT: Record<string, string> = {
  approved: "bg-emerald-500",
  pending: "bg-amber-500",
  rejected: "bg-red-500",
};

interface RecentLeave {
  _id?: string;
  leaveType?: string;
  status?: string;
  startDate?: string;
  totalDays?: number;
  employee?: { name?: string } | string;
}

interface Props {
  recent: RecentLeave[];
  recentLoading: boolean;
  holidays: HolidayEntry[];
  team: TeamMember[];
  isAdmin: boolean;
  /** Translated status wording, so the pill does not carry its own copy. */
  statusLabel: (status?: string) => string;
  /** Translated wording for one person's day in Team Availability. */
  availabilityLabel: (key: string) => string;
  onOpenLeaves: () => void;
  onOpenCalendar: () => void;
  onOpenEmployee: (id: string) => void;
  labels: {
    recentActivity: string;
    viewAll: string;
    publicHolidays: string;
    viewCalendar: string;
    teamAvailability: string;
    seeMore: string;
    seeLess: string;
    noRecentActivity: string;
    requestsWillAppear: string;
    noTeamActivity: string;
  };
}

/** The heading over a list, with at most one action beside it. */
const ListHead: React.FC<{
  title: string;
  action?: { label: string; onClick: () => void };
}> = ({ title, action }) => (
  <div className="flex items-center justify-between gap-2 px-1 pb-2 pt-1.5">
    <GroupLabel>{title}</GroupLabel>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400"
      >
        {action.label}
      </button>
    )}
  </div>
);

/** How many people the availability list shows before it is expanded. */
const TEAM_PREVIEW = 3;

const MobileActivityTab: React.FC<Props> = ({
  recent,
  recentLoading,
  holidays,
  team,
  isAdmin,
  statusLabel,
  availabilityLabel,
  onOpenLeaves,
  onOpenCalendar,
  onOpenEmployee,
  labels,
}) => {
  const listRow = useListRowMotion();
  const [showAllTeam, setShowAllTeam] = React.useState(false);
  const visibleTeam = showAllTeam ? team : team.slice(0, TEAM_PREVIEW);

  return (
    <div className="space-y-3">
      <EmployeeVoiceWidget />

      <section>
        <ListHead
          title={labels.recentActivity}
          action={{ label: labels.viewAll, onClick: onOpenLeaves }}
        />
        <div className={`${SHEET} px-4`}>
          {recentLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-black/[0.06] dark:bg-white/[0.07]"
                />
              ))}
            </div>
          ) : recent.length ? (
            <ul>
              {recent.map((leave, i) => {
                const employeeName =
                  typeof leave.employee === "object" ? leave.employee?.name : null;
                const started = leave.startDate ? new Date(leave.startDate) : null;
                return (
                  <motion.li
                    key={leave._id || i}
                    {...listRow(i)}
                    className="flex items-start gap-2.5 border-b border-black/5 py-3 last:border-0 dark:border-white/[0.07]"
                  >
                    <span
                      className={`mt-[7px] h-[7px] w-[7px] flex-none rounded-full ${
                        STATUS_DOT[leave.status ?? ""] || "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold capitalize text-gray-900 dark:text-white">
                        {leave.leaveType} leave
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            STATUS_PILL[leave.status ?? ""] || NEUTRAL_PILL
                          }`}
                        >
                          {statusLabel(leave.status)}
                        </span>
                        <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {isAdmin && employeeName ? `${employeeName} - ` : ""}
                          {leave.totalDays}{" "}
                          {leave.totalDays === 1 ? "day" : "days"}
                        </span>
                      </div>
                    </div>
                    <span className="flex-none whitespace-nowrap text-[10.5px] text-gray-400 dark:text-gray-500">
                      {started && !isNaN(started.getTime())
                        ? started.toLocaleDateString()
                        : ""}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <EmptyNote
              icon={CalendarDaysIcon}
              title={labels.noRecentActivity}
              body={labels.requestsWillAppear}
            />
          )}
        </div>
      </section>

      <section>
        <ListHead title={labels.publicHolidays} />
        <div className={`${SHEET} px-4 py-1.5`}>
          <ul>
            {holidays.map((holiday, i) => (
              <motion.li
                key={holiday.name}
                {...listRow(i)}
                className="flex items-center gap-3 py-2.5"
              >
                {/* The date block is the row's identity, so it carries the
                    accent rather than the name beside it. */}
                <span
                  className="grid h-[42px] w-[42px] flex-none place-items-center rounded-[13px] leading-none text-white"
                  style={{
                    backgroundImage:
                      "linear-gradient(150deg, color-mix(in srgb, var(--accent) 78%, white), var(--accent))",
                  }}
                >
                  <span className="block text-center">
                    <span className="block text-[8.5px] font-bold uppercase tracking-wide text-white/80">
                      {holiday.mon}
                    </span>
                    <span className="mt-[2px] block text-[14px] font-bold">
                      {holiday.day}
                    </span>
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                    {holiday.name}
                  </p>
                  <p className="mt-[2px] truncate text-[11px] text-gray-400 dark:text-gray-500">
                    {holiday.sub}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onOpenCalendar}
            className="mb-2.5 mt-1.5 min-h-[40px] w-full rounded-[12px] border border-black/[0.06] bg-black/[0.03] text-[12.5px] font-semibold text-gray-700 active:bg-black/[0.06] dark:border-white/10 dark:bg-white/[0.05] dark:text-gray-200"
          >
            {labels.viewCalendar}
          </button>
        </div>
      </section>

      <section>
        <ListHead title={labels.teamAvailability} />
        <div className={`${SHEET} px-4 py-1.5`}>
          {team.length ? (
            <>
              <ul>
                {visibleTeam.map((member, i) => (
                  <motion.li
                    key={member._id}
                    {...listRow(i)}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="relative flex-none">
                      <Avatar
                        src={member.profilePicture}
                        name={member.name || "Unknown"}
                        size="md"
                      />
                      {/* The state is a dot on the avatar and a word under the
                          name - never the dot alone, which would put the whole
                          answer in a colour. */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[var(--card-surface)] ${member.availability.dot}`}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          member._id && onOpenEmployee(member._id)
                        }
                        className="block max-w-full truncate text-left text-[13px] font-semibold text-gray-900 dark:text-white"
                      >
                        {member.name || "Unknown"}
                      </button>
                      <p
                        className={`mt-[2px] truncate text-[11px] font-medium ${member.availability.text}`}
                      >
                        {availabilityLabel(member.availability.labelKey)}
                      </p>
                    </div>
                    <span className="max-w-[86px] flex-none truncate text-right text-[11px] text-gray-400 dark:text-gray-500">
                      {(typeof member.department === "object"
                        ? member.department?.name
                        : member.department) ||
                        member.position ||
                        "Team"}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {team.length > TEAM_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setShowAllTeam((open) => !open)}
                  className="mb-2.5 mt-1.5 min-h-[40px] w-full rounded-[12px] text-[12.5px] font-semibold text-blue-600 dark:text-blue-400"
                >
                  {showAllTeam
                    ? labels.seeLess
                    : `${labels.seeMore} (${team.length - TEAM_PREVIEW})`}
                </button>
              )}
            </>
          ) : (
            <p className="py-6 text-center text-[12.5px] text-gray-500 dark:text-gray-400">
              {labels.noTeamActivity}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MobileActivityTab;
