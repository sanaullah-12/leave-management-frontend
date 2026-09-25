/**
 * Knowledge pack - General / Dashboard.
 *
 * Cross-cutting questions: getting around, searching, and what the home
 * screen shows. Owns `/` so it is also the context module on the dashboard.
 */
import type { KnowledgeModule } from "../../types";

const general: KnowledgeModule = {
  id: "general",
  name: "Dashboard",
  icon: "chart",
  primaryRoute: "/",
  routes: ["/"],
  summary:
    "The Dashboard is your daily overview. It has Overview, Charts and Activity tabs covering leave balances, pending requests, who is present, late, absent, on leave or working remotely today, public holidays, and the latest announcements.",
  quickActions: [
    { label: "Open Dashboard", to: "/", icon: "navigate" },
    { label: "Announcements", to: "/announcements", icon: "megaphone" },
  ],
  entries: [
    {
      id: "general.what-is-nexora",
      module: "general",
      question: "What is Nexora?",
      aliases: ["what does this app do", "what is this system"],
      keywords: ["nexora", "hrms", "about", "overview", "system"],
      answer:
        "Nexora is your company's HRMS. It is one place for leave, attendance, lateness, time changes, work from home, people, payroll, documents and employee feedback.",
      steps: [
        "Use the icon rail on the left to move between areas: Home, Leave, Team, Attendance, WFH, Payroll, Documents and Voice. Which areas you see depends on your role.",
        "Each rail icon opens a panel listing the pages inside that area.",
        "The Dashboard is your daily summary; everything else lives one click away.",
      ],
      actions: [{ label: "Go to Dashboard", to: "/", icon: "navigate" }],
      related: ["general.navigate", "general.search"],
      featured: true,
      weight: 2,
    },
    {
      id: "general.navigate",
      module: "general",
      question: "How do I find my way around?",
      aliases: ["where is the menu", "how do I navigate", "where do I find pages"],
      keywords: ["navigation", "menu", "sidebar", "rail", "move", "find"],
      answer:
        "Navigation is a two-part sidebar: an icon rail for areas, and a panel listing the pages inside the selected area.",
      steps: [
        "Click an icon in the left rail to switch area: Home, Leave, Team, Attendance, WFH, Payroll, Documents, Voice or Settings.",
        "Pick a page from the panel that opens beside the rail. Attendance, for example, holds Attendance, Late Time and Time Changes.",
        "On mobile, use the bottom tab bar. The centre button is Apply Leave, and \"More\" opens everything else.",
      ],
      tips: [
        "The double-arrow button at the bottom of the rail collapses the panel when you want more room.",
      ],
      related: ["general.search"],
      featured: true,
    },
    {
      id: "general.search",
      module: "general",
      question: "How do I search for a page?",
      aliases: ["is there a search", "keyboard shortcut for search"],
      keywords: ["search", "find", "shortcut", "ctrl k", "cmd k", "quick"],
      answer:
        "The search box in the header finds any page you have access to. It searches pages and settings, not employees or records.",
      steps: [
        "Press Ctrl + K (Cmd + K on Mac) from anywhere in the app, or click the header search.",
        "Type part of a page name or a common word. For example, \"wfh\" finds Work From Home, \"tardy\" finds Late Time and \"correction\" finds Time Changes.",
        "Click a result to jump straight there.",
      ],
      tips: [
        "On smaller screens the same search sits at the top of the navigation panel.",
      ],
      featured: true,
    },
    {
      id: "general.dashboard",
      module: "general",
      question: "What does the Dashboard show?",
      aliases: ["what is on the home page"],
      keywords: ["dashboard", "home", "overview", "summary", "widgets"],
      answer:
        "The Dashboard is a live summary of everything that needs your attention today.",
      steps: [
        "Overview: leave balances, pending requests, today's attendance and the latest announcements.",
        "Team Availability: who is Present, Late, Absent, On Leave or Working Remotely today.",
        "Charts: Leave by Type and Leave Trends.",
        "Activity: recent activity across the team, plus upcoming public holidays.",
      ],
      tips: [
        "Employees also get a Quick Apply card to request leave straight from the dashboard.",
        "Use \"Enable notifications\" on the dashboard to get browser alerts.",
      ],
      actions: [{ label: "Open Dashboard", to: "/", icon: "navigate" }],
      related: ["announcements.read", "leave.apply"],
    },
    {
      id: "general.notifications",
      module: "general",
      question: "Where are my notifications?",
      aliases: ["how do I see alerts", "notification bell"],
      keywords: ["notification", "alert", "bell", "unread", "updates"],
      answer:
        "The bell in the header shows unread notifications; the Notifications page keeps the full history.",
      steps: [
        "Click the bell icon in the top-right for a quick list of recent activity.",
        "Choose \"View all\" - or open Home → Notifications - for the complete list.",
        "Selecting a notification takes you to whatever it refers to.",
      ],
      actions: [
        { label: "Open Notifications", to: "/notifications", icon: "navigate" },
      ],
    },
    {
      id: "general.install",
      module: "general",
      question: "Can I install Nexora as an app?",
      aliases: ["download the app", "install on my phone", "get app", "desktop app"],
      keywords: ["install", "app", "download", "phone", "mobile", "desktop", "pwa"],
      answer:
        "Yes. Nexora can be installed on your computer or phone and opens in its own window like a normal app.",
      steps: [
        "Press \"Get app\" in the header.",
        "Choose \"Install now\" and confirm in your browser's prompt.",
      ],
      tips: [
        "Turn on browser notifications from the dashboard so alerts reach you even when the app is closed.",
      ],
      related: ["general.notifications"],
    },
  ],
};

export default general;
