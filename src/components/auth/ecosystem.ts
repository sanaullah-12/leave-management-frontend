import type { ComponentType } from "react";
import {
  UsersIcon,
  CalendarDaysIcon,
  ClockIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  BriefcaseIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";

/**
 * The Nexora ecosystem, as told on the authentication screen.
 *
 * This file is the single source of truth for the hero visualisation: which
 * modules appear, where they sit in the composition, in what order they are
 * revealed, and what each one is allowed to claim. Nothing here touches
 * authentication - it is presentation data only.
 *
 * Coordinates are expressed in *stage units*: a 0-100 square that the visual
 * maps onto its (square) container, with the Nexora core at (50, 50). The cards
 * are sized against the same square (see auth-hero.css), so an anchor that
 * clears its neighbours here clears them at every panel size.
 */

type Icon = ComponentType<{ className?: string }>;

/**
 * `live` modules ship today. `soon` modules are on the roadmap and are labelled
 * as such in the UI - the visual communicates the platform vision without
 * claiming unreleased capability.
 */
export type ModuleStatus = "live" | "soon";

export interface EcosystemModule {
  id: string;
  /** Short label shown on the card. */
  name: string;
  /** Full module name, used for the accessible description. */
  fullName: string;
  icon: Icon;
  status: ModuleStatus;
  /** Accent hue for the icon tile and the connector running back to the core. */
  accent: string;
  /** Anchor point (card centre) in stage units. */
  x: number;
  y: number;
  /** Reveal position in the entrance timeline (1 = first). */
  order: number;
  /** Ambient float amplitude in px; the sign sets the starting direction. */
  drift: number;
  /** Numeric headline. Counts up on reveal. Omit for a text headline. */
  count?: number;
  /** Appended to the counted number, e.g. "%". */
  suffix?: string;
  /** Text headline, used when `count` is omitted. */
  text?: string;
  /** Supporting line under the headline. */
  caption: string;
  /**
   * Range the headline gently drifts between once the entrance has finished,
   * so the workspace reads as live rather than as a screenshot.
   */
  liveRange?: [number, number];
  /** Renders a pulsing activity dot on the card. */
  pulse?: boolean;
}

/** Four hues only - the Nexora mark's blue and green, plus the two tints
 *  already used by the `.hrms-gradient` brand sweep. Roadmap modules always
 *  take violet, which makes "not yet shipped" readable at a glance. */
const INDIGO = "#6E86FF";
const SKY = "#38BDF8";
const EMERALD = "#2FC98D";
const VIOLET = "#A78BFA";

export const ECOSYSTEM_MODULES: EcosystemModule[] = [
  {
    id: "employees",
    name: "Employees",
    fullName: "Employee Management",
    icon: UsersIcon,
    status: "live",
    accent: INDIGO,
    x: 79,
    y: 10,
    order: 1,
    drift: -8,
    count: 248,
    caption: "people on board",
  },
  {
    id: "leave",
    name: "Leave",
    fullName: "Leave Management",
    icon: CalendarDaysIcon,
    status: "live",
    accent: SKY,
    x: 17,
    y: 31,
    order: 2,
    drift: 9,
    count: 14,
    caption: "open requests",
    liveRange: [11, 17],
  },
  {
    id: "attendance",
    name: "Attendance",
    fullName: "Attendance & Time",
    icon: ClockIcon,
    status: "live",
    accent: EMERALD,
    x: 84,
    y: 32,
    order: 3,
    drift: 7,
    count: 92,
    suffix: "%",
    caption: "present today",
    liveRange: [90, 95],
    pulse: true,
  },
  {
    id: "payroll",
    name: "Payroll",
    fullName: "Payroll",
    icon: BanknotesIcon,
    status: "live",
    accent: INDIGO,
    x: 85,
    y: 57,
    order: 4,
    drift: -10,
    text: "Processed",
    caption: "this month's cycle",
  },
  {
    id: "documents",
    name: "Documents",
    fullName: "Documents & Letter Builder",
    icon: DocumentTextIcon,
    status: "live",
    accent: SKY,
    x: 82,
    y: 79,
    order: 5,
    drift: 8,
    count: 12,
    caption: "letters generated",
  },
  {
    id: "performance",
    name: "Performance",
    fullName: "Performance Management",
    icon: TrophyIcon,
    status: "soon",
    accent: VIOLET,
    x: 50,
    y: 94,
    order: 6,
    drift: -7,
    count: 87,
    suffix: "%",
    caption: "goals completed",
  },
  {
    id: "recruitment",
    name: "Recruitment",
    fullName: "Recruitment & Applicant Tracking",
    icon: BriefcaseIcon,
    status: "soon",
    accent: VIOLET,
    x: 19,
    y: 9,
    order: 7,
    drift: 8,
    count: 8,
    caption: "open positions",
  },
  {
    id: "reports",
    name: "Reports",
    fullName: "Reports & Analytics",
    icon: ChartBarSquareIcon,
    status: "live",
    accent: INDIGO,
    x: 15,
    y: 55,
    order: 8,
    drift: -9,
    text: "Insights",
    caption: "workforce analytics",
  },
  {
    id: "voice",
    name: "Employee Voice",
    fullName: "Employee Voice",
    icon: ChatBubbleLeftRightIcon,
    status: "live",
    accent: EMERALD,
    x: 18,
    y: 79,
    order: 9,
    drift: 10,
    count: 3,
    caption: "new suggestions",
    liveRange: [2, 6],
    pulse: true,
  },
];

/** Reveal order for the entrance timeline; also the DOM order of the cards. */
export const MODULES_BY_ORDER = [...ECOSYSTEM_MODULES].sort(
  (a, b) => a.order - b.order
);

/** Core of the composition, in stage units. */
export const CORE = { x: 50, y: 50 };

/** Distance from the core at which connectors start, so they emerge from the
 *  edge of the core disc rather than from underneath it. */
export const CORE_RADIUS = 13;

/** Where the notification pill sits - clear of the core rings and the top row. */
export const NOTIFICATION_ANCHOR = { x: 50, y: 23 };

/** Modules named on the compact mobile / tablet composition. */
export const MOBILE_MODULE_CHIPS = [
  { label: "Employees", icon: UsersIcon },
  { label: "Leave", icon: CalendarDaysIcon },
  { label: "Attendance", icon: ClockIcon },
  { label: "Payroll", icon: BanknotesIcon },
  { label: "Documents", icon: DocumentTextIcon },
  { label: "Employee Voice", icon: ChatBubbleLeftRightIcon },
  { label: "Reports", icon: ChartBarSquareIcon },
];

/** Geometry for one connector: where it starts, ends, and how long it is. */
export function connectorGeometry(m: EcosystemModule) {
  const dx = m.x - CORE.x;
  const dy = m.y - CORE.y;
  const dist = Math.hypot(dx, dy) || 1;
  const start = CORE_RADIUS / dist;
  // Stop a little short of the anchor - the card covers the remainder.
  const end = Math.max(start, (dist - 9) / dist);
  return {
    x1: CORE.x + dx * start,
    y1: CORE.y + dy * start,
    x2: CORE.x + dx * end,
    y2: CORE.y + dy * end,
  };
}
