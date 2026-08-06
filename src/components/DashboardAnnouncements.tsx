import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  MegaphoneIcon,
  ArrowRightIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { announcementsAPI } from "../services/api";
import { categoryIcon } from "./announcements/categoryIcons";

interface Item {
  _id: string;
  title: string;
  category: string;
  pinned: boolean;
  createdAt: string;
  authorName: string;
  author?: { name?: string };
}

const isFresh = (iso: string) =>
  Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;

/**
 * Dashboard highlight - surfaces announcements posted in the last 24 hours
 * (plus anything HR pinned) so fresh news greets everyone on sign-in. Renders
 * nothing when there's nothing to show.
 */
const DashboardAnnouncements: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["dashboard-announcements"],
    queryFn: async () => {
      const res = await announcementsAPI.getDashboard();
      return (res.data?.announcements ?? []) as Item[];
    },
    staleTime: 60 * 1000,
  });

  const items = data ?? [];
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="announce-attn overflow-hidden rounded-2xl bg-white dark:bg-gray-800/60"
    >
      <div className="h-1 w-full" style={{ background: "var(--accent)" }} />
      <div className="p-5">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-blue-600 dark:text-blue-400"
            >
              <MegaphoneIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-card-title font-bold text-gray-900 dark:text-white">
                Announcements
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Fresh updates from your team
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/announcements")}
            className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--accent)" }}
          >
            View all <ArrowRightIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-700/50">
          {items.map((a) => {
            const CategoryIcon = categoryIcon(a.category);
            return (
            <button
              key={a._id}
              onClick={() => navigate("/announcements")}
              className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:opacity-90"
            >
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-gray-500 dark:text-gray-400">
                <CategoryIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {a.title}
                  </p>
                  {a.pinned && (
                    <BookmarkIcon
                      className="h-3.5 w-3.5 flex-shrink-0 text-amber-500"
                      title="Pinned"
                    />
                  )}
                  {isFresh(a.createdAt) && (
                    <span
                      className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      New
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                  {a.author?.name || a.authorName} ·{" "}
                  {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                </p>
              </div>
            </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

export default DashboardAnnouncements;
