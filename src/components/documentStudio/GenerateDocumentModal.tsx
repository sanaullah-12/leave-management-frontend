import React, { useEffect, useMemo, useState } from "react";
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
  formatDocumentDate,
  resolvePlaceholders,
  findUnresolved,
} from "./studioService";
import { exportPdf, exportDocx, printDocument } from "./exporters";
import DocumentPreview from "./DocumentPreview";
import type {
  BrandSettings,
  BrandingAsset,
  CompanyProfile,
  DocumentSubject,
  PageSettings,
  StudioDocument,
  TemplateField,
  TemplateVariant,
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

/** Fields every document can use, when a template declares none of its own. */
export const BASE_FIELDS: TemplateField[] = [
  {
    key: "Salary",
    label: "Gross salary",
    type: "text",
    placeholder: "e.g. PKR 250,000 per month",
    source: "salary",
  },
  {
    key: "Manager Name",
    label: "Reporting manager",
    type: "text",
    placeholder: "Full name",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  content: string;
  templateId: string | null;
  templateName: string;
  variant: TemplateVariant;
  fields: TemplateField[];
  referenceNo: string;
  page: PageSettings;
  assets: BrandingAsset[];
  company: CompanyProfile;
  brand: BrandSettings;
  employees: StudioEmployee[];
  employeesLoading: boolean;
  createdBy: string;
  /** Persist a generated document via the store; returns the stored doc (with its id). */
  onGenerate: (payload: {
    name: string;
    templateId: string | null;
    templateName: string;
    subject: DocumentSubject | null;
    content: string;
    variant: TemplateVariant;
    referenceNo: string;
    createdBy: string;
  }) => StudioDocument;
  onStatusChange: (docId: string, status: StudioDocument["status"]) => void;
}

const prefillFor = (
  field: TemplateField,
  employee: StudioEmployee
): string => {
  switch (field.source) {
    case "salary":
      return employee.salary != null ? String(employee.salary) : "";
    case "joinDate":
      return formatDocumentDate(employee.joinDate);
    case "designation":
      return employee.position ?? "";
    case "department":
      return employee.department ?? "";
    default:
      return "";
  }
};

/**
 * Generation flow: pick the employee, fill only what the template actually
 * needs, watch it merge into a live A4 preview, then export. The field list is
 * whatever the template declares, so a new document type brings its own form.
 */
const GenerateDocumentModal: React.FC<Props> = ({
  open,
  onClose,
  content,
  templateId,
  templateName,
  variant,
  fields,
  referenceNo,
  page,
  assets,
  company,
  brand,
  employees,
  employeesLoading,
  createdBy,
  onGenerate,
  onStatusChange,
}) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StudioEmployee | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [generatedDoc, setGeneratedDoc] = useState<StudioDocument | null>(null);

  const activeFields = fields.length ? fields : BASE_FIELDS;

  // Pull whatever the employee record already knows into the form.
  useEffect(() => {
    if (!selected) return;
    setValues((current) => {
      const next = { ...current };
      activeFields.forEach((f) => {
        const prefill = prefillFor(f, selected);
        if (prefill && !next[f.key]) next[f.key] = prefill;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

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

  const overrides = useMemo(() => {
    const map: Record<string, string> = {
      "Joining Date": formatDocumentDate(selected?.joinDate),
    };
    activeFields.forEach((f) => {
      const raw = values[f.key];
      if (!raw) return;
      map[f.key] = f.type === "date" ? formatDocumentDate(raw) : raw;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, selected, fields]);

  const resolutionMap = useMemo(
    () =>
      buildResolutionMap({
        subject,
        company,
        referenceNo,
        phone: selected?.phone,
        managerName: values["Manager Name"],
        salary: values.Salary,
        overrides,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subject, company, referenceNo, selected, overrides]
  );

  const previewBody = useMemo(
    () => resolvePlaceholders(content, resolutionMap, { highlightMissing: true }),
    [content, resolutionMap]
  );

  const cleanBody = useMemo(
    () => resolvePlaceholders(content, resolutionMap),
    [content, resolutionMap]
  );

  const unresolved = useMemo(() => findUnresolved(cleanBody), [cleanBody]);

  const docName = `${templateName}${selected ? ` - ${selected.name}` : ""}`;

  const ensureGenerated = (): StudioDocument => {
    if (generatedDoc) return generatedDoc;
    const doc = onGenerate({
      name: docName,
      templateId,
      templateName,
      subject,
      content: cleanBody,
      variant,
      referenceNo,
      createdBy,
    });
    setGeneratedDoc(doc);
    return doc;
  };

  const handleGenerate = () => {
    ensureGenerated();
    showSuccessToast("Document generated and saved to history");
  };

  const exportOpts = () => ({
    title: docName,
    bodyHtml: cleanBody,
    page,
    assets,
    company,
    brand,
    variant,
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
    setValues({});
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={reset}
      size="2xl"
      title="Generate Document"
      description={`${templateName} - ${referenceNo}`}
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
        {/* Left: employee + the fields this template needs */}
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

            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-1 dark:border-gray-700/50">
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
                          {[e.position, e.department].filter(Boolean).join(" - ") || "-"}
                        </span>
                      </span>
                      {active && <CheckCircleIcon className="h-4 w-4" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Fields declared by the template */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
              Document details
            </label>
            <div className="grid grid-cols-2 gap-3">
              {activeFields.map((f) => (
                <div key={f.key} className={f.wide ? "col-span-2" : undefined}>
                  <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {f.label}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={values[f.key] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                      className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      value={values[f.key] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {selected ? (
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              Employee details are read from the record of{" "}
              <strong className="text-gray-700 dark:text-gray-200">
                {selected.name}
              </strong>
              . Anything still highlighted in the preview needs a value above.
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
              <UserIcon className="h-4 w-4" />
              Pick an employee to auto-fill the document.
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div className="h-[460px]">
          <DocumentPreview
            title={docName}
            bodyHtml={previewBody}
            page={page}
            assets={assets}
            company={company}
            brand={brand}
            variant={variant}
            unresolved={unresolved}
            subjectLabel={
              selected ? `Resolved for ${selected.name}` : undefined
            }
          />
        </div>
      </div>
    </Modal>
  );
};

export default GenerateDocumentModal;
