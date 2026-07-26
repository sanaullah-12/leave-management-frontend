import type {
  VoiceCategory,
  VoicePriority,
  VoiceStatus,
  VoiceEmployee,
  NotificationType,
} from "../types/employeeVoice";
import {
  ExclamationTriangleIcon,
  FaceFrownIcon,
  LightBulbIcon,
  LifebuoyIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export interface CategoryMeta {
  key: VoiceCategory;
  label: string;
  short: string;
  description: string;
  icon: Icon;
  /** Icon-tile classes (bg + text). */
  tile: string;
  /** Soft badge/pill classes. */
  badge: string;
}

export const CATEGORY_META: Record<VoiceCategory, CategoryMeta> = {
  workplace_issue: {
    key: "workplace_issue",
    label: "Workplace Issue",
    short: "Issue",
    description: "Report something that needs attention at work",
    icon: ExclamationTriangleIcon,
    tile: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  complaint: {
    key: "complaint",
    label: "Complaint",
    short: "Complaint",
    description: "Raise a concern or file a formal complaint",
    icon: FaceFrownIcon,
    tile: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  suggestion: {
    key: "suggestion",
    label: "Suggestion",
    short: "Idea",
    description: "Share an idea to make things better",
    icon: LightBulbIcon,
    tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  },
  hr_support: {
    key: "hr_support",
    label: "HR Support",
    short: "Support",
    description: "Request help or guidance from HR",
    icon: LifebuoyIcon,
    tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    badge:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  },
  appreciation: {
    key: "appreciation",
    label: "Appreciation",
    short: "Kudos",
    description: "Recognize a colleague or celebrate a win",
    icon: HeartIcon,
    tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  feedback: {
    key: "feedback",
    label: "Feedback",
    short: "Feedback",
    description: "Give general feedback about your experience",
    icon: ChatBubbleLeftRightIcon,
    tile: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300",
    badge:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
  },
};

export const CATEGORY_LIST = Object.values(CATEGORY_META);

export interface PriorityMeta {
  key: VoicePriority;
  label: string;
  badge: string;
  dot: string;
}

export const PRIORITY_META: Record<VoicePriority, PriorityMeta> = {
  low: {
    key: "low",
    label: "Low",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
    dot: "bg-gray-400",
  },
  medium: {
    key: "medium",
    label: "Medium",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  high: {
    key: "high",
    label: "High",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  urgent: {
    key: "urgent",
    label: "Urgent",
    badge: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    dot: "bg-red-500",
  },
};

export const PRIORITY_LIST = Object.values(PRIORITY_META);

export interface StatusMeta {
  key: VoiceStatus;
  label: string;
  badge: string;
  dot: string;
}

export const STATUS_META: Record<VoiceStatus, StatusMeta> = {
  pending: {
    key: "pending",
    label: "Pending",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
    dot: "bg-gray-400",
  },
  under_review: {
    key: "under_review",
    label: "Under Review",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  in_progress: {
    key: "in_progress",
    label: "In Progress",
    badge:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  waiting_employee: {
    key: "waiting_employee",
    label: "Waiting for Employee",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  resolved: {
    key: "resolved",
    label: "Resolved",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  closed: {
    key: "closed",
    label: "Closed",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300",
    dot: "bg-slate-400",
  },
};

export const STATUS_LIST = Object.values(STATUS_META);

// Admin status workflow order for step progress / next-status pickers.
export const STATUS_FLOW: VoiceStatus[] = [
  "pending",
  "under_review",
  "in_progress",
  "waiting_employee",
  "resolved",
  "closed",
];

/** Display name for a (possibly anonymous) submitter. */
export const employeeDisplayName = (employee?: VoiceEmployee): string => {
  if (!employee) return "Unknown";
  if (employee.anonymous) return "Anonymous";
  return employee.name || "Unknown";
};

/** Department may arrive as a string or a populated object. */
export const departmentName = (
  dept?: string | { name: string }
): string | undefined => {
  if (!dept) return undefined;
  return typeof dept === "string" ? dept : dept.name;
};

// Notification presentation (icon + tile) by type.
export const NOTIFICATION_META: Record<
  NotificationType,
  { icon: Icon; tile: string }
> = {
  leave_request: {
    icon: PaperAirplaneIcon,
    tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  leave_approved: {
    icon: CheckCircleIcon,
    tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  leave_rejected: {
    icon: FaceFrownIcon,
    tile: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  },
  voice_submitted: {
    icon: BellAlertIcon,
    tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  voice_reply: {
    icon: ChatBubbleLeftRightIcon,
    tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  },
  voice_status: {
    icon: CheckCircleIcon,
    tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
};

export const isVoiceNotification = (type: NotificationType) =>
  type === "voice_submitted" || type === "voice_reply" || type === "voice_status";
