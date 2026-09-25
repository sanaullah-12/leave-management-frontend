import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  LockOpenIcon,
  UserGroupIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useThemeAccent } from "../../../hooks/useThemeAccent";
import { EMPTY_ROSTER_TOTALS, useRosterDay } from "../../../hooks/useRosterDay";
import { periodRange } from "../../../lib/attendancePeriod";
import type { DayBar } from "../AttendanceOverview";
import type { DayRow } from "../DayTable";
import type { LateTimeForm } from "../DeviceSettingsPanel";
import type { RosterEmployee, RosterRow } from "../EmployeeTable";
import MobileTodayTab from "./MobileTodayTab";
import MobileTrendsTab, {
  type MobileSlice,
  type MobileStat,
} from "./MobileTrendsTab";
import MobileDirectoryTab from "./MobileDirectoryTab";
import MobileDaysTab from "./MobileDaysTab";
import MobileDeviceTab from "./MobileDeviceTab";
import { ABSENT_INK, IconButton, LATE_INK, WELL, WFH_INK } from "../../mobile/primitives";
import { spring } from "../../../lib/motion";

/**
 * Attendance on a phone.
 *
 * The desktop page is one long column: a hero banner, today's roster, a range
 * toolbar, five summary tiles, two charts, a row of device actions, a settings
 * panel and a paged table. Scrolled on a 360px screen that is eleven screens
 * deep, and the answer to "who is late today" is at the top while the control
 * that decides what "late" means is at the bottom.
 *
 * So the same page is four screens under one segmented control, each answering
 * one question:
 *
 *   Today     - who is in, right now
 *   Trends    - how a range went
 *   Directory - find one person (an employee gets their own days instead)
 *   Device    - the unit, and the rule the rest of it is judged by
 *
 * Nothing new is computed here. Every figure is the one the desktop page
 * already has; this file only decides which screen it belongs on.
 */

export interface MobileSelfSummary {
  workingDays: number;
  attendedDays: number;
  onTimeDays: number;
  lateDays: number;
  absentDays: number;
  wfhDays: number;
}

interface Props {
  isAdmin: boolean;

  /* ---- the range, and loading it ---- */
  startDate: string;
  endDate: string;
  onStartDate: (iso: string) => void;
  onEndDate: (iso: string) => void;
  activeRangeDays: number | null;
  onPreset: (days: number) => void;
  onFetchRoster: () => void;
  canFetchRoster: boolean;
  rosterLoading: boolean;
  rosterProgress: { done: number; total: number };
  rosterFetched: boolean;
  rosterStale: boolean;
  rangeLabel: string;

  /* ---- the figures behind the range ---- */
  employeeCount: number;
  statusCounts: { onTime: number; late: number; absent: number };
  selfSummary: MobileSelfSummary | null;
  dayBars: DayBar[];

  /* ---- the lists ---- */
  rosterRows: RosterRow[];
  rosterRowsLoading: boolean;
  onSelectEmployee: (employee: RosterEmployee) => void;
  dayRows: DayRow[];
  onSelectDay: (row: DayRow) => void;
  /** Offered on a late day. Omit where the viewer cannot raise a request. */
  onRequestTimeChange?: (row: DayRow) => void;
  onViewFullRecord?: () => void;
  statusFilter: string;
  onStatusFilterChange: (next: string) => void;

  /* ---- the device ---- */
  ip: string;
  onIpChange: (next: string) => void;
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  deviceStatusText?: string;
  onRefreshEmployees: () => void;
  refreshingEmployees: boolean;
  onUnlockDoor: () => void;
  unlockingDoor: boolean;
  doorCountdown: number;
  doorMessage: { type: "success" | "error"; text: string } | null;
  onExport: () => void;
  canExport: boolean;

  /* ---- the arrival rule ---- */
  settings: LateTimeForm;
  onSettingsChange: (next: LateTimeForm) => void;
  onSaveSettings: () => void;
  formatCutoff: (hhmm?: string) => string;
}

type TabKey = "today" | "trends" | "directory" | "days" | "device";

