import React, { useState, useEffect } from "react";
import { CARD, CARD_HOVER } from "../lib/surfaces";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { leavesAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import LogoLoader from "../components/LogoLoader";
import StepProgress, { type ProgressStep } from "../components/StepProgress";
import Avatar from "../components/Avatar";
import {
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  CheckBadgeIcon,
  ClockIcon,
  IdentificationIcon,
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
/* ------------------------------------------------------------------ */

// Info pill used in the hero (status / balance / department / tenure).
const HeroPill: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, children }) => (
  <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200/70 dark:bg-white/5 dark:text-gray-200 dark:ring-white/10">
    <span className="text-blue-500 dark:text-blue-400">{icon}</span>
    {children}
  </span>
);

// Compact metadata card (Employee ID / Joining Date / Generated).
const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className={`group ${CARD} ${CARD_HOVER} flex h-full flex-col p-5`}>
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:-rotate-3 dark:bg-blue-500/10 dark:text-blue-400">
      {icon}
    </span>
    {/* Label + value pinned to the bottom so they align across the row even
        when one card's value wraps to a second line. */}
    <p className="mt-auto pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {label}
    </p>
    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
      {value}
    </p>
  </div>
);

// Field row in the profile card (label + value).
const ProfileField: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 truncate font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  </div>
);

