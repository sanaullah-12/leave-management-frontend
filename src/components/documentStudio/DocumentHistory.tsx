import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowUpRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Select from "../ui/Select";
import Avatar from "../Avatar";
import { CARD } from "./ui";
import type { DocumentStatus, StudioDocument } from "./types";

interface Props {
  documents: StudioDocument[];
  onOpen: (doc: StudioDocument) => void;
  onDelete: (doc: StudioDocument) => void;
  onExport: (doc: StudioDocument) => void;
  onPrint: (doc: StudioDocument) => void;
}

const STATUS_STYLE: Record<DocumentStatus, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
  generated: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  downloaded: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  printed: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/** Document history with search + status/template filters. */
const DocumentHistory: React.FC<Props> = ({
  documents,
  onOpen,
  onDelete,
  onExport,
  onPrint,
}) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [template, setTemplate] = useState("all");

  const templateOptions = useMemo(() => {
    const set = new Map<string, string>();
    documents.forEach((d) => set.set(d.templateName, d.templateName));
    return [
      { value: "all", label: "All templates" },
      ...[...set.values()].map((t) => ({ value: t, label: t })),
    ];
  }, [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents
      .filter((d) => status === "all" || d.status === status)
      .filter((d) => template === "all" || d.templateName === template)
      .filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          d.subject?.name?.toLowerCase().includes(q) ||
          d.subject?.department?.toLowerCase().includes(q) ||
          d.templateName.toLowerCase().includes(q) ||
          d.createdBy.toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [documents, query, status, template]);

  return (
    <div className={`${CARD} p-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-card-title text-gray-900 dark:text-white">
            Document History
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Every generated document, searchable and filterable.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history"
              className="w-48 rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="w-36">
            <Select
              value={status}
              onChange={setStatus}
              options={[
                { value: "all", label: "All statuses" },
                { value: "draft", label: "Draft", dotColor: "#9ca3af" },
                { value: "generated", label: "Generated", dotColor: "#3b82f6" },
                { value: "downloaded", label: "Downloaded", dotColor: "#10b981" },
                { value: "printed", label: "Printed", dotColor: "#8b5cf6" },
              ]}
            />
          </div>
          <div className="w-40">
            <Select value={template} onChange={setTemplate} options={templateOptions} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 dark:bg-gray-700/60">
              <ClockIcon className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {documents.length === 0
                ? "No documents generated yet"
                : "No documents match your filters"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Generated documents will appear here with full history.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200/70 text-left dark:border-gray-700/50">
                {["Document", "Employee", "Template", "Generated", "By", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((d) => (
                  <motion.tr
                    key={d.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group border-b border-gray-100 transition-colors hover:bg-black/[0.02] dark:border-gray-800 dark:hover:bg-white/[0.03]"
                  >
                    <td className="max-w-[220px] px-3 py-3">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {d.name}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {d.subject ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={d.subject.name} size="sm" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {d.subject.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                      {d.templateName}
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                      {fmt(d.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                      {d.createdBy}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[d.status]}`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => onOpen(d)}
                          title="Open in editor"
                          className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                        >
                          <ArrowUpRightIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onExport(d)}
                          title="Download PDF"
                          className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onPrint(d)}
                          title="Print"
                          className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(d)}
                          title="Delete"
                          className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <DocumentDuplicateIcon className="h-4 w-4" />
          {filtered.length} of {documents.length} documents
        </p>
      )}
    </div>
  );
};

export default DocumentHistory;
