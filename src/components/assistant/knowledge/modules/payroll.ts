/**
 * Knowledge pack - Payroll.
 *
 * The payroll module is admin-only and code-split (see App.tsx), so every
 * entry here is scoped to `admin`. Employees asking about payslips are served
 * by the account pack instead.
 */
import type { KnowledgeModule } from "../../types";

const payroll: KnowledgeModule = {
  id: "payroll",
  name: "Payroll",
  icon: "money",
  primaryRoute: "/payroll",
  routes: ["/payroll"],
  roles: ["admin"],
  summary:
    "Payroll is where salary structures are defined, monthly runs are processed, and payslips are generated and archived - with a dashboard summarising cost, headcount and the last run.",
  quickActions: [
    { label: "Payroll dashboard", to: "/payroll", icon: "money", roles: ["admin"] },
    { label: "Run payroll", to: "/payroll/run", icon: "create", roles: ["admin"] },
    { label: "Payslips", to: "/payroll/payslips", icon: "document", roles: ["admin"] },
  ],
  entries: [
    {
      id: "payroll.where",
      module: "payroll",
      question: "Where is Payroll?",
      aliases: ["how do I open payroll", "find payroll", "payroll page"],
      keywords: ["payroll", "salary", "pay", "where", "find", "open"],
      answer:
        "Payroll has its own area in the sidebar rail, with six pages inside it.",
      steps: [
        "Click the Payroll icon (the banknote) in the left rail.",
        "The panel lists: Dashboard, Employee Salaries, Run Payroll, Payslips, History and Settings.",
        "Dashboard is the overview; the rest are the working pages.",
      ],
      tips: ["Payroll is admin-only - employees do not see the area at all."],
      actions: [
        { label: "Open Payroll", to: "/payroll", icon: "money", roles: ["admin"] },
      ],
      related: ["payroll.run", "payroll.salary", "payroll.payslip"],
      roles: ["admin"],
      featured: true,
      weight: 3,
    },
    {
      id: "payroll.salary",
      module: "payroll",
      question: "How do I set an employee's salary?",
      aliases: [
        "add a salary structure",
        "change someone's pay",
        "configure allowances",
      ],
      keywords: [
        "salary",
        "structure",
        "basic",
        "allowance",
        "deduction",
        "ctc",
        "pay",
        "set",
      ],
      answer:
        "Employee Salaries holds one salary structure per person - basic pay plus the allowances and deductions that build their monthly total.",
      steps: [
        "Open Payroll → Employee Salaries.",
        "Find the employee and open their salary structure.",
        "Set the basic pay, then add allowances (housing, transport, and so on) and deductions.",
        "Save. The structure is what every future payroll run reads from.",
      ],
      tips: [
        "Components and how they are calculated are configured in Payroll → Settings.",
      ],
      actions: [
        { label: "Open Employee Salaries", to: "/payroll/salaries", icon: "money", roles: ["admin"] },
        { label: "Payroll settings", to: "/payroll/settings", icon: "settings", roles: ["admin"] },
      ],
      related: ["payroll.run", "payroll.settings"],
      roles: ["admin"],
      featured: true,
    },
    {
      id: "payroll.run",
      module: "payroll",
      question: "How do I run payroll for the month?",
      aliases: ["process payroll", "generate this month's pay", "close payroll"],
      keywords: ["run", "process", "monthly", "generate", "execute", "period"],
      answer:
        "Run Payroll walks a month from selection to generated payslips in one pass.",
      steps: [
        "Open Payroll → Run Payroll.",
        "Select the month and year you are processing.",
        "Review the calculated list - each employee's gross, deductions and net.",
        "Fix anything that looks wrong in Employee Salaries, then come back.",
        "Confirm the run. Payslips are generated and the run is written to History.",
      ],
      tips: [
        "Anyone without a salary structure is skipped - set theirs up first in Employee Salaries.",
      ],
      actions: [
        { label: "Run payroll", to: "/payroll/run", icon: "create", roles: ["admin"] },
        { label: "Payroll history", to: "/payroll/history", icon: "chart", roles: ["admin"] },
      ],
      related: ["payroll.salary", "payroll.payslip", "payroll.history"],
      roles: ["admin"],
      featured: true,
      weight: 2,
    },
    {
      id: "payroll.payslip",
      module: "payroll",
      question: "How do I generate or download a payslip?",
      aliases: ["print payslip", "send payslips", "export payslip pdf"],
      keywords: ["payslip", "slip", "pdf", "download", "print", "export"],
      answer:
        "Payslips are produced by a payroll run and can be previewed or exported to PDF from the Payslips page.",
      steps: [
        "Open Payroll → Payslips.",
        "Filter by month and, if you need one person, by employee.",
        "Click a payslip to preview it in the branded template.",
        "Use Download to export it as a PDF.",
      ],
      actions: [
        { label: "Open Payslips", to: "/payroll/payslips", icon: "document", roles: ["admin"] },
      ],
      related: ["payroll.run", "payroll.history"],
      roles: ["admin"],
    },
    {
      id: "payroll.history",
      module: "payroll",
      question: "Where can I see past payroll runs?",
      aliases: ["payroll history", "previous months payroll"],
      keywords: ["history", "past", "previous", "archive", "audit", "record"],
      answer:
        "Payroll History is the archive of every completed run, with its totals and headcount.",
      steps: [
        "Open Payroll → History.",
        "Each row is one month's run - total cost, employees paid and when it was processed.",
        "Open a run to see the per-employee breakdown behind those totals.",
      ],
      actions: [
        { label: "Open History", to: "/payroll/history", icon: "chart", roles: ["admin"] },
      ],
      roles: ["admin"],
    },
    {
      id: "payroll.settings",
      module: "payroll",
      question: "How do I configure payroll settings?",
      aliases: ["set currency", "add a salary component", "tax settings"],
      keywords: ["settings", "currency", "component", "tax", "configure", "rules"],
      answer:
        "Payroll Settings defines the currency, pay period and the salary components every structure can draw on.",
      steps: [
        "Open Payroll → Settings.",
        "Set the currency and pay cycle for the organisation.",
        "Add or edit salary components - allowances and deductions - and how each is computed.",
        "Save. Existing structures pick up the new components immediately.",
      ],
      actions: [
        { label: "Open Payroll settings", to: "/payroll/settings", icon: "settings", roles: ["admin"] },
      ],
      related: ["payroll.salary"],
      roles: ["admin"],
    },
  ],
};

export default payroll;
