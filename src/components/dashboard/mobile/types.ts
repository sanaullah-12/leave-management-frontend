import type React from "react";

/**
 * What the dashboard's phone screens are handed.
 *
 * Every figure here is one the desktop page already derived - see
 * pages/DashboardPage. Nothing in components/dashboard/mobile fetches or
 * recomputes a number, so a count cannot say one thing on a phone and another
 * on a laptop; these screens only decide which of them belongs on which tab.
 */

type IconComponent = React.ComponentType<{ className?: string }>;

/** A headline figure in the four-up grid at the top of Overview. */
export interface DashboardKpi {
  label: string;
  value: number | string;
  /** Sits after the value, e.g. the quota an employee's remaining days are out of. */
  suffix?: string;
  caption?: string;
  icon: IconComponent;
  onClick?: () => void;
}

/** A supporting figure under the Leave by Type chart. */
export interface DashboardMiniStat {
  label: string;
  value: number;
  icon: IconComponent;
}

/** The single arc on the Review tab: a share, and the count behind it. */
export interface DashboardGauge {
  label: string;
  percent: number;
  big: React.ReactNode;
  small?: string;
}

/**
 * One month of the leave trend: every request in it, and how those requests
 * were decided. DashboardPage counts all four - the chart draws two of them
 * and the tooltip reports the rest.
 */
export interface TrendPoint {
  month: string;
  value: number;
  approved: number;
  pending: number;
  rejected: number;
}

/** One bar of Leave by Type. */
export interface TypePoint {
  name: string;
  value: number;
}

/** An upcoming public holiday, already formatted for display. */
export interface HolidayEntry {
  mon: string;
  day: string;
  name: string;
  sub: string;
}

/** How one person's day reads in Team Availability. */
export interface AvailabilityTone {
  labelKey: string;
  available: boolean;
  rank: number;
  dot: string;
  text: string;
}

export interface TeamMember {
  _id?: string;
  name?: string;
  profilePicture?: string;
  department?: { name?: string } | string;
  position?: string;
  availability: AvailabilityTone;
}
