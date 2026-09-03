/**
 * events.ts
 * ---------
 * Client mirror of the server's real-time event names (backend
 * socket/socketEvents.js). Keep the two in sync.
 */
export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: "notification:new",
  LEAVE_NEW: "leave:new",
  LEAVE_REVIEWED: "leave:reviewed",
  WFH_NEW: "wfh:new",
  WFH_REVIEWED: "wfh:reviewed",
  VOICE_NEW: "voice:new",
  VOICE_UPDATED: "voice:updated",
  ANNOUNCEMENT_NEW: "announcement:new",
  ATTENDANCE_UPDATE: "attendance:update",
  STATS_UPDATE: "stats:update",
  PRESENCE_UPDATE: "presence:update",
  CONNECTED: "server:connected",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
