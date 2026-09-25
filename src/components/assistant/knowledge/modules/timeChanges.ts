/**
 * Knowledge pack - Time Changes.
 *
 * A time change only moves a late day's arrival earlier. It is not a general
 * missed-punch tool, and the entries say so because that is the first thing
 * people assume it does.
 */
import type { KnowledgeModule } from "../../types";

const timeChanges: KnowledgeModule = {
  id: "timeChanges",
  name: "Time Changes",
  icon: "document",
  primaryRoute: "/attendance/time-changes",
  routes: ["/attendance/time-changes"],
  summary:
    "Time Changes is for late arrivals that were agreed in advance. An employee asks for a late day to be recorded from an earlier time, and an admin approves or rejects it. The machine check-in is always kept. An approved time is shown on top of it across every screen and report.",
  quickActions: [
    { label: "Open Time Changes", to: "/attendance/time-changes", icon: "navigate" },
  ],
  entries: [
    {
      id: "timeChanges.request",
      module: "timeChanges",
      question: "How do I request a time change for a late day?",
      aliases: [
        "correct my check in time",
        "i was late with permission",
        "change my arrival time",
        "fix my late attendance",
        "time correction",
      ],
      keywords: ["time change", "correction", "correct", "late", "check in", "arrival", "request"],
      answer:
        "If you arrived late with prior approval, ask for that day to be recorded from the agreed time.",
      steps: [
        "Open Attendance → Time Changes. The \"Late days\" list shows your late days from the last 60 days.",
        "Press \"Request time change\" on the day.",
        "Pick the requested check-in time. It must be earlier than the machine check-in.",
        "Give a reason of at least 3 characters, then press \"Submit request\".",
      ],
      tips: [
        "The same button also appears next to late times on the Attendance and Late Time pages.",
        "Only days within the last 60 days can be changed. Weekends and days that were not late cannot.",
        "You can have one pending or approved request per day. After a rejection or withdrawal you can ask again.",
      ],
      actions: [
        { label: "Open Time Changes", to: "/attendance/time-changes", icon: "create", roles: ["employee"] },
      ],
      related: ["timeChanges.missed-punch", "timeChanges.status", "lateTime.rule"],
      roles: ["employee"],
      featured: true,
      weight: 3,
    },
    {
      id: "timeChanges.missed-punch",
      module: "timeChanges",
      question: "I forgot to punch in. Can I fix it?",
      aliases: [
        "missed punch",
        "forgot to check in",
        "no check in recorded",
        "forgot to check out",
        "machine did not record me",
      ],
      keywords: ["missed", "forgot", "punch", "no punch", "check out", "absent", "missing"],
      answer:
        "Not with a time change. A time change only moves a recorded late check-in earlier. It cannot add a missing punch or change a check-out.",
      steps: [
        "If you were working from home that day, submit a backdated work from home request. You can go up to 7 days back.",
        "Otherwise, contact your HR admin to sort out the record.",
      ],
      actions: [
        { label: "Open Work From Home", to: "/work-from-home", icon: "create", roles: ["employee"] },
      ],
      related: ["timeChanges.request", "wfh.unreported-absence"],
    },
    {
      id: "timeChanges.status",
      module: "timeChanges",
      question: "What happens after I request a time change?",
      aliases: ["is my time change approved", "withdraw time change", "time change status"],
      keywords: ["status", "pending", "approved", "rejected", "withdraw", "cancel"],
      answer:
        "The request goes to an admin for approval, and you are notified of the decision.",
      steps: [
        "While it waits, the day shows \"Change pending\". You can withdraw it from the Time Changes page.",
        "If approved, the day shows \"Time corrected\" and your attendance and late totals are recalculated.",
        "If rejected, the reason is shown under the day and you can request again.",
      ],
      tips: [
        "Your machine check-in is never deleted. It stays visible, struck through, beside the approved time.",
      ],
      actions: [{ label: "Open Time Changes", to: "/attendance/time-changes", icon: "navigate" }],
      related: ["timeChanges.request"],
      roles: ["employee"],
    },
    {
      id: "timeChanges.review",
      module: "timeChanges",
      question: "How do I approve a time change request?",
      aliases: ["review time change requests", "reject time change", "pending time corrections"],
      keywords: ["approve", "reject", "review", "time change", "correction", "pending"],
      answer:
        "Time Changes opens on the Pending queue, oldest first. Every row shows the machine time next to the requested time and the reason.",
      steps: [
        "Open Attendance → Time Changes.",
        "Check the machine and requested times and the reason on the row.",
        "Press \"Approve\", or \"Reject\" and give a reason. A reason is required to reject.",
      ],
      tips: [
        "Approval never edits the device record. The new time is applied on top, so every report uses it.",
        "An approval cannot be undone from the app.",
        "You cannot approve your own request while another admin is active.",
      ],
      actions: [
        { label: "Open Time Changes", to: "/attendance/time-changes", icon: "navigate", roles: ["admin"] },
      ],
      related: ["lateTime.rule"],
      roles: ["admin"],
      featured: true,
    },
  ],
};

export default timeChanges;
