import React from "react";
import type { SectionVariant } from "../SectionHeader";
import DashboardIllustration from "./DashboardIllustration";
import TeamIllustration from "./TeamIllustration";

/**
 * One place that decides what artwork a section banner shows.
 *
 * A page asks for its variant and gets a node back, so changing a section's
 * illustration is an edit here rather than in every page that uses it.
 *
 * ---------------------------------------------------------------------------
 * How animations are shared
 * ---------------------------------------------------------------------------
 * There is not one animation per screen, and there does not need to be. A
 * subject is what the artwork identifies, not a route: every payroll screen
 * runs `payroll.json`, Profile and Customize both run `setting.json`, and
 * everything an employee requests time away through runs `leave.json`. A visitor arriving on
 * Payslips should recognise it as payroll on sight, which is the opposite of
 * what six unrelated drawings would achieve.
 *
 * Each animation is declared once below and reused by every variant that
 * belongs to that subject, so the JSON is fetched and parsed once per session
 * however many of those screens are visited.
 *
 * ---------------------------------------------------------------------------
 * Adding a Lottie animation
 * ---------------------------------------------------------------------------
 * 1. Put the JSON in `src/assets/lottie/` and record its source and licence
 *    in the README there.
 * 2. Add a `lottieArt(...)` entry below and point one or more variants at it.
 *
 * `lottieArt` puts the player and the JSON behind one lazy boundary, so
 * neither reaches the bundle for a screen that does not show that banner, and
 * `LottieIllustration` recolours the animation onto the theme accent on the
 * way in (see lib/lottieTheme).
 */

/** Holds the banner's space while a lazy animation resolves. */
const ArtPlaceholder: React.FC<{ className?: string }> = ({
  className = "h-48 w-72",
}) => (
  <div className={className} aria-hidden="true">
    <div className="h-full w-full animate-pulse rounded-2xl bg-white/10" />
  </div>
);

/**
 * Wrap a Lottie import as a section illustration.
 *
 * `load` is a function rather than a promise so the import does not start
 * until the banner actually renders.
 */
function lottieArt(
  load: () => Promise<{ default: unknown }>,
  {
    className = "h-48 w-72",
    minLightness,
  }: { className?: string; minLightness?: number } = {}
): React.ComponentType {
  const Lazy = React.lazy(async () => {
    const [{ default: LottieIllustration }, animation] = await Promise.all([
      import("./LottieIllustration"),
      load(),
    ]);
    return {
      default: () => (
        <LottieIllustration
          data={animation.default}
          className={className}
          minLightness={minLightness}
        />
      ),
    };
  });

  return () => (
    <React.Suspense fallback={<ArtPlaceholder className={className} />}>
      <Lazy />
    </React.Suspense>
  );
}

/**
 * The animations, one entry per subject.
 *
 * `minLightness` floors how dark a recoloured colour may end up, because a
 * banner gradient is saturated and without a floor the darker half of an
 * animation's palette sinks into the background instead of reading as shapes.
 *
 * It sits at the `recolorLottie` default rather than the 0.42 the first two
 * banners used: the banner ground was lightened a rung (see SectionHeader), so
 * artwork now needs to keep more of its own depth to read against it, not
 * less.
 */
const BANNER_ART = { minLightness: 0.34 };

const DashboardArt = lottieArt(
  () => import("../../../assets/lottie/DataDashboard.json"),
  BANNER_ART
);

const PeopleArt = lottieArt(
  () => import("../../../assets/lottie/Team.json"),
  BANNER_ART
);

const AnnouncementsArt = lottieArt(
  () => import("../../../assets/lottie/announcements.json"),
  BANNER_ART
);

const AttendanceArt = lottieArt(
  () => import("../../../assets/lottie/attendence.json"),
  BANNER_ART
);

const LeaveArt = lottieArt(
  () => import("../../../assets/lottie/leave.json"),
  BANNER_ART
);

const CalendarArt = lottieArt(
  () => import("../../../assets/lottie/CALENDAR.json"),
  BANNER_ART
);

const ReportsArt = lottieArt(
  () => import("../../../assets/lottie/reports.json"),
  { ...BANNER_ART, className: "h-48 w-56" }
);

const PayrollArt = lottieArt(
  () => import("../../../assets/lottie/payroll.json"),
  BANNER_ART
);

const DocumentsArt = lottieArt(
  () => import("../../../assets/lottie/documents.json"),
  BANNER_ART
);

const VoiceArt = lottieArt(
  () => import("../../../assets/lottie/employeevoice.json"),
  BANNER_ART
);

// `notification.json` is a byte-identical copy of this file; only one is
// referenced so the other never reaches a bundle.
const NotificationsArt = lottieArt(
  () => import("../../../assets/lottie/notifications.json"),
  BANNER_ART
);

const SettingsArt = lottieArt(
  () => import("../../../assets/lottie/setting.json"),
  BANNER_ART
);

/**
 * Variant to artwork.
 *
 * Several variants deliberately share an entry - see the note on subjects at
 * the top of this file.
 */
const ILLUSTRATIONS: Partial<Record<SectionVariant, React.ComponentType>> = {
  dashboard: DashboardArt,
  announcements: AnnouncementsArt,

  // People
  team: PeopleArt,
  employees: PeopleArt,
  departments: PeopleArt,

  // Presence
  attendance: AttendanceArt,

  // Time off. Work from home is a request an employee raises and someone
  // approves, so it belongs with the other request screens rather than with
  // attendance reporting.
  leave: LeaveArt,
  policies: LeaveArt,
  workFromHome: LeaveArt,
  calendar: CalendarArt,

  reports: ReportsArt,
  payroll: PayrollArt,
  documents: DocumentsArt,
  voice: VoiceArt,
  notifications: NotificationsArt,

  // Personal chrome. Both screens are the same subject - preferences about
  // your own account - so they share one animation.
  settings: SettingsArt,
  profile: SettingsArt,

  // `tasks` and `default` fall through to no artwork. The banner renders
  // correctly without one - the illustration slot is optional.
};

/**
 * The artwork for a section, or nothing if that section has none.
 * Rendering nothing is a valid outcome; the banner is designed for it.
 */
export const sectionIllustration = (
  variant: SectionVariant
): React.ReactNode => {
  const Art = ILLUSTRATIONS[variant];
  return Art ? <Art /> : null;
};

export { DashboardIllustration, TeamIllustration };
