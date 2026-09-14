import React from "react";
import Input from "../ui/Input";

/**
 * One leave type's balance, as a row.
 *
 * The bar fills with what is LEFT, so it and the figure beside it make the
 * same statement - a bar that empties while the number reads "18 left" is two
 * claims about one fact, and the reader has to decide which to trust.
 *
 * Rows, not cards: three rows share one track width, which is what makes the
 * types comparable. Three separate rings were three separate scales, drawn at
 * a weight that made the decoration louder than the numbers.
 *
 * Admin allocation editing swaps the bar for an input. The used figure stays
 * visible while editing, because an allocation set below days already taken is
 * the mistake this screen has to make obvious.
 */

interface Props {
  label: string;
  /** The leave type's colour. The same hex the charts use for this type. */
  color: string;
  allocated: number;
  used: number;
  remaining: number;
  /** Admin allocation edit mode. */
  editing?: boolean;
  editValue?: number;
  onChange?: (value: number) => void;
}

const LeaveBalanceRow: React.FC<Props> = ({
  label,
  color,
  allocated,
  used,
  remaining,
  editing = false,
  editValue = 0,
  onChange,
}) => {
  const percent = allocated > 0 ? Math.round((remaining / allocated) * 100) : 0;

  return (
    <div>
      {/* Stacked, never two texts on one line: these rows sit in a third of a
          card, where a label and a figure competing for the width wrap into
          each other. */}
      <p className="flex items-center gap-2 truncate text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </p>

      {editing ? (
        <>
          <Input
            type="number"
            min={0}
            max={365}
            value={editValue}
            onChange={(e) => onChange?.(parseInt(e.target.value) || 0)}
            className="mt-1.5"
            inputClassName="text-lg font-bold tabular-nums"
            aria-label={`${label} allocation in days per year`}
          />
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            {used} day{used === 1 ? "" : "s"} already taken
          </p>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {remaining}
            </span>{" "}
            of {allocated} days
          </p>

          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
            role="img"
            aria-label={`${label}: ${remaining} of ${allocated} days remaining, ${used} taken`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${percent}%`, backgroundColor: color }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default LeaveBalanceRow;
