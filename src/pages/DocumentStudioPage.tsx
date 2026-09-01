import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  PlusIcon,
  DocumentTextIcon,
  BookmarkSquareIcon,
  CloudArrowUpIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  RectangleStackIcon,
  AdjustmentsHorizontalIcon,
  DocumentArrowUpIcon,
  SwatchIcon,
  PencilSquareIcon,
  EyeIcon,
  ViewColumnsIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { usersAPI } from "../services/api";
import { showSuccessToast, showErrorToast } from "../utils/toastHelpers";
import { staggerContainer, staggerItem } from "../lib/motion";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useStudioStore } from "../components/documentStudio/useStudioStore";
import StudioOverviewCards from "../components/documentStudio/StudioOverviewCards";
import StudioEmptyState from "../components/documentStudio/StudioEmptyState";
import TemplateLibrary from "../components/documentStudio/TemplateLibrary";
import DocumentCanvas, {
  type CanvasHandle,
} from "../components/documentStudio/DocumentCanvas";
import DocumentPreview from "../components/documentStudio/DocumentPreview";
import PropertiesPanel from "../components/documentStudio/PropertiesPanel";
import LetterheadManager from "../components/documentStudio/LetterheadManager";
import GenerateDocumentModal, {
  BASE_FIELDS,
  type StudioEmployee,
} from "../components/documentStudio/GenerateDocumentModal";
import ImportTemplateModal from "../components/documentStudio/ImportTemplateModal";
import DocumentHistory from "../components/documentStudio/DocumentHistory";
import { BLANK_TEMPLATE } from "../components/documentStudio/constants";
import {
  buildResolutionMap,
  findUnresolved,
  formatDocumentDate,
  nextReferenceNumber,
  resolvePlaceholders,
} from "../components/documentStudio/studioService";
import {
  exportPdf,
  printDocument,
} from "../components/documentStudio/exporters";
import type {
  DocumentTemplate,
  StudioDocument,
  TemplateField,
  TemplateVariant,
} from "../components/documentStudio/types";
import "../components/documentStudio/studio.css";

/** Editor working session - what's currently loaded into the canvas. */
interface Session {
  key: string; // forces canvas DOM reset
  html: string;
  templateId: string | null;
  templateName: string;
  variant: TemplateVariant;
  fields: TemplateField[];
  refCode: string;
  docId: string | null; // set when a saved document is being edited
}

type ViewMode = "split" | "editor" | "preview";

const VIEW_MODES: {
  key: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "editor", label: "Editor", icon: PencilSquareIcon },
  { key: "split", label: "Split", icon: ViewColumnsIcon },
  { key: "preview", label: "Preview", icon: EyeIcon },
];

const DocumentStudioPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const store = useStudioStore();
  const canvasRef = useRef<CanvasHandle>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProps, setShowProps] = useState(false);
  const [letterheadOpen, setLetterheadOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("split");
  const [previewEmployeeId, setPreviewEmployeeId] = useState<string>("");
  const [renameFor, setRenameFor] = useState<DocumentTemplate | "new" | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");
  const [confirmTpl, setConfirmTpl] = useState<DocumentTemplate | null>(null);
  const [confirmDoc, setConfirmDoc] = useState<StudioDocument | null>(null);

  // Employees for placeholder resolution (admins only).
  const { data: empData, isLoading: employeesLoading } = useQuery({
    queryKey: ["studio-employees"],
    queryFn: async () => {
      const res = await usersAPI.getEmployees(1, 200);
      return (
        (res.data as any)?.employees || (res.data as any)?.data?.employees || []
      );
    },
    enabled: canManage,
    staleTime: 5 * 60 * 1000,
  });
  const employees: StudioEmployee[] = empData ?? [];

  const { company, brand, page, assets, documents } = store.state;

  // Seed the company card from the signed-in account so the very first
  // document already carries a name instead of an empty letterhead.
  useEffect(() => {
    if (company.name || !user) return;
    store.setCompany({
      name: typeof user.company === "string" ? user.company : "",
      signatoryName: user.name ?? "",
      email: user.email ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, company.name]);

  // Close the floating Templates/Properties panels when clicking anywhere else.
  useEffect(() => {
    if (!showLibrary && !showProps) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el) return;
      // Keep open when interacting with the panels, their toggles, or any
      // portaled menu/listbox/dialog they spawned.
      if (
        el.closest("[data-studio-keep]") ||
        el.closest('[role="menu"],[role="listbox"],[role="dialog"]')
      )
        return;
      setShowLibrary(false);
      setShowProps(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showLibrary, showProps]);

  /* ---------------- session actions ---------------- */
  const loadTemplate = (tpl: DocumentTemplate) => {
    setSession({
      key: `tpl-${tpl.id}-${Date.now()}`,
      html: tpl.content,
      templateId: tpl.id,
      templateName: tpl.name,
      variant: tpl.variant ?? "letter",
      fields: tpl.fields ?? BASE_FIELDS,
      refCode: tpl.refCode ?? "DOC",
      docId: null,
    });
  };

  const startBlank = () => {
    setSession({
      key: `blank-${Date.now()}`,
      html: BLANK_TEMPLATE.content,
      templateId: null,
      templateName: "Untitled Document",
      variant: "letter",
      fields: BASE_FIELDS,
      refCode: "DOC",
      docId: null,
    });
  };

  const openDocument = (doc: StudioDocument) => {
    const tpl = store.state.templates.find((t) => t.id === doc.templateId);
    setSession({
      key: `doc-${doc.id}-${Date.now()}`,
      html: doc.content,
      templateId: doc.templateId,
      templateName: doc.templateName,
      variant: doc.variant ?? tpl?.variant ?? "letter",
      fields: tpl?.fields ?? BASE_FIELDS,
      refCode: tpl?.refCode ?? "DOC",
      docId: doc.id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentHtml = () => canvasRef.current?.getHtml() ?? session?.html ?? "";

  /* ---------------- live preview ---------------- */
  const referenceNo = useMemo(
    () => nextReferenceNumber(company, session?.refCode, documents),
    [company, session?.refCode, documents]
  );

  const previewEmployee =
    employees.find((e) => e._id === previewEmployeeId) ?? null;

  const previewBody = useMemo(() => {
    if (!session) return "";
    const map = buildResolutionMap({
      subject: previewEmployee
        ? {
            employeeId: previewEmployee.employeeId,
            name: previewEmployee.name,
            designation: previewEmployee.position,
            department: previewEmployee.department,
            email: previewEmployee.email,
          }
        : null,
      company,
      referenceNo,
      phone: previewEmployee?.phone,
      salary:
        previewEmployee?.salary != null ? String(previewEmployee.salary) : "",
      overrides: {
        "Joining Date": formatDocumentDate(previewEmployee?.joinDate),
      },
    });
    return resolvePlaceholders(session.html, map, { highlightMissing: true });
  }, [session, previewEmployee, company, referenceNo]);

  const previewUnresolved = useMemo(
    () => (session ? findUnresolved(previewBody) : []),
    [session, previewBody]
  );

  /* ---------------- template management ---------------- */
  const handleNewTemplate = () => {
    setRenameFor("new");
    setRenameValue("");
  };

  const handleImportTemplate = (name: string, html: string) => {
    const tpl = store.addTemplate({
      name,
      description: "Imported company template",
      category: "Custom",
      icon: "policy",
      content: html,
    });
    loadTemplate(tpl);
    setShowLibrary(false);
    showSuccessToast(`Imported "${name}"`);
  };

  const submitRename = () => {
    const name = renameValue.trim();
    if (!name) return;
    if (renameFor === "new") {
      const tpl = store.addTemplate({
        name,
        description: "Custom template",
        category: "Custom",
        icon: "blank",
        content: BLANK_TEMPLATE.content,
      });
      loadTemplate(tpl);
      showSuccessToast(`Template "${name}" created`);
    } else if (renameFor) {
      store.updateTemplate(renameFor.id, { name });
      showSuccessToast("Template renamed");
    }
    setRenameFor(null);
  };

  const saveAsTemplate = () => {
    if (!session) return;
    const html = currentHtml();
    const tpl = store.addTemplate({
      name: `${session.templateName} (Template)`,
      description: "Saved from the editor",
      category: "Custom",
      icon: "contract",
      variant: session.variant,
      fields: session.fields,
      refCode: session.refCode,
      content: html,
    });
    showSuccessToast("Saved as a reusable template");
    setSession((s) => (s ? { ...s, templateId: tpl.id } : s));
  };

  const saveDraft = () => {
    if (!session) return;
    const html = currentHtml();
    if (session.docId) {
      store.updateDocument(session.docId, { content: html, status: "draft" });
      showSuccessToast("Draft updated");
    } else {
      const doc = store.addDocument({
        name: session.templateName,
        templateId: session.templateId,
        templateName: session.templateName,
        subject: null,
        content: html,
        variant: session.variant,
        referenceNo,
        createdBy: user?.name ?? "You",
        status: "draft",
      });
      setSession((s) => (s ? { ...s, docId: doc.id } : s));
      showSuccessToast("Draft saved to history");
    }
  };

  /* ---------------- history exports ---------------- */
  const exportDocFromHistory = async (doc: StudioDocument) => {
    try {
      await exportPdf({
        title: doc.name,
        bodyHtml: doc.content,
        page,
        assets,
        company,
        brand,
        variant: doc.variant ?? "letter",
      });
      store.updateDocument(doc.id, { status: "downloaded" });
      showSuccessToast("PDF downloaded");
    } catch {
      showErrorToast("Could not export PDF");
    }
  };
  const printDocFromHistory = (doc: StudioDocument) => {
    printDocument({
      title: doc.name,
      bodyHtml: doc.content,
      page,
      assets,
      company,
      brand,
      variant: doc.variant ?? "letter",
    });
    store.updateDocument(doc.id, { status: "printed" });
  };

  const hasSession = !!session;
  const showEditor = view !== "preview";
  const showPreview = view !== "editor";

  const centerActions = useMemo(
    () => [
      {
        label: "Save as Template",
        icon: BookmarkSquareIcon,
        onClick: saveAsTemplate,
        show: canManage,
      },
      {
        label: "Save Draft",
        icon: CloudArrowUpIcon,
        onClick: saveDraft,
        show: true,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, canManage, referenceNo]
  );

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* ============ Header ============ */}
      <motion.div
        variants={staggerItem}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            <DocumentTextIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Document Studio
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create, manage and generate professional HR documents without
            leaving Nexora.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {canManage && (
            <button
              onClick={() => setLetterheadOpen(true)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <SwatchIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Branding</span>
            </button>
          )}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={startBlank}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            New Document
          </motion.button>
        </div>
      </motion.div>

      {/* ============ Overview cards ============ */}
      <motion.div variants={staggerItem}>
        <StudioOverviewCards stats={store.stats} />
      </motion.div>

      {/* ============ Branding prompt ============ */}
      {canManage && !company.addressLine1 && (
        <motion.div
          variants={staggerItem}
          className="flex flex-col gap-3 rounded-2xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: "var(--accent)",
            background: "var(--accent-soft)",
          }}
        >
          <div className="flex items-start gap-3">
            <SwatchIcon
              className="mt-0.5 h-5 w-5 flex-shrink-0"
              style={{ color: "var(--accent)" }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Finish your company letterhead
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Add your address, contact details and logo once. Every document
                you issue from now on carries them automatically.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLetterheadOpen(true)}
            className="btn-primary self-start whitespace-nowrap text-sm sm:self-auto"
          >
            Set up branding
          </button>
        </motion.div>
      )}

      {/* ============ Canvas-first workspace ============ */}
      <motion.div variants={staggerItem} className="space-y-3">
        {/* Control bar - the only always-visible chrome */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200/70 bg-white/80 px-2.5 py-2 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/70">
          <div className="flex min-w-0 items-center gap-2">
            <button
              data-studio-keep
              onClick={() => setShowLibrary((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showLibrary
                  ? "text-white"
                  : "text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
              }`}
              style={showLibrary ? { background: "var(--accent)" } : undefined}
            >
              <RectangleStackIcon className="h-4 w-4" />
              Templates
            </button>
            {canManage && (
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
              >
                <DocumentArrowUpIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}
            {hasSession && (
              <div className="flex min-w-0 items-center gap-1.5 border-l border-gray-200 pl-2 dark:border-gray-700">
                <DocumentTextIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {session!.templateName}
                </span>
                <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] text-gray-500 md:inline dark:bg-gray-700 dark:text-gray-400">
                  {referenceNo}
                </span>
                {session!.docId && (
                  <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 sm:inline dark:bg-gray-700 dark:text-gray-400">
                    saved
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {hasSession && (
              <div className="mr-1 flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-700/50">
                {VIEW_MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setView(m.key)}
                    title={m.label}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      view === m.key
                        ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    <m.icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{m.label}</span>
                  </button>
                ))}
              </div>
            )}
            {hasSession &&
              centerActions
                .filter((a) => a.show)
                .map((a) => (
                  <button
                    key={a.label}
                    onClick={a.onClick}
                    className="btn-secondary inline-flex items-center gap-1.5 !py-1.5 text-xs"
                  >
                    <a.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{a.label}</span>
                  </button>
                ))}
            {hasSession && (
              <button
                onClick={() => setGenerateOpen(true)}
                className="btn-primary inline-flex items-center gap-1.5 !py-1.5 text-xs"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Generate
              </button>
            )}
            <button
              data-studio-keep
              onClick={() => setShowProps((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showProps
                  ? "text-white"
                  : "text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
              }`}
              style={showProps ? { background: "var(--accent)" } : undefined}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Properties</span>
            </button>
          </div>
        </div>

        {/* Preview subject - which employee's data the preview merges in */}
        {hasSession && showPreview && canManage && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200/70 bg-white/60 px-3 py-2 text-xs dark:border-gray-700/50 dark:bg-gray-800/50">
            <UserCircleIcon className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-500 dark:text-gray-400">
              Preview with
            </span>
            <select
              value={previewEmployeeId}
              onChange={(e) => setPreviewEmployeeId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 outline-none sm:flex-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Sample placeholders</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                  {e.employeeId ? ` (${e.employeeId})` : ""}
                </option>
              ))}
            </select>
            {employeesLoading && (
              <span className="text-gray-400">Loading employees...</span>
            )}
          </div>
        )}

        {/* Stage - editor and preview side by side; panels float in on demand */}
        <div className="relative h-[640px] overflow-hidden rounded-2xl lg:h-[820px]">
          <div className="flex h-full gap-3">
            <div className={showEditor ? "min-w-0 flex-1" : "hidden"}>
              {hasSession ? (
                <DocumentCanvas
                  ref={canvasRef}
                  docKey={session!.key}
                  initialHtml={session!.html}
                  page={page}
                  assets={assets}
                  company={company}
                  brand={brand}
                  variant={session!.variant}
                  editable={canManage}
                  onChange={(html) =>
                    setSession((s) => (s ? { ...s, html } : s))
                  }
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-gray-200/70 bg-white/60 dark:border-gray-700/50 dark:bg-gray-800/50">
                  <StudioEmptyState
                    onCreate={
                      canManage ? startBlank : () => setShowLibrary(true)
                    }
                    headline="Your document canvas"
                    sub="Start blank, open Templates for a ready-made letter, or Import your own company template. Everything appears live on a real A4 page with your letterhead."
                    ctaLabel={
                      canManage ? "Start a blank document" : "Browse templates"
                    }
                  />
                </div>
              )}
            </div>

            {hasSession && showPreview && (
              <div
                className={`min-w-0 ${
                  view === "preview"
                    ? "flex-1"
                    : "hidden w-[42%] flex-none md:block"
                }`}
              >
                <DocumentPreview
                  title={session!.templateName}
                  bodyHtml={previewBody}
                  page={page}
                  assets={assets}
                  company={company}
                  brand={brand}
                  variant={session!.variant}
                  unresolved={previewUnresolved}
                  subjectLabel={
                    previewEmployee
                      ? `Merged with ${previewEmployee.name}`
                      : undefined
                  }
                  onHide={() => setView("editor")}
                />
              </div>
            )}
          </div>

          {/* Dim scrim (mobile) when a panel is open */}
          <AnimatePresence>
            {(showLibrary || showProps) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowLibrary(false);
                  setShowProps(false);
                }}
                className="absolute inset-0 z-20 bg-black/10 backdrop-blur-[1px] lg:hidden"
              />
            )}
          </AnimatePresence>

          {/* LEFT - Template library overlay */}
          <AnimatePresence>
            {showLibrary && (
              <motion.aside
                key="library"
                data-studio-keep
                initial={{ x: -28, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -28, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="absolute inset-y-0 left-0 z-30 w-[320px] max-w-[88%] p-2"
              >
                <div className="relative h-full rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                  <TemplateLibrary
                    templates={store.state.templates}
                    activeId={session?.templateId ?? null}
                    canManage={canManage}
                    onClose={() => setShowLibrary(false)}
                    onUse={(t) => {
                      loadTemplate(t);
                      setShowLibrary(false);
                    }}
                    onNew={handleNewTemplate}
                    onRename={(t) => {
                      setRenameFor(t);
                      setRenameValue(t.name);
                    }}
                    onDuplicate={(t) => {
                      const dup = store.duplicateTemplate(t.id);
                      if (dup) showSuccessToast(`Duplicated "${t.name}"`);
                    }}
                    onArchive={(t, archived) => {
                      store.archiveTemplate(t.id, archived);
                      showSuccessToast(archived ? "Archived" : "Unarchived");
                    }}
                    onDelete={(t) => setConfirmTpl(t)}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* RIGHT - Properties overlay */}
          <AnimatePresence>
            {showProps && (
              <motion.aside
                key="props"
                data-studio-keep
                initial={{ x: 28, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 28, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="absolute inset-y-0 right-0 z-30 w-[330px] max-w-[88%] p-2"
              >
                <div className="relative h-full rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                  <PropertiesPanel
                    page={page}
                    setPage={store.setPage}
                    company={company}
                    brand={brand}
                    setBrand={store.setBrand}
                    variant={session?.variant ?? "letter"}
                    onVariantChange={(variant) => {
                      setSession((s) => (s ? { ...s, variant } : s));
                      if (session?.templateId)
                        store.updateTemplate(session.templateId, { variant });
                    }}
                    templateFields={session?.fields}
                    onInsertToken={(key) => canvasRef.current?.insertToken(key)}
                    onOpenLetterhead={() => setLetterheadOpen(true)}
                    assetCount={assets.length}
                    canManage={canManage}
                    editable={hasSession && canManage}
                    onClose={() => setShowProps(false)}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ============ History ============ */}
      <motion.div variants={staggerItem}>
        <DocumentHistory
          documents={documents}
          onOpen={openDocument}
          onDelete={(d) => setConfirmDoc(d)}
          onExport={exportDocFromHistory}
          onPrint={printDocFromHistory}
        />
      </motion.div>

      {/* ============ Modals ============ */}
      <ImportTemplateModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImportTemplate}
      />

      <LetterheadManager
        open={letterheadOpen}
        onClose={() => setLetterheadOpen(false)}
        assets={assets}
        company={company}
        brand={brand}
        page={page}
        onAdd={store.addAsset}
        onUpdate={store.updateAsset}
        onDelete={store.deleteAsset}
        onCompanyChange={store.setCompany}
        onBrandChange={store.setBrand}
      />

      {session && (
        <GenerateDocumentModal
          open={generateOpen}
          onClose={() => setGenerateOpen(false)}
          content={currentHtml()}
          templateId={session.templateId}
          templateName={session.templateName}
          variant={session.variant}
          fields={session.fields}
          referenceNo={referenceNo}
          page={page}
          assets={assets}
          company={company}
          brand={brand}
          employees={employees}
          employeesLoading={employeesLoading}
          createdBy={user?.name ?? "You"}
          onGenerate={(payload) => {
            const doc = store.addDocument({ ...payload, status: "generated" });
            if (payload.templateId) store.bumpUsage(payload.templateId);
            return doc;
          }}
          onStatusChange={(docId, status) =>
            store.updateDocument(docId, { status })
          }
        />
      )}

      {/* Rename / create template modal */}
      <Modal
        open={renameFor !== null}
        onClose={() => setRenameFor(null)}
        size="sm"
        title={renameFor === "new" ? "New Template" : "Rename Template"}
        icon={<DocumentDuplicateIcon className="h-5 w-5" />}
        footer={
          <div className="flex w-full justify-end gap-2">
            <button
              onClick={() => setRenameFor(null)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button onClick={submitRename} className="btn-primary text-sm">
              {renameFor === "new" ? "Create" : "Save"}
            </button>
          </div>
        }
      >
        <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
          Template name
        </label>
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitRename()}
          placeholder="e.g. Probation Confirmation Letter"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
      </Modal>

      {/* Confirm delete template */}
      <ConfirmDialog
        open={!!confirmTpl}
        onClose={() => setConfirmTpl(null)}
        onConfirm={() => {
          if (confirmTpl) {
            store.deleteTemplate(confirmTpl.id);
            if (session?.templateId === confirmTpl.id) setSession(null);
            showSuccessToast("Template deleted");
          }
          setConfirmTpl(null);
        }}
        variant="danger"
        title={`Delete "${confirmTpl?.name}"?`}
        description="This custom template will be permanently removed."
        consequences={["This action cannot be undone."]}
        confirmLabel="Delete template"
      />

      {/* Confirm delete document */}
      <ConfirmDialog
        open={!!confirmDoc}
        onClose={() => setConfirmDoc(null)}
        onConfirm={() => {
          if (confirmDoc) {
            store.deleteDocument(confirmDoc.id);
            if (session?.docId === confirmDoc.id)
              setSession((s) => (s ? { ...s, docId: null } : s));
            showSuccessToast("Document deleted");
          }
          setConfirmDoc(null);
        }}
        variant="danger"
        title={`Delete "${confirmDoc?.name}"?`}
        description="This document will be removed from history."
        consequences={["This action cannot be undone."]}
        confirmLabel="Delete document"
      />
    </motion.div>
  );
};

export default DocumentStudioPage;
