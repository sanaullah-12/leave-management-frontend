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

const META: Record<
  string,
  { fg: string; bg: string; border: string; Icon: typeof CheckCircleIcon; label: string }
> = {
  pending: {
    fg: "#b5650a",
    bg: "#fdf0df",
    border: "#f5d9ae",
    Icon: ClockIcon,
    label: "Pending",
  },
  approved: {
    fg: "#0f7a4c",
    bg: "#e4f5ec",
    border: "#bfe6d3",
    Icon: CheckCircleIcon,
    label: "Approved",
  },
  rejected: {
    fg: "#b42318",
    bg: "#fbeaea",
    border: "#f3c6c3",
    Icon: XCircleIcon,
    label: "Rejected",
  },
  cancelled: {
    fg: "#5c6470",
    bg: "#f1f3f6",
    border: "#dde1e7",
    Icon: MinusCircleIcon,
    label: "Cancelled",
  },
};

interface Props {
  status: string;
  compact?: boolean;
}

const WfhStatusBadge: React.FC<Props> = ({ status, compact = false }) => {
  const meta = META[status] || META.pending;
  const { Icon } = meta;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-semibold leading-tight ${
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
      style={{ color: meta.fg, background: meta.bg, borderColor: meta.border }}
    >
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {meta.label}
    </span>
  );
};

export default WfhStatusBadge;
