/**
 * Knowledge pack - Work From Home.
 *
 * Covers the request/approval flow and the work timer that runs on an
 * approved day. Timing limits quoted here are the server defaults; a
 * deployment can change them through its environment.
 */
import type { KnowledgeModule } from "../../types";

const wfh: KnowledgeModule = {
  id: "wfh",
  name: "Work From Home",
  icon: "calendar",
  primaryRoute: "/work-from-home",
  routes: ["/work-from-home"],
  summary:
    "Work From Home is where employees request a day away from the office and admins approve or reject it. On an approved day the page shows a work timer with a task list, and admins get a live view of who is working remotely today. Approved days count as working days and never use leave balance.",
  quickActions: [
    { label: "Request work from home", to: "/work-from-home", icon: "create", roles: ["employee"] },
    { label: "Review WFH requests", to: "/work-from-home", icon: "navigate", roles: ["admin"] },
  ],
  entries: [
    {
      id: "wfh.request",
      module: "wfh",
      question: "How do I request work from home?",
      aliases: [
        "apply for wfh",
        "i want to work from home",
        "request remote work",
        "how to apply work from home",
      ],
      keywords: ["wfh", "work from home", "remote", "home", "request", "apply"],
      answer:
        "Use the \"Request work from home\" form on the Work From Home page. Approved days count as working days and do not use your leave balance.",
      steps: [
        "Open Work From Home from the sidebar.",
        "Pick the Date, or choose \"Use a date range\" for several days.",
        "Set your working hours. They are for planning only and do not limit the timer.",
        "Write a reason and add at least one task you will work on. Press Enter or \"+\" after each task.",
        "Add an optional note for your approver, then press \"Submit request\".",
      ],
      tips: [
        "You can request up to 7 days in the past. That is treated as a correction and turns those days from absent into work from home once approved.",
        "A request cannot overlap your own pending or approved leave or another WFH request.",
        "A date range counts every calendar day, weekends included.",
      ],
      actions: [
        { label: "Open Work From Home", to: "/work-from-home", icon: "create", roles: ["employee"] },
      ],
      related: ["wfh.status", "wfh.timer", "wfh.leave-balance"],
      roles: ["employee"],
      featured: true,
      weight: 3,
    },
    {
      id: "wfh.status",
      module: "wfh",
      question: "How do I check or withdraw my WFH request?",
      aliases: [
        "is my wfh approved",
        "cancel my work from home request",
        "withdraw wfh",
        "wfh request status",
      ],
      keywords: ["status", "withdraw", "cancel", "pending", "approved", "rejected", "wfh"],
      answer:
        "Your requests are listed under \"My requests\" on the Work From Home page, with their status.",
      steps: [
        "Open Work From Home and scroll to \"My requests\".",
        "Filter by status if you need to: Pending, Approved, Rejected or Cancelled.",
        "Click a request to see its details, planned tasks and any review comment.",
        "To cancel a request that is still pending, press \"Withdraw\".",
      ],
      tips: [
        "Only pending requests can be withdrawn. An approved request cannot be cancelled from the app, so ask an admin.",
        "You get a notification when your request is approved or rejected.",
      ],
      actions: [{ label: "Open Work From Home", to: "/work-from-home", icon: "navigate" }],
      related: ["wfh.request"],
      roles: ["employee"],
    },
    {
      id: "wfh.timer",
      module: "wfh",
      question: "How does the work from home timer work?",
      aliases: [
        "start work from home",
        "how do i start my wfh day",
        "pause wfh timer",
        "finish work from home",
      ],
      keywords: ["timer", "start", "pause", "resume", "finish", "session", "track", "hours"],
      answer:
        "On a day covered by an approved request, a \"WFH - Today\" card appears at the top of the Work From Home page. It records your working time.",
      steps: [
        "Press \"Start Work\". Your first planned task starts automatically.",
        "Use the pause button inside the timer ring for breaks. Paused time is not counted.",
        "Press resume when you are back. The timer never resumes on its own.",
        "Press \"Finish Work\" at the end of the day to see your WFH Work Summary.",
      ],
      tips: [
        "Finishing cannot be undone. Once finished, the day is closed and cannot be restarted.",
        "The timer does not watch your mouse or keyboard, and takes no screenshots. It only stops when you pause or finish.",
        "A day left open is closed automatically after 16 hours. Only time with recorded activity is counted.",
        "The card only appears for approved requests. A pending request does not unlock it.",
      ],
      actions: [{ label: "Open Work From Home", to: "/work-from-home", icon: "navigate" }],
      related: ["wfh.tasks", "wfh.request"],
      featured: true,
      weight: 2,
    },
    {
      id: "wfh.tasks",
      module: "wfh",
      question: "How do I manage tasks during work from home?",
      aliases: ["add a task to my wfh day", "mark task done", "switch task"],
      keywords: ["task", "tasks", "done", "complete", "add", "wfh"],
      answer:
        "Open the tasks panel on the \"WFH - Today\" card with the list button. It shows how many tasks are still open.",
      steps: [
        "Press \"Start\" on a task to work on it. Only one task is active at a time.",
        "Press \"Done\" when you finish it. The next task does not start on its own.",
        "Type in \"Add a task\" to add work that was not planned. It is tagged \"Added\" in the report.",
      ],
      tips: [
        "You can have up to 50 tasks a day. A finished task cannot be restarted, so add it again if there is more to do.",
      ],
      actions: [{ label: "Open Work From Home", to: "/work-from-home", icon: "navigate" }],
      related: ["wfh.timer"],
    },
    {
      id: "wfh.leave-balance",
      module: "wfh",
      question: "Does work from home use my leave balance?",
      aliases: ["is wfh counted as leave", "wfh and leave", "does wfh count as a working day"],
      keywords: ["balance", "leave", "working day", "count", "wfh"],
      answer:
        "No. An approved work from home day counts as a working day and never touches your leave balance.",
      tips: [
        "If you have leave and WFH on the same day, the leave takes precedence.",
        "An approved backdated WFH request also reverses any leave the system recorded automatically for an unreported absence, and your balance is returned.",
      ],
      related: ["wfh.request", "wfh.unreported-absence"],
    },
    {
      id: "wfh.unreported-absence",
      module: "wfh",
      question: "Why was leave marked automatically when I was absent?",
      aliases: [
        "leave auto marked",
        "system marked me on leave",
        "unreported absence",
        "absent without leave",
      ],
      keywords: ["auto", "automatic", "absent", "absence", "unreported", "marked", "unpaid"],
      answer:
        "On a working day with no device punch, no leave and no work from home request, the system records the day as leave after 14:00. It uses annual leave, or unpaid leave when no balance is left.",
      steps: [
        "If you actually worked from home that day, submit a backdated work from home request for it. You can go up to 7 days back.",
        "Once an admin approves it, the automatic leave is reversed and your balance is returned.",
      ],
      tips: [
        "A pending WFH request for the day is enough to stop the automatic leave from being recorded.",
      ],
      actions: [
        { label: "Open Work From Home", to: "/work-from-home", icon: "create", roles: ["employee"] },
      ],
      related: ["wfh.request", "wfh.leave-balance"],
    },
    {
      id: "wfh.review",
      module: "wfh",
      question: "How do I approve or reject a WFH request?",
      aliases: [
        "approve work from home",
        "reject wfh",
        "review wfh requests",
        "pending work from home requests",
      ],
      keywords: ["approve", "reject", "review", "pending", "wfh", "request"],
      answer:
        "Admins review requests on the WFH Requests page. The employee is notified of every decision.",
      steps: [
        "Open WFH Requests from the sidebar and filter to Pending.",
        "Press \"Review\" on a row, or click the row, to see the reason and planned tasks.",
        "Press \"Approve\", or \"Reject\" and give a reason. A reason is required to reject.",
      ],
      tips: [
        "Approving a backdated request changes those days from absent to work from home.",
        "You cannot review your own request while another admin is active.",
        "Only pending requests can be reviewed. An approval cannot be undone from the app.",
      ],
      actions: [{ label: "Open WFH Requests", to: "/work-from-home", icon: "navigate", roles: ["admin"] }],
      related: ["wfh.monitor"],
      roles: ["admin"],
      featured: true,
      weight: 2,
    },
    {
      id: "wfh.monitor",
      module: "wfh",
      question: "How do I see who is working from home today?",
      aliases: ["live wfh monitor", "who is working remotely", "wfh activity report"],
      keywords: ["monitor", "live", "today", "remote", "working", "inactive", "report"],
      answer:
        "The \"Working from home today\" monitor at the top of WFH Requests lists everyone with an approved day, with a live count of who is working, inactive, not started or completed.",
      steps: [
        "Open WFH Requests.",
        "Each row shows the planned and actual start, current status, current task and worked time.",
        "Press \"View\" for the full report: summary, task report, work sessions and activity log.",
        "Press \"Enable desktop alerts\" to get a browser alert when people start, pause, resume or finish.",
      ],
      actions: [{ label: "Open WFH Requests", to: "/work-from-home", icon: "chart", roles: ["admin"] }],
      related: ["wfh.review"],
      roles: ["admin"],
    },
  ],
};

export default wfh;
