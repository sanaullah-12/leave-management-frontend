import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  TrashIcon,
  ArrowUpRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Dropdown from "../ui/Dropdown";
import { CATEGORY_META } from "./constants";
import { studioIcon } from "./icons";
import { PANEL, tintFor, relativeTime } from "./ui";
import type { DocumentTemplate, TemplateCategory } from "./types";

interface Props {
  templates: DocumentTemplate[];
  activeId: string | null;
  canManage: boolean;
  onClose?: () => void;
  onUse: (tpl: DocumentTemplate) => void;
  onNew: () => void;
  onRename: (tpl: DocumentTemplate) => void;
  onDuplicate: (tpl: DocumentTemplate) => void;
  onArchive: (tpl: DocumentTemplate, archived: boolean) => void;
  onDelete: (tpl: DocumentTemplate) => void;
}

type Filter = "All" | TemplateCategory;

const TemplateCard: React.FC<{
  tpl: DocumentTemplate;
  active: boolean;
  canManage: boolean;
  onUse: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}> = ({ tpl, active, canManage, onUse, onRename, onDuplicate, onArchive, onDelete }) => {
  const tint = tintFor(CATEGORY_META[tpl.category].tint);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      whileHover={{ y: -3 }}
      onClick={onUse}
      className={`group relative cursor-pointer rounded-xl border p-3 transition-colors ${
        active
          ? "ring-2"
          : "border-gray-200/70 hover:border-transparent dark:border-gray-700/60"
      }`}
      style={
        active
          ? {
              borderColor: "transparent",
              boxShadow: "0 0 0 2px var(--accent)",
              backgroundColor: "var(--accent-soft)",
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg ${tint.chip}`}
        >
          {React.createElement(studioIcon(tpl.icon), { className: "h-5 w-5" })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {tpl.name}
            </h4>
            {tpl.archived && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                Archived
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
            {tpl.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tint.chip}`}
            >
              {CATEGORY_META[tpl.category].label}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Updated {relativeTime(tpl.updatedAt)}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            align="right"
            widthClass="w-44"
            bareButton
            buttonClassName="rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-black/5 hover:text-gray-700 group-hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-gray-200"
            sections={[
              {
                items: [
                  { label: "Use template", icon: ArrowUpRightIcon, onClick: onUse },
                  ...(canManage
                    ? [
                        { label: "Rename", icon: PencilIcon, onClick: onRename },
                        {
                          label: "Duplicate",
                          icon: DocumentDuplicateIcon,
                          onClick: onDuplicate,
                        },
                        {
                          label: tpl.archived ? "Unarchive" : "Archive",
                          icon: tpl.archived ? ArchiveBoxXMarkIcon : ArchiveBoxIcon,
                          onClick: onArchive,
                        },
                      ]
                    : []),
                ],
              },
              ...(canManage && !tpl.system
                ? [
                    {
                      items: [
                        {
                          label: "Delete",
                          icon: TrashIcon,
                          danger: true,
                          onClick: onDelete,
                        },
                      ],
                    },
                  ]
                : []),
            ]}
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </Dropdown>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Left column - searchable, category-filtered template library. Purely
 * presentational; all mutations bubble up to the page.
 */
const TemplateLibrary: React.FC<Props> = ({
  templates,
  activeId,
  canManage,
  onClose,
  onUse,
  onNew,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
}) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [showArchived, setShowArchived] = useState(false);

  const categories: Filter[] = useMemo(() => {
    const present = new Set<TemplateCategory>(templates.map((t) => t.category));
    return ["All", ...(Object.keys(CATEGORY_META) as TemplateCategory[]).filter(
      (c) => present.has(c)
    )];
  }, [templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates
      .filter((t) => (showArchived ? true : !t.archived))
      .filter((t) => filter === "All" || t.category === filter)
      .filter(
        (t) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [templates, query, filter, showArchived]);

  return (
    <div className={`flex h-full flex-col ${PANEL}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-3 dark:border-gray-700/50">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Template Library
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {filtered.length} templates
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {canManage && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onNew}
              title="New template"
              className="grid h-8 w-8 place-items-center rounded-lg text-white shadow-sm"
              style={{ background: "var(--accent)" }}
            >
              <PlusIcon className="h-4 w-4" />
            </motion.button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              title="Close"
              className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            className="w-full rounded-lg border border-gray-200 bg-white/70 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => {
          const active = filter === c;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700/60 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
              style={active ? { background: "var(--accent)" } : undefined}
            >
              {c === "All" ? "All" : CATEGORY_META[c].label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              tpl={tpl}
              active={tpl.id === activeId}
              canManage={canManage}
              onUse={() => onUse(tpl)}
              onRename={() => onRename(tpl)}
              onDuplicate={() => onDuplicate(tpl)}
              onArchive={() => onArchive(tpl, !tpl.archived)}
              onDelete={() => onDelete(tpl)}
            />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No templates found
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Try a different search or category.
            </p>
          </div>
        )}
      </div>

      {/* Footer toggle */}
      <button
        onClick={() => setShowArchived((v) => !v)}
        className="border-t border-gray-200/70 px-4 py-2.5 text-left text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 dark:border-gray-700/50 dark:text-gray-400 dark:hover:text-gray-200"
      >
        {showArchived ? "Hide archived" : "Show archived"}
      </button>
    </div>
  );
};

export default TemplateLibrary;
