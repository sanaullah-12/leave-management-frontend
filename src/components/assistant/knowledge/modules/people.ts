/**
 * Knowledge pack - People (Employees, My Team, Departments).
 */
import type { KnowledgeModule } from "../../types";

const people: KnowledgeModule = {
  id: "people",
  name: "Team",
  icon: "navigate",
  primaryRoute: "/employees",
  routes: ["/employees", "/team", "/departments"],
  summary:
    "The Team area is your people directory - employee profiles, admins, department structure and the invitations that bring new joiners into Nexora.",
  quickActions: [
    { label: "Employees", to: "/employees", icon: "navigate", roles: ["admin"] },
    { label: "My team", to: "/team", icon: "navigate" },
    { label: "Departments", to: "/departments", icon: "navigate", roles: ["admin"] },
  ],
  entries: [
    {
      id: "people.add-employee",
      module: "people",
      question: "How do I add an employee?",
      aliases: [
        "how do I invite someone",
        "add a new joiner",
        "create an employee account",
        "onboard an employee",
      ],
      keywords: [
        "add",
        "employee",
        "invite",
        "new",
        "joiner",
        "hire",
        "onboard",
        "create",
        "user",
      ],
      answer:
        "Employees join by invitation - you send one from the Employees page and they set their own password.",
      steps: [
        "Open Team → Employees.",
        "Click Invite Employee in the top-right.",
        "Fill in their name, work email, department and position.",
        "Send the invitation - they receive an email with a secure link.",
        "Once they accept and set a password, they appear in the Employees list as active.",
      ],
      tips: [
        "Use Invite Admin instead when the person needs to manage leave, payroll or people.",
      ],
      actions: [
        { label: "Open Employees", to: "/employees", icon: "create", roles: ["admin"] },
        { label: "Departments", to: "/departments", icon: "navigate", roles: ["admin"] },
      ],
      related: ["people.add-admin", "people.departments", "people.employee-profile"],
      roles: ["admin"],
      featured: true,
      weight: 3,
    },
    {
      id: "people.add-admin",
      module: "people",
      question: "How do I add an admin?",
      aliases: ["invite an administrator", "give someone admin access"],
      keywords: ["admin", "administrator", "permission", "role", "access", "hr"],
      answer:
        "Admins are invited from the same page as employees, using the Invite Admin action.",
      steps: [
        "Open Team → Employees.",
        "Click Invite Admin.",
        "Enter their name and work email.",
        "Send the invitation. After they accept, they appear under the Admins tab with full HR access.",
      ],
      actions: [
        { label: "Open Employees", to: "/employees", icon: "create", roles: ["admin"] },
      ],
      related: ["people.add-employee"],
      roles: ["admin"],
    },
    {
      id: "people.employee-profile",
      module: "people",
      question: "How do I view an employee's details?",
      aliases: ["open an employee profile", "see someone's leave history"],
      keywords: ["profile", "detail", "employee", "view", "record", "history"],
      answer:
        "Every employee has a detail page with their profile, leave history and attendance.",
      steps: [
        "Open Team → Employees.",
        "Search or filter to find the person.",
        "Click their row to open the full profile.",
        "From there you can edit their details or generate their leave report.",
      ],
      actions: [
        { label: "Open Employees", to: "/employees", icon: "navigate", roles: ["admin"] },
      ],
      related: ["reports.employee-report", "people.add-employee"],
      roles: ["admin"],
    },
    {
      id: "people.departments",
      module: "people",
      question: "How do I manage departments?",
      aliases: ["create a department", "add a team", "organisation structure"],
      keywords: ["department", "team", "structure", "division", "group"],
      answer:
        "Departments group people for reporting, approvals and payroll. They are managed on their own page.",
      steps: [
        "Open Team → Departments.",
        "Use the add action to create a department and name its head.",
        "Assign people to it from each employee's profile.",
      ],
      actions: [
        { label: "Open Departments", to: "/departments", icon: "navigate", roles: ["admin"] },
      ],
      related: ["people.add-employee"],
      roles: ["admin"],
    },
    {
      id: "people.my-team",
      module: "people",
      question: "Where do I see my team?",
      aliases: ["who is in my team", "my colleagues"],
      keywords: ["team", "colleagues", "members", "department", "mine"],
      answer:
        "My Team lists the people you work with, with their status and current availability.",
      steps: [
        "Open Team → My Team.",
        "Each card shows the person's role, department and whether they are currently on leave.",
      ],
      actions: [{ label: "Open My Team", to: "/team", icon: "navigate" }],
      related: ["leave.calendar"],
    },
  ],
};

export default people;
