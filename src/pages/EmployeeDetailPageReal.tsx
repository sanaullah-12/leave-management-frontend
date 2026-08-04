import React, { useState } from "react";
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
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  PhoneIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  IdentificationIcon,
  CheckBadgeIcon,
  ChartBarIcon,
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
/*  Presentational pieces                                              */
/* ------------------------------------------------------------------ */

// Hollow accent ring (arc only) with a soft glow.
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

// Glowing leave-balance card — view mode shows the ring + remaining; edit
// mode shows an allocation input. Admin-editable.
const LeaveBalanceCard: React.FC<{
  leaveKey: LeaveKey;
  total: number;
  used: number;
  remaining: number;
  editing: boolean;
  editValue: number;
  onChange: (v: number) => void;
}> = ({ leaveKey, total, used, remaining, editing, editValue, onChange }) => {
  const meta = LEAVE_META[leaveKey];
  const Icon = meta.icon;
  const percent = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const usedPct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-[var(--card-surface)] p-6 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1"
      style={{
        border: `1px solid ${meta.hex}55`,
        boxShadow: `inset 0 1px 0 ${meta.hex}22, 0 0 0 1px ${meta.hex}1f, 0 14px 34px -14px ${meta.hex}66`,
      }}
    >
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
            Allocated: {editing ? editValue : total} Days
          </p>
        </div>
        {!editing && (
          <div className="flex flex-col items-end gap-1">
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: meta.hex }}
            >
              {percent}%
            </span>
            <ProgressRing percent={percent} color={meta.hex} />
          </div>
        )}
      </div>

      {editing ? (
        <div className="relative mt-5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Allocation (days / year)
          </label>
          <input
            type="number"
            min={0}
            max={365}
            value={editValue}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="mt-1.5 w-full rounded-xl bg-slate-100 px-4 py-3 text-3xl font-extrabold tabular-nums outline-none ring-1 ring-inset ring-gray-200/70 focus:ring-2 dark:bg-white/5 dark:ring-white/10"
            style={{ color: meta.hex }}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {used} day{used === 1 ? "" : "s"} already used this year
          </p>
        </div>
      ) : (
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
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${usedPct}%`, backgroundColor: meta.hex }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Used {used} of {total} days
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

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

const SectionHeading: React.FC<{
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ children, action }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <span className="h-6 w-1.5 rounded-full bg-blue-500" />
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        {children}
      </h3>
    </div>
    {action}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const EmployeeDetailPageReal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colorScheme } = useTheme();
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
    return <LogoLoader label="Loading profile…" />;
  }

  if (employeesError || !employee) {
    return (
      <div className="space-y-6 fade-in">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/employees")}
            className="rounded-lg p-2 text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25"
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
      : employee.department || "—";

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
  const monthlyData = MONTHS.map((month, index) => {
    const leaves = leaveHistory
      .filter((leave: any) => {
        const d = new Date(leave.startDate);
        return (
          d.getFullYear() === currentYear &&
          d.getMonth() === index &&
          leave.status === "approved"
        );
      })
      .reduce((sum: number, leave: any) => sum + (leave.totalDays || 1), 0);
    return { month, leaves };
  });
  const hasTrend = monthlyData.some((m) => m.leaves > 0);

  // Distribution donut — used days by type.
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

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/employees")}
            className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Employee Details
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Leave overview & analytics
            </p>
          </div>
        </div>

        {isAdmin && !isEditingAllocation && (
          <button
            onClick={handleStartEdit}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Allocation
          </button>
        )}
      </div>

      {/* Profile */}
      <div className={`${CARD} p-6 sm:p-7`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar
            src={employee.profilePicture}
            name={employee.name}
            size="2xl"
            className="ring-4 ring-blue-500/20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {employee.name}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                }`}
              >
                <CheckBadgeIcon className="h-3.5 w-3.5" />
                {active ? "Active" : employee.status || "Inactive"}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              {employee.position || "—"} • {departmentName}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 ring-1 ring-inset ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              {totalRemaining} of {totalAllocated} leave days remaining
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-gray-100 pt-6 dark:border-white/5 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField
            icon={<EnvelopeIcon className="h-4 w-4" />}
            label="Email"
            value={employee.email || "—"}
          />
          <ProfileField
            icon={<IdentificationIcon className="h-4 w-4" />}
            label="Employee ID"
            value={employee.employeeId || "—"}
          />
          <ProfileField
            icon={<BuildingOffice2Icon className="h-4 w-4" />}
            label="Department"
            value={departmentName}
          />
          {employee.phone && (
            <ProfileField
              icon={<PhoneIcon className="h-4 w-4" />}
              label="Phone"
              value={employee.phone}
            />
          )}
          <ProfileField
            icon={<CalendarDaysIcon className="h-4 w-4" />}
            label="Joined"
            value={employee.joinDate ? formatDate(employee.joinDate) : "—"}
          />
          <ProfileField
            icon={<UserIcon className="h-4 w-4" />}
            label="Role"
            value={employee.role === "admin" ? "Administrator" : "Employee"}
          />
        </div>
      </div>

      {/* Leave Balance */}
      <div className="space-y-4">
        <SectionHeading
          action={
            isAdmin && isEditingAllocation ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveAllocation}
                  disabled={updateAllocationMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 disabled:opacity-70"
                >
                  {updateAllocationMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <CheckIcon className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
              </div>
            ) : (
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200/70 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
                Total: {totalAllocated} Days
              </span>
            )
          }
        >
          Leave Balance
        </SectionHeading>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {LEAVE_ORDER.map((key) => (
            <LeaveBalanceCard
              key={key}
              leaveKey={key}
              total={leaveBalance[key].total}
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

      {/* Analytics */}
      <div className="space-y-4">
        <SectionHeading>Leave Analytics</SectionHeading>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Trend */}
          <div className={`${CARD} p-6 lg:col-span-2`}>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Leave Trend
            </h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Approved leave days across {currentYear}
            </p>
            <div className="mt-4 h-60">
              {hasTrend ? (
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
                      dataKey="leaves"
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
                  No approved leaves recorded this year
                </div>
              )}
            </div>
          </div>

          {/* Distribution */}
          <div className={`${CARD} p-6`}>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Distribution
            </h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Days used by type
            </p>
            <div className="mt-4 flex h-60 flex-col items-center justify-center gap-4">
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

      {/* Leave History */}
      <div className="space-y-4">
        <SectionHeading
          action={
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200/70 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10">
              {leaveHistory.length} requests
            </span>
          }
        >
          Leave History
        </SectionHeading>

        {leaveHistory.length > 0 ? (
          <div className="space-y-3">
            {leaveHistory.map((leave: any) => (
              <div
                key={leave._id}
                className={`${CARD} flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <ChartBarIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold capitalize text-gray-900 dark:text-gray-100">
                      {leave.leaveType} Leave
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)}{" "}
                      · {leave.totalDays || 1}{" "}
                      {leave.totalDays === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  {leave.reason && (
                    <span
                      className="hidden max-w-[220px] truncate text-xs text-gray-400 dark:text-gray-500 md:block"
                      title={leave.reason}
                    >
                      “{leave.reason}”
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusChip(
                      leave.status
                    )}`}
                  >
                    {leave.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${CARD} py-12 text-center`}>
            <CalendarDaysIcon className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="font-medium text-gray-900 dark:text-gray-200">
              No leave history
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This employee hasn't submitted any leave requests yet.
            </p>
          </div>
        )}
      </div>

      {/* Activity */}
      <EmployeeLeaveActivity
        employeeId={employee._id}
        isCurrentUser={user?.id === employee._id}
      />
    </div>
  );
};

export default EmployeeDetailPageReal;
