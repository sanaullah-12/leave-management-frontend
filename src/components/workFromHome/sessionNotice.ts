import { showDesktopNotice } from "../../services/desktopNotifications";
import { formatClock, formatHm } from "./sessionFormat";

/**
 * What a system notification says about a work-from-home day.
 *
 * The in-app notification is unchanged and is still the record - this is the
 * same four moments written for a notification tray, where there is room for a
 * line and no bell to click. Only the four state changes appear here. A running
 * timer produces nothing: a notification per tick would make the feature
 * unusable within a minute, and it is the change of state an admin needs
 * telling about, not the count.
 *
 * -- Who gets told what, and by which channel -----------------------------
 *
 * These four events are addressed to the company's admins
 * (notifications/NotificationEvents.js), so the server writes them a
 * notification and pushes it to their devices. The employee is sent none of
 * that - they are the one causing the events - which makes THIS the only
 * channel that can tell them their own timer has stopped. So a notice about
 * the reader's own day is drawn here even on a browser that holds a push
 * subscription: no push is coming for it, and suppressing it as a duplicate
 * would suppress the one message nothing else sends.
 */

/** The socket payload from backend/services/wfhSessionNotifier.js. */
export interface WfhSessionSignal {
  sessionId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: "working" | "paused" | "completed";
  activeMs: number;
  startedAt: string;
  idleTimeoutMinutes: number;
  transitions: string[];
}

/**
 * The one transition worth announcing out of a signal that may carry several.
 *
 * A day that is auto-paused and auto-finished in the same sweep is one thing
 * that happened to the reader: the day ended. Announcing both would be the same
 * news twice, so the later state wins.
 */
const PRECEDENCE = [
  "auto_finished",
  "finished",
  "auto_paused",
  "paused",
  "resumed",
  "started",
];

const principal = (transitions: string[]): string | null =>
  PRECEDENCE.find((candidate) => transitions.includes(candidate)) || null;

/**
 * The copy, in the second person when it is the reader's own day and the third
 * when it is somebody they manage.
 */
function compose(
  transition: string,
  signal: WfhSessionSignal,
  isSelf: boolean
): { title: string; body: string; force?: boolean; pushWillDeliver?: boolean } | null {
  const who = isSelf ? "You" : signal.employeeName;
  const their = isSelf ? "your" : "their";

  switch (transition) {
    case "started":
      return {
        title: "WFH Work Started",
        body: `${who} ${isSelf ? "have" : "has"} started ${their} WFH work session at ${formatClock(
          signal.startedAt
        )}.`,
      };

    case "auto_paused":
      return {
        title: "WFH Work Paused",
        body: `${isSelf ? "Your" : `${signal.employeeName}'s`} work timer was paused after ${
          signal.idleTimeoutMinutes
        } minutes of no mouse or keyboard activity.`,
        // Shown to the employee even with the tab in front of them. It is in
        // front of them because they walked away and left it there, which is
        // the very thing being reported.
        force: isSelf,
      };

    case "paused":
      return {
        title: "WFH Work Paused",
        body: `${who} paused ${their} WFH work session. ${formatHm(
          signal.activeMs
        )} counted so far today.`,
      };

    case "resumed":
      return {
        title: "WFH Work Resumed",
        body: `${who} ${isSelf ? "have" : "has"} resumed ${their} WFH work session.`,
      };

    case "finished":
      return {
        title: "WFH Work Completed",
        body: `${who} completed ${their} WFH session. Active work time: ${formatHm(
          signal.activeMs
        )}.`,
      };

    case "auto_finished":
      return {
        title: "WFH Work Completed",
        body: `${
          isSelf ? "Your" : `${signal.employeeName}'s`
        } WFH session was closed automatically. Active work time: ${formatHm(
          signal.activeMs
        )}.`,
      };

    default:
      return null;
  }
}

/**
 * Announce a session change on the desktop, if there is anything to announce.
 *
 * The tag is the session and the transition, so a repeat of the same moment
 * replaces the earlier notification rather than stacking beside it, and the
 * duplicate guard in services/desktopNotifications has something stable to key
 * on when a socket event is delivered twice.
 */
export function announceWfhSessionOnDesktop(
  signal: WfhSessionSignal | undefined,
  viewerId: string | undefined
): void {
  if (!signal || !Array.isArray(signal.transitions)) return;

  const transition = principal(signal.transitions);
  if (!transition) return;

  const isSelf =
    Boolean(viewerId) && String(signal.employeeId) === String(viewerId);

  const copy = compose(transition, signal, isSelf);
  if (!copy) return;

  void showDesktopNotice({
    tag: `wfh-session:${signal.sessionId}:${transition}`,
    // The server pushes these to the admins watching, never to the employee
    // they are about. An admin may therefore get it twice and this tab keeps
    // quiet; the employee gets it from nowhere else, so this tab draws it.
    pushWillDeliver: !isSelf,
    ...copy,
  });
}
