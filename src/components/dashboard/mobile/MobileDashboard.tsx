import React from "react";
import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import SectionHeader from "../../ui/SectionHeader";
import { MorphTabs, MorphTabPanels } from "../../ui/MorphTabs";
import PushNotificationToggle from "../../notifications/PushNotificationToggle";
import MobileOverviewTab from "./MobileOverviewTab";
import MobileChartsTab from "./MobileChartsTab";
import MobileReviewTab from "./MobileReviewTab";
import MobileActivityTab from "./MobileActivityTab";
import type {
  DashboardGauge,
  DashboardKpi,
  DashboardMiniStat,
  HolidayEntry,
  TeamMember,
  TrendPoint,
  TypePoint,
} from "./types";

/**
 * The dashboard on a phone.
 *
 * The desktop page is one column of eight sections: a banner, four KPIs,
 * announcements, today's roster, a donut, a gauge, the voice widget, two
 * charts, recent activity, holidays and team availability. Scrolled on a
 * 390px screen that is nine screens deep, and the two things the app is
 * opened to check - how much leave is moving, and who is in - are separated
 * from the rest of the page by seven of them.
 *
 * So the same page is four screens under one segmented control:
 *
 *   Overview - the headline figures, and who is in today
 *   Charts   - the shape of the year, and the split by type
 *   Review   - the month as one figure: attendance, and what is still pending
 *   Activity - what happened, what is coming, who is around
 *
 * Nothing is computed here. Every figure is one DashboardPage already derived
 * and every list is one it already fetched; this file only decides which
 * screen each belongs on. The banner stays above the control because it is
 * the only part of the page that is true on all four.
 */

type TabKey = "overview" | "charts" | "review" | "activity";

interface Props {
  isAdmin: boolean;
  role?: string;
  employeeId?: string | number;

  /* ---- the banner ---- */
  greeting: string;
  eyebrow: string;
  today: string;
  primaryAction: { label: string; onClick: () => void };

  /* ---- the figures ---- */
  kpis: DashboardKpi[];
  gauges: DashboardGauge[];
  trend: TrendPoint[];
  types: TypePoint[];
  miniStats: DashboardMiniStat[];
  trendCaption: string;
  typesCaption: string;
  typesUnit: string;

  /* ---- the lists ---- */
  recent: any[];
  recentLoading: boolean;
  holidays: HolidayEntry[];
  team: TeamMember[];
  statusLabel: (status?: string) => string;
  availabilityLabel: (key: string) => string;

  /* ---- where a row goes ---- */
  onOpenLeaves: () => void;
  onOpenCalendar: () => void;
  onOpenAttendance: () => void;
  onOpenEmployee: (id: string) => void;

  /* ---- wording ---- */
  tabLabels: Record<TabKey, string>;
  listLabels: React.ComponentProps<typeof MobileActivityTab>["labels"];

  accent: string;
  accentSoft: string;
  isDark: boolean;
}

const MobileDashboard: React.FC<Props> = ({
  isAdmin,
  role,
  employeeId,
  greeting,
  eyebrow,
  today,
  primaryAction,
  kpis,
  gauges,
  trend,
  types,
  miniStats,
  trendCaption,
  typesCaption,
  typesUnit,
  recent,
  recentLoading,
  holidays,
  team,
  statusLabel,
  availabilityLabel,
  onOpenLeaves,
  onOpenCalendar,
  onOpenAttendance,
  onOpenEmployee,
  tabLabels,
  listLabels,
  accent,
  accentSoft,
  isDark,
}) => {
  const [tab, setTab] = React.useState<TabKey>("overview");

  const tabs: TabKey[] = ["overview", "charts", "review", "activity"];

  return (
    <div>
      {/* No `description`: the sentence under the greeting is the same every
          day, and two lines of it is a fifth of a phone screen spent saying
          nothing the figures below do not say better. */}
      <SectionHeader
        variant="dashboard"
        eyebrow={eyebrow}
        title={greeting}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-inset ring-white/25">
            <CalendarDaysIcon className="h-3.5 w-3.5" />
            {today}
          </span>
        }
        action={
          <>
            {/* Compact, so the banner's two actions fit one row on a 360px
                phone instead of the toggle taking a line of its own. */}
            <PushNotificationToggle compact />
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="sh-action-primary"
            >
              <PlusIcon className="h-4 w-4" />
              {primaryAction.label}
            </button>
          </>
        }
      />

      {/* Sticky under the app bar, so the control that says which screen you
          are on does not scroll away from the screen it is labelling. The
          negative margin lets the blurred ground run to both edges while the
          buttons keep the page's gutter. */}
      <div className="sticky top-[calc(var(--app-bar-h)+var(--safe-top))] z-20 -mx-[max(0.75rem,var(--safe-left))] mb-3 mt-3 bg-white/80 px-[max(0.75rem,var(--safe-left))] py-2 backdrop-blur-xl dark:bg-gray-900/70">
        {/* One well holding four tabs, not four buttons in a row: the four are
            one choice, and a border around each says they are four. The
            selected pill is a single element that travels between them, so the
            eye follows the selection rather than re-finding it. */}
        <MorphTabs
          value={tab}
          onChange={setTab}
          ariaLabel="Dashboard screens"
          options={tabs.map((key) => ({ value: key, label: tabLabels[key] }))}
        />
      </div>

      {/* The panel travels from the side the new tab sits on, which keeps the
          strip above reading as a horizontal axis. */}
      <MorphTabPanels value={tab} order={tabs}>
      {tab === "overview" && (
        <MobileOverviewTab
          kpis={kpis}
          role={role}
          onOpenAttendance={onOpenAttendance}
        />
      )}

      {tab === "charts" && (
        <MobileChartsTab
          trend={trend}
          types={types}
          miniStats={miniStats}
          trendCaption={trendCaption}
          typesCaption={typesCaption}
          typesUnit={typesUnit}
          accent={accent}
          accentSoft={accentSoft}
          isDark={isDark}
        />
      )}

      {tab === "review" && (
        <MobileReviewTab
          role={role}
          employeeId={employeeId}
          gauges={gauges}
          accent={accent}
          accentSoft={accentSoft}
        />
      )}

      {tab === "activity" && (
        <MobileActivityTab
          recent={recent}
          recentLoading={recentLoading}
          holidays={holidays}
          team={team}
          isAdmin={isAdmin}
          statusLabel={statusLabel}
          availabilityLabel={availabilityLabel}
          onOpenLeaves={onOpenLeaves}
          onOpenCalendar={onOpenCalendar}
          onOpenEmployee={onOpenEmployee}
          labels={listLabels}
        />
      )}
      </MorphTabPanels>
    </div>
  );
};

export default MobileDashboard;
