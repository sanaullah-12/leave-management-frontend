import React, { useState } from "react";
import SectionHeader from "../components/ui/SectionHeader";
import { CardHeading, Meta } from "../components/ui/CardPrimitives";
import LeaveBalanceRow from "../components/leaves/LeaveBalanceRow";
import { sectionIllustration } from "../components/ui/illustrations";
import { CARD } from "../lib/surfaces";
import { accentFor } from "../lib/themeTokens";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI, leavesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import LogoLoader from "../components/LogoLoader";
import Avatar from "../components/Avatar";
import EmployeeLeaveActivity from "../components/EmployeeLeaveActivity";
import LateHoursCard from "../components/attendance/LateHoursCard";
import MobileEmployeeDetail from "../components/employees/mobile/MobileEmployeeDetail";
import useMediaQuery from "../hooks/useMediaQuery";
import { useLateHours } from "../hooks/useLateHours";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusCircleIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "../styles/design-system.css";

interface LeaveAllocation {
  casual: number;
  sick: number;
  annual: number;
}



// Per-leave-type accent + watermark icon (same language as the report page).
const LEAVE_META = {
  annual: { label: "Annual Leave", hex: "#10b981", icon: CalendarDaysIcon },
  sick: { label: "Sick Leave", hex: "#f43f5e", icon: PlusCircleIcon },
  casual: { label: "Casual Leave", hex: "#6366f1", icon: Square2StackIcon },
} as const;

