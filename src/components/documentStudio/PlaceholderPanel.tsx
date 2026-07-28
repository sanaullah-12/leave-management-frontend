import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PLACEHOLDERS } from "./constants";
import type { PlaceholderDef } from "./types";

interface Props {
  /** Insert the token at the caret (click). Drag is handled inline. */
  onInsert: (key: string) => void;
  disabled?: boolean;
}

const GROUP_ORDER: PlaceholderDef["group"][] = [
  "Employee",
  "Company",
  "Date",
  "Custom",
];

/**
 * Draggable placeholder palette. Each chip can be dragged onto the canvas or
 * clicked to insert at the caret — HR never types a {{token}} by hand.
 */
const PlaceholderPanel: React.FC<Props> = ({ onInsert, disabled }) => {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = PLACEHOLDERS.filter(
      (p) => !q || p.label.toLowerCase().includes(q)
    );
    return GROUP_ORDER.map((g) => ({
      group: g,
      items: items.filter((p) => p.group === g),
    })).filter((x) => x.items.length);
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        Drag a field into the document, or click to insert it at the cursor.
        Fields resolve to real employee data when you generate.
      </p>

      <div className="relative mb-3">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fields"
          className="w-full rounded-lg border border-gray-200 bg-white/70 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-0.5">
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {group}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {items.map((p) => (
                <motion.button
                  key={p.key}
                  type="button"
                  draggable={!disabled}
                  onDragStart={(e) => {
                    (e as unknown as React.DragEvent).dataTransfer.setData(
                      "text/placeholder",
                      p.key
                    );
                    (e as unknown as React.DragEvent).dataTransfer.effectAllowed =
                      "copy";
                  }}
                  onClick={() => !disabled && onInsert(p.key)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={disabled}
                  className="group flex items-center gap-2.5 rounded-lg border border-gray-200/70 bg-white/60 px-2.5 py-2 text-left transition-colors hover:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700/50 dark:bg-white/5"
                  style={{ cursor: disabled ? "not-allowed" : "grab" }}
                >
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md bg-gray-100 text-sm dark:bg-gray-700/60">
                    {p.glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {p.label}
                    </span>
                    <span className="block truncate text-[11px] text-gray-400 dark:text-gray-500">
                      {p.hint}
                    </span>
                  </span>
                  <span
                    className="rounded px-1 text-[10px] font-mono text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  >
                    {"{{ }}"}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}

        {grouped.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">
            No fields match “{query}”.
          </p>
        )}
      </div>
    </div>
  );
};

export default PlaceholderPanel;
