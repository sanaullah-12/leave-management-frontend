import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { leavesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getHoliday } from "../data/holidays";
import { showLeaveSubmissionSuccess, showErrorToast } from "../utils/toastHelpers";
import Modal from "./ui/Modal";
import DatePicker from "./ui/DatePicker";
import {
  CalendarDaysIcon,
  SunIcon,
  HeartIcon,
  BoltIcon,
  UserIcon,
  UsersIcon,
  ArrowUturnLeftIcon,
  WalletIcon,
  DocumentArrowUpIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckSolid } from "@heroicons/react/24/solid";

interface ApplyLeaveModalProps {
  open: boolean;
  onClose: () => void;
}

const LEAVE_TYPES = [
  { id: "annual", label: "Annual", icon: CalendarDaysIcon },
  { id: "casual", label: "Casual", icon: SunIcon },
  { id: "sick", label: "Sick", icon: HeartIcon },
  { id: "emergency", label: "Emergency", icon: BoltIcon },
  { id: "maternity", label: "Maternity", icon: UserIcon },
  { id: "paternity", label: "Paternity", icon: UsersIcon },
];

const SUGGESTIONS = ["Family vacation", "Medical appointment", "Personal matter"];
const STEPS = [
  "Validating request",
  "Checking leave balance",
  "Sending for approval",
  "Updating calendar",
  "Completed",
];

const inputClass =
  "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const eyebrow =
  "text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500";

const fmt = (d: Date | null) =>
  d
    ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