type LeaveKey = keyof typeof LEAVE_META;
const LEAVE_ORDER: LeaveKey[] = ["annual", "sick", "casual"];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const EmployeeDetailPageReal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const isPhoneLayout = useMediaQuery("(max-width: 1023px)");
  const accent = accentFor(colorScheme);
  const queryClient = useQueryClient();
  const [isEditingAllocation, setIsEditingAllocation] = useState(false);
  const [editAllocation, setEditAllocation] = useState<LeaveAllocation>({
    casual: 10,
    sick: 8,
    annual: 10,
  });
  const [savedAllocation, setSavedAllocation] =
    useState<LeaveAllocation | null>(null);

  const {
    data: employeesData,
    isLoading: employeesLoading,
    error: employeesError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () => usersAPI.getEmployees(1, 100),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: leaveHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ["employee-leaves", id],
    queryFn: () => leavesAPI.getLeaves(1, 50, "", id),
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: leavePolicyData } = useQuery({
    queryKey: ["leave-policy"],
    queryFn: () => leavesAPI.getLeavePolicy(),
    retry: 1,
  });

  const updateAllocationMutation = useMutation({
    mutationFn: (allocations: LeaveAllocation) =>
      leavesAPI.updateEmployeeLeaveAllocation(id!, allocations),
    onSuccess: () => {
      setSavedAllocation(editAllocation);
      queryClient.invalidateQueries({ queryKey: ["employee-leaves", id] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-leave-balance", id] });
      queryClient.invalidateQueries({ queryKey: ["leave-policy"] });
      setIsEditingAllocation(false);
    },
  });

  // Company policy → default allocation (with sensible fallbacks).
  const defaultPolicy = React.useMemo(() => {
    const policyData = leavePolicyData?.data?.policy || {};
    return {
      casual: policyData.casual || policyData.casualLeave || 10,
      sick: policyData.sick || policyData.sickLeave || 8,
      annual: policyData.annual || policyData.annualLeave || 10,
    };
  }, [leavePolicyData?.data?.policy]);

  const employees = React.useMemo(
    () => employeesData?.data?.employees || [],
    [employeesData?.data?.employees]
  );
  const employee = React.useMemo(
    () => employees.find((emp: any) => emp._id === id),
    [employees, id]
  );

  React.useEffect(() => {
    if (
      !savedAllocation &&
      defaultPolicy &&
      (defaultPolicy.casual || defaultPolicy.sick || defaultPolicy.annual)
    ) {
      const policyAllocation = {
        casual: defaultPolicy.casual || 10,
        sick: defaultPolicy.sick || 8,
        annual: defaultPolicy.annual || 10,
      };
      setSavedAllocation(policyAllocation);
      setEditAllocation(policyAllocation);
    } else if (!savedAllocation && employee && employee.leaveQuota) {
      const customAllocation = {
        casual: employee.leaveQuota.casual || 10,
        sick: employee.leaveQuota.sick || 8,
        annual: employee.leaveQuota.annual || 10,
      };
      setSavedAllocation(customAllocation);
      setEditAllocation(customAllocation);
    }
  }, [employee, defaultPolicy, savedAllocation]);

  const leaveHistory = React.useMemo(
    () => leaveHistoryData?.data?.leaves || [],
    [leaveHistoryData?.data?.leaves]
  );

  /**
   * Late hours for this employee, over the last three months.
   *
   * A record opened by HR should answer attendance as well as leave, and the
   * two are kept apart on purpose: late minutes are reported here and charged
   * to nothing. The window is fixed rather than picked, because this page has
   * no date range of its own and a quarter is the span a review covers.
   */
  const lateRange = React.useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    return { startDate: iso(start), endDate: iso(end), label: "last 3 months" };
  }, []);

  const lateHours = useLateHours(employee?.employeeId, {
    startDate: lateRange.startDate,
    endDate: lateRange.endDate,
    enabled: Boolean(employee?.employeeId),
  });

  const calculateLeaveBalance = React.useCallback(() => {
    const year = new Date().getFullYear();
    const yearlyLeaves = leaveHistory.filter((leave: any) => {
      const leaveYear = new Date(leave.startDate).getFullYear();
      return leaveYear === year && leave.status === "approved";
    });

    const allocations = savedAllocation || {
      casual: defaultPolicy.casual || 10,
      sick: defaultPolicy.sick || 8,
      annual: defaultPolicy.annual || 10,
    };

    const sumFor = (type: string) =>
      yearlyLeaves
        .filter((leave: any) => leave.leaveType === type)
        .reduce((sum: number, leave: any) => sum + (leave.totalDays || 1), 0);

    const build = (total: number, used: number) => ({
      total,
      used,
      remaining: Math.max(0, total - used),
    });

    return {
      annual: build(allocations.annual, sumFor("annual")),
      sick: build(allocations.sick, sumFor("sick")),
      casual: build(allocations.casual, sumFor("casual")),
    };
  }, [leaveHistory, savedAllocation, defaultPolicy]);

  const leaveBalance = React.useMemo(
    () => calculateLeaveBalance(),
    [calculateLeaveBalance]
  );

  if (employeesLoading || historyLoading) {
    return <LogoLoader label="Loading profile..." />;
  }

  if (employeesError || !employee) {
    return (
      <div className="space-y-6 fade-in">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/employees")}
            className="rounded-full p-2 text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Employee Not Found
          </h1>
        </div>
        <div className={`${CARD} p-8 text-center`}>
          <UserIcon className="mx-auto mb-4 h-16 w-16 text-gray-400 dark:text-gray-500" />
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            This employee may have been removed or the ID is incorrect.
          </p>
          <button
            onClick={() => navigate("/employees")}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 sm:px-3.5 text-[13px] sm:text-sm font-semibold text-white shadow-sm shadow-blue-600/25"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- Derived view data ---------------- */
  const departmentName =
    typeof employee.department === "object" && employee.department?.name
      ? employee.department.name
      : employee.department || "-";

  const active = employee.status === "active";

  const totalRemaining =
    leaveBalance.annual.remaining +
    leaveBalance.sick.remaining +
    leaveBalance.casual.remaining;
  const totalAllocated =
    leaveBalance.annual.total +
    leaveBalance.sick.total +
    leaveBalance.casual.total;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusChip = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
      case "rejected":
        return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400";
      case "pending":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
      default:
        return "bg-slate-100 text-gray-600 dark:bg-white/5 dark:text-gray-300";
    }
  };

  // Monthly approved-leave trend (current year).
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const currentYear = new Date().getFullYear();

  /**
   * The trend, split the way the dashboard's is: approved is the shape, and
   * pending is the work still waiting on somebody. Counted in days rather than
   * requests, because days is what the rest of this record is denominated in.
   */
  const monthlyData = MONTHS.map((month, index) => {
    const inMonth = leaveHistory.filter((leave: any) => {
      const d = new Date(leave.startDate);
      return d.getFullYear() === currentYear && d.getMonth() === index;
    });
    const daysWith = (status: string) =>
      inMonth
        .filter((leave: any) => leave.status === status)
        .reduce((sum: number, leave: any) => sum + (leave.totalDays || 1), 0);

    const approved = daysWith("approved");
    const pending = daysWith("pending");
    const rejected = daysWith("rejected");
    return {
      month,
      value: approved + pending + rejected,
      approved,
      pending,
      rejected,
    };
  });

  /* The desktop chart draws approved alone, so a year of nothing but pending
     requests would give it a flat line to plot and nothing to say. The phone
     chart draws pending too, so it has something to show either way. */
  const hasApproved = monthlyData.some((m) => m.approved > 0);
  const hasTrend = monthlyData.some((m) => m.value > 0);

  // Distribution donut - used days by type.
  const distribution = LEAVE_ORDER.map((key) => ({
    name: LEAVE_META[key].label.split(" ")[0],
    value: leaveBalance[key].used,
    hex: LEAVE_META[key].hex,
  })).filter((d) => d.value > 0);

  const handleStartEdit = () => {
    setEditAllocation(
      savedAllocation || {
        casual: defaultPolicy.casual || 10,
        sick: defaultPolicy.sick || 8,
        annual: defaultPolicy.annual || 10,
      }
    );
    setIsEditingAllocation(true);
  };
  const handleCancelEdit = () => {
    setEditAllocation(
      savedAllocation || {
        casual: defaultPolicy.casual || 10,
        sick: defaultPolicy.sick || 8,
        annual: defaultPolicy.annual || 10,
      }
    );
    setIsEditingAllocation(false);
  };
  const handleSaveAllocation = () =>
    updateAllocationMutation.mutate(editAllocation);

  const isAdmin = user?.role === "admin";

  /**
   * The phone reading of everything above.
   *
   * Placed here rather than at the top of the component on purpose: the two
   * layouts are the same record, so they have to be built from the same
   * figures. Branching before the derivations would have let a balance or a
   * late total drift between them one edit at a time.
   */
  if (isPhoneLayout) {
    return (
      <MobileEmployeeDetail
        employee={employee}
        departmentName={departmentName}
        active={active}
        isAdmin={isAdmin}
        onBack={() => navigate("/employees")}
        leaveBalance={leaveBalance}
        totalRemaining={totalRemaining}
        totalAllocated={totalAllocated}
        leaveMeta={LEAVE_META}
        leaveOrder={LEAVE_ORDER}
        isEditingAllocation={isEditingAllocation}
        editAllocation={editAllocation}
        onEditAllocation={setEditAllocation}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onSaveAllocation={handleSaveAllocation}
        savingAllocation={updateAllocationMutation.isPending}
        accent={accent}
        currentYear={currentYear}
        monthlyData={monthlyData}
        hasTrend={hasTrend}
        distribution={distribution}
        lateSummary={lateHours.summary}
        lateEntries={lateHours.lateEntries}
        latePolicy={lateHours.policy}
        lateLoading={lateHours.isLoading}
        lateRangeLabel={lateRange.label}
        leaveHistory={leaveHistory}
        formatDate={formatDate}
        statusChip={getStatusChip}
      />
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <SectionHeader
        variant="employees"
        eyebrow={
          <button
            type="button"
            onClick={() => navigate("/employees")}
            className="inline-flex items-center gap-1.5 uppercase tracking-[0.14em] transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Back to Employees
          </button>
        }
        title="Employee Details"
        description="Leave overview and analytics for this employee."
        illustration={sectionIllustration("employees")}
        action={
          isAdmin && !isEditingAllocation ? (
            <button onClick={handleStartEdit} className="sh-action-primary">
              <PencilIcon className="h-4 w-4" />
              Edit Allocation
            </button>
          ) : undefined
        }
      />

      {/* ---- Who ----
          One statement of each fact. The old layout carried the name, the
          status, the department and the balance in a hero, then again in a
          six-field icon grid, then again in the balance cards below it. */}
      <div className={`${CARD} p-6`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar src={employee.profilePicture} name={employee.name} size="xl" />
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
                  active
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                    : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {active ? "Active" : employee.status || "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-gray-100 pt-5 dark:border-white/5 sm:grid-cols-3 lg:grid-cols-6">
          <Meta label="Employee ID" value={employee.employeeId || "-"} />
          <Meta label="Email" value={employee.email || "-"} />
          <Meta label="Department" value={departmentName} />
          {/* Always shown, even when empty: a missing number is the reason an
              employee receives no WhatsApp notifications, and hiding the field
              hides the cause. */}
          <Meta label="Phone" value={employee.phone || "-"} />
          <Meta
            label="Joined"
            value={employee.joinDate ? formatDate(employee.joinDate) : "-"}
          />
          <Meta
            label="Role"
            value={employee.role === "admin" ? "Administrator" : "Employee"}
          />
        </div>
      </div>

      {/* ---- What is left ---- */}
      <div className={`${CARD} p-6`}>
        <CardHeading
          title="Leave balance"
          sub={
            isEditingAllocation
              ? "Set this employee's yearly allocation"
              : "Days remaining, by type"
          }
          action={
            isAdmin && isEditingAllocation ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveAllocation}
                  disabled={updateAllocationMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
                >
                  {updateAllocationMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <CheckIcon className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
              </div>
            ) : undefined
          }
        />

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* The one number this card exists to give. */}
          <div className="flex shrink-0 items-baseline gap-3 lg:w-44 lg:flex-col lg:items-start lg:gap-1 lg:border-r lg:border-gray-100 lg:pr-8 lg:dark:border-white/5">
            <span className="text-4xl font-bold leading-none tabular-nums text-gray-900 dark:text-white">
              {totalRemaining}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              days left of {totalAllocated}
            </span>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            {LEAVE_ORDER.map((key) => (
              <LeaveBalanceRow
                key={key}
                label={LEAVE_META[key].label}
                color={LEAVE_META[key].hex}
                allocated={leaveBalance[key].total}
                used={leaveBalance[key].used}
                remaining={leaveBalance[key].remaining}
                editing={isEditingAllocation}
                editValue={editAllocation[key]}
                onChange={(v) =>
                  setEditAllocation((prev) => ({ ...prev, [key]: v }))
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---- Attendance ----
          An attendance figure, kept beside the leave record but never charged
          against it. The card states its own subject, so it needs no heading
          above it repeating the word. */}
      <LateHoursCard
        summary={lateHours.summary}
        entries={lateHours.lateEntries}
        loading={lateHours.isLoading}
        policy={lateHours.policy}
        rangeLabel={lateRange.label}
        title="Late hours"
        emptyMessage="No late arrivals in the last 3 months."
      />

      {/* ---- How leave was used ---- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className={`${CARD} p-6 lg:col-span-2`}>
          <CardHeading
            title="Leave trend"
            sub={`Approved leave days across ${currentYear}`}
          />
          <div className="mt-5 h-56">
            {hasApproved ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="edTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [`${v} days`, "Leave"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="approved"
                    stroke={accent}
                    strokeWidth={3}
                    fill="url(#edTrend)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                No approved leave recorded this year
              </div>
            )}
          </div>
        </div>

        <div className={`${CARD} p-6`}>
          <CardHeading title="Distribution" sub="Days taken, by leave type" />
          <div className="mt-5 h-56">
            {distribution.length > 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <div className="h-36 w-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
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

                {/* Named as well as coloured, so the split survives a
                    greyscale print and a colourblind reader. */}
                <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {distribution.map((d) => (
                    <li
                      key={d.name}
                      className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300"
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

      {/* ---- Leave history ----
          One card of rows. Every request used to be its own raised card with
          its own icon, so a year of requests read as a wall of cards rather
          than a list you can scan down. */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="p-6 pb-4">
          <CardHeading
            title="Leave history"
            sub={`${leaveHistory.length} ${
              leaveHistory.length === 1 ? "request" : "requests"
            } on record`}
          />
        </div>

        {leaveHistory.length > 0 ? (
          <ul className="max-h-[30rem] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
            {leaveHistory.map((leave: any) => (
              <li
                key={leave._id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">
                    {leave.leaveType} leave
                    <span className="ml-2 font-normal tabular-nums text-gray-400">
                      {leave.totalDays || 1}{" "}
                      {leave.totalDays === 1 ? "day" : "days"}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    {leave.reason ? ` · ${leave.reason}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusChip(
                    leave.status
                  )}`}
                >
                  {leave.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 pb-12 pt-4 text-center">
            <CalendarDaysIcon className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
              No leave history
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This employee has not submitted any leave requests yet.
            </p>
          </div>
        )}
      </div>

      {/* ---- Every request, filterable ---- */}
      <EmployeeLeaveActivity employeeId={employee._id} />
    </div>
  );
};

export default EmployeeDetailPageReal;
