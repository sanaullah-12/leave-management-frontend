import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import {
  PaperClipIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Drawer from "../ui/Drawer";
import { useAuth } from "../../context/AuthContext";
import {
  useVoice,
  useVoiceReply,
  useUpdateVoiceStatus,
  useDeleteVoice,
} from "../../hooks/useEmployeeVoice";
import {
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  STATUS_LIST,
  employeeDisplayName,
  departmentName,
} from "../../lib/voiceMeta";
import { showErrorToast, showSuccessToast } from "../../utils/toastHelpers";
import type { VoiceReply, VoiceStatus } from "../../types/employeeVoice";

interface Props {
  voiceId: string | null;
  open: boolean;
  onClose: () => void;
}

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");
const fileUrl = (p: string) => (p.startsWith("http") ? p : `${API_ORIGIN}${p}`);

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}
  >
    {children}
  </span>
);

const ReplyBubble: React.FC<{ reply: VoiceReply }> = ({ reply }) => {
  const isAdmin = reply.authorRole === "admin";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAdmin ? "flex-row-reverse text-right" : ""}`}
    >
      <span
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          isAdmin
            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
            : "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300"
        }`}
      >
        {initials(reply.authorName || "?")}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={`flex items-center gap-2 ${isAdmin ? "justify-end" : ""}`}
        >
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {reply.authorName}
          </span>
          {isAdmin && (
            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              <ShieldCheckIcon className="h-3 w-3" /> HR
            </Badge>
          )}
        </div>
        <div
          className={`mt-1 inline-block rounded-2xl px-3.5 py-2 text-sm ${
            isAdmin
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
          }`}
        >
          {reply.message}
        </div>
        <p className="mt-1 text-[10px] text-gray-400">
          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  );
};

const VoiceDetailDrawer: React.FC<Props> = ({ voiceId, open, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: voice, isLoading } = useVoice(open ? voiceId : null);
  const replyM = useVoiceReply(voiceId || "");
  const statusM = useUpdateVoiceStatus(voiceId || "");
  const deleteM = useDeleteVoice();
  const [replyText, setReplyText] = useState("");

  const cat = voice ? CATEGORY_META[voice.category] : null;
  const CatIcon = cat?.icon || UserIcon;

  const sendReply = () => {
    if (!replyText.trim()) return;
    replyM.mutate(replyText.trim(), {
      onSuccess: () => setReplyText(""),
      onError: (e: any) =>
        showErrorToast(e?.response?.data?.message || "Failed to send reply"),
    });
  };

  const changeStatus = (status: VoiceStatus) => {
    if (!voice || voice.status === status) return;
    statusM.mutate(status, {
      onSuccess: () =>
        showSuccessToast(`Status set to ${STATUS_META[status].label}`),
      onError: (e: any) =>
        showErrorToast(e?.response?.data?.message || "Failed to update status"),
    });
  };

  const handleDelete = () => {
    if (!voiceId) return;
    if (!window.confirm("Delete this submission? This cannot be undone.")) return;
    deleteM.mutate(voiceId, {
      onSuccess: () => {
        showSuccessToast("Submission deleted");
        onClose();
      },
      onError: (e: any) =>
        showErrorToast(e?.response?.data?.message || "Failed to delete"),
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="xl"
      icon={<CatIcon className="h-5 w-5" />}
      iconClassName={cat?.tile}
      title={voice?.title || (isLoading ? "Loading..." : "Submission")}
      description={
        voice ? (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className={STATUS_META[voice.status].badge}>
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATUS_META[voice.status].dot}`}
              />
              {STATUS_META[voice.status].label}
            </Badge>
            <Badge className={PRIORITY_META[voice.priority].badge}>
              {PRIORITY_META[voice.priority].label} priority
            </Badge>
            {cat && <Badge className={cat.badge}>{cat.label}</Badge>}
          </div>
        ) : null
      }
      footer={
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply();
            }}
            placeholder={isAdmin ? "Reply to the employee..." : "Add a reply..."}
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-100"
          />
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={sendReply}
            disabled={!replyText.trim() || replyM.isPending}
            className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:opacity-40"
            aria-label="Send reply"
          >
            {replyM.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      }
    >
      {isLoading || !voice ? (
        <div className="space-y-4 p-5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/60"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6 p-5">
          {/* Submitter */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-700/60 dark:text-gray-300">
              {voice.employee?.anonymous ? "??" : initials(voice.employee?.name || "?")}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {employeeDisplayName(voice.employee)}
                {voice.isAnonymous && (
                  <span className="ml-2 text-[11px] font-normal text-gray-400">
                    (anonymous)
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {departmentName(voice.employee?.department) ||
                  voice.department ||
                  "-"}{" "}
                • {format(new Date(voice.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
              {voice.description}
            </p>
          </div>

          {/* Attachments */}
          {voice.attachments?.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Attachments
              </p>
              <div className="space-y-1.5">
                {voice.attachments.map((a, i) => (
                  <a
                    key={i}
                    href={fileUrl(a.path)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-gray-700/60 dark:bg-gray-800/50 dark:text-gray-200"
                  >
                    <PaperClipIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="min-w-0 flex-1 truncate">{a.originalName}</span>
                    <span className="flex-shrink-0 text-[11px] text-gray-400">
                      {(a.size / 1024).toFixed(0)} KB
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin: status control */}
          {isAdmin && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Update status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_LIST.map((s) => {
                  const active = voice.status === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => changeStatus(s.key)}
                      disabled={statusM.isPending}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                        active
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/15 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Conversation ({voice.replies?.length || 0})
            </p>
            {voice.replies?.length ? (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {voice.replies.map((r, i) => (
                    <ReplyBubble key={r._id || i} reply={r} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-400 dark:bg-gray-800/40">
                No replies yet. Start the conversation below.
              </p>
            )}
          </div>

          {/* Admin: delete */}
          {isAdmin && (
            <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
              <button
                onClick={handleDelete}
                disabled={deleteM.isPending}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                Delete submission
              </button>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default VoiceDetailDrawer;
