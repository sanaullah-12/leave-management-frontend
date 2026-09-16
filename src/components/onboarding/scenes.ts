import type React from "react";
import {
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon,
  EyeIcon,
  HandRaisedIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
  SignalIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

/**
 * The onboarding story.
 *
 * Five scenes, one per thing a new person actually opens Nexora to do. Each is
 * a character rather than a screenshot: a screenshot of a dashboard means
 * nothing to somebody who has never seen the data in it, and it dates the
 * moment the UI moves. A character saying the one sentence that matters
 * survives both.
 *
 * The chips carry icons rather than the emoji the visual reference used - the
 * product draws every glyph from heroicons, and a row of emoji beside heroicon
 * chips elsewhere in the app would read as a different product.
 */

export type FaceKind = "glasses" | "focused" | "resting" | "alert" | "friendly";

export interface ScenePalette {
  /** The body's mid tone, and the hue the whole scene is keyed to. */
  base: string;
  /** Top highlight, where the light falls. */
  light: string;
  /** Bottom edge, where the body turns away. */
  deep: string;
}

export interface Trait {
  label: string;
  /** Heroicons take the scene hue through `style`, so keep that prop in scope. */
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface Scene {
  id: string;
  /** The feature, as a person would name it. */
  name: string;
  /** What the character says. Two lines at phone width. */
  line: string;
  traits: Trait[];
  description: string;
  palette: ScenePalette;
  face: FaceKind;
}

export const SCENES: Scene[] = [
  {
    id: "dashboard",
    name: "Your dashboard",
    line: "Here's your day. Nothing to go digging for.",
    traits: [
      { label: "At a glance", Icon: Squares2X2Icon },
      { label: "Live", Icon: SignalIcon },
      { label: "Yours", Icon: SparklesIcon },
    ],
    description:
      "Leave balances, who is in today, and what is waiting on your approval. The figures you actually open the app for are the first thing on the screen.",
    palette: { base: "#14b8a6", light: "#7dead8", deep: "#0b7a70" },
    face: "glasses",
  },
  {
    id: "attendance",
    name: "Attendance",
    line: "Clocked in. That is the whole ritual.",
    traits: [
      { label: "One tap", Icon: BoltIcon },
      { label: "Accurate", Icon: ClockIcon },
      { label: "Automatic", Icon: CheckBadgeIcon },
    ],
    description:
      "Start and end your day in a tap. Hours, breaks and late minutes add themselves up, so nobody is reconstructing a timesheet on Friday afternoon.",
    palette: { base: "#f59e0b", light: "#fcd77e", deep: "#b45309" },
    face: "focused",
  },
  {
    id: "leave",
    name: "Time off",
    line: "Ask for leave in two taps. Then forget about it.",
    traits: [
      { label: "Simple", Icon: HandRaisedIcon },
      { label: "Tracked", Icon: ScaleIcon },
      { label: "Restful", Icon: HeartIcon },
    ],
    description:
      "Pick your days and send. Your balance updates as you choose them, your manager has it straight away, and the calendar shows who else is already out.",
    palette: { base: "#8b5cf6", light: "#c9b8fd", deep: "#5b21b6" },
    face: "resting",
  },
  {
    id: "notifications",
    name: "Notifications",
    line: "Approved. You will know before you think to ask.",
    traits: [
      { label: "Timely", Icon: BoltIcon },
      { label: "Quiet", Icon: EyeIcon },
      { label: "Clear", Icon: CheckBadgeIcon },
    ],
    description:
      "Approvals, rejections and reminders arrive as they happen, on the device already in your hand. No refreshing, and nothing buried in an inbox.",
    palette: { base: "#f43f5e", light: "#fda8b4", deep: "#9f1239" },
    face: "alert",
  },
  {
    id: "people",
    name: "Your people",
    line: "The whole team, in one place that stays current.",
    traits: [
      { label: "Complete", Icon: UserGroupIcon },
      { label: "Searchable", Icon: MagnifyingGlassIcon },
      { label: "Current", Icon: CheckBadgeIcon },
    ],
    description:
      "Profiles, departments, documents and history, one record per person. Onboarding somebody becomes a morning's work rather than a week of chasing.",
    palette: { base: "#3b82f6", light: "#9dc4fd", deep: "#1d4ed8" },
    face: "friendly",
  },
];
