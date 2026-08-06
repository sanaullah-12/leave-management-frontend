/**
 * Knowledge pack - Employee Voice.
 */
import type { KnowledgeModule } from "../../types";

const voice: KnowledgeModule = {
  id: "voice",
  name: "Employee Voice",
  icon: "megaphone",
  primaryRoute: "/employee-voice",
  routes: ["/employee-voice"],
  summary:
    "Employee Voice is a direct, optionally anonymous channel to HR - raise a workplace issue, file a complaint, suggest an improvement, ask for support or share appreciation, then follow the reply thread until it is resolved.",
  quickActions: [
    { label: "Open Employee Voice", to: "/employee-voice", icon: "megaphone" },
  ],
  entries: [
    {
      id: "voice.what-is",
      module: "voice",
      question: "What is Employee Voice?",
      aliases: [
        "what does employee voice do",
        "explain employee voice",
        "what is the voice module",
      ],
      keywords: [
        "voice",
        "feedback",
        "complaint",
        "suggestion",
        "anonymous",
        "hr",
        "concern",
        "speak",
      ],
      answer:
        "Employee Voice is a private channel between you and HR. You submit a message in a category, HR responds in a thread, and the item moves through clear statuses until it is resolved.",
      steps: [
        "Categories cover workplace issues, complaints, suggestions, HR support, appreciation and general feedback.",
        "Every submission can be sent anonymously - HR sees the message and category, not who wrote it.",
        "Status moves from Pending through Under Review and In Progress to Resolved or Closed.",
        "Replies land in your notifications so you never have to keep checking.",
      ],
      actions: [
        { label: "Open Employee Voice", to: "/employee-voice", icon: "megaphone" },
      ],
      related: ["voice.submit", "voice.anonymous", "voice.track"],
      featured: true,
      weight: 3,
    },
    {
      id: "voice.submit",
      module: "voice",
      question: "How do I submit feedback or raise a concern?",
      aliases: [
        "how do I complain",
        "report a workplace issue",
        "send a suggestion to hr",
      ],
      keywords: ["submit", "raise", "report", "send", "new", "concern", "issue"],
      answer:
        "Submitting takes one form on the Employee Voice page.",
      steps: [
        "Open Voice → Employee Voice.",
        "Click the submit button in the header.",
        "Pick the category that fits - issue, complaint, suggestion, HR support, appreciation or feedback.",
        "Set a priority, write your message, and attach a file if it helps.",
        "Choose whether to submit anonymously, then send.",
      ],
      actions: [
        { label: "Open Employee Voice", to: "/employee-voice", icon: "create" },
      ],
      related: ["voice.anonymous", "voice.track"],
      featured: true,
    },
    {
      id: "voice.anonymous",
      module: "voice",
      question: "Is Employee Voice anonymous?",
      aliases: ["can HR see who submitted", "is my feedback private"],
      keywords: ["anonymous", "private", "confidential", "identity", "hidden", "safe"],
      answer:
        "Only if you choose it. Anonymity is a toggle on the submission form, decided per message.",
      steps: [
        "Turn on the anonymous option before you send.",
        "HR then sees the category, priority and message - but not your name.",
        "You can still follow the thread and read replies from your own list.",
      ],
      tips: [
        "Leaving it off is often better for HR support requests - it lets HR follow up with you directly.",
      ],
      related: ["voice.submit"],
    },
    {
      id: "voice.track",
      module: "voice",
      question: "How do I track my Employee Voice submission?",
      aliases: ["did HR reply", "check my voice status"],
      keywords: ["track", "status", "reply", "response", "progress", "resolved"],
      answer:
        "Your submissions stay on the Employee Voice page with their live status and reply thread.",
      steps: [
        "Open Voice → Employee Voice.",
        "Your items are listed with their status badge.",
        "Open one to read HR's replies and add your own.",
        "New replies also arrive as notifications.",
      ],
      actions: [
        { label: "Open Employee Voice", to: "/employee-voice", icon: "navigate" },
      ],
      related: ["voice.submit", "general.notifications"],
    },
    {
      id: "voice.manage",
      module: "voice",
      question: "How do I respond to employee submissions?",
      aliases: ["manage employee voice", "reply to a complaint"],
      keywords: ["respond", "reply", "manage", "resolve", "assign", "close"],
      answer:
        "Admins see every submission on the same page, with tools to reply and move it through its statuses.",
      steps: [
        "Open Voice → Employee Voice.",
        "Filter by status or category to find what needs attention.",
        "Open a submission to read it in full and reply in the thread.",
        "Update the status as you work - Under Review, In Progress, then Resolved or Closed.",
      ],
      tips: [
        "Anonymous submissions hide the sender's identity from you as well; reply in the thread to reach them.",
      ],
      actions: [
        { label: "Open Employee Voice", to: "/employee-voice", icon: "navigate", roles: ["admin"] },
      ],
      roles: ["admin"],
    },
  ],
};

export default voice;
