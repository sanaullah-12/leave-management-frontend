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
import {
  FOUR_UP_COLUMNS,
  KPI_MEASURE,
  StatCard,
  type StatCardProps,
} from "../ui/StatCard";
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
    <div className={KPI_MEASURE}>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        /* Four across, as every other KPI row in the product. Two across when
           four will not fit: a column of full-width bands is 300px of figures
           before the screen's actual content starts. No `grid-cols-2` utility
           here - `kpi-four-up` carries the two-column base itself, and a
           utility would win the cascade over its container rule. */
        className={`grid gap-2.5 sm:gap-3 ${FOUR_UP_COLUMNS}`}
      >
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            variants={staggerItem}
            /* The fifth metric is a template's name rather than a count, so it
               takes the whole of the row under the four counts instead of
               sitting in the first of four empty cells. A name needs width a
               count does not. */
            className={i === 4 ? "kpi-span" : undefined}
          >
            <StatCard {...t} accent={i % 2 === 0 ? "indigo" : "teal"} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default StudioOverviewCards;
