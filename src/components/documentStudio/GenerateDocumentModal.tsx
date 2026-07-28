import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  UserIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import Avatar from "../Avatar";
import { showSuccessToast } from "../../utils/toastHelpers";
import {
  buildResolutionMap,
  resolvePlaceholders,
  findUnresolved,
} from "./studioService";
import { composeDocumentHtml, exportPdf, exportDocx, printDocument } from "./exporters";
import type {
  BrandingAsset,
  DocumentSubject,
  PageSettings,
  StudioDocument,
} from "./types";

/** Minimal employee shape used by generation (superset-safe). */
export interface StudioEmployee {
  _id: string;
  name: string;
  employeeId?: string;
  department?: string;
  position?: string;
  email?: string;
  joinDate?: string;
  phone?: string;
  salary?: string | number;
  profilePicture?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  content: string;
  templateId: string | null;
  templateName: string;
  page: PageSettings;
  assets: BrandingAsset[];
  employees: StudioEmployee[];
  employeesLoading: boolean;
  companyName: string;
  companyAddress: string;
  createdBy: string;
  /** Persist a generated document via the store; returns the stored doc (with its id). */
  onGenerate: (payload: {
    name: string;
    templateId: string | null;
    templateName: string;
    subject: DocumentSubject | null;
    content: string;
    createdBy: string;
  }) => StudioDocument;
  onStatusChange: (docId: string, status: StudioDocument["status"]) => void;
}

const fmtDate = (v?: string) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

/**
 * Generation flow: pick employee → fields auto-resolve → live A4 preview →
 * generate + export (PDF / DOCX / Print). No copy-paste anywhere.
 */
