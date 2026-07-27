import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leavesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { HeaderSkeleton, StatCardsSkeleton } from "../components/Skeletons";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  PencilIcon,
  XMarkIcon,
  CalendarDaysIcon,
  HeartIcon,
  SunIcon,
  SparklesIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

interface LeavePolicy {
  casual: number;
  sick: number;
  annual: number;
  maternity?: number;
  paternity?: number;
  emergency?: number;
}

// Neumorphic soft-UI card surface — matches the dashboard / team cards.
const CARD =
  "rounded-2xl bg-[var(--card-surface)] " +
  "shadow-[7px_7px_16px_rgba(174,186,204,0.5),-7px_-7px_16px_rgba(255,255,255,0.95)] " +
  "dark:shadow-[7px_7px_18px_rgba(0,0,0,0.55),-6px_-6px_16px_rgba(255,255,255,0.045)]";
const CARD_HOVER =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 " +
  "hover:shadow-[12px_12px_24px_rgba(174,186,204,0.6),-12px_-12px_24px_rgba(255,255,255,1)] " +
  "dark:hover:shadow-[12px_12px_28px_rgba(0,0,0,0.7),-10px_-10px_24px_rgba(255,255,255,0.06)]";

// Core leave types (the 28-day allocation). Each has a semantic accent.
const CORE_TYPES = [
  {
    key: "annual" as const,
    name: "Annual Leave",
    description: "Yearly vacation and planned time off.",
    icon: SunIcon,
    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    industry: "10–20",
    min: 10,
  },
  {
    key: "casual" as const,
    name: "Casual Leave",
    description: "Short personal or ad-hoc time off.",
    icon: CalendarDaysIcon,
    chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    value: "text-blue-600 dark:text-blue-400",
    bar: "bg-blue-500",
    industry: "10–15",
    min: 10,
  },
  {
    key: "sick" as const,
    name: "Sick Leave",
    description: "Medical leave for illness or recovery.",
    icon: HeartIcon,
    chip: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    value: "text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    industry: "8–12",
    min: 8,
  },
];

const LeavePolicyPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editPolicy, setEditPolicy] = useState<LeavePolicy>({
    casual: 10,
    sick: 8,
    annual: 10,
    maternity: 90,
    paternity: 15,
    emergency: 3,
  });

  const { data: policyData, isLoading } = useQuery({
    queryKey: ["leave-policy"],
    queryFn: () => leavesAPI.getLeavePolicy(),
    retry: 1,
  });

  const updatePolicyMutation = useMutation({
    mutationFn: (policy: LeavePolicy) => leavesAPI.updateLeavePolicy(policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-policy"] });
      setIsEditing(false);
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
          <ShieldCheckIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
          Admin access required
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You need administrator privileges to manage leave policies.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 fade-in">
        <HeaderSkeleton />
        <StatCardsSkeleton count={3} />
      </div>
    );
  }

  // Backend returns { policy: { annual, sick, casual, maternityLeave, paternityLeave } }.
  const rawPolicy = policyData?.data?.policy || {};
  const currentPolicy: LeavePolicy = {
    casual: rawPolicy.casual ?? rawPolicy.casualLeave ?? 10,
    sick: rawPolicy.sick ?? rawPolicy.sickLeave ?? 8,
    annual: rawPolicy.annual ?? rawPolicy.annualLeave ?? 10,
    maternity: rawPolicy.maternity ?? rawPolicy.maternityLeave ?? 90,
    paternity: rawPolicy.paternity ?? rawPolicy.paternityLeave ?? 15,
    emergency: rawPolicy.emergency ?? 3,
  };

  const shown = isEditing ? editPolicy : currentPolicy;
  const coreTotal =
    (shown.annual || 0) + (shown.casual || 0) + (shown.sick || 0);

  const handleStartEdit = () => {
    setEditPolicy(currentPolicy);
    setIsEditing(true);
  };
  const handleSavePolicy = () => updatePolicyMutation.mutate(editPolicy);
  const handleCancelEdit = () => {
    setEditPolicy(currentPolicy);
    setIsEditing(false);
  };

  const statutory = [
    { name: "Maternity", value: currentPolicy.maternity ?? 90 },
    { name: "Paternity", value: currentPolicy.paternity ?? 15 },
    { name: "Emergency", value: currentPolicy.emergency ?? 3 },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/25">
            <ShieldCheckIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Leave Policy
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Configure company-wide leave allocation for all employees.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
              >
                <XMarkIcon className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleSavePolicy}
                disabled={updatePolicyMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70"
              >
                {updatePolicyMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={handleStartEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Policy
            </button>
          )}
        </div>
      </div>

      {/* Total allocation banner */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/25">
              <span className="text-3xl font-extrabold leading-none tabular-nums">
                {coreTotal}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                Days
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Total Annual Allocation
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                {coreTotal} Days per Employee
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Annual + Casual + Sick leave combined
              </p>
            </div>
          </div>

          {/* Segment breakdown */}
          <div className="flex gap-3">
            {CORE_TYPES.map((t) => (
              <div
                key={t.key}
                className="flex min-w-[68px] flex-col items-center rounded-xl bg-slate-100 px-4 py-3 dark:bg-white/5"
              >
                <span className={`text-xl font-bold tabular-nums ${t.value}`}>
                  {shown[t.key] || 0}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {t.key}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Proportion bar */}
        <div className="flex h-2 w-full overflow-hidden">
          {CORE_TYPES.map((t) => (
            <div
              key={t.key}
              className={t.bar}
              style={{
                width: `${coreTotal > 0 ? ((shown[t.key] || 0) / coreTotal) * 100 : 0}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Core leave-type cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {CORE_TYPES.map((t) => {
          const Icon = t.icon;
          const current = currentPolicy[t.key] || 0;
          const edit = editPolicy[t.key] || 0;
          const changed = isEditing && edit !== current;
          return (
            <div key={t.key} className={`${CARD} ${CARD_HOVER} p-6`}>
              <div className="flex items-start justify-between">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${t.chip}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                {isEditing ? (
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={edit}
                    onChange={(e) =>
                      setEditPolicy((prev) => ({
                        ...prev,
                        [t.key]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-20 rounded-xl bg-slate-100 py-2 text-center text-2xl font-bold text-gray-900 outline-none ring-1 ring-inset ring-gray-200/70 focus:ring-2 focus:ring-blue-500/50 dark:bg-white/5 dark:text-white dark:ring-white/10"
                  />
                ) : (
                  <div className="text-right">
                    <span className={`text-4xl font-extrabold tabular-nums ${t.value}`}>
                      {current}
                    </span>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                      days / year
                    </p>
                  </div>
                )}
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">
                {t.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t.description}
              </p>

              {/* Industry comparison line */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/5">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Industry: {t.industry} days
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    (shown[t.key] || 0) >= t.min
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                  }`}
                >
                  {(shown[t.key] || 0) >= t.min ? "Competitive" : "Below average"}
                </span>
              </div>

              {changed && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  {edit > current ? "↑" : "↓"} {current} → {edit} days
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Statutory leaves (read-only) + edit notice */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className={`${CARD} p-6 lg:col-span-2`}>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Statutory & Special Leaves
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:bg-white/5 dark:text-gray-500">
              Separate from the {coreTotal}-day allocation
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {statutory.map((s) => (
              <div
                key={s.name}
                className="rounded-xl bg-slate-100 p-4 text-center dark:bg-white/5"
              >
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {s.name} · days
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={`${CARD} p-6`}>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <InformationCircleIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                How changes apply
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                New allocations apply to employees from the next cycle. Existing
                balances stay unchanged, and individual allocations can still be
                adjusted per employee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeavePolicyPage;
