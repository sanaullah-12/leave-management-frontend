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
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { usersAPI } from "../services/api";
import {
  showSuccessToast,
  showErrorToast,
} from "../utils/toastHelpers";
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
import PropertiesPanel from "../components/documentStudio/PropertiesPanel";
import LetterheadManager from "../components/documentStudio/LetterheadManager";
import GenerateDocumentModal, {
  type StudioEmployee,
} from "../components/documentStudio/GenerateDocumentModal";
import ImportTemplateModal from "../components/documentStudio/ImportTemplateModal";
import DocumentHistory from "../components/documentStudio/DocumentHistory";
import { BLANK_TEMPLATE } from "../components/documentStudio/constants";
import {
  exportPdf,
  printDocument,
} from "../components/documentStudio/exporters";
import type {
  DocumentTemplate,
  StudioDocument,
} from "../components/documentStudio/types";
import "../components/documentStudio/studio.css";

/** Editor working session — what's currently loaded into the canvas. */
interface Session {
  key: string; // forces canvas DOM reset
  html: string;
  templateId: string | null;
  templateName: string;
  docId: string | null; // set when a saved document is being edited
}

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
        (res.data as any)?.employees ||
        (res.data as any)?.data?.employees ||
        []
      );
    },
    enabled: canManage,
    staleTime: 5 * 60 * 1000,
  });
  const employees: StudioEmployee[] = empData ?? [];

  const companyName =
    (typeof user?.company === "string" && user.company) || "Your Company";

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
      docId: null,
    });
  };

  const startBlank = () => {
    setSession({
      key: `blank-${Date.now()}`,
      html: BLANK_TEMPLATE.content,
      templateId: null,
      templateName: "Untitled Document",
      docId: null,
    });
  };

  const openDocument = (doc: StudioDocument) => {
    setSession({
      key: `doc-${doc.id}-${Date.now()}`,
      html: doc.content,
      templateId: doc.templateId,
      templateName: doc.templateName,
      docId: doc.id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentHtml = () => canvasRef.current?.getHtml() ?? session?.html ?? "";

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
      icon: "📁",
      content: html,
    });
    loadTemplate(tpl);
    setShowLibrary(false);
    showSuccessToast(`Imported “${name}”`);
  };

  const submitRename = () => {
    const name = renameValue.trim();
    if (!name) return;
    if (renameFor === "new") {
      const tpl = store.addTemplate({
        name,
        description: "Custom template",
        category: "Custom",
        icon: "✨",
        content: BLANK_TEMPLATE.content,
      });
      loadTemplate(tpl);
      showSuccessToast(`Template “${name}” created`);
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
      icon: "📄",
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
        page: store.state.page,
        assets: store.state.assets,
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
      page: store.state.page,
      assets: store.state.assets,
    });
    store.updateDocument(doc.id, { status: "printed" });
  };

  const hasSession = !!session;

  const centerActions = useMemo(
    () => [
      { label: "Save as Template", icon: BookmarkSquareIcon, onClick: saveAsTemplate, show: canManage },
      { label: "Save Draft", icon: CloudArrowUpIcon, onClick: saveDraft, show: true },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, canManage]
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
            <span className="text-3xl">📄</span> Document Studio
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create, manage and generate professional HR documents without
            leaving Nexora.
          </p>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={startBlank}
          className="btn-primary inline-flex items-center gap-2 self-start"
        >
          <PlusIcon className="h-5 w-5" />
          New Document
        </motion.button>
      </motion.div>

      {/* ============ Overview cards ============ */}
      <motion.div variants={staggerItem}>
        <StudioOverviewCards stats={store.stats} />
      </motion.div>

      {/* ============ Canvas-first workspace ============ */}
      <motion.div variants={staggerItem} className="space-y-3">
        {/* Control bar — the only always-visible chrome */}
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
                {session!.docId && (
                  <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 sm:inline dark:bg-gray-700 dark:text-gray-400">
                    saved
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
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

        {/* Stage — canvas is full-width; panels float in on demand */}
        <div className="relative h-[640px] overflow-hidden rounded-2xl lg:h-[820px]">
          {/* Canvas / empty state (always full width underneath) */}
          <div className="h-full">
            {hasSession ? (
              <DocumentCanvas
                ref={canvasRef}
                docKey={session!.key}
                initialHtml={session!.html}
                page={store.state.page}
                assets={store.state.assets}
                editable={canManage}
                onChange={(html) => setSession((s) => (s ? { ...s, html } : s))}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-gray-200/70 bg-white/60 dark:border-gray-700/50 dark:bg-gray-800/50">
                <StudioEmptyState
                  onCreate={canManage ? startBlank : () => setShowLibrary(true)}
                  headline="Your document canvas"
                  sub="Start blank, open Templates for a ready-made letter, or Import your own company template (Word / HTML / design). Everything appears live on a real A4 page."
                  ctaLabel={canManage ? "Start a blank document" : "Browse templates"}
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

          {/* LEFT — Template library overlay */}
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
                      if (dup) showSuccessToast(`Duplicated “${t.name}”`);
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

          {/* RIGHT — Properties overlay */}
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
                    page={store.state.page}
                    setPage={store.setPage}
                    onInsertToken={(key) => canvasRef.current?.insertToken(key)}
                    onOpenLetterhead={() => setLetterheadOpen(true)}
                    assetCount={store.state.assets.length}
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
          documents={store.state.documents}
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
        assets={store.state.assets}
        onAdd={store.addAsset}
        onUpdate={store.updateAsset}
        onDelete={store.deleteAsset}
      />

      {session && (
        <GenerateDocumentModal
          open={generateOpen}
          onClose={() => setGenerateOpen(false)}
          content={currentHtml()}
          templateId={session.templateId}
          templateName={session.templateName}
          page={store.state.page}
          assets={store.state.assets}
          employees={employees}
          employeesLoading={employeesLoading}
          companyName={companyName}
          companyAddress=""
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
            <button onClick={() => setRenameFor(null)} className="btn-secondary text-sm">
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
        title={`Delete “${confirmTpl?.name}”?`}
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
        title={`Delete “${confirmDoc?.name}”?`}
        description="This document will be removed from history."
        consequences={["This action cannot be undone."]}
        confirmLabel="Delete document"
      />
    </motion.div>
  );
};

export default DocumentStudioPage;