const GenerateDocumentModal: React.FC<Props> = ({
  open,
  onClose,
  content,
  templateId,
  templateName,
  page,
  assets,
  employees,
  employeesLoading,
  companyName,
  companyAddress,
  createdBy,
  onGenerate,
  onStatusChange,
}) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudioEmployee | null>(null);
  const [salary, setSalary] = useState("");
  const [manager, setManager] = useState("");
  const [generatedDoc, setGeneratedDoc] = useState<StudioDocument | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees.slice(0, 40);
    return employees
      .filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.employeeId?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.department?.toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [employees, query]);

  const subject: DocumentSubject | null = selected
    ? {
        employeeId: selected.employeeId,
        name: selected.name,
        designation: selected.position,
        department: selected.department,
        email: selected.email,
      }
    : null;

  const resolvedBody = useMemo(() => {
    const map = buildResolutionMap({
      subject,
      companyName,
      companyAddress,
      managerName: manager,
      salary: salary || (selected?.salary != null ? String(selected.salary) : ""),
      phone: selected?.phone,
      overrides: { "Joining Date": fmtDate(selected?.joinDate) },
    });
    return resolvePlaceholders(content, map, { highlightMissing: true });
  }, [content, subject, companyName, companyAddress, manager, salary, selected]);

  const previewHtml = useMemo(
    () =>
      composeDocumentHtml({
        title: templateName,
        bodyHtml: resolvedBody,
        page,
        assets,
      }),
    [resolvedBody, templateName, page, assets]
  );

  const cleanBody = useMemo(() => {
    // Same resolution but without the missing-token highlight, for saving/export.
    const map = buildResolutionMap({
      subject,
      companyName,
      companyAddress,
      managerName: manager,
      salary: salary || (selected?.salary != null ? String(selected.salary) : ""),
      phone: selected?.phone,
      overrides: { "Joining Date": fmtDate(selected?.joinDate) },
    });
    return resolvePlaceholders(content, map);
  }, [content, subject, companyName, companyAddress, manager, salary, selected]);

  const unresolved = useMemo(() => findUnresolved(cleanBody), [cleanBody]);

  const docName = `${templateName}${selected ? ` — ${selected.name}` : ""}`;

  const ensureGenerated = (): StudioDocument => {
    if (generatedDoc) return generatedDoc;
    const doc = onGenerate({
      name: docName,
      templateId,
      templateName,
      subject,
      content: cleanBody,
      createdBy,
    });
    setGeneratedDoc(doc);
    return doc;
  };

  const handleGenerate = () => {
    ensureGenerated();
    showSuccessToast("Document generated & saved to history");
  };

  const exportOpts = () => ({
    title: docName,
    bodyHtml: cleanBody,
    page,
    assets,
  });

  const handlePdf = async () => {
    const doc = ensureGenerated();
    await exportPdf(exportOpts());
    onStatusChange(doc.id, "downloaded");
    showSuccessToast("PDF downloaded");
  };
  const handleDocx = () => {
    const doc = ensureGenerated();
    exportDocx(exportOpts());
    onStatusChange(doc.id, "downloaded");
    showSuccessToast("DOCX downloaded");
  };
  const handlePrint = () => {
    const doc = ensureGenerated();
    printDocument(exportOpts());
    onStatusChange(doc.id, "printed");
  };

  const reset = () => {
    setGeneratedDoc(null);
    setSelected(null);
    setQuery("");
    setSalary("");
    setManager("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={reset}
      size="2xl"
      title="Generate Document"
      description={templateName}
      icon={<DocumentTextIcon className="h-5 w-5" />}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            {unresolved.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {unresolved.length} field{unresolved.length > 1 ? "s" : ""} unresolved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircleIcon className="h-4 w-4" /> All fields resolved
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
              <PrinterIcon className="h-4 w-4" /> Print
            </button>
            <button onClick={handleDocx} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
              <DocumentArrowDownIcon className="h-4 w-4" /> DOCX
            </button>
            <button onClick={handlePdf} className="btn-secondary inline-flex items-center gap-1.5 text-sm">
              <DocumentArrowDownIcon className="h-4 w-4" /> PDF
            </button>
            <button onClick={handleGenerate} className="btn-primary inline-flex items-center gap-1.5 text-sm">
              <CheckCircleIcon className="h-4 w-4" />
              {generatedDoc ? "Saved" : "Generate & Save"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: employee + fields */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
              Select employee
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, ID, department"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-1 dark:border-gray-700/50">
              {employeesLoading ? (
                <div className="space-y-1 p-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/50" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-center text-xs text-gray-400">
                  No employees found.
                </p>
              ) : (
                filtered.map((e) => {
                  const active = selected?._id === e._id;
                  return (
                    <button
                      key={e._id}
                      onClick={() => setSelected(e)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                        active
                          ? "text-white"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                      style={active ? { background: "var(--accent)" } : undefined}
                    >
                      <Avatar src={e.profilePicture} name={e.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-medium ${
                            active ? "" : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {e.name}
                        </span>
                        <span
                          className={`block truncate text-[11px] ${
                            active ? "text-white/80" : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {e.position || "—"} · {e.department || "—"}
                        </span>
                      </span>
                      {active && <CheckCircleIcon className="h-4 w-4" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Manual fields not stored on the employee record */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                Salary <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. $6,500 / mo"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                Manager <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="Reporting manager"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          {selected ? (
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              Resolving fields for <strong className="text-gray-700 dark:text-gray-200">{selected.name}</strong>.
              Empty tokens are highlighted in the preview.
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <UserIcon className="h-4 w-4" />
              Pick an employee to auto-fill the document.
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
            Live preview
          </label>
          <motion.div
            key={selected?._id ?? "none"}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="h-[420px] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900/40"
          >
            {/* A4 at 96dpi ≈ 794×1123px, scaled to fit the preview pane. */}
            <iframe
              title="Document preview"
              srcDoc={previewHtml}
              className="origin-top-left"
              style={{
                width: "794px",
                height: "1123px",
                transform: "scale(0.5)",
                border: "0",
              }}
            />
          </motion.div>
        </div>
      </div>
    </Modal>
  );
};

export default GenerateDocumentModal;
