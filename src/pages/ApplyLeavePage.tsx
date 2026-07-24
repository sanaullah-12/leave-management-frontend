import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { leavesAPI } from "../services/api";
import {
  showLeaveSubmissionSuccess,
  showErrorToast,
  showWarningToast,
} from "../utils/toastHelpers";
import LoadingButton from "../components/LoadingButton";
import { PlusCircleIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import "../styles/design-system.css";

interface LeaveForm {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "emergency", label: "Emergency Leave" },
];

const ApplyLeavePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LeaveForm>();

  const { data: leaveBalance } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => leavesAPI.getLeaveBalance(),
    enabled: user?.role === "employee",
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const balance: Record<string, { total: number; used: number; remaining: number }> =
    (leaveBalance as any)?.data?.balance || {};

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

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Apply for Leave
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Submit a new leave request for approval
        </p>
      </div>

      {/* Balance summary (employees) */}
      {user?.role === "employee" && Object.keys(balance).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          {(["annual", "sick", "casual"] as const).map((key) => {
            const b = balance[key] || { total: 0, used: 0, remaining: 0 };
            return (
              <div
                key={key}
                className="rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 p-5"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {key} Leave
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {b.remaining}
                  <span className="text-sm font-normal text-gray-400">
                    {" "}
                    / {b.total} left
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Form */}
      <div className="max-w-2xl rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="form-label">Leave Type</label>
            <select
              {...register("leaveType", { required: "Leave type is required" })}
              className="input-field"
            >
              <option value="">Select leave type</option>
              {LEAVE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.leaveType && (
              <p className="form-error">{errors.leaveType.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                min={today}
                {...register("startDate", { required: "Start date is required" })}
                className="input-field"
              />
              {errors.startDate && (
                <p className="form-error">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                min={startDate || today}
                {...register("endDate", { required: "End date is required" })}
                className="input-field"
              />
              {errors.endDate && (
                <p className="form-error">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {dayCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-200/60 dark:ring-blue-500/20">
              <CalendarDaysIcon className="h-5 w-5" />
              <span>
                This request covers{" "}
                <strong className="tabular-nums">{dayCount}</strong>{" "}
                {dayCount === 1 ? "day" : "days"}
                {selectedType && balance[selectedType]
                  ? ` — ${balance[selectedType].remaining} ${selectedType} day(s) remaining`
                  : ""}
                .
              </span>
            </div>
          )}

          <div>
            <label className="form-label">Reason</label>
            <textarea
              rows={4}
              {...register("reason", { required: "Reason is required" })}
              className="input-field"
              placeholder="Briefly describe the reason for your leave"
            />
            {errors.reason && (
              <p className="form-error">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/leaves")}
              className="btn-secondary"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              loading={submitMutation.isPending}
              loadingText="Submitting request..."
            >
              <PlusCircleIcon className="h-5 w-5" />
              Submit Request
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeavePage;
