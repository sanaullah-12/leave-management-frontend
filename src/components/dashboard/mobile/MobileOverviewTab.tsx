import React from "react";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import AttendanceBoard from "../../attendance/AttendanceBoard";
import DashboardAnnouncements from "../../DashboardAnnouncements";
import type { DashboardKpi } from "./types";

/**
 * The tab the dashboard opens on: the four headline figures, then today.
 *
 * It answers the two questions the app is opened to ask - how much leave is
 * moving, and who is in - and stops there. Everything else the desktop page
 * stacks below those two lives on a tab of its own, because on a phone a
 * section you have to scroll past is a section that costs you the one you
 * came for.
 *
 * The roster underneath is the shared AttendanceBoard, which already reads as
 * a list rather than a table below `lg`. Reusing it is what keeps "who is
 * late today" the same answer here as on the attendance page - a second copy
 * of that read would be a second chance for the two to disagree.
 */

interface Props {
  kpis: DashboardKpi[];
  role?: string;
  onOpenAttendance: () => void;
}

/**
 * One headline figure.
 *
 * Centred and four across, which is tighter than the two-across tiles the
 * attendance screens use. It earns the width here because this row is the
 * first thing on the screen and all four are counts of the same thing - a
 * split reads as a split when you can see it in one line.
 */
const KpiTile: React.FC<{ kpi: DashboardKpi }> = ({ kpi }) => {
  const Icon = kpi.icon;
  const body = (
    <>
      <span
        className="mx-auto mb-2 grid h-[26px] w-[26px] place-items-center rounded-[8px]"
        style={{
          backgroundColor: "var(--accent-soft)",
          color: "var(--accent)",
        }}
      >
        <Icon className="h-[14px] w-[14px]" />
      </span>
      {/* Two lines of room, so "Pending Requests" keeps both of its words in
          a 78px column instead of being cut to "Pending". */}
      <p className="min-h-[24px] text-[9.5px] font-semibold leading-[1.25] text-gray-500 dark:text-gray-400">
        {kpi.label}
      </p>
      <p className="mt-0.5 text-[16px] font-bold leading-none tabular-nums text-gray-900 dark:text-white">
        {kpi.value}
        {kpi.suffix && (
          <span className="ml-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
            {kpi.suffix}
          </span>
        )}
      </p>
    </>
  );

  const shell =
    "glass-card rounded-[12px] px-1.5 py-2.5 text-center transition-transform";

  return kpi.onClick ? (
    <button
      type="button"
      onClick={kpi.onClick}
      className={`${shell} active:scale-[0.97]`}
    >
      {body}
    </button>
  ) : (
    <div className={shell}>{body}</div>
  );
};

const MobileOverviewTab: React.FC<Props> = ({
  kpis,
  role,
  onOpenAttendance,
}) => (
  <div className="space-y-3">
    <div className="grid grid-cols-4 gap-2">
      {kpis.map((kpi) => (
        <KpiTile key={kpi.label} kpi={kpi} />
      ))}
    </div>

    {/* Announcements stay on Overview rather than moving to Activity: one that
        went up this morning is news, and news belongs on the screen the app
        opens on. */}
    <DashboardAnnouncements />

    <AttendanceBoard
      variant="dashboard"
      role={role}
      footer={
        <button
          type="button"
          onClick={onOpenAttendance}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600 dark:text-blue-400"
        >
          Open the attendance page
          <ArrowUpRightIcon className="h-3.5 w-3.5" />
        </button>
      }
    />
  </div>
);

export default MobileOverviewTab;
