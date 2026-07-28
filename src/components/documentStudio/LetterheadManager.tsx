import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpTrayIcon,
  TrashIcon,
  PhotoIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import Drawer from "../ui/Drawer";
import { showErrorToast, showSuccessToast } from "../../utils/toastHelpers";
import { createAsset } from "./studioService";
import type { AssetSlot, BrandingAsset } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  assets: BrandingAsset[];
  onAdd: (partial: Parameters<typeof createAsset>[0]) => void;
  onUpdate: (id: string, patch: Partial<BrandingAsset>) => void;
  onDelete: (id: string) => void;
}

const SLOTS: {
  slot: AssetSlot;
  label: string;
  hint: string;
  glyph: string;
}[] = [
  { slot: "background", label: "Full-page Template Design", hint: "Your designed A4 template — text is typed on top of it", glyph: "🖼️" },
  { slot: "header", label: "Company Letterhead / Header", hint: "Full-width banner at the top of every page", glyph: "🏢" },
  { slot: "logo", label: "Company Logo", hint: "Used when no full header is set", glyph: "🔷" },
  { slot: "watermark", label: "Watermark", hint: "Faint centered stamp behind the content", glyph: "💧" },
  { slot: "footer", label: "Footer", hint: "Address / contact strip at the bottom", glyph: "📄" },
  { slot: "signature", label: "Signature", hint: "Authorised signatory image", glyph: "✍️" },
];

const ACCEPT = "image/png,image/jpeg,image/svg+xml,application/pdf";
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

const AssetSlotRow: React.FC<{
  slot: (typeof SLOTS)[number];
  asset?: BrandingAsset;
  onUpload: (file: File) => void;
  onUpdate: (patch: Partial<BrandingAsset>) => void;
  onDelete: () => void;
}> = ({ slot, asset, onUpload, onUpdate, onDelete }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const isPdf = asset?.mime === "application/pdf";

  return (
    <div className="rounded-xl border border-gray-200/70 p-4 dark:border-gray-700/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-100 text-lg dark:bg-gray-700/60">
            {slot.glyph}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {slot.label}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {slot.hint}
            </p>
          </div>
        </div>
        {asset && (
          <button
            onClick={onDelete}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
            title="Remove"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Preview / dropzone */}
      <div className="mt-3">
        {asset ? (
          <div className="flex items-center gap-3">
            <div className="grid h-20 w-32 place-items-center overflow-hidden rounded-lg border border-gray-200 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#fff_0%_50%)_50%/12px_12px] dark:border-gray-700">
              {isPdf ? (
                <div className="flex flex-col items-center text-gray-400">
                  <DocumentIcon className="h-7 w-7" />
                  <span className="text-[10px]">PDF</span>
                </div>
              ) : (
                <img
                  src={asset.dataUrl}
                  alt={slot.label}
                  className="max-h-full max-w-full"
                  style={{ opacity: asset.opacity / 100 }}
                />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Scale · {asset.scale}%
              </label>
              <input
                type="range"
                min={30}
                max={160}
                value={asset.scale}
                onChange={(e) => onUpdate({ scale: +e.target.value })}
                className="w-full accent-[var(--accent)]"
              />
              {slot.slot === "watermark" && (
                <>
                  <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Opacity · {asset.opacity}%
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={60}
                    value={asset.opacity}
                    onChange={(e) => onUpdate({ opacity: +e.target.value })}
                    className="w-full accent-[var(--accent)]"
                  />
                </>
              )}
              <button
                onClick={() => inputRef.current?.click()}
                className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
              >
                Replace file
              </button>
            </div>
          </div>
        ) : (
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
              if (f) onUpload(f);
            }}
            className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-5 transition-colors ${
              drag
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
            }`}
          >
            <ArrowUpTrayIcon className="h-5 w-5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Drop or click to upload
            </span>
            <span className="text-[10px] text-gray-400">
              PNG · JPG · SVG · PDF (max 4MB)
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
};

/**
 * Letterhead & branding manager. Uploads are stored as portable data-URLs so
 * they travel with the document into PDF / DOCX / print without a server.
 */
const LetterheadManager: React.FC<Props> = ({
  open,
  onClose,
  assets,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const handleUpload = (slot: AssetSlot, file: File) => {
    if (!ACCEPT.split(",").includes(file.type)) {
      showErrorToast("Unsupported file type. Use PNG, JPG, SVG or PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      showErrorToast("File is too large (max 4MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const existing = assets.find((a) => a.slot === slot);
      if (existing) {
        onUpdate(existing.id, { dataUrl, mime: file.type, name: file.name });
      } else {
        onAdd({ slot, name: file.name, dataUrl, mime: file.type });
      }
      showSuccessToast(`${file.name} uploaded`);
    };
    reader.onerror = () => showErrorToast("Could not read that file.");
    reader.readAsDataURL(file);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="xl"
      title="Letterhead & Branding"
      description="Upload and position your company's official branding."
      icon={<PhotoIcon className="h-5 w-5" />}
    >
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {SLOTS.map((s) => (
            <motion.div
              key={s.slot}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AssetSlotRow
                slot={s}
                asset={assets.find((a) => a.slot === s.slot)}
                onUpload={(f) => handleUpload(s.slot, f)}
                onUpdate={(patch) => {
                  const a = assets.find((x) => x.slot === s.slot);
                  if (a) onUpdate(a.id, patch);
                }}
                onDelete={() => {
                  const a = assets.find((x) => x.slot === s.slot);
                  if (a) onDelete(a.id);
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <p className="px-1 pt-1 text-[11px] text-gray-400 dark:text-gray-500">
          Tip: a full-width <strong>Header</strong> takes priority over a{" "}
          <strong>Logo</strong>. Toggle the letterhead on/off per document from
          the Page tab.
        </p>
      </div>
    </Drawer>
  );
};

export default LetterheadManager;
