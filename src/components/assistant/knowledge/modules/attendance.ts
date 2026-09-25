/**
 * Knowledge pack - Attendance.
 *
 * Attendance is driven by a biometric device rather than in-app punches, so
 * the entries lean on the device connection and record syncing.
 */
import type { KnowledgeModule } from "../../types";

const attendance: KnowledgeModule = {
  id: "attendance",
  name: "Attendance",
  icon: "calendar",
  primaryRoute: "/attendance",
  routes: ["/attendance"],
  summary:
    "Attendance connects Nexora to your biometric device. It syncs enrolled employees, pulls check-in and check-out records, and flags late arrivals against the office arrival time. Admins get Today, Reports, Employees and Device tabs, a CSV export and a remote door unlock. Employees get Today, Reports and My days. Late Time and Time Changes sit under the same area.",
  quickActions: [
    { label: "Open Attendance", to: "/attendance", icon: "calendar" },
    { label: "Late Time", to: "/attendance/late-time", icon: "chart" },
    { label: "Time Changes", to: "/attendance/time-changes", icon: "navigate" },
  ],
  entries: [
    {
      id: "attendance.view",
      module: "attendance",
      question: "Where do I see attendance records?",
      aliases: ["check in times", "who came late", "daily attendance"],
      keywords: [
        "attendance",
        "records",
        "check in",
        "check out",
        "punch",
        "late",
        "present",
        "absent",
      ],
      answer:
        "The Attendance page lists every check-in and check-out pulled from the biometric device.",
      steps: [
        "Open Attendance from the sidebar rail.",
        "Use the Today tab for the current day, or Reports for a longer range. Employees also have My days.",
        "Each row shows the check-in and check-out times. Late arrivals are flagged against the office arrival time.",
      ],
      tips: [
        "Late with prior approval? Press \"Request time change\" next to the late time.",
      ],
      actions: [{ label: "Open Attendance", to: "/attendance", icon: "navigate" }],
      related: ["lateTime.view", "timeChanges.request", "attendance.device"],
      featured: true,
    },
    {
      id: "attendance.device",
      module: "attendance",
      question: "How do I connect the attendance device?",
      aliases: [
        "connect biometric machine",
        "attendance machine not connecting",
        "sync attendance",
      ],
      keywords: [
        "device",
        "machine",
        "biometric",
        "connect",
        "sync",
        "ip",
        "port",
        "offline",
      ],
      answer:
        "The device connects over your network by IP address, and syncing pulls its enrolled users and records into Nexora.",
      steps: [
        "Open Attendance and switch to the Device tab.",
        "Enter the machine's IP address, then connect.",
        "Once the status reads connected, sync employees so device IDs map to Nexora profiles.",
        "Sync records to pull the latest check-ins.",
      ],
      tips: [
        "A failed connection almost always means the device is on a different network segment or a firewall is blocking it.",
      ],
      actions: [
        { label: "Open Attendance", to: "/attendance", icon: "settings", roles: ["admin"] },
      ],
      related: ["attendance.view"],
      roles: ["admin"],
    },
    {
      id: "attendance.late",
      module: "attendance",
      question: "How do I change the time that counts as late?",
      aliases: ["change the late cut-off", "late time settings", "set office arrival time"],
      keywords: ["late", "cutoff", "cut-off", "grace", "threshold", "rule", "arrival", "setting"],
      answer:
        "One company-wide arrival time decides who is late. You set it on the Attendance page's Device tab.",
      steps: [
        "Open Attendance and switch to the Device tab.",
        "Find the card \"Arrival time that decides late\".",
        "Choose Flexible arrival (09:15 by default), Strict deadline (09:30), or Another time to set your own.",
        "Press \"Save rule\". Every screen and report judges lateness against the new time.",
      ],
      tips: [
        "Employees can compare the 9:15 and 9:30 times on their own Attendance page. That is only a preview and never changes the saved rule.",
      ],
      actions: [
        { label: "Open Attendance", to: "/attendance", icon: "settings", roles: ["admin"] },
      ],
      related: ["lateTime.rule", "lateTime.view"],
      roles: ["admin"],
    },
    {
      id: "attendance.export",
      module: "attendance",
      question: "How do I export attendance?",
      aliases: ["download attendance", "attendance csv", "attendance report"],
      keywords: ["export", "download", "csv", "report", "excel"],
      answer:
        "Admins can download attendance as a CSV file with the Export button on the Attendance page.",
      steps: [
        "Open Attendance.",
        "Set the date and any filters you need.",
        "Press \"Export\" to download the CSV.",
      ],
      actions: [
        { label: "Open Attendance", to: "/attendance", icon: "document", roles: ["admin"] },
      ],
      related: ["attendance.view"],
      roles: ["admin"],
    },
  ],
};

export default attendance;
