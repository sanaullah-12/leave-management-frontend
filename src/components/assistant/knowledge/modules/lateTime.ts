/**
 * Knowledge pack - Late Time.
 *
 * The read-only lateness report. How lateness is judged is shared with
 * Attendance and Time Changes, so the rule lives in `lateTime.rule` and the
 * other packs link to it.
 */
import type { KnowledgeModule } from "../../types";

const lateTime: KnowledgeModule = {
  id: "lateTime",
  name: "Late Time",
  icon: "chart",
  primaryRoute: "/attendance/late-time",
  routes: ["/attendance/late-time"],
  summary:
    "Late Time is the late-arrival report. Employees see their own late days. Admins see the whole roster, the weekly trend and repeat offenders, and can drill into any person. Each arrival is the first device punch of the day, compared against the office arrival time.",
  quickActions: [
    { label: "Open Late Time", to: "/attendance/late-time", icon: "chart" },
    { label: "Request a time change", to: "/attendance/time-changes", icon: "create", roles: ["employee"] },
  ],
  entries: [
    {
      id: "lateTime.view",
      module: "lateTime",
      question: "Where can I see my late arrivals?",
      aliases: [
        "how many times was i late",
        "my late time",
        "late report",
        "total late minutes",
        "who came late this month",
      ],
      keywords: ["late", "lateness", "tardy", "delay", "arrivals", "report", "minutes"],
      answer:
        "The Late Time page, under Attendance, lists every late arrival with how late it was, plus totals for the range you pick.",
      steps: [
        "Open Attendance → Late Time.",
        "Pick a range: Last 7 days, This month, Quarter or Year. You can also set your own From and To dates.",
        "The tiles show total late days, average delay and total late time.",
        "The table lists each late day with the arrival, the expected time and the delay.",
      ],
      tips: [
        "The presets are rolling windows. \"This month\" means the last 30 days, not the calendar month.",
        "Admins can click a name under \"Repeat offenders\" to see one person's record.",
        "This page is a report only. There is no export, and nothing on it can be edited.",
      ],
      actions: [{ label: "Open Late Time", to: "/attendance/late-time", icon: "chart" }],
      related: ["lateTime.rule", "timeChanges.request"],
      featured: true,
      weight: 2,
    },
    {
      id: "lateTime.rule",
      module: "lateTime",
      question: "How is late arrival calculated?",
      aliases: [
        "what time counts as late",
        "grace period for late",
        "when am i marked late",
        "late cut-off",
      ],
      keywords: ["late", "cutoff", "cut-off", "grace", "threshold", "rule", "arrival", "calculated"],
      answer:
        "Your arrival is the first device punch of the day. If it is after the office arrival time, the day is late. It is judged to the minute, so with a 09:15 rule, 09:15:59 still counts as on time.",
      steps: [
        "Late minutes are the arrival minute minus the rule's minute.",
        "One arrival time applies to the whole company. There are no per-shift or per-department times.",
        "Saturdays and Sundays are never judged.",
        "A day with no punch is not late. It is recorded as absent, leave or work from home instead.",
      ],
      tips: [
        "An approved time change replaces the machine arrival for that day everywhere, including these totals.",
        "Late minutes never affect your leave balance.",
      ],
      actions: [{ label: "Open Late Time", to: "/attendance/late-time", icon: "chart" }],
      related: ["attendance.late", "timeChanges.request"],
      featured: true,
    },
    {
      id: "lateTime.not-linked",
      module: "lateTime",
      question: "Why does Late Time show nothing for me?",
      aliases: ["no late data", "account not linked to device", "late time is empty"],
      keywords: ["empty", "nothing", "device id", "linked", "missing"],
      answer:
        "Late Time needs your account to be linked to a device ID. Without one there are no punches to judge.",
      steps: [
        "If the page says your account is not linked, ask an admin to link your device ID from your employee record.",
        "If it is linked and the list is empty, you had no late arrivals in that range. Try a wider range.",
      ],
      related: ["lateTime.view"],
    },
    {
      id: "lateTime.notification",
      module: "lateTime",
      question: "Why did I get a late arrival notification?",
      aliases: ["late arrival alert", "you are late today notification"],
      keywords: ["notification", "alert", "late", "today", "accumulated"],
      answer:
        "When you arrive after the office arrival time, you get one \"Late Arrival\" notification for that day. It shows how late you were and your total late time for the month so far.",
      tips: [
        "If you had approval to arrive late, raise a time change request for that day.",
      ],
      actions: [
        { label: "Request a time change", to: "/attendance/time-changes", icon: "create", roles: ["employee"] },
      ],
      related: ["timeChanges.request"],
      roles: ["employee"],
    },
  ],
};

export default lateTime;
