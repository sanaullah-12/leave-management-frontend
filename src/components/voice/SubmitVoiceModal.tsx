import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  EyeSlashIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import Modal from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { useSubmitVoice } from "../../hooks/useEmployeeVoice";
import { CATEGORY_LIST, PRIORITY_LIST } from "../../lib/voiceMeta";
import { showErrorToast, showSuccessToast } from "../../utils/toastHelpers";
import type { VoiceCategory, VoicePriority } from "../../types/employeeVoice";

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const inputClass =
  "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10";
const eyebrow =
  "text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500";

const SubmitVoiceModal: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const submit = useSubmitVoice();
  const fileRef = useRef<HTMLInputElement>(null);

  const defaultDept =
    typeof user?.department === "string"
      ? user.department
      : (user?.department as any)?.name || "";

  const [phase, setPhase] = useState<"form" | "success">("form");
  const [category, setCategory] = useState<VoiceCategory | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<VoicePriority>("medium");
  const [department, setDepartment] = useState(defaultDept);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPhase("form");
    setCategory(null);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDepartment(defaultDept);
    setIsAnonymous(false);
    setFiles([]);
    setError(null);
  };

  const close = () => {
    if (submit.isPending) return;
    onClose();
    // Let the modal exit animation play before clearing state.
    setTimeout(reset, 250);
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next: File[] = [...files];
    Array.from(incoming).forEach((f) => {
      if (next.length >= MAX_FILES) return;
      if (f.size > MAX_SIZE) {
        showErrorToast(`${f.name} is larger than 10MB`);
        return;
      }
      if (!next.some((e) => e.name === f.name && e.size === f.size)) {
        next.push(f);
      }
    });
    setFiles(next.slice(0, MAX_FILES));
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const canSubmit = useMemo(
    () => !!category && title.trim().length > 0 && description.trim().length > 0,
    [category, title, description]
  );

  const handleSubmit = () => {
    setError(null);
    if (!category) return setError("Please choose a category");
    if (!title.trim()) return setError("Please add a title");
    if (!description.trim()) return setError("Please describe your voice");

    const fd = new FormData();
    fd.append("category", category);
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("priority", priority);
    if (department) fd.append("department", department);
    fd.append("isAnonymous", String(isAnonymous));
    files.forEach((f) => fd.append("attachments", f));

    submit.mutate(fd, {
      onSuccess: () => {
        setPhase("success");
        showSuccessToast("Your voice has been submitted", { icon: "announce" });
        setTimeout(close, 1900);
      },
      onError: (err: any) => {
        setError(
          err?.response?.data?.message || "Something went wrong. Please try again."
        );
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title="Share your voice"
      description="Report an issue, raise a concern, suggest an idea or send appreciation."
      icon={<PaperClipIcon className="h-5 w-5" />}
      hideClose={submit.isPending}
      closeOnBackdrop={!submit.isPending}
    >
      <AnimatePresence mode="wait">
        {phase === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-14 text-center"
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative"
            >
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-400/30" />
              <CheckCircleIcon className="h-20 w-20 text-emerald-500" />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-5 text-lg font-bold text-gray-900 dark:text-white"
            >
              Voice submitted!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="mt-1 text-sm text-gray-500 dark:text-gray-400"
            >
              {isAnonymous
                ? "Submitted anonymously. HR will review it shortly."
                : "Thanks for speaking up - HR will review it shortly."}
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 pt-1"
          >
            {/* Category */}
            <div>
              <p className={eyebrow}>Category</p>
              <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {CATEGORY_LIST.map((c) => {
                  const Icon = c.icon;
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCategory(c.key)}
                      className={`group flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                        active
                          ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/15 dark:border-blue-400 dark:bg-blue-500/10"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.tile}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {c.label}
                      </span>
                      <span className="text-[11px] leading-tight text-gray-500 dark:text-gray-400">
                        {c.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between">
                <p className={eyebrow}>Title</p>
                <span className="text-[11px] tabular-nums text-gray-400">
                  {title.length}/140
                </span>
              </div>
              <input
                value={title}
                maxLength={140}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A short summary..."
                className={`${inputClass} mt-2`}
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between">
                <p className={eyebrow}>Description</p>
                <span className="text-[11px] tabular-nums text-gray-400">
                  {description.length}/4000
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share the details. The more context you give, the faster HR can help..."
                className={`${inputClass} mt-2 resize-none`}
              />
            </div>

            {/* Priority + Department */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className={eyebrow}>Priority</p>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {PRIORITY_LIST.map((p) => {
                    const active = priority === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPriority(p.key)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                          active
                            ? "border-blue-500 bg-blue-50/60 text-blue-700 ring-2 ring-blue-500/15 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className={eyebrow}>Department</p>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className={`${inputClass} mt-2`}
                />
              </div>
            </div>

            {/* Attachments */}
            <div>
              <p className={eyebrow}>
                Attachments{" "}
                <span className="font-normal normal-case text-gray-400">
                  (optional)
                </span>
              </p>
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
                  addFiles(e.dataTransfer.files);
                }}
                className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  dragOver
                    ? "border-blue-400 bg-blue-50/50 dark:bg-blue-500/5"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <DocumentArrowUpIcon className="h-6 w-6 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-[11px] text-gray-400">
                  Images or PDF, up to 10MB each ({files.length}/{MAX_FILES})
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-1.5 overflow-hidden"
                  >
                    {files.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2 text-sm dark:border-gray-700/60 dark:bg-gray-800/50"
                      >
                        <PaperClipIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200">
                          {f.name}
                        </span>
                        <span className="flex-shrink-0 text-[11px] tabular-nums text-gray-400">
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(i);
                          }}
                          className="flex-shrink-0 rounded-md p-0.5 text-gray-400 hover:bg-gray-200/70 hover:text-red-500 dark:hover:bg-gray-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Anonymous toggle */}
            <button
              type="button"
              onClick={() => setIsAnonymous((v) => !v)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                isAnonymous
                  ? "border-blue-500 bg-blue-50/60 dark:border-blue-400 dark:bg-blue-500/10"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <span
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                  isAnonymous
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400"
                }`}
              >
                <EyeSlashIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Submit anonymously
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                  Your name won't be shown to HR. You'll still get replies.
                </span>
              </span>
              <span
                className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                  isAnonymous ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${
                    isAnonymous ? "right-0.5" : "left-0.5"
                  }`}
                />
              </span>
            </button>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button
                type="button"
                onClick={close}
                disabled={submit.isPending}
                className="btn-secondary"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!canSubmit || submit.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submit.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Submit voice
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default SubmitVoiceModal;
