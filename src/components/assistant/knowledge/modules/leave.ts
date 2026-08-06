/**
 * Knowledge pack - Leave.
 *
 * Covers the request lifecycle (apply → approve → track), the calendar and
 * leave policies. Entries that only make sense for one audience carry `roles`.
 */
import type { KnowledgeModule } from "../../types";

const leave: KnowledgeModule = {
  id: "leave",
  name: "Leave",
  icon: "calendar",
  primaryRoute: "/leaves",
  routes: [
    "/apply-leave",
    "/leave-calendar",
    "/my-leave-activity",
    "/leave-policies",
    "/leaves",
  ],
  summary:
    "Leave is where time off is requested, reviewed and tracked - request forms, the team calendar, your own history and the policies that set everyone's entitlement.",
  quickActions: [
    { label: "Apply for leave", to: "/apply-leave", icon: "create", roles: ["employee"] },
    { label: "Leave requests", to: "/leaves", icon: "navigate" },
    { label: "Leave calendar", to: "/leave-calendar", icon: "calendar" },
  ],
  entries: [
    {
      id: "leave.apply",
      module: "leave",
      question: "How do I apply for leave?",
      aliases: [
        "how to request time off",
        "how do I book a holiday",
        "i want to take leave",
        "apply for vacation",
      ],
      keywords: [
        "apply",
        "request",
        "leave",
        "time off",
        "holiday",
        "vacation",
        "sick",
        "absence",
      ],
      answer:
        "Use the Apply for Leave form under the Leave area. It checks your balance as you fill it in.",
      steps: [
        "Open Leave → Apply for Leave from the sidebar.",
        "Choose a leave type: Annual, Sick, Casual, Maternity, Paternity or Emergency.",
        "Pick your start and end date - the form totals the days for you.",
        "Write a short reason so your approver has the context they need.",
        "Submit. The request goes to your approver and appears in My Leave Activity as pending.",
      ],
      tips: [
        "Your remaining balance for the selected type is shown beside the form, so you know before you submit.",
      ],
      actions: [
        { label: "Apply for leave", to: "/apply-leave", icon: "create", roles: ["employee"] },
        { label: "See my requests", to: "/my-leave-activity", icon: "navigate", roles: ["employee"] },
      ],
      related: ["leave.status", "leave.balance", "leave.cancel"],
      roles: ["employee"],
      featured: true,
      weight: 3,
    },
    {
      id: "leave.status",
      module: "leave",
      question: "How do I check my leave request status?",
      aliases: ["was my leave approved", "where is my request", "track my leave"],
      keywords: ["status", "pending", "approved", "rejected", "track", "history"],
      answer:
        "My Leave Activity lists every request you have made with its current status.",
      steps: [
        "Open Leave → My Leave Activity.",
        "Each row shows the type, dates, day count and status - pending, approved or rejected.",
        "Open a row to read your approver's note, if they left one.",
      ],
      actions: [
        { label: "My leave activity", to: "/my-leave-activity", icon: "navigate", roles: ["employee"] },
      ],
      related: ["leave.apply", "leave.cancel"],
      roles: ["employee"],
      featured: true,
    },
    {
      id: "leave.approve",
      module: "leave",
      question: "How do I approve or reject a leave request?",
      aliases: ["approve time off", "reject a request", "review leave requests"],
      keywords: ["approve", "reject", "review", "decline", "pending", "manager"],
      answer:
        "Pending requests collect on the Leave Requests page, where you can act on them one at a time.",
      steps: [
        "Open Leave → Leave Requests.",
        "Filter by Pending to see only what still needs a decision.",
        "Open a request to see the dates, reason and the employee's remaining balance.",
        "Choose Approve or Reject - adding a note when you reject explains the decision.",
        "The employee is notified immediately and the calendar updates.",
      ],
      actions: [
        { label: "Review requests", to: "/leaves", icon: "navigate", roles: ["admin"] },
        { label: "Open calendar", to: "/leave-calendar", icon: "calendar" },
      ],
      related: ["leave.calendar", "leave.policies"],
      roles: ["admin"],
      featured: true,
      weight: 2,
    },
    {
      id: "leave.calendar",
      module: "leave",
      question: "Where can I see who is on leave?",
      aliases: ["team leave calendar", "who is off this week", "leave calendar"],
      keywords: ["calendar", "who", "team", "off", "schedule", "month"],
      answer:
        "The Leave Calendar shows approved time off across the company, month by month.",
      steps: [
        "Open Leave → Leave Calendar.",
        "Use the month arrows to move through the year.",
        "Click a day to see everyone who is away and the leave type.",
      ],
      actions: [{ label: "Open calendar", to: "/leave-calendar", icon: "calendar" }],
      related: ["leave.apply", "leave.approve"],
    },
    {
      id: "leave.balance",
      module: "leave",
      question: "How many leave days do I have left?",
      aliases: ["check my leave balance", "remaining leave"],
      keywords: ["balance", "remaining", "left", "entitlement", "allowance", "days"],
      answer:
        "Your balance per leave type appears on the Dashboard and again beside the Apply for Leave form.",
      steps: [
        "Open the Dashboard for a card per leave type showing used and remaining days.",
        "Or start a request in Leave → Apply for Leave - the balance for the selected type is shown as you choose it.",
      ],
      actions: [
        { label: "Open Dashboard", to: "/", icon: "navigate" },
        { label: "Apply for leave", to: "/apply-leave", icon: "create", roles: ["employee"] },
      ],
      related: ["leave.policies", "leave.apply"],
      featured: true,
    },
    {
      id: "leave.cancel",
      module: "leave",
      question: "Can I cancel a leave request?",
      aliases: ["withdraw my leave", "delete a leave request"],
      keywords: ["cancel", "withdraw", "remove", "delete", "undo"],
      answer:
        "A request can be withdrawn while it is still pending. Once it is approved, ask your HR admin to reverse it.",
      steps: [
        "Open Leave → My Leave Activity.",
        "Find the pending request and use the cancel action on the row.",
        "If it has already been approved, contact your HR admin - they can reverse it from Leave Requests.",
      ],
      actions: [
        { label: "My leave activity", to: "/my-leave-activity", icon: "navigate", roles: ["employee"] },
      ],
      roles: ["employee"],
    },
    {
      id: "leave.policies",
      module: "leave",
      question: "Where do I set leave policies?",
      aliases: ["change leave entitlement", "configure leave types", "annual allowance"],
      keywords: ["policy", "policies", "entitlement", "allowance", "rules", "quota"],
      answer:
        "Leave Policies is where each leave type's yearly allowance and rules are defined for the whole organisation.",
      steps: [
        "Open Team → Leave Policies.",
        "Pick the leave type you want to change.",
        "Set the annual allowance and any carry-over or notice rules.",
        "Save - new balances apply to everyone on the next request.",
      ],
      actions: [
        { label: "Open leave policies", to: "/leave-policies", icon: "settings", roles: ["admin"] },
      ],
      related: ["leave.balance"],
      roles: ["admin"],
    },
  ],
};

export default leave;
