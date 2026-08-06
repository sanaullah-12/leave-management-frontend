/**
 * Knowledge pack - Reports.
 */
import type { KnowledgeModule } from "../../types";

const reports: KnowledgeModule = {
  id: "reports",
  name: "Reports",
  icon: "chart",
  primaryRoute: "/reports",
  routes: ["/reports"],
  roles: ["admin"],
  summary:
    "Reports turns leave data into a shareable document - per-employee leave analysis with balances, a monthly trend and a full request timeline, exportable as a branded PDF.",
  quickActions: [
    { label: "Open Reports", to: "/reports", icon: "chart", roles: ["admin"] },
  ],
  entries: [
    {
      id: "reports.generate",
      module: "reports",
      question: "How do I generate a report?",
      aliases: [
        "create a leave report",
        "export employee data",
        "how do I get a pdf report",
      ],
      keywords: [
        "report",
        "generate",
        "export",
        "pdf",
        "download",
        "analysis",
        "print",
      ],
      answer:
        "Reports are generated per employee and downloaded as a PDF.",
      steps: [
        "Open Home → Reports, or start from Team → Employees and use Generate Report on someone's row.",
        "Review the report on screen - leave balances, monthly usage and the request timeline.",
        "Click Download PDF in the action bar.",
        "A progress panel runs while the PDF is built, then the file saves to your device.",
      ],
      tips: [
        "The action bar itself is excluded from the export, so the PDF stays clean.",
      ],
      actions: [
        { label: "Open Reports", to: "/reports", icon: "chart", roles: ["admin"] },
        { label: "Open Employees", to: "/employees", icon: "navigate", roles: ["admin"] },
      ],
      related: ["reports.employee-report", "payroll.history"],
      roles: ["admin"],
      featured: true,
      weight: 3,
    },
    {
      id: "reports.employee-report",
      module: "reports",
      question: "What is in an employee leave report?",
      aliases: ["what does the report contain"],
      keywords: ["report", "contains", "contents", "leave", "employee", "analysis"],
      answer:
        "It is a single-employee leave analysis, laid out for sharing or filing.",
      steps: [
        "A header with the employee's identity, joining date and status.",
        "Leave balances broken down by type, with used versus remaining.",
        "A month-by-month chart of approved leave days across the year.",
        "A timeline of recent requests with their outcomes.",
      ],
      actions: [
        { label: "Open Reports", to: "/reports", icon: "chart", roles: ["admin"] },
      ],
      related: ["reports.generate", "people.employee-profile"],
      roles: ["admin"],
    },
  ],
};

export default reports;
