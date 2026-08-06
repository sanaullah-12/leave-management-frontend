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
    "The Dashboard is your daily overview - leave balances, pending requests, upcoming time off, team activity and the latest announcements, all on one screen.",
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
        "Nexora is your company's HRMS - one place for leave, attendance, people, payroll, documents and employee feedback.",
      steps: [
        "Use the icon rail on the left to move between areas: Home, Leave, Team, Attendance, Payroll, Documents and Voice.",
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
        "Click an icon in the left rail to switch area - Home, Leave, Team, Attendance, Payroll, Documents, Voice or Settings.",
        "Pick a page from the panel that opens beside the rail.",
        "On mobile, tap the menu button in the top-left to slide the same navigation in.",
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
        "There is a search box at the top of the navigation panel that filters every page you have access to.",
      steps: [
        "Press Ctrl + K (Cmd + K on Mac) from anywhere in the app.",
        "Type part of a page name - for example \"payslip\" or \"policy\".",
        "Click a result to jump straight there.",
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
        "Leave balances and how much of your allowance is left.",
        "Pending requests - yours to track, or your team's to approve.",
        "Upcoming approved leave and who else is out.",
        "The most recent company announcements.",
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
  ],
};

export default general;
