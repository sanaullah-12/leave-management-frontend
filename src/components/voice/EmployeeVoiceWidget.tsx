import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MegaphoneIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  FireIcon,
  ArrowRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useVoices, useVoiceStats } from "../../hooks/useEmployeeVoice";
import AnimatedNumber from "../AnimatedNumber";
import SubmitVoiceModal from "./SubmitVoiceModal";
import { STATUS_META } from "../../lib/voiceMeta";

const cardShell =
  "bg-gradient-to-br from-white to-slate-50/80 dark:from-gray-800/90 dark:to-gray-800/50 rounded-2xl shadow-[0_2px_8px_-2px_rgba(16,24,40,0.06),0_4px_16px_-4px_rgba(16,24,40,0.05)] ring-1 ring-gray-200/70 dark:ring-gray-700/60";

const MiniStat: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  tile: string;
}> = ({ label, value, icon, tile }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white/60 p-3 dark:border-gray-700/50 dark:bg-gray-800/40">
    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tile}`}>
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-lg font-bold leading-none tabular-nums text-gray-900 dark:text-white">
        <AnimatedNumber value={value} />
      </p>
      <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>
    </div>
  </div>
);

const EmployeeVoiceWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const { data: stats } = useVoiceStats();
  const { data: myVoices = [] } = useVoices({}, isAdmin ? 999999 : 20000);
  const [submitOpen, setSubmitOpen] = useState(false);

  const header = (
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <MegaphoneIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Employee Voice
          </h3>
          <p className="text-[11px] text-gray-400">
            {isAdmin ? "Team submissions" : "Your submissions"}
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate("/employee-voice")}
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        Open <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  if (isAdmin) {
    return (
      <motion.div whileHover={{ y: -2 }} className={cardShell}>
        {header}
        <div className="grid grid-cols-2 gap-2.5 px-5 pb-5 sm:grid-cols-4">
          <MiniStat
            label="Pending"
            value={stats?.pending ?? 0}
            icon={<ClockIcon className="h-4 w-4" />}
            tile="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          />
          <MiniStat
            label="Resolved"
            value={stats?.resolved ?? 0}
            icon={<CheckCircleIcon className="h-4 w-4" />}
            tile="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          />
          <MiniStat
            label="New Today"
            value={stats?.newToday ?? 0}
            icon={<SparklesIcon className="h-4 w-4" />}
            tile="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          />
          <MiniStat
            label="High Priority"
            value={stats?.highPriority ?? 0}
            icon={<FireIcon className="h-4 w-4" />}
            tile="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          />
        </div>
      </motion.div>
    );
  }

  // Employee view — quick submit CTA + own open submissions count.
  const openCount = myVoices.filter(
    (v) => v.status !== "resolved" && v.status !== "closed"
  ).length;

  return (
    <>
      <motion.div whileHover={{ y: -2 }} className={cardShell}>
        {header}
        <div className="flex items-center justify-between gap-4 px-5 pb-5">
          <div>
            <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
              <AnimatedNumber value={openCount} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              open submission{openCount === 1 ? "" : "s"}
              {myVoices.length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className={STATUS_META.resolved.badge + " rounded-full px-1.5 py-0.5 text-[10px]"}>
                    {myVoices.length} total
                  </span>
                </>
              )}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setSubmitOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Share
          </motion.button>
        </div>
      </motion.div>
      <SubmitVoiceModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </>
  );
};

export default EmployeeVoiceWidget;
