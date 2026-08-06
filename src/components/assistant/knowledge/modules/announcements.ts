/**
 * Knowledge pack - Announcements.
 */
import type { KnowledgeModule } from "../../types";

const announcements: KnowledgeModule = {
  id: "announcements",
  name: "Announcements",
  icon: "megaphone",
  primaryRoute: "/announcements",
  routes: ["/announcements"],
  summary:
    "Announcements is the company noticeboard - HR posts news, events and policy updates here, pinned items stay at the top, and the newest ones also surface on the Dashboard.",
  quickActions: [
    { label: "Open Announcements", to: "/announcements", icon: "megaphone" },
  ],
  entries: [
    {
      id: "announcements.create",
      module: "announcements",
      question: "How do I create an announcement?",
      aliases: [
        "post company news",
        "how do I publish a notice",
        "send an announcement to everyone",
      ],
      keywords: [
        "announcement",
        "create",
        "post",
        "publish",
        "notice",
        "news",
        "broadcast",
      ],
      answer:
        "Announcements are written from the Announcements page - one modal, then it is live for everyone.",
      steps: [
        "Open Home → Announcements.",
        "Click New Announcement in the top-right.",
        "Write the title and body, and pick a category so it is easy to scan.",
        "Pin it if it should stay at the top of everyone's list.",
        "Publish. It appears for all employees and on their Dashboard.",
      ],
      tips: [
        "Only admins see the New Announcement button - everyone else sees a read-only board.",
      ],
      actions: [
        { label: "Open Announcements", to: "/announcements", icon: "create", roles: ["admin"] },
      ],
      related: ["announcements.edit", "announcements.read"],
      roles: ["admin"],
      featured: true,
      weight: 3,
    },
    {
      id: "announcements.edit",
      module: "announcements",
      question: "How do I edit or delete an announcement?",
      aliases: ["remove a notice", "update an announcement", "unpin"],
      keywords: ["edit", "delete", "remove", "update", "pin", "unpin", "change"],
      answer:
        "Each announcement card has a menu with edit, pin and delete.",
      steps: [
        "Open Home → Announcements.",
        "Use the menu on the announcement's card.",
        "Choose Edit to reopen the form, Pin to move it to the top, or Delete to remove it.",
      ],
      actions: [
        { label: "Open Announcements", to: "/announcements", icon: "navigate", roles: ["admin"] },
      ],
      roles: ["admin"],
    },
    {
      id: "announcements.read",
      module: "announcements",
      question: "Where do I read company announcements?",
      aliases: ["company news", "see notices"],
      keywords: ["read", "see", "view", "news", "notice", "updates", "board"],
      answer:
        "The Announcements page carries everything HR has published; the latest also appear on your Dashboard.",
      steps: [
        "Open Home → Announcements.",
        "Pinned notices sit at the top, the rest are newest first.",
        "Unread ones are marked so you can spot what is new at a glance.",
      ],
      actions: [
        { label: "Open Announcements", to: "/announcements", icon: "navigate" },
      ],
      related: ["general.dashboard"],
    },
  ],
};

export default announcements;
