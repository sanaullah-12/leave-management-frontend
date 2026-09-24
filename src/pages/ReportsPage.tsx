import React, { useState, useEffect } from "react";
import { CARD } from "../lib/surfaces";
import SectionHeader from "../components/ui/SectionHeader";
import EmployeePicker from "../components/reports/EmployeePicker";
import { sectionIllustration } from "../components/ui/illustrations";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useThemeAccent } from "../hooks/useThemeAccent";
import { useQuery } from "@tanstack/react-query";
import { leavesAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import StepProgress, { type ProgressStep } from "../components/StepProgress";
import Avatar from "../components/Avatar";
import { CardHeading, Meta } from "../components/ui/CardPrimitives";
import LeaveBalanceRow from "../components/leaves/LeaveBalanceRow";
import {
  exportReportExcel,
  exportReportPdf,
  withInlinedImages,
} from "../components/reports/exporters";
import type { ReportModel } from "../components/reports/reportModel";
import {
  TableCellsIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  PlusCircleIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "../styles/design-system.css";
import useChartMotion from "../hooks/useChartMotion";

interface EmployeeReportData {
  employee: any;
  searchCriteria: {
    searchTerm: string;
    dateFrom: string;
    dateTo: string;
  };
  generatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Current leave policy (Total = 28). Used as the display fallback    */
/*  before the balance API resolves; real totals come from the API.   */
/* ------------------------------------------------------------------ */
const POLICY = { annual: 10, casual: 10, sick: 8 } as const;
const TOTAL_ALLOCATION = POLICY.annual + POLICY.casual + POLICY.sick; // 28

// Per-leave-type accent (hex for SVG rings/charts) + watermark icon.
const LEAVE_META = {
  annual: {
    label: "Annual Leave",
    hex: "#10b981",
    text: "text-emerald-500",
    icon: CalendarDaysIcon,
  },
  sick: {
    label: "Sick Leave",
    hex: "#f43f5e",
    text: "text-rose-500",
    icon: PlusCircleIcon,
  },
  casual: {
    label: "Casual Leave",
    hex: "#6366f1",
    text: "text-indigo-500",
    icon: Square2StackIcon,
  },
} as const;

type LeaveKey = keyof typeof LEAVE_META;



/* ------------------------------------------------------------------ */
/*  Relative-time helper for the activity timeline                     */
/* ------------------------------------------------------------------ */
const timeAgo = (input: string | Date): string => {
  const date = new Date(input);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/* ------------------------------------------------------------------ */
/*  Small reusable presentational pieces                               */
/*                                                                     */
/*  One card surface, one heading pattern, one size for a number. The  */
/*  report reads as a document rather than a gallery of card styles,   */
/*  and colour is spent only where it carries meaning - which here is  */
/*  the leave type, nothing else.                                      */
/* ------------------------------------------------------------------ */

// Dot colour per leave status for the timeline.
const STATUS_DOT: Record<string, string> = {
  approved: "#10b981",
  rejected: "#f43f5e",
  pending: "#f59e0b",
  cancelled: "#64748b",
};

// Purpose-built activity timeline driven by the employee's leave history.
const ActivityTimeline: React.FC<{
  history: any[];
  onViewAll: () => void;
}> = ({ history, onViewAll }) => {
  const events = [...history]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.startDate).getTime() -
        new Date(a.createdAt || a.startDate).getTime()
    )
    .slice(0, 6);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const titleFor = (l: any) => {
    const type = l.leaveType
      ? l.leaveType.charAt(0).toUpperCase() + l.leaveType.slice(1)
      : "Leave";
    switch (l.status) {
      case "approved":
        return `${type} Leave Approved`;
      case "rejected":
        return `${type} Leave Rejected`;
      case "pending":
        return `${type} Leave Requested`;
      default:
        return `${type} Leave`;
    }
  };

  const subtitleFor = (l: any) => {
    const days = l.totalDays || 1;
    if (l.startDate && l.endDate && l.startDate !== l.endDate)
      return `For period ${fmt(l.startDate)} - ${fmt(l.endDate)} (${days} days)`;
    if (l.startDate)
      return `${fmt(l.startDate)} · ${days} day${days > 1 ? "s" : ""}`;
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  return (
    <div className={`${CARD} p-6`}>
      <CardHeading
        title="Recent activity"
        sub="Latest leave requests and decisions"
        action={
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
          >
            View all requests <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        }
      />

      {events.length > 0 ? (
        <ol className="mt-5">
          {events.map((l, i) => {
            const dot = STATUS_DOT[l.status] || "rgb(var(--brand-500))";
            const last = i === events.length - 1;
            const ts = l.createdAt || l.updatedAt || l.startDate;
            return (
              <li key={l._id || i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className="mt-1.5 h-3 w-3 flex-shrink-0 rounded-full ring-4"
                    style={{
                      backgroundColor: dot,
                      // ring matches the card so the dot sits on the line cleanly
                      // eslint-disable-next-line
                      ["--tw-ring-color" as any]: "var(--card-surface)",
                    }}
                  />
                  {!last && (
                    <span className="my-1 w-px flex-1 bg-gray-200 dark:bg-white/10" />
                  )}
                </div>
                <div
                  className={`flex flex-1 items-start justify-between gap-4 ${
                    last ? "" : "pb-6"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {titleFor(l)}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {subtitleFor(l)}
                    </p>
                    {l.reason && (
                      <p
                        className="mt-1 truncate text-xs italic text-gray-400 dark:text-gray-500"
                        title={l.reason}
                      >
                        “{l.reason}”
                      </p>
                    )}
                  </div>
                  <span className="whitespace-nowrap text-xs font-medium text-gray-400 dark:text-gray-500">
                    {ts ? timeAgo(ts) : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-white/5">
            <CalendarDaysIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
            No recent activity
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave requests will appear here as they happen.
          </p>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const ReportsPage: React.FC = () => {
  /* Recharts animates by default, to its own timing. See useChartMotion. */
  const chartMotion = useChartMotion();
  const { user } = useAuth();
  const accent = useThemeAccent(600);
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<EmployeeReportData | null>(null);
  // Which export is running (if any) and how far along it is.
  const [exportKind, setExportKind] = useState<"pdf" | "excel" | null>(null);
  const [exportStep, setExportStep] = useState(0); // 1..n active, n+1 = complete
  const [exportError, setExportError] = useState<string | null>(null);

  const STEP_LABELS: Record<"pdf" | "excel", string[]> = {
    pdf: [
      "Composing the report document",
      "Rendering pages",
      "Building the PDF",
      "Saving your file",
    ],
    excel: ["Collecting report data", "Building worksheets", "Saving your file"],
  };
  const activeLabels = STEP_LABELS[exportKind ?? "pdf"];
  const exportSteps: ProgressStep[] = activeLabels.map((label, i) => {
    const stepNum = i + 1;
    return {
      label,
      status:
        exportStep > stepNum
          ? "done"
          : exportStep === stepNum
          ? "active"
          : "pending",
    };
  });
  const isExporting = exportKind !== null;
  // A short pause lets the overlay actually paint between steps.
  const yieldFrame = () => new Promise((r) => setTimeout(r, 220));

  /**
   * Restore the last chosen employee, if there was one.
   *
   * A missing or unreadable selection is not an error any more: it means
   * nobody has been picked yet, and the picker below is the answer. This used
   * to redirect to the employee list, which took the reader out of Reports
   * entirely and made another section the only way in.
   */
  useEffect(() => {
    const storedData = localStorage.getItem("selectedEmployeeReport");
    if (!storedData) return;
    try {
      setReportData(JSON.parse(storedData));
    } catch (error) {
      console.error("Failed to parse report data:", error);
      localStorage.removeItem("selectedEmployeeReport");
    }
  }, []);

  /** Build the report for one person, without leaving this page. */
  const handleSelectEmployee = (employee: any) => {
    const next: EmployeeReportData = {
      employee,
      searchCriteria: { searchTerm: "", dateFrom: "", dateTo: "" },
      generatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("selectedEmployeeReport", JSON.stringify(next));
    } catch {
      // A blocked localStorage costs the reader their selection on reload,
      // never the report they asked for now.
    }
    setReportData(next);
  };

  const employeeId = reportData?.employee?._id;

  const { data: leaveBalanceData } = useQuery({
    queryKey: ["employee-leave-balance-report", employeeId],
    queryFn: () => leavesAPI.getLeaveBalance(employeeId),
    enabled: !!employeeId,
  });

  const { data: historyData } = useQuery({
    queryKey: ["employee-leaves-report", employeeId],
    queryFn: () => leavesAPI.getLeaves(1, 50, "", employeeId),
    enabled: !!employeeId,
  });

  /** Back to the picker - which is on this page, not in another section. */
  const handleChooseAnother = () => {
    localStorage.removeItem("selectedEmployeeReport");
    setReportData(null);
  };

  if (!reportData) {
    return (
      <div className="space-y-6 stagger-children">
        <SectionHeader
          variant="reports"
          eyebrow="Insights"
          title="Employee Report"
          description="Pick someone below to see their leave analysis, then download it as a PDF or a workbook."
          illustration={sectionIllustration("reports")}
        />
        <EmployeePicker onSelect={handleSelectEmployee} />
      </div>
    );
  }

  /* ---------------- Derived view data ---------------- */
  const { employee, generatedAt } = reportData;
  const balance = leaveBalanceData?.data?.balance || {};
  const history: any[] = historyData?.data?.leaves || [];

  const departmentName =
    typeof employee.department === "object" && employee.department?.name
      ? employee.department.name
      : employee.department || "-";

  const generatedDate = new Date(generatedAt);
  const monthYear = generatedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const tenureYears = employee.joinDate
    ? (
        (Date.now() - new Date(employee.joinDate).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25)
      ).toFixed(1)
    : null;

  // Leave-type breakdown (allocated / used / remaining), policy-backed.
  const leaveKeys: LeaveKey[] = ["annual", "sick", "casual"];
  const leaveRows = leaveKeys.map((key) => {
    const allocated = balance[key]?.total ?? POLICY[key];
    const used = balance[key]?.used ?? 0;
    const remaining = balance[key]?.remaining ?? Math.max(0, allocated - used);
    return { key, allocated, used, remaining };
  });
  const totalRemaining = leaveRows.reduce((s, r) => s + r.remaining, 0);

  // Distribution donut - used days per type (only types with usage).
  const distribution = leaveRows
    .filter((r) => r.used > 0)
    .map((r) => ({
      name: LEAVE_META[r.key].label.split(" ")[0],
      value: r.used,
      hex: LEAVE_META[r.key].hex,
    }));

  // Monthly usage - trailing 6 months of approved leave days.
  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(
      generatedDate.getFullYear(),
      generatedDate.getMonth() - (5 - i),
      1
    );
    const days = history
      .filter((l) => {
        if (l.status !== "approved" || !l.startDate) return false;
        const sd = new Date(l.startDate);
        return (
          sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth()
        );
      })
      .reduce((sum, l) => sum + (l.totalDays || 1), 0);
    return { month: d.toLocaleString("en-US", { month: "short" }), days };
  });
  const hasMonthly = monthly.some((m) => m.days > 0);

  const statusActive = employee.status === "active";

  /* ---------------- Exports ---------------- */

  const shortDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "-";

  /**
   * One model, both exports. The PDF and the workbook are rendered from this
   * rather than from the live DOM, which is what keeps them consistent with
   * each other and with the page.
   */
  const buildModel = (): ReportModel => ({
    employee: {
      name: employee.name || "-",
      email: employee.email || "",
      employeeId: employee.employeeId || "",
      position: employee.position || "",
      department: departmentName,
      status: statusActive ? "Active" : employee.status || "Inactive",
      joinDate: shortDate(employee.joinDate),
      tenureYears,
    },
    period: monthYear,
    generatedAt: generatedDate.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    generatedBy: `${user?.name ?? "-"}${user?.email ? ` (${user.email})` : ""}`,
    balance: leaveRows.map((r) => ({
      label: LEAVE_META[r.key].label,
      hex: LEAVE_META[r.key].hex,
      allocated: r.allocated,
      used: r.used,
      remaining: r.remaining,
    })),
    monthly,
    history: [...history]
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.startDate || 0).getTime() -
          new Date(a.createdAt || a.startDate || 0).getTime()
      )
      .map((l) => ({
        type: String(l.leaveType || "leave").replace(/^\w/, (c: string) =>
          c.toUpperCase()
        ),
        from: shortDate(l.startDate),
        to: shortDate(l.endDate || l.startDate),
        days: l.totalDays || 0,
        status: l.status || "-",
        reason: l.reason || "-",
        appliedOn: shortDate(l.createdAt),
      })),
    totals: {
      allocated: leaveRows.reduce((s, r) => s + r.allocated, 0),
      used: leaveRows.reduce((s, r) => s + r.used, 0),
      remaining: totalRemaining,
    },
  });

  const runExport = async (
    kind: "pdf" | "excel",
    steps: number,
    job: (advance: (step: number) => Promise<void>) => Promise<void>
  ) => {
    setExportError(null);
    setExportKind(kind);
    setExportStep(1);
    await yieldFrame();

    const advance = async (step: number) => {
      setExportStep(step);
      await yieldFrame();
    };

    try {
      await job(advance);
      setExportStep(steps + 1);
      await new Promise((r) => setTimeout(r, 700));
    } catch (error) {
      console.error(`Failed to generate ${kind}:`, error);
      setExportError(
        `We couldn't build the ${
          kind === "pdf" ? "PDF" : "Excel file"
        }. Please try again.`
      );
    } finally {
      setExportKind(null);
      setExportStep(0);
    }
  };

  const handleDownloadPDF = () =>
    runExport("pdf", 4, async (advance) => {
      const model = await withInlinedImages(buildModel(), employee.profilePicture);
      await advance(2);
      await exportReportPdf(model, {
        onPage: (done, total) => setExportStep(done >= total ? 4 : 3),
      });
    });

  const handleDownloadExcel = () =>
    runExport("excel", 3, async (advance) => {
      const model = buildModel();
      await advance(2);
      await exportReportExcel(model);
      await advance(3);
    });

  return (
    <div className="space-y-6 stagger-children">
      {/* Export progress overlay - shared by both download paths */}
      {isExporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--overlay-scrim)] p-4 backdrop-blur-sm">
          <div className="animate-pop-in">
            <StepProgress
              title={
                exportStep > activeLabels.length
                  ? exportKind === "excel"
                    ? "Workbook ready"
                    : "Report ready"
                  : exportKind === "excel"
                  ? "Building your workbook..."
                  : "Generating your report..."
              }
              steps={exportSteps}
              progress={(exportStep / activeLabels.length) * 100}
              eta={
                exportStep > activeLabels.length
                  ? "Completed"
                  : "This usually takes a few seconds"
              }
            />
          </div>
        </div>
      )}

      {exportError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <span>{exportError}</span>
          <button
            onClick={() => setExportError(null)}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ---------------- Banner + actions (screen only) ----------------
          The PDF and workbook are built from `buildModel()`, not from this
          markup, so nothing here can leak into an export. */}
      <SectionHeader
        variant="reports"
        eyebrow={
          <button
            type="button"
            onClick={handleChooseAnother}
            className="inline-flex items-center gap-1.5 uppercase tracking-[0.14em] transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Choose another employee
          </button>
        }
        title="Employee Report"
        description={`Leave balance, usage and history for ${
          employee?.name || "this employee"
        }.`}
        illustration={sectionIllustration("reports")}
        action={
          <>
            <button
              onClick={handleDownloadExcel}
              disabled={isExporting}
              className="sh-action"
            >
              {exportKind === "excel" ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Building...</span>
                </>
              ) : (
                <>
                  <TableCellsIcon className="h-4 w-4" />
                  Download Excel
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="sh-action-primary"
            >
              {exportKind === "pdf" ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </button>
          </>
        }
      />

      {/* ---------------- Report content (on-screen view) ----------------
          Read top to bottom: who this is, what they have left, how they have
          used it, what happened recently. Each fact is stated once - the old
          layout repeated status, department and tenure across a hero, a
          profile card and a field grid, which is what made the page feel
          crowded without adding anything. */}
      <div className="space-y-5">
        {/* ---- Who ---- */}
        <div className={`${CARD} p-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={employee.profilePicture}
                name={employee.name}
                size="xl"
              />
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {employee.name}
                </h2>
                <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                  {[employee.position, departmentName]
                    .filter((part) => part && part !== "-")
                    .join(" · ") || "Employee"}
                </p>
                <span
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    statusActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                      : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      statusActive ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {statusActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/employees/${employee._id}`)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            >
              View full profile
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* The facts a reader checks a report against, once each. */}
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-gray-100 pt-5 dark:border-white/5 sm:grid-cols-3 lg:grid-cols-5">
            <Meta label="Employee ID" value={employee.employeeId || "-"} />
            <Meta label="Email" value={employee.email || "-"} />
            <Meta
              label="Joined"
              value={
                employee.joinDate
                  ? new Date(employee.joinDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "-"
              }
            />
            <Meta
              label="Tenure"
              value={tenureYears ? `${tenureYears} years` : "-"}
            />
            <Meta label="Report period" value={monthYear} />
          </div>
        </div>

        {/* ---- What is left ---- */}
        <div className={`${CARD} p-6`}>
          {/* The allocation is stated once, by the headline below. Repeating
              it in the subtitle and again in every row is how one number
              becomes four sentences. */}
          <CardHeading title="Leave balance" sub="Days remaining, by type" />

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:gap-8">
            {/* The one number this card exists to give. */}
            <div className="flex shrink-0 items-baseline gap-3 lg:w-44 lg:flex-col lg:items-start lg:gap-1 lg:border-r lg:border-gray-100 lg:pr-8 lg:dark:border-white/5">
              <span className="text-4xl font-bold leading-none tabular-nums text-gray-900 dark:text-white">
                {totalRemaining}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                days left of {TOTAL_ALLOCATION}
              </span>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
              {leaveRows.map((row) => (
                <LeaveBalanceRow
                  key={row.key}
                  label={LEAVE_META[row.key].label}
                  color={LEAVE_META[row.key].hex}
                  allocated={row.allocated}
                  used={row.used}
                  remaining={row.remaining}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ---- How it was used ---- */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className={`${CARD} p-6`}>
            <CardHeading
              title="Monthly usage"
              sub="Approved leave days over the last 6 months"
            />
            <div className="mt-5 h-48">
              {hasMonthly ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthly}
                    margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148,163,184,0.12)" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                      formatter={(v: any) => [`${v} days`, "Leave"]}
                    />
                    <Bar
                      {...chartMotion}
                      dataKey="days"
                      fill={accent}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={34}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                  No approved leave in the last 6 months
                </div>
              )}
            </div>
          </div>

          <div className={`${CARD} p-6`}>
            <CardHeading
              title="Leave distribution"
              sub="Days taken, by leave type"
            />
            <div className="mt-5 h-48">
              {distribution.length > 0 ? (
                <div className="flex h-full flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
                  <div className="h-36 w-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          {...chartMotion}
                          data={distribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={64}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {distribution.map((d, i) => (
                            <Cell key={i} fill={d.hex} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                            fontSize: 12,
                          }}
                          formatter={(v: any, n: any) => [`${v} days`, n]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Named in the legend as well as coloured: the split must
                      survive a greyscale print and a colourblind reader. */}
                  <ul className="space-y-2">
                    {distribution.map((d) => (
                      <li
                        key={d.name}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: d.hex }}
                        />
                        {d.name}
                        <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                          {d.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                  No leave taken yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent activity timeline */}
        <ActivityTimeline history={history} onViewAll={() => navigate("/leaves")} />

        {/* Footer */}
        {/* Provenance, not a section: a card around one muted line gave the
            least important sentence on the page the same weight as the data. */}
        <p className="px-1 pb-2 text-center text-xs text-gray-400 dark:text-gray-500">
          Generated {generatedDate.toLocaleDateString()} at{" "}
          {generatedDate.toLocaleTimeString()} by {user?.name} ({user?.email})
        </p>
      </div>
    </div>
  );
};

export default ReportsPage;
