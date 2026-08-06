import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { leavesAPI } from "../services/api";
import DatePicker from "../components/ui/DatePicker";
import {
  showLeaveSubmissionSuccess,
  showErrorToast,
  showWarningToast,
} from "../utils/toastHelpers";
import LoadingButton from "../components/LoadingButton";
import {
  PlusCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  SunIcon,
  HeartIcon,
  Square2StackIcon,
  SparklesIcon,
  UserGroupIcon,
  BoltIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

interface LeaveForm {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const LEAVE_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    chip: string;
    hex: string;
  }
> = {
  annual: {
    label: "Annual",
    icon: SunIcon,
    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    hex: "#10b981",
  },
  sick: {
    label: "Sick",
    icon: HeartIcon,
    chip: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
    hex: "#f43f5e",
  },
  casual: {
    label: "Casual",
    icon: Square2StackIcon,
    chip: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    hex: "#6366f1",
  },
  maternity: {
    label: "Maternity",
    icon: SparklesIcon,
    chip: "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
    hex: "#ec4899",
  },
  paternity: {
    label: "Paternity",
    icon: UserGroupIcon,
    chip: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    hex: "#8b5cf6",
  },
  emergency: {
    label: "Emergency",
    icon: BoltIcon,
    chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    hex: "#f59e0b",
  },
};
const LEAVE_ORDER = [
  "annual",
  "sick",
  "casual",
  "maternity",
  "paternity",
  "emergency",
];

const TEXTAREA =
  "w-full rounded-xl bg-[var(--card-surface)] px-4 py-3 text-sm text-gray-900 outline-none ring-1 ring-inset ring-gray-200/70 transition-shadow placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 dark:text-gray-100 dark:placeholder-gray-500 dark:ring-white/10";

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

const ApplyLeavePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LeaveForm>();

  const { data: leaveBalance } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => leavesAPI.getLeaveBalance(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const balance: Record<string, { total: number; used: number; remaining: number }> =
    (leaveBalance as any)?.data?.balance || {};

  // Current policy allocation - used as a fallback so the balance/leave-bank
  // always render even before (or without) live balance data.
  const POLICY_CORE: Record<string, number> = { annual: 10, casual: 10, sick: 8 };
  const coreBal = (key: string) => {
    const b = balance[key];
    if (b) return b;
    if (key in POLICY_CORE) {
      const t = POLICY_CORE[key];
      return { total: t, used: 0, remaining: t };
    }
    return undefined;
  };

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const selectedType = watch("leaveType");

  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return 0;
    return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const submitMutation = useMutation({
    mutationFn: leavesAPI.submitLeave,
    onSuccess: (response: any) => {
      const newLeave = response.data.leave;
      const hasWarnings =
        response.data.warnings && response.data.warnings.length > 0;
      if (hasWarnings) {
        showWarningToast(
          `Leave request submitted! ${dayCount} ${
            dayCount === 1 ? "day" : "days"
          } pending approval. Note: ${response.data.warnings.join(", ")}.`
        );
      } else {
        showLeaveSubmissionSuccess(newLeave.totalDays || dayCount, newLeave.leaveType);
      }
      reset();
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["recent-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      navigate("/leaves");
    },
    onError: (error: any) => {
      showErrorToast(
        error?.response?.data?.message ||
          "Failed to submit leave request. Please try again."
      );
    },
  });

  const onSubmit = (data: LeaveForm) => submitMutation.mutate(data);

  const today = new Date().toISOString().split("T")[0];

  const selectedBalance = selectedType ? coreBal(selectedType) : undefined;
  const remainingAfter =
    selectedBalance && dayCount > 0
      ? selectedBalance.remaining - dayCount
      : undefined;
  const exceeds = remainingAfter !== undefined && remainingAfter < 0;
  const selectedLabel = selectedType
    ? `${LEAVE_META[selectedType]?.label ?? selectedType} Leave`
    : "Not selected";

  // Aggregate leave bank across the core allocation (Annual + Sick + Casual).
  const bank = (["annual", "sick", "casual"] as const).reduce(
    (acc, k) => {
      const b = coreBal(k);
      if (b) {
        acc.total += b.total;
        acc.used += b.used;
        acc.remaining += b.remaining;
      }
      return acc;
    },
    { total: 0, used: 0, remaining: 0 }
  );
  const hasBank = bank.total > 0;
  const bankUsedPct = bank.total > 0 ? (bank.used / bank.total) * 100 : 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-blue-600 dark:text-blue-400">
          <PlusCircleIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Apply for Leave
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Choose a leave type, pick your dates, and submit for approval.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Leave type picker */}
            <div className="surface-card p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Leave type
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Select the category that fits your request.
              </p>

              <Controller
                name="leaveType"
                control={control}
                rules={{ required: "Please choose a leave type" }}
                render={({ field }) => (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {LEAVE_ORDER.map((key) => {
                      const meta = LEAVE_META[key];
                      const Icon = meta.icon;
                      const b = coreBal(key);
                      const sel = field.value === key;
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => field.onChange(key)}
                          className={`group relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                            sel
                              ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/30 dark:bg-blue-500/10"
                              : "border-gray-200 bg-[var(--card-surface)] hover:-translate-y-0.5 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20"
                          }`}
                        >
                          {sel && (
                            <CheckCircleIcon className="absolute right-2.5 top-2.5 h-5 w-5 text-blue-500" />
                          )}
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.chip}`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                              {meta.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-gray-400 dark:text-gray-500">
                              {b
                                ? `${b.remaining}/${b.total} left`
                                : "Special leave"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.leaveType && (
                <p className="form-error mt-2">{errors.leaveType.message}</p>
              )}
            </div>

            {/* Dates + reason */}
            <div className="surface-card space-y-5 p-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                When &amp; why
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="form-label">Start date</label>
                  <Controller
                    name="startDate"
                    control={control}
                    rules={{ required: "Start date is required" }}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value || ""}
                        onChange={field.onChange}
                        min={today}
                        placeholder="Select start date"
                      />
                    )}
                  />
                  {errors.startDate && (
                    <p className="form-error">{errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">End date</label>
                  <Controller
                    name="endDate"
                    control={control}
                    rules={{ required: "End date is required" }}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value || ""}
                        onChange={field.onChange}
                        min={startDate || today}
                        placeholder="Select end date"
                      />
                    )}
                  />
                  {errors.endDate && (
                    <p className="form-error">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">Reason</label>
                <textarea
                  rows={4}
                  {...register("reason", { required: "Reason is required" })}
                  className={TEXTAREA}
                  placeholder="Briefly describe the reason for your leave..."
                />
                {errors.reason && (
                  <p className="form-error">{errors.reason.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: balance + sticky summary + CTA */}
          <div className="space-y-6 lg:col-span-1">
            {/* Leave balance overview */}
            {hasBank && (
                <div className="surface-card p-6">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                    Your leave balance
                  </h3>
                  <div className="mt-4 space-y-4">
                    {(["annual", "sick", "casual"] as const).map((key) => {
                      const b = coreBal(key);
                      if (!b) return null;
                      const meta = LEAVE_META[key];
                      const pct =
                        b.total > 0
                          ? Math.min(100, (b.remaining / b.total) * 100)
                          : 0;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.chip}`}
                              >
                                <meta.icon className="h-3.5 w-3.5" />
                              </span>
                              {meta.label}
                            </span>
                            <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                              {b.remaining}
                              <span className="text-xs font-normal text-gray-400">
                                {" "}
                                / {b.total}
                              </span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: meta.hex }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Request summary */}
            <div className="surface-card p-6 lg:sticky lg:top-6">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                Request summary
              </h3>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Type</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {selectedLabel}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <CalendarDaysIcon className="h-4 w-4" /> Start
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {fmt(startDate)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <CalendarDaysIcon className="h-4 w-4" /> End
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {fmt(endDate)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4" /> Duration
                  </dt>
                  <dd className="font-semibold tabular-nums text-gray-900 dark:text-white">
                    {dayCount > 0 ? `${dayCount} day${dayCount === 1 ? "" : "s"}` : "-"}
                  </dd>
                </div>
              </dl>

              {/* Balance impact */}
              {selectedBalance && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {LEAVE_META[selectedType]?.label} balance
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedBalance.remaining}/{selectedBalance.total}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${
                          selectedBalance.total > 0
                            ? Math.min(
                                100,
                                (selectedBalance.remaining /
                                  selectedBalance.total) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  {remainingAfter !== undefined && (
                    <p
                      className={`mt-2 text-xs font-medium ${
                        exceeds
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {exceeds
                        ? `Exceeds balance by ${Math.abs(remainingAfter)} day(s)`
                        : `${remainingAfter} day(s) remaining after this request`}
                    </p>
                  )}
                </div>
              )}

              {exceeds && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700 ring-1 ring-inset ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>
                    This request is more than your remaining balance - it may
                    require special approval.
                  </span>
                </div>
              )}

              {/* Leave bank - total credit / used / remaining */}
              {hasBank && (
                <div className="mt-5 rounded-xl border border-gray-100 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Leave bank
                    </p>
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                      {new Date().getFullYear()}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
                        {bank.total}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        Credit
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                        {bank.used}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        Used
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {bank.remaining}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        Remaining
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                      style={{ width: `${bankUsedPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
                    {bank.used} of {bank.total} days used ·{" "}
                    {Math.round(bankUsedPct)}%
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-2 border-t border-gray-100 pt-5 dark:border-white/10">
                <motion.div whileTap={{ scale: 0.99 }}>
                  <LoadingButton
                    type="submit"
                    loading={submitMutation.isPending}
                    loadingText="Submitting..."
                    className="btn-primary w-full justify-center"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    Submit request
                  </LoadingButton>
                </motion.div>
                <button
                  type="button"
                  onClick={() => navigate("/leaves")}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ApplyLeavePage;
