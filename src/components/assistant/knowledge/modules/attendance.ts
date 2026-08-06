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
    "Attendance connects Nexora to your biometric device - it syncs enrolled employees, pulls check-in and check-out records, flags late arrivals against your cut-off, and lets an admin unlock the door remotely.",
  quickActions: [
    { label: "Open Attendance", to: "/attendance", icon: "calendar" },
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
        "Pick a date, and filter by employee or department if you need to narrow it down.",
        "Each row shows the entry type and time; late arrivals are flagged against the cut-off.",
      ],
      actions: [{ label: "Open Attendance", to: "/attendance", icon: "navigate" }],
      related: ["attendance.device", "attendance.late"],
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
        "Open Attendance and find the device connection panel.",
        "Enter the machine's IP address and port, then connect.",
        "Once the status reads connected, sync employees so device IDs map to Nexora profiles.",
        "Sync records to pull the latest check-ins.",
      ],
      tips: [
        "A failed connection almost always means the device is on a different network segment or the port is blocked.",
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
      question: "How is late arrival calculated?",
      aliases: ["change the late cut-off", "late time settings"],
      keywords: ["late", "cutoff", "cut-off", "grace", "threshold", "time", "rule"],
      answer:
        "A cut-off time decides what counts as late; anything after it is flagged on the record.",
      steps: [
        "Open Attendance and go to the late-time settings.",
        "Turn on the custom cut-off and set the time that applies to your organisation.",
        "Save - records are re-evaluated against the new cut-off as they display.",
      ],
      actions: [
        { label: "Open Attendance", to: "/attendance", icon: "settings", roles: ["admin"] },
      ],
      roles: ["admin"],
    },
  ],
};

export default attendance;
