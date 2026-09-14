import React from "react";
import { motion } from "framer-motion";
import {
  RectangleStackIcon,
  DocumentCheckIcon,
  PencilSquareIcon,
  SparklesIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { StatCard, type StatCardProps } from "../ui/StatCard";
import type { StudioStats } from "./useStudioStore";

interface Props {
  stats: StudioStats;
}

/**
 * The five headline metrics for Document Studio.
 *
 * Renders the product's shared StatCard, so a figure here is the same tile as
 * one on the dashboard, in payroll or on a report.
 */
const StudioOverviewCards: React.FC<Props> = ({ stats }) => {
  const tiles: Array<Omit<StatCardProps, "accent">> = [
    {
      label: "Total Templates",
      value: stats.totalTemplates,
      icon: <RectangleStackIcon className="h-5 w-5" />,
    },
    {
      label: "Generated Documents",
      value: stats.generatedDocuments,
      icon: <DocumentCheckIcon className="h-5 w-5" />,
    },
    {
      label: "Draft Documents",
      value: stats.draftDocuments,
      icon: <PencilSquareIcon className="h-5 w-5" />,
    },
    {
      label: "Recently Created",
      value: stats.recentlyCreated,
      icon: <SparklesIcon className="h-5 w-5" />,
    },
    {
      // A name, not a count - the tile prints strings as given.
      label: "Most Used Template",
      value: stats.mostUsedTemplate?.name ?? "-",
      suffix: stats.mostUsedTemplate
        ? `${stats.mostUsedTemplate.usageCount}x`
        : undefined,
      icon: <TrophyIcon className="h-5 w-5" />,
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      // Same rule as StatCardRow: auto-fit from 11rem, then share what is
      // left, so the row ends flush with the content below it.
      className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]"
    >
      {tiles.map((t, i) => (
        <motion.div key={t.label} variants={staggerItem}>
          <StatCard {...t} accent={i % 2 === 0 ? "indigo" : "teal"} />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StudioOverviewCards;
