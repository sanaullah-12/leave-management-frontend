import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Squares2X2Icon,
  AdjustmentsHorizontalIcon,
  SwatchIcon,
  SparklesIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Select from "../ui/Select";
import PlaceholderPanel from "./PlaceholderPanel";
import { PAGE_FONT_FAMILIES } from "./constants";
import { PANEL } from "./ui";
import type { PageSettings } from "./types";

type Tab = "insert" | "page" | "brand";

interface Props {
  page: PageSettings;
  setPage: (patch: Partial<PageSettings>) => void;
  onInsertToken: (key: string) => void;
  onOpenLetterhead: () => void;
  assetCount: number;
  canManage: boolean;
  editable: boolean;
  onClose?: () => void;
}

const Toggle: React.FC<{
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, hint, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-left"
  >
    <span>
      <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
        {label}
      </span>
      {hint && (
        <span className="block text-[11px] text-gray-400 dark:text-gray-500">
          {hint}
        </span>
      )}
    </span>
    <span
      className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors ${
        checked ? "" : "bg-gray-200 dark:bg-gray-700"
      }`}
      style={checked ? { background: "var(--accent)" } : undefined}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${
          checked ? "right-0.5" : "left-0.5"
        }`}
      />
    </span>
  </button>
);

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "insert", label: "Insert", icon: Squares2X2Icon },
  { key: "page", label: "Page", icon: AdjustmentsHorizontalIcon },
  { key: "brand", label: "Brand", icon: SwatchIcon },
];

/** Right column — placeholders, page setup and branding. */
const PropertiesPanel: React.FC<Props> = ({
  page,
  setPage,
  onInsertToken,
  onOpenLetterhead,
  assetCount,
  canManage,
  editable,
  onClose,
}) => {
  const [tab, setTab] = useState<Tab>("insert");

  return (
    <div className={`flex h-full flex-col ${PANEL}`}>
      {/* Header + tabs */}
      <div className="border-b border-gray-200/70 px-4 py-3 dark:border-gray-700/50">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Properties & Settings
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              title="Close"
              className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700/50">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="prop-tab"
                    className="absolute inset-0 rounded-md bg-white shadow-sm dark:bg-gray-800"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <t.icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "insert" && (
          <PlaceholderPanel onInsert={onInsertToken} disabled={!editable} />
        )}

        {tab === "page" && (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                Font family
              </label>
              <Select
                value={page.fontFamily}
                onChange={(v) => setPage({ fontFamily: v })}
                options={PAGE_FONT_FAMILIES.map((f) => ({
                  value: f,
                  label: f.split(",")[0].replace(/['"]/g, ""),
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Font size · {page.fontSize}pt
                </label>
                <input
                  type="range"
                  min={9}
                  max={18}
                  value={page.fontSize}
                  onChange={(e) => setPage({ fontSize: +e.target.value })}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Line height · {page.lineHeight.toFixed(1)}
                </label>
                <input
                  type="range"
                  min={1}
                  max={2.4}
                  step={0.1}
                  value={page.lineHeight}
                  onChange={(e) => setPage({ lineHeight: +e.target.value })}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                Page margin · {page.margin}mm
              </label>
              <input
                type="range"
                min={10}
                max={40}
                value={page.margin}
                onChange={(e) => setPage({ margin: +e.target.value })}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            <div className="border-t border-gray-200/70 pt-2 dark:border-gray-700/50">
              <Toggle
                label="Show template design"
                hint="Your uploaded full-page background"
                checked={page.showBackground}
                onChange={(v) => setPage({ showBackground: v })}
              />
              <Toggle
                label="Show letterhead"
                hint="Header, logo & footer branding"
                checked={page.showLetterhead}
                onChange={(v) => setPage({ showLetterhead: v })}
              />
              <Toggle
                label="Show watermark"
                hint="Faint background stamp"
                checked={page.showWatermark}
                onChange={(v) => setPage({ showWatermark: v })}
              />
              <Toggle
                label="Page numbers"
                hint="On printed / PDF output"
                checked={page.showPageNumbers}
                onChange={(v) => setPage({ showPageNumbers: v })}
              />
            </div>
          </div>
        )}

        {tab === "brand" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200/70 p-4 text-center dark:border-gray-700/50">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gray-100 dark:bg-gray-700/60">
                <PhotoIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {assetCount > 0
                  ? `${assetCount} brand asset${assetCount > 1 ? "s" : ""}`
                  : "No branding yet"}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Upload a letterhead, logo, watermark, footer or signature and
                position them visually.
              </p>
              <button
                onClick={onOpenLetterhead}
                disabled={!canManage}
                className="btn-secondary mt-3 w-full justify-center text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Manage letterhead & branding
              </button>
              {!canManage && (
                <p className="mt-2 text-[11px] text-gray-400">
                  Only HR/Admins can edit branding.
                </p>
              )}
            </div>

            {/* Future-ready AI slot — intentionally not wired yet. */}
            <div
              className="relative overflow-hidden rounded-xl border border-dashed p-4"
              style={{
                borderColor: "var(--accent)",
                background: "var(--accent-soft)",
              }}
            >
              <div className="flex items-center gap-2">
                <SparklesIcon
                  className="h-5 w-5"
                  style={{ color: "var(--accent)" }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  Generate with AI
                </span>
                <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-900/40">
                  Soon
                </span>
              </div>
              <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300">
                Draft a polished letter from a short prompt. Coming to Document
                Studio.
              </p>
              <button
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-lg border border-white/40 bg-white/50 py-2 text-sm font-medium text-gray-500 dark:bg-gray-900/30"
              >
                ✨ Draft with AI
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
