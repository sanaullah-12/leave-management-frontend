import React from "react";
import { motion } from "framer-motion";
import {
  RectangleStackIcon,
  DocumentCheckIcon,
  PencilSquareIcon,
  SparklesIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import AnimatedNumber from "../AnimatedNumber";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { CARD, CARD_HOVER } from "./ui";
import type { StudioStats } from "./useStudioStore";

interface Props {
  stats: StudioStats;
}

interface Tile {
  label: string;
  value: number | string;
  caption: string;
  icon: React.ReactNode;
  gradient: string;
}

/**
 * The five headline metrics for Document Studio. Mirrors the dashboard KPI tile
 * exactly (neumorphic surface, count-up numbers, hover lift + icon micro-tilt)
 * so it reads as part of the same product.
 */
const StudioOverviewCards: React.FC<Props> = ({ stats }) => {
  const tiles: Tile[] = [
    {
      label: "Total Templates",
      value: stats.totalTemplates,
      caption: "Ready-to-use blueprints",
      icon: <RectangleStackIcon className="h-6 w-6" />,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Generated Documents",
      value: stats.generatedDocuments,
      caption: "Issued to employees",
      icon: <DocumentCheckIcon className="h-6 w-6" />,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Draft Documents",
      value: stats.draftDocuments,
      caption: "Saved & in progress",
      icon: <PencilSquareIcon className="h-6 w-6" />,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Recently Created",
      value: stats.recentlyCreated,
      caption: "In the last 7 days",
      icon: <SparklesIcon className="h-6 w-6" />,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      label: "Most Used Template",
      value: stats.mostUsedTemplate?.name ?? "-",
      caption: stats.mostUsedTemplate
        ? `${stats.mostUsedTemplate.usageCount} generations`
        : "No usage yet",
      icon: <TrophyIcon className="h-6 w-6" />,
      gradient: "from-pink-500 to-rose-600",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {tiles.map((t) => (
        // `h-full` on both the grid item and the card: the motion wrapper is
        // what the grid stretches, so without it the card only grew to its own
        // content and short tiles floated in a taller row.
        <motion.div key={t.label} variants={staggerItem} className="h-full">
          <div className={`group ${CARD} ${CARD_HOVER} flex h-full flex-col p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p
                  className="text-overline truncate text-gray-400 dark:text-gray-500"
                  title={t.label}
                >
                  {t.label}
                </p>
                {/* Fixed-height value line so a text value (e.g. a template
                    name) and a count-up number sit on the same baseline. */}
                <p className="mt-2 flex min-h-[2rem] min-w-0 items-end sm:min-h-[2.25rem]">
                  {typeof t.value === "number" ? (
                    <span className="text-2xl font-bold tabular-nums leading-none text-gray-900 sm:text-3xl dark:text-white">
                      <AnimatedNumber value={t.value} />
                    </span>
                  ) : (
                    <span
                      className="block min-w-0 truncate text-lg font-bold leading-tight text-gray-900 dark:text-white"
                      title={t.value}
                    >
                      {t.value}
                    </span>
                  )}
                </p>
              </div>
              <div
                className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br ${t.gradient} text-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:-rotate-3`}
              >
                {t.icon}
              </div>
            </div>
            {/* Pinned to the bottom so captions align across the whole row,
                however many lines each one wraps to. */}
            <p className="mt-auto pt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t.caption}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StudioOverviewCards;
