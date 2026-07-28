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

// Neumorphic (soft-UI) card surface — matches the dashboard cards. Dual
// shadows extrude the card from the page; hover deepens them (the lift itself
// is driven by framer-motion's whileHover below).
const cardShell =
  "group rounded-2xl bg-[var(--card-surface)] " +
  "shadow-[7px_7px_16px_rgba(174,186,204,0.5),-7px_-7px_16px_rgba(255,255,255,0.95)] " +
  "dark:shadow-[7px_7px_18px_rgba(0,0,0,0.55),-6px_-6px_16px_rgba(255,255,255,0.045)] " +
  "transition-shadow duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "hover:shadow-[12px_12px_24px_rgba(174,186,204,0.6),-12px_-12px_24px_rgba(255,255,255,1)] " +
  "dark:hover:shadow-[12px_12px_28px_rgba(0,0,0,0.7),-10px_-10px_24px_rgba(255,255,255,0.06)]";

const MiniStat: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  tile: string;
}> = ({ label, value, icon, tile }) => (
  <div className="flex items-center gap-2.5 rounded-xl bg-[var(--card-surface)] p-3 shadow-[inset_2px_2px_5px_rgba(174,186,204,0.55),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.55),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]">
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
  const { data: myVoices = [] } = useVoices({});
  const [submitOpen, setSubmitOpen] = useState(false);

  const header = (
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:-rotate-6">
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
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cardShell}
      >
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
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cardShell}
      >
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