const weekday = (d: Date | null) =>
  d ? d.toLocaleDateString(undefined, { weekday: "long" }) : "";

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<"form" | "submitting" | "success">("form");
  const [step, setStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset when reopened
  useEffect(() => {
    if (open) {
      setLeaveType("annual");
      setStartDate("");
      setEndDate("");
      setHalfDay(false);
      setReason("");
      setFile(null);
      setPhase("form");
      setStep(0);
    }
  }, [open]);

  const { data: balanceData } = useQuery({
    queryKey: ["leave-balance"],
    queryFn: () => leavesAPI.getLeaveBalance(),
    enabled: open && user?.role === "employee",
    staleTime: 5 * 60 * 1000,
  });
  const balance: Record<string, { total: number; remaining: number }> =
    (balanceData as any)?.data?.balance || {};

  const { data: existingData } = useQuery({
    queryKey: ["leaves-overlap"],
    queryFn: () => leavesAPI.getLeaves(1, 100),
    enabled: open,
    staleTime: 60 * 1000,
  });
  const existing: any[] = (existingData as any)?.data?.leaves || [];

  const start = startDate ? new Date(startDate) : null;
  const end = halfDay ? start : endDate ? new Date(endDate) : null;

  const duration = useMemo(() => {
    if (!start) return 0;
    if (halfDay) return 0.5;
    if (!end) return 0;
    if (end < start) return 0;
    return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  }, [start, end, halfDay]);

  const returnDate = useMemo(() => {
    if (!end) return null;
    const d = new Date(end);
    d.setDate(d.getDate() + 1);
    return d;
  }, [end]);

  const typeBalance = balance[leaveType];
  const newBalance =
    typeBalance !== undefined ? Math.max(0, typeBalance.remaining - duration) : null;

  // Smart warnings
  const warnings = useMemo(() => {
    const list: { tone: "amber" | "red"; text: string }[] = [];
    if (!start) return list;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) list.push({ tone: "red", text: "Start date is in the past." });

    // holidays within range
    if (end) {
      const names: string[] = [];
      const cur = new Date(start);
      while (cur <= end) {
        const h = getHoliday(cur);
        if (h) names.push(h.name);
        cur.setDate(cur.getDate() + 1);
      }
      if (names.length)
        list.push({
          tone: "amber",
          text: `Range includes ${names[0]}${
            names.length > 1 ? ` +${names.length - 1} more` : ""
          } (public holiday).`,
        });

      // overlap with existing leaves
      const overlap = existing.find((lv) => {
        if (lv.status === "rejected") return false;
        const s = new Date(lv.startDate);
        const e = new Date(lv.endDate);
        return start <= e && end >= s;
      });
      if (overlap)
        list.push({
          tone: "red",
          text: `Overlaps an existing ${overlap.status} ${overlap.leaveType} leave.`,
        });
    }
    return list;
  }, [start, end, existing]);

  const submitMutation = useMutation({
    mutationFn: leavesAPI.submitLeave,
  });

  const canSubmit =
    !!startDate && (halfDay || !!endDate) && duration > 0 && reason.trim().length > 0;

  const frame = (ms = 420) => new Promise((r) => setTimeout(r, ms));

  const handleSubmit = async () => {
    if (!canSubmit) {
      showErrorToast("Please choose dates and add a reason.");
      return;
    }
    setPhase("submitting");
    setStep(1);
    await frame();
    setStep(2);
    await frame();
    try {
      const res: any = await submitMutation.mutateAsync({
        leaveType,
        startDate,
        endDate: halfDay ? startDate : endDate,
        reason,
      });
      setStep(3);
      await frame();
      setStep(4);
      await frame(300);
      setStep(5);
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["recent-leaves"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      setPhase("success");
      const days = res?.data?.leave?.totalDays || duration;
      showLeaveSubmissionSuccess(days, leaveType);
      setTimeout(onClose, 1900);
    } catch (e: any) {
      setPhase("form");
      showErrorToast(e?.response?.data?.message || "Failed to submit request.");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal open={open} onClose={onClose} size="2xl" bodyClassName="!p-0">
      <AnimatePresence mode="wait">
        {phase === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[420px] flex-col items-center justify-center p-10 text-center"
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10"
            >
              <CheckSolid className="h-12 w-12 text-emerald-500" />
            </motion.div>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Request submitted!
            </h2>
            <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Your {leaveType} leave for{" "}
              <strong className="text-gray-700 dark:text-gray-200">
                {duration} {duration === 1 ? "day" : "days"}
              </strong>{" "}
              was sent to your manager for approval.
            </p>
          </motion.div>
        ) : phase === "submitting" ? (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[420px] flex-col items-center justify-center p-10"
          >
            <p className="mb-6 text-base font-semibold text-gray-900 dark:text-gray-100">
              Submitting your request…
            </p>
            <div className="w-full max-w-xs space-y-3">
              {STEPS.map((label, i) => {
                const n = i + 1;
                const done = step > n || step === STEPS.length;
                const active = step === n && step !== STEPS.length;
                return (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        done
                          ? "text-emerald-500"
                          : active
                          ? "text-blue-500"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    >
                      {done ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : active ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent"
                        />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={
                        done || active
                          ? "font-medium text-gray-900 dark:text-gray-100"
                          : "text-gray-400 dark:text-gray-500"
                      }
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col sm:flex-row"
          >
            {/* ===== Left: form ===== */}
            <div className="min-w-0 flex-1 p-6">
              {/* header */}
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <CalendarDaysIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                    Apply Leave
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Submit a leave request for manager approval
                  </p>
                </div>
              </div>

              {/* Leave type cards */}
              <p className={`${eyebrow} mt-6 mb-2.5`}>Leave type</p>
              <div className="grid grid-cols-3 gap-2.5">
                {LEAVE_TYPES.map((t) => {
                  const selected = leaveType === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setLeaveType(t.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
                        selected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <t.icon
                        className={`h-5 w-5 ${
                          selected
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          selected
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {t.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Duration */}
              <div className="mt-6 flex items-center justify-between">
                <p className={eyebrow}>Duration</p>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Half Day
                  <button
                    type="button"
                    onClick={() => setHalfDay((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      halfDay ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        halfDay ? "translate-x-4.5" : "translate-x-1"
                      }`}
                      style={{ transform: halfDay ? "translateX(18px)" : "translateX(3px)" }}
                    />
                  </button>
                </label>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Start Date
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    min={today}
                    placeholder="Select date"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    End Date
                  </label>
                  <DatePicker
                    value={halfDay ? startDate : endDate}
                    onChange={setEndDate}
                    min={startDate || today}
                    disabled={halfDay}
                    placeholder="Select date"
                  />
                </div>
              </div>

              {/* Total duration */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-500/10 px-4 py-3">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Duration
                </span>
                <motion.span
                  key={duration}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-sm font-bold tabular-nums text-blue-700 dark:text-blue-300"
                >
                  {duration} {duration === 1 ? "Day" : "Days"}
                </motion.span>
              </div>

              {/* Warnings */}
              <AnimatePresence>
                {warnings.map((w) => (
                  <motion.div
                    key={w.text}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                        w.tone === "red"
                          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}
                    >
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                      {w.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Reason */}
              <div className="mt-6 flex items-center justify-between">
                <p className={eyebrow}>Additional details</p>
                <span className="text-[11px] tabular-nums text-gray-400">
                  {reason.length}/500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell your manager the reason for your request…"
                className={`${inputClass} mt-2 resize-none`}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setReason(s)}
                    className="rounded-full border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-[11px] text-gray-500 dark:text-gray-400 transition-colors hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Attachment */}
              <p className={`${eyebrow} mt-6 mb-2`}>Attachment</p>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  dragOver
                    ? "border-blue-400 bg-blue-50/50 dark:bg-blue-500/5"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <DocumentArrowUpIcon className="h-6 w-6 text-gray-400" />
                {file ? (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    {file.name}
                  </motion.p>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-[11px] text-gray-400">PDF, JPG, PNG up to 10MB</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            {/* ===== Right: summary ===== */}
            <div className="w-full flex-shrink-0 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 p-6 sm:w-72 sm:border-l sm:border-t-0">
              <p className={`${eyebrow} mb-4`}>Leave summary</p>

              <div className="space-y-4">
                <SummaryRow
                  icon={<WalletIcon className="h-4 w-4" />}
                  label="New Balance"
                  value={
                    newBalance !== null
                      ? `${newBalance} Days`
                      : duration
                      ? `${duration} Days`
                      : "—"
                  }
                  sub={
                    typeBalance
                      ? `From ${typeBalance.total} available`
                      : "Balance not tracked"
                  }
                />
                <SummaryRow
                  icon={<ArrowUturnLeftIcon className="h-4 w-4" />}
                  label="Return Date"
                  value={fmt(returnDate)}
                  sub={weekday(returnDate)}
                />
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={eyebrow}>Approver</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Your manager
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pending approval
                    </p>
                  </div>
                </div>
              </div>

              {/* Policy tip */}
              <div className="mt-5 rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/70 dark:bg-blue-500/10 p-3.5">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <InformationCircleIcon className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Leave policy
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-blue-700/80 dark:text-blue-300/70">
                  Requests made 7 days in advance have a 95% faster approval rate.
                </p>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2.5">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  Submit Request
                  <ArrowRightIcon className="h-4 w-4" />
                </motion.button>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

const SummaryRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}> = ({ icon, label, value, sub }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white dark:bg-gray-700/60 text-gray-500 dark:text-gray-300 ring-1 ring-gray-200/70 dark:ring-gray-700">
      {icon}
    </div>
    <div className="min-w-0">
      <p className={eyebrow}>{label}</p>
      <motion.p
        key={value}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        className="text-sm font-semibold text-gray-900 dark:text-gray-100"
      >
        {value}
      </motion.p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  </div>
);

export default ApplyLeaveModal;
