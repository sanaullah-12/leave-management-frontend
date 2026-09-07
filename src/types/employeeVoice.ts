// -- Employee Voice domain types ------------------------------------------

export type VoiceCategory =
  | "workplace_issue"
  | "complaint"
  | "suggestion"
  | "hr_support"
  | "appreciation"
  | "feedback";

export type VoicePriority = "low" | "medium" | "high" | "urgent";

export type VoiceStatus =
  | "pending"
  | "under_review"
  | "in_progress"
  | "waiting_employee"
  | "resolved"
  | "closed";

export interface VoiceEmployee {
  _id?: string;
  name: string;
  employeeId?: string;
  department?: string | { name: string };
  position?: string;
  profilePicture?: string;
  /** true when the identity was hidden (anonymous submission viewed by admin). */
  anonymous?: boolean;
}

export interface VoiceAttachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface VoiceReplyAuthor {
  _id: string;
  name: string;
  profilePicture?: string;
  role?: "admin" | "employee";
}

export interface VoiceReply {
  _id?: string;
  author?: VoiceReplyAuthor | string;
  authorName: string;
  authorRole: "admin" | "employee";
  message: string;
  createdAt: string;
}

export interface EmployeeVoice {
  _id: string;
  employee: VoiceEmployee;
  company: string;
  category: VoiceCategory;
  title: string;
  description: string;
  priority: VoicePriority;
  department?: string;
  isAnonymous: boolean;
  status: VoiceStatus;
  attachments: VoiceAttachment[];
  replies: VoiceReply[];
  reviewedBy?: { _id: string; name: string } | string;
  reviewedDate?: string;
  resolvedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceStatBucket {
  _id: string;
  count: number;
}

export interface VoiceStats {
  pending: number;
  resolved: number;
  newToday: number;
  highPriority: number;
  total: number;
  byStatus: VoiceStatBucket[];
  byCategory: VoiceStatBucket[];
}

/**
 * Every value Notification.type can hold, matching the enum in
 * backend/models/Notification.js. Kept complete rather than partial: the
 * icon map below is a Record over this union, so a type the backend can send
 * and the UI has no icon for is a compile error rather than a bell with no
 * meaning next to it.
 */
export type NotificationType =
  | "leave_request"
  | "leave_approved"
  | "leave_rejected"
  | "leave_auto_marked"
  | "leave_auto_reversed"
  | "wfh_request"
  | "wfh_approved"
  | "wfh_rejected"
  | "voice_submitted"
  | "voice_reply"
  | "voice_status"
  | "announcement"
  | "attendance_late"
  | "app_update";

export interface AppNotification {
  _id: string;
  recipient: string;
  sender?: { _id: string; name: string; employeeId?: string } | null;
  company: string;
  type: NotificationType;
  title: string;
  message: string;
  leaveId?: string | null;
  voiceId?: { _id: string } | string | null;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    unreadCount: number;
  };
}
