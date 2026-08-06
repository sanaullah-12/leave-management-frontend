import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  ClockIcon,
  CheckCircleIcon,
  FireIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useVoices, useVoiceStats } from "../hooks/useEmployeeVoice";
import SubmitVoiceModal from "../components/voice/SubmitVoiceModal";
import VoiceDetailDrawer from "../components/voice/VoiceDetailDrawer";
import { staggerContainer, staggerItem } from "../lib/motion";
import {
  CATEGORY_META,
  STATUS_META,
  PRIORITY_META,
  STATUS_LIST,
  employeeDisplayName,
} from "../lib/voiceMeta";
import type { EmployeeVoice, VoiceStatus } from "../types/employeeVoice";
import "../styles/design-system.css";

const FILTERS: { key: "all" | VoiceStatus; label: string }[] = [
  { key: "all", label: "All" },
  ...STATUS_LIST.map((s) => ({ key: s.key, label: s.label })),
];

const StatChip: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  tile: string;
}> = ({ label, value, icon, tile }) => (
  <div className="flex items-center gap-3 surface-card p-4">
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile}`}>
      {icon}
    </span>
    <div>
      <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>
    </div>
  </div>
);

const VoiceCard: React.FC<{
  voice: EmployeeVoice;
  onOpen: () => void;
}> = ({ voice, onOpen }) => {
  const cat = CATEGORY_META[voice.category];
  const Icon = cat.icon;
  return (
    <motion.button
      variants={staggerItem}
      onClick={onOpen}
      whileHover={{ y: -2 }}
      className="flex w-full items-start gap-4 surface-card surface-card-interactive p-4 text-left"
    >
      <span
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${cat.tile}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate font-semibold text-gray-900 dark:text-gray-100">
            {voice.title}
          </p>
          <span
            className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_META[voice.status].badge}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${STATUS_META[voice.status].dot}`}
            />
            {STATUS_META[voice.status].label}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
          {voice.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
          <span className="font-medium text-gray-500 dark:text-gray-400">
            {employeeDisplayName(voice.employee)}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_META[voice.priority].dot}`} />
            {PRIORITY_META[voice.priority].label}
          </span>
          <span>{cat.label}</span>
          {voice.replies?.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
              {voice.replies.length}
            </span>
          )}
          <span className="ml-auto">
            {formatDistanceToNow(new Date(voice.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

const EmployeeVoicePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<"all" | VoiceStatus>("all");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: voices = [], isLoading } = useVoices(
    filter === "all" ? {} : { status: filter }
  );
  const { data: stats } = useVoiceStats();

  // Deep-link support: /employee-voice?voice=<id> (from a notification click).
  useEffect(() => {
    const id = params.get("voice");
    if (id) {
      setSelectedId(id);
      params.delete("voice");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    voices.forEach((v) => {
      map[v.status] = (map[v.status] || 0) + 1;
    });
    return map;
  }, [voices]);

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <MegaphoneIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Employee Voice
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? "Every submission from your team - reports, ideas and appreciation."
              : "Report issues, suggest ideas, request support or send appreciation."}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setSubmitOpen(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          Share your voice
        </motion.button>
      </motion.div>

      {/* Admin stat chips */}
      {isAdmin && stats && (
        <motion.div
          variants={staggerItem}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <StatChip
            label="Pending"
            value={stats.pending}
            icon={<ClockIcon className="h-5 w-5" />}
            tile="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />
          <StatChip
            label="Resolved"
            value={stats.resolved}
            icon={<CheckCircleIcon className="h-5 w-5" />}
            tile="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          />
          <StatChip
            label="New Today"
            value={stats.newToday}
            icon={<SparklesIcon className="h-5 w-5" />}
            tile="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />
          <StatChip
            label="High Priority"
            value={stats.highPriority}
            icon={<FireIcon className="h-5 w-5" />}
            tile="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          />
        </motion.div>
      )}

      {/* Filter tabs */}
      <motion.div
        variants={staggerItem}
        className="flex gap-1.5 overflow-x-auto pb-1"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = f.key === "all" ? voices.length : counts[f.key];
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {f.label}
              {count ? (
                <span
                  className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                    active
                      ? "bg-white/20"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/60"
            />
          ))}
        </div>
      ) : voices.length === 0 ? (
        <motion.div
          variants={staggerItem}
          className="surface-card py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-blue-500">
            <MegaphoneIcon className="h-8 w-8" />
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            {filter === "all" ? "No submissions yet" : "Nothing here"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {isAdmin
              ? "Submissions from your team will appear here."
              : "Share your first voice - it only takes a minute."}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} className="space-y-3">
          {voices.map((v) => (
            <VoiceCard key={v._id} voice={v} onOpen={() => setSelectedId(v._id)} />
          ))}
        </motion.div>
      )}

      <SubmitVoiceModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
      <VoiceDetailDrawer
        voiceId={selectedId}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
      />
    </motion.div>
  );
};

export default EmployeeVoicePage;