const MobileAttendance: React.FC<Props> = (props) => {
  const {
    isAdmin,
    startDate,
    endDate,
    onStartDate,
    onEndDate,
    activeRangeDays,
    onPreset,
    onFetchRoster,
    canFetchRoster,
    rosterLoading,
    rosterProgress,
    rosterFetched,
    rosterStale,
    rangeLabel,
    employeeCount,
    statusCounts,
    selfSummary,
    dayBars,
    rosterRows,
    rosterRowsLoading,
    onSelectEmployee,
    dayRows,
    onSelectDay,
    onViewFullRecord,
    onRequestTimeChange,
    statusFilter,
    onStatusFilterChange,
    ip,
    onIpChange,
    connected,
    connecting,
    onConnect,
    onDisconnect,
    deviceStatusText,
    onRefreshEmployees,
    refreshingEmployees,
    onUnlockDoor,
    unlockingDoor,
    doorCountdown,
    doorMessage,
    onExport,
    canExport,
    settings,
    onSettingsChange,
    onSaveSettings,
    formatCutoff,
  } = props;

  const accent = useThemeAccent(600);
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("today");

  /* Today, asked the way the desktop section asks it - same endpoint, same
     server-side judgement, so the two cannot disagree. */
  const today = useMemo(() => periodRange("today"), []);
  const {
    data: todayData,
    loading: todayLoading,
    refreshing: todayRefreshing,
    error: todayError,
    refresh: refreshToday,
  } = useRosterDay(today.from, today.to, today.detail);

  const tabs: { key: TabKey; label: string }[] = isAdmin
    ? [
        { key: "today", label: "Today" },
        { key: "trends", label: "Trends" },
        { key: "directory", label: "Directory" },
        { key: "device", label: "Device" },
      ]
    : [
        { key: "today", label: "Today" },
        { key: "trends", label: "Trends" },
        { key: "days", label: "My days" },
      ];

  /** The cutoff the figures on screen were judged against, ready to print. */
  const cutoffLabel =
    todayData?.cutoffTime ||
    formatCutoff(settings.effectiveCutoffTime || settings.cutoffTime);

  const todayLabel = useMemo(
    () =>
      new Date(`${today.to}T00:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    [today.to]
  );

  const subtitle = (() => {
    switch (tab) {
      case "trends":
        return `Roster and trends - ${rangeLabel}`;
      case "directory":
        return employeeCount
          ? `${employeeCount} employees on the device`
          : "No roster loaded yet";
      case "days":
        return `Your days - ${rangeLabel}`;
      case "device":
        return connected ? `Connected to ${ip}` : "Device not connected";
      case "today":
      default:
        return cutoffLabel
          ? `${todayLabel} - measured against ${cutoffLabel}`
          : todayLabel;
    }
  })();

  /** What the header's one button does on the screen being read. */
  const headerAction = (() => {
    switch (tab) {
      case "trends":
      case "days":
        return {
          label: "Fetch attendance for this range",
          onClick: onFetchRoster,
          busy: rosterLoading,
          disabled: !canFetchRoster,
        };
      case "directory":
      case "device":
        return {
          label: "Refresh the device roster",
          onClick: onRefreshEmployees,
          busy: refreshingEmployees,
          disabled: !isAdmin,
        };
      case "today":
      default:
        return {
          label: "Refresh today",
          onClick: refreshToday,
          busy: todayRefreshing,
          disabled: false,
        };
    }
  })();

  /* ---- the four headline figures of the range ---- */
  const stats: MobileStat[] = isAdmin
    ? [
        {
          label: "Employees",
          value: employeeCount || null,
          tone: accent,
          icon: UserGroupIcon,
        },
        {
          label: "On time",
          value: rosterFetched ? statusCounts.onTime : null,
          tone: accent,
          icon: CheckCircleIcon,
        },
        {
          label: "Late",
          value: rosterFetched ? statusCounts.late : null,
          tone: LATE_INK,
          icon: ClockIcon,
        },
        {
          label: "Absent",
          value: rosterFetched ? statusCounts.absent : null,
          tone: ABSENT_INK,
          icon: XCircleIcon,
        },
      ]
    : [
        {
          label: "Attendance days",
          value: selfSummary ? selfSummary.attendedDays : null,
          tone: accent,
          icon: CalendarDaysIcon,
        },
        {
          label: "On time",
          value: selfSummary ? selfSummary.onTimeDays : null,
          tone: accent,
          icon: CheckCircleIcon,
        },
        {
          label: "Late",
          value: selfSummary ? selfSummary.lateDays : null,
          tone: LATE_INK,
          icon: ClockIcon,
        },
        {
          label: "Absent",
          value: selfSummary ? selfSummary.absentDays : null,
          tone: ABSENT_INK,
          icon: XCircleIcon,
        },
      ];

  /*
   * The donut is one figure split three or four ways, so every slice has to be
   * a count of the same thing. An admin's slices are people - the workforce,
   * split by how today went - which is why the range's work-from-home total is
   * not among them: it counts employee-days, and a day cannot be a share of a
   * headcount. An employee's slices are all days, so theirs can include it.
   */
  const slices: MobileSlice[] = isAdmin
    ? [
        { label: "On time", count: statusCounts.onTime, tone: accent },
        { label: "Late", count: statusCounts.late, tone: LATE_INK },
        { label: "Absent", count: statusCounts.absent, tone: ABSENT_INK },
      ]
    : [
        { label: "On time", count: selfSummary?.onTimeDays ?? 0, tone: accent },
        { label: "Late", count: selfSummary?.lateDays ?? 0, tone: LATE_INK },
        {
          label: "Work from home",
          count: selfSummary?.wfhDays ?? 0,
          tone: WFH_INK,
        },
        {
          label: "Absent",
          count: selfSummary?.absentDays ?? 0,
          tone: ABSENT_INK,
        },
      ];

  const deviceActions = [
    {
      label: "Unlock door",
      icon: LockOpenIcon,
      onClick: onUnlockDoor,
      busy: unlockingDoor,
    },
    {
      label: "Late hours",
      icon: ClockIcon,
      onClick: () => navigate("/attendance/late-time"),
    },
    {
      label: "Refresh roster",
      icon: ArrowPathIcon,
      onClick: onRefreshEmployees,
      busy: refreshingEmployees,
    },
    {
      label: "Export",
      icon: ArrowDownTrayIcon,
      onClick: onExport,
      disabled: !canExport,
    },
  ];

  return (
    <div className="lg:hidden">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-gray-900 dark:text-white">
            Attendance
          </h1>
          <p className="mt-1 truncate text-[12px] text-gray-400 dark:text-gray-500">
            {subtitle}
          </p>
        </div>
        <IconButton
          label={headerAction.label}
          icon={ArrowPathIcon}
          onClick={headerAction.onClick}
          busy={headerAction.busy}
          disabled={headerAction.disabled}
        />
      </div>

      {/* One segmented control, not a second row of app tabs. The four screens
          are one destination - the bar at the foot of the app says which
          destination you are in, this one says which question you are asking
          inside it. */}
      <div
        role="tablist"
        aria-label="Attendance screens"
        className={`mb-3.5 flex gap-1 rounded-[14px] p-1 ${WELL}`}
      >
        {tabs.map((item) => {
          const on = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(item.key)}
              className={`relative min-h-[36px] flex-1 rounded-[11px] px-1 text-[12px] font-semibold transition-colors ${
                on ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {/* One pill travelling between the tabs, not a background
                  switching off one and on to another. Every selection strip in
                  the app now does this on the same spring - the bottom bar's
                  badge, the mobile filter chips, the leave status filter - so
                  choosing a tab, a filter and a screen are recognisably the
                  same gesture. */}
              {on && (
                <motion.span
                  layoutId="attendance-screen-pill"
                  transition={spring}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[11px] bg-[var(--card-surface)] shadow-sm"
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "today" && (
        <MobileTodayTab
          rows={todayData?.rows || []}
          totals={todayData?.totals || EMPTY_ROSTER_TOTALS}
          loading={todayLoading}
          error={todayError}
          message={todayData?.message}
          accent={accent}
          isSelfView={!isAdmin}
          onSelectRow={
            isAdmin
              ? (row) =>
                  onSelectEmployee({
                    employeeId: row.employeeId,
                    machineId: row.employeeId,
                    name: row.name,
                    department: row.department || undefined,
                  })
              : undefined
          }
        />
      )}

      {tab === "trends" && (
        <MobileTrendsTab
          startDate={startDate}
          endDate={endDate}
          onStartDate={onStartDate}
          onEndDate={onEndDate}
          activeRangeDays={activeRangeDays}
          onPreset={onPreset}
          onFetch={onFetchRoster}
          canFetch={canFetchRoster}
          loading={rosterLoading}
          progress={rosterProgress}
          fetched={rosterFetched}
          stale={rosterStale}
          stats={stats}
          days={dayBars}
          slices={slices}
          sliceTotalLabel={
            isAdmin
              ? "Share of the enrolled workforce"
              : "Share of your working days"
          }
          rangeLabel={rangeLabel}
          accent={accent}
        />
      )}

      {tab === "directory" && (
        <MobileDirectoryTab
          rows={rosterRows}
          loading={rosterRowsLoading}
          onSelect={onSelectEmployee}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      )}

      {tab === "days" && (
        <MobileDaysTab
          rows={dayRows}
          loading={rosterLoading}
          onSelect={onSelectDay}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          onViewFull={onViewFullRecord}
          onRequestTimeChange={onRequestTimeChange}
        />
      )}

      {tab === "device" && (
        <MobileDeviceTab
          ip={ip}
          onIpChange={onIpChange}
          connected={connected}
          connecting={connecting}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          employeeCount={employeeCount}
          statusText={deviceStatusText}
          actions={deviceActions}
          door={{
            unlocking: unlockingDoor,
            countdown: doorCountdown,
            message: doorMessage,
          }}
          settings={settings}
          onSettingsChange={onSettingsChange}
          onSave={onSaveSettings}
          canEdit={isAdmin}
          formatCutoff={formatCutoff}
        />
      )}
    </div>
  );
};

export default MobileAttendance;
