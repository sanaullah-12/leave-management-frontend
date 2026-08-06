import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpTrayIcon,
  ClipboardDocumentIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import { showErrorToast } from "../../utils/toastHelpers";
import { importFile, importPasted, IMPORT_ACCEPT } from "./importers";

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (name: string, html: string) => void;
}

type Mode = "upload" | "paste";

/**
 * Bring an existing company template into the editor - upload a Word/HTML/text
 * file or paste content. The result becomes a fully editable Studio template.
 */
const ImportTemplateModal: React.FC<Props> = ({ open, onClose, onImport }) => {
  const [mode, setMode] = useState<Mode>("upload");
  const [name, setName] = useState("");
  const [html, setHtml] = useState("");
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setHtml("");
    setPaste("");
    setBusy(false);
    setMode("upload");
    onClose();
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const res = await importFile(file);
      if (!res.html.trim()) {
        showErrorToast("That file appears to be empty.");
      } else {
        setHtml(res.html);
        setName((n) => n || res.name);
      }
    } catch (e: any) {
      showErrorToast(e?.message || "Could not import that file.");
    } finally {
      setBusy(false);
    }
  };

  const applyPaste = (raw: string) => {
    setPaste(raw);
    setHtml(importPasted(raw, /<[a-z][\s\S]*>/i.test(raw)));
  };

  const confirm = () => {
    const finalName = name.trim() || "Imported Template";
    if (!html.trim()) return;
    onImport(finalName, html);
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={reset}
      size="2xl"
      title="Import your template"
      description="Bring a company letter or design into Document Studio."
      icon={<DocumentArrowUpIcon className="h-5 w-5" />}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="hidden text-xs text-gray-400 sm:block">
            Imported content becomes a fully editable template.
          </p>
          <div className="flex items-center gap-2">
            <button onClick={reset} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              onClick={confirm}
              disabled={!html.trim() || busy}
              className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Studio
            </button>
          </div>
        </div>
      }
    >
      {/* Mode switch */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700/50">
        {[
          { key: "upload" as Mode, label: "Upload file", icon: ArrowUpTrayIcon },
          { key: "paste" as Mode, label: "Paste content", icon: ClipboardDocumentIcon },
        ].map((t) => {
          const active = mode === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setMode(t.key)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="import-tab"
                  className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-gray-800"
                />
              )}
              <t.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Input side */}
        <div className="space-y-3">
          {mode === "upload" ? (
            <button
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
                drag
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
              }`}
            >
              {busy ? (
                <ArrowPathIcon className="h-7 w-7 animate-spin text-gray-400" />
              ) : (
                <ArrowUpTrayIcon className="h-7 w-7 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {busy ? "Converting..." : "Drop or click to upload"}
              </span>
              <span className="text-xs text-gray-400">
                Word (.docx) · HTML · TXT · Markdown
              </span>
              <input
                ref={inputRef}
                type="file"
                accept={IMPORT_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </button>
          ) : (
            <textarea
              value={paste}
              onChange={(e) => applyPaste(e.target.value)}
              placeholder="Paste your letter here - rich text or HTML both work..."
              className="h-48 w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
              Template name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Company Offer Letter"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <p className="rounded-lg bg-gray-50 p-2.5 text-[11px] text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            Tip: after importing, drop{" "}
            <span className="font-mono">{"{{Employee Name}}"}</span> style fields
            anywhere and they'll auto-fill on generation. For a designed
            letterhead, use <strong>Brand → Manage letterhead</strong>.
          </p>
        </div>

        {/* Preview side */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
            Preview
          </label>
          <div className="h-[280px] overflow-auto rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
            {html.trim() ? (
              <div
                className="ds-editable text-sm text-gray-900 dark:text-gray-100"
                // Preview only - content is sanitized in importers before it lands here.
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                <DocumentArrowUpIcon className="mb-2 h-8 w-8" />
                <p className="text-sm">Your imported document will preview here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImportTemplateModal;
