import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/solid";

/**
 * Status pill for a work from home request.
 *
 * Icon plus word, never colour alone - same rule the attendance badges follow,
 * so the two read as one system.
 */

/**
 * Each state is a class pair, not a fixed fill. The light half is the original
 * palette; the dark half is a low-alpha wash of the same hue with the label a
 * step lighter, because a #e4f5ec fill on a #1b1e27 card is not a pale tint of
 * green - it is a white chip.
 */
const META: Record<
  string,
  { className: string; Icon: typeof CheckCircleIcon; label: string }
> = {
  pending: {
    className:
      "text-[var(--warning-text)] bg-[#fdf0df] border-[#f5d9ae] dark:text-amber-300 dark:bg-amber-400/15 dark:border-amber-400/25",
    Icon: ClockIcon,
    label: "Pending",
  },
  approved: {
    className:
      "text-[var(--success-text)] bg-[#e4f5ec] border-[#bfe6d3] dark:text-emerald-300 dark:bg-emerald-400/15 dark:border-emerald-400/25",
    Icon: CheckCircleIcon,
    label: "Approved",
  },
  rejected: {
    className:
      "text-[var(--danger-text)] bg-[#fbeaea] border-[#f3c6c3] dark:text-red-300 dark:bg-red-400/15 dark:border-red-400/25",
    Icon: XCircleIcon,
    label: "Rejected",
  },
  cancelled: {
    className:
      "text-[var(--text-muted)] bg-[#f1f3f6] border-[#dde1e7] dark:text-gray-300 dark:bg-white/10 dark:border-white/15",
    Icon: MinusCircleIcon,
    label: "Cancelled",
  },
};

interface Props {
  status: string;
  compact?: boolean;
  /**
   * A dot in place of the icon, for the request list.
   *
   * At 12px a tick, a cross and a clock are three shapes competing with the
   * word beside them, and a column of them reads as noise down a long table.
   * The dot carries the colour and lets the label do the naming. Everywhere a
   * badge stands alone - a card, a drawer header - the icon still earns its
   * place, so it stays the default.
   */
  dot?: boolean;
}

/** Dot fills, matched to each state's text colour. */
const DOT: Record<string, string> = {
  pending: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
  cancelled: "bg-gray-400",
};

const WfhStatusBadge: React.FC<Props> = ({
  status,
  compact = false,
  dot = false,
}) => {
  const meta = META[status] || META.pending;
  const { Icon } = meta;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold leading-tight ${
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${meta.className}`}
    >
      {dot ? (
        <span
          className={`h-1.5 w-1.5 rounded-full ${DOT[status] || DOT.pending}`}
        />
      ) : (
        <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      )}
      {meta.label}
    </span>
  );
};

export default WfhStatusBadge;