// Hollow circular progress ring (arc only) in the leave-type colour.
const ProgressRing: React.FC<{ percent: number; color: string }> = ({
  percent,
  color,
}) => {
  const p = Math.max(0, Math.min(100, percent));
  const ARC =
    "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";
  return (
    <div className="relative h-16 w-16 flex-shrink-0">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
        <path
          className="stroke-gray-200 dark:stroke-white/10"
          d={ARC}
          fill="none"
          strokeWidth="4"
        />
        <path
          d={ARC}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${p}, 100`}
          style={{
            transition: "stroke-dasharray 0.7s ease",
            filter: `drop-shadow(0 0 4px ${color}66)`,
          }}
        />
      </svg>
    </div>
  );
};

// One of the three leave-summary cards — glowing colour border, watermark
// icon, hollow accent ring + percent label, and the big remaining count.
const LeaveSummaryCard: React.FC<{
  leaveKey: LeaveKey;
  allocated: number;
  remaining: number;
}> = ({ leaveKey, allocated, remaining }) => {
  const meta = LEAVE_META[leaveKey];
  const Icon = meta.icon;
  const percent = allocated > 0 ? Math.round((remaining / allocated) * 100) : 0;
  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-[var(--card-surface)] p-6 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1"
      style={{
        border: `1px solid ${meta.hex}55`,
        boxShadow: `inset 0 1px 0 ${meta.hex}22, 0 0 0 1px ${meta.hex}1f, 0 14px 34px -14px ${meta.hex}66`,
      }}
    >
      {/* Soft colour glow from the top + faint watermark icon */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: `linear-gradient(to bottom, ${meta.hex}14, transparent)` }}
      />
      <Icon
        className="pointer-events-none absolute -bottom-5 -right-4 h-28 w-28"
        style={{ color: meta.hex, opacity: 0.1 }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            {meta.label}
          </h4>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Allocated: {allocated} Days
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: meta.hex }}
          >
            {percent}%
          </span>
          <ProgressRing percent={percent} color={meta.hex} />
        </div>
      </div>

      <div className="relative mt-5">
        <span
          className="text-5xl font-extrabold leading-none tabular-nums"
          style={{ color: meta.hex }}
        >
          {remaining}
        </span>
        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          Remaining Days
        </p>
      </div>
    </div>
  );
};

// Section heading with the accent bar (matches the reference).
const SectionHeading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex items-center gap-3">
    <span className="h-6 w-1.5 rounded-full bg-blue-500" />
    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
      {children}
    </h3>
  </div>
);

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
      return `For period ${fmt(l.startDate)} – ${fmt(l.endDate)} (${days} days)`;
    if (l.startDate)
      return `${fmt(l.startDate)} · ${days} day${days > 1 ? "s" : ""}`;
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  return (
    <div className={`${CARD} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Recent Activity Timeline
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Latest leave requests and approvals
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
        >
          View All Requests <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {events.length > 0 ? (
        <ol className="mt-5">
          {events.map((l, i) => {
            const dot = STATUS_DOT[l.status] || "#3b82f6";
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
          <div className="mb-3 rounded-full bg-slate-100 p-3 dark:bg-white/5">
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<EmployeeReportData | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfStep, setPdfStep] = useState(0); // 1..4 active, 5 = complete

  const PDF_STEP_LABELS = [
    "Preparing report layout",
    "Rendering content",
    "Building PDF pages",
    "Saving your file",
  ];
  const pdfSteps: ProgressStep[] = PDF_STEP_LABELS.map((label, i) => {
    const stepNum = i + 1;
    return {
      label,
      status:
        pdfStep > stepNum ? "done" : pdfStep === stepNum ? "active" : "pending",
    };
  });
  const yieldFrame = () => new Promise((r) => setTimeout(r, 350));

  useEffect(() => {
    const storedData = localStorage.getItem("selectedEmployeeReport");
    if (storedData) {
      try {
        setReportData(JSON.parse(storedData));
      } catch (error) {
        console.error("Failed to parse report data:", error);
        navigate("/employees");
      }
    } else {
      navigate("/employees");
    }
  }, [navigate]);

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

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfStep(1);
    await yieldFrame();

    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      const element = document.getElementById("report-content");
      if (!element) throw new Error("Report content not found");

      setPdfStep(2);
      await yieldFrame();

      // Render a CLONE (never the live DOM) at a fixed desktop width in light
      // theme, so the PDF layout is always the full multi-column desktop design
      // with correct colours — regardless of the user's screen size or theme.
      const PDF_WIDTH = 1024;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#eef1f7",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1120, // >1024 so Tailwind's lg: breakpoints apply
        onclone: (doc) => {
          // Force light theme for consistent, print-friendly colours.
          doc.documentElement.classList.remove("dark");
          const el = doc.getElementById("report-content") as HTMLElement | null;
          if (el) {
            el.style.width = `${PDF_WIDTH}px`;
            el.style.maxWidth = "none";
            el.style.margin = "0 auto";
            el.style.padding = "28px";
            el.style.background = "#eef1f7";
            el.style.borderRadius = "0";
          }
        },
      });

      setPdfStep(3);
      await yieldFrame();

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width (mm)
      const pageHeight = 295; // slightly < 297 to overlap page seams
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `employee-report-${reportData?.employee?.name?.replace(
        /\s+/g,
        "-"
      )}-${new Date().toISOString().split("T")[0]}.pdf`;

      setPdfStep(4);
      await yieldFrame();
      pdf.save(fileName);

      setPdfStep(5);
      await new Promise((r) => setTimeout(r, 700));
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
      setPdfStep(0);
    }
  };

  const handleBackToEmployees = () => {
    localStorage.removeItem("selectedEmployeeReport");
    navigate("/employees");
  };

  if (!reportData) {
    return <LogoLoader label="Building your reports…" />;
  }

  /* ---------------- Derived view data ---------------- */
  const { employee, generatedAt } = reportData;
  const balance = leaveBalanceData?.data?.balance || {};
  const history: any[] = historyData?.data?.leaves || [];

  const departmentName =
    typeof employee.department === "object" && employee.department?.name
      ? employee.department.name
      : employee.department || "—";

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

  // Distribution donut — used days per type (only types with usage).
  const distribution = leaveRows
    .filter((r) => r.used > 0)
    .map((r) => ({
      name: LEAVE_META[r.key].label.split(" ")[0],
      value: r.used,
      hex: LEAVE_META[r.key].hex,
    }));

  // Monthly usage — trailing 6 months of approved leave days.
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

  return (
    <div className="space-y-6 fade-in">
      {/* PDF export progress overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="animate-pop-in">
            <StepProgress
              title={pdfStep >= 5 ? "Report ready 🎉" : "Generating your report…"}
              steps={pdfSteps}
              progress={(pdfStep / PDF_STEP_LABELS.length) * 100}
              eta={pdfStep >= 5 ? "Completed" : "This usually takes a few seconds"}
            />
          </div>
        </div>
      )}

      {/* ---------------- Action bar (excluded from PDF) ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToEmployees}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Employees
          </button>
          <span className="hidden h-5 w-px bg-gray-200 dark:bg-white/10 sm:block" />
          <h1 className="text-base font-semibold text-blue-600 dark:text-blue-400">
            Employee Report
          </h1>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70"
        >
          {isGeneratingPDF ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Generating…</span>
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* ---------------- Report content (captured for PDF) ---------------- */}
      <div id="report-content" className="space-y-6">
        {/* Hero */}
        <div className={`${CARD} p-6 sm:p-7`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/25">
                <DocumentChartBarIcon className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-[1.75rem]">
                  Employee Leave Report
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Comprehensive Leave Analysis for{" "}
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {monthYear}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <HeroPill
                icon={
                  <span
                    className={`h-2 w-2 rounded-full ${
                      statusActive ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                }
              >
                Status:{" "}
                <span className="font-semibold">
                  {statusActive ? "Active" : "Inactive"}
                </span>
              </HeroPill>
              <HeroPill icon={<CalendarDaysIcon className="h-4 w-4" />}>
                Balance: {totalRemaining} Days
              </HeroPill>
              <HeroPill icon={<BuildingOffice2Icon className="h-4 w-4" />}>
                {departmentName}
              </HeroPill>
              {tenureYears && (
                <HeroPill icon={<ClockIcon className="h-4 w-4" />}>
                  {tenureYears} Years
                </HeroPill>
              )}
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className={`${CARD} p-6 sm:p-7`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <Avatar
                src={employee.profilePicture}
                name={employee.name}
                size="2xl"
                className="ring-4 ring-blue-500/20"
              />
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {employee.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {employee.position || "—"} • {departmentName}
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    statusActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                      : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                  }`}
                >
                  <CheckBadgeIcon className="h-3.5 w-3.5" />
                  {statusActive ? "Active Employee" : "Inactive"}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/employees/${employee._id}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
            >
              View Full Profile
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Two-column field grid */}
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-gray-100 pt-6 dark:border-white/5 md:grid-cols-2">
            <ProfileField
              icon={<EnvelopeIcon className="h-4 w-4" />}
              label="Email"
              value={employee.email || "—"}
            />
            <ProfileField
              icon={<BriefcaseIcon className="h-4 w-4" />}
              label="Position"
              value={employee.position || "—"}
            />
            <ProfileField
              icon={<BuildingOffice2Icon className="h-4 w-4" />}
              label="Department"
              value={departmentName}
            />
            <ProfileField
              icon={<CheckBadgeIcon className="h-4 w-4" />}
              label="Status"
              value={statusActive ? "Active" : "Inactive"}
            />
            <ProfileField
              icon={<ClockIcon className="h-4 w-4" />}
              label="Tenure"
              value={tenureYears ? `${tenureYears} Years` : "—"}
            />
          </div>
        </div>

        {/* Three metadata cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <InfoCard
            icon={<IdentificationIcon className="h-5 w-5" />}
            label="Employee ID"
            value={employee.employeeId || "—"}
          />
          <InfoCard
            icon={<CalendarDaysIcon className="h-5 w-5" />}
            label="Joining Date"
            value={
              employee.joinDate
                ? new Date(employee.joinDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—"
            }
          />
          <InfoCard
            icon={<ClockIcon className="h-5 w-5" />}
            label="Report Generated"
            value={generatedDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          />
        </div>

        {/* Leave summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeading>Leave Summary</SectionHeading>
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200/70 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
              Total Allocation: {TOTAL_ALLOCATION} Days
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {leaveRows.map((r) => (
              <LeaveSummaryCard
                key={r.key}
                leaveKey={r.key}
                allocated={r.allocated}
                remaining={r.remaining}
              />
            ))}
          </div>
        </div>

        {/* Analytics */}
        <div className="space-y-4">
          <SectionHeading>Employee Leave Analytics</SectionHeading>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Monthly usage */}
            <div className={`${CARD} ${CARD_HOVER} p-6`}>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Monthly Usage
              </h4>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Approved leave days · last 6 months
              </p>
              <div className="mt-4 h-44">
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
                        dataKey="days"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={34}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                    No approved leaves in the last 6 months
                  </div>
                )}
              </div>
            </div>

            {/* Distribution */}
            <div className={`${CARD} ${CARD_HOVER} p-6`}>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Leave Distribution
              </h4>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Days used by leave type
              </p>
              <div className="mt-4 flex h-44 items-center justify-center gap-6">
                {distribution.length > 0 ? (
                  <>
                    <div className="h-40 w-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={70}
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
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {d.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    No leave usage recorded yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity timeline */}
        <ActivityTimeline history={history} onViewAll={() => navigate("/leaves")} />

        {/* Footer */}
        <div className={`${CARD} p-5 text-center`}>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Report generated on {generatedDate.toLocaleDateString()} at{" "}
            {generatedDate.toLocaleTimeString()} · by {user?.name} ({user?.email})
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
