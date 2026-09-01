import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpTrayIcon,
  TrashIcon,
  PhotoIcon,
  DocumentIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  BeakerIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  IdentificationIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Drawer from "../ui/Drawer";
import Select from "../ui/Select";
import { showErrorToast, showSuccessToast } from "../../utils/toastHelpers";
import { createAsset } from "./studioService";
import { BRAND_ACCENTS, HEADING_FONT_FAMILIES } from "./constants";
import { renderLetterhead } from "./letterhead";
import { documentCss } from "./documentStyles";
import type {
  AssetSlot,
  BrandSettings,
  BrandingAsset,
  CompanyProfile,
  PageSettings,
} from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  assets: BrandingAsset[];
  company: CompanyProfile;
  brand: BrandSettings;
  page: PageSettings;
  onAdd: (partial: Parameters<typeof createAsset>[0]) => void;
  onUpdate: (id: string, patch: Partial<BrandingAsset>) => void;
  onDelete: (id: string) => void;
  onCompanyChange: (patch: Partial<CompanyProfile>) => void;
  onBrandChange: (patch: Partial<BrandSettings>) => void;
}

type Tab = "company" | "assets" | "layout";

const SLOTS: {
  slot: AssetSlot;
  label: string;
  hint: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}[] = [
  {
    slot: "logo",
    label: "Company Logo",
    hint: "Sits in the letterhead of every document",
    icon: SparklesIcon,
  },
  {
    slot: "signature",
    label: "Signature",
    hint: "Dropped into the signature block automatically",
    icon: PencilSquareIcon,
  },
  {
    slot: "header",
    label: "Designed Letterhead Banner",
    hint: "A ready-made header image - overrides the composed letterhead",
    icon: BuildingOffice2Icon,
  },
  {
    slot: "footer",
    label: "Designed Footer Strip",
    hint: "A ready-made footer image - overrides the composed footer",
    icon: DocumentTextIcon,
  },
  {
    slot: "watermark",
    label: "Watermark",
    hint: "Faint centred stamp behind the content",
    icon: BeakerIcon,
  },
  {
    slot: "background",
    label: "Full-page Template Design",
    hint: "Your designed A4 sheet - text is typed on top of it",
    icon: PhotoIcon,
  },
];

const ACCEPT = "image/png,image/jpeg,image/svg+xml,application/pdf";
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  wide?: boolean;
}> = ({ label, value, onChange, placeholder, hint, wide }) => (
  <div className={wide ? "sm:col-span-2" : undefined}>
    <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
      {label}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
    />
    {hint && (
      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
        {hint}
      </p>
    )}
  </div>
);

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
          <span className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 dark:text-gray-400">
            <slot.icon className="h-5 w-5" />
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
                Scale - {asset.scale}%
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
                    Opacity - {asset.opacity}%
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
              PNG, JPG, SVG or PDF (max 4MB)
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

/** Miniature of the letterhead as it will print, updated as HR types. */
const LetterheadPreview: React.FC<{
  company: CompanyProfile;
  brand: BrandSettings;
  assets: BrandingAsset[];
  page: PageSettings;
}> = ({ company, brand, assets, page }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700">
    <style>{documentCss({ page, brand })}</style>
    <div
      className="ds-doc"
      dangerouslySetInnerHTML={{
        __html: renderLetterhead({
          company,
          brand,
          assets,
          page: { ...page, showLetterhead: true },
        }),
      }}
    />
  </div>
);

const TABS: {
  key: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "company", label: "Company", icon: IdentificationIcon },
  { key: "assets", label: "Logo & assets", icon: PhotoIcon },
  { key: "layout", label: "Layout", icon: Squares2X2Icon },
];

/**
 * Branding and letterhead manager. The company card is entered once and every
 * document issued afterwards carries it, so HR never re-uploads a logo or
 * retypes an address. Uploads are stored as portable data-URLs, which is what
 * lets them travel into the PDF, DOCX and print output without a server.
 */
const LetterheadManager: React.FC<Props> = ({
  open,
  onClose,
  assets,
  company,
  brand,
  page,
  onAdd,
  onUpdate,
  onDelete,
  onCompanyChange,
  onBrandChange,
}) => {
  const [tab, setTab] = useState<Tab>("company");

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
      title="Branding & Letterhead"
      description="Set this up once - every document you issue picks it up."
      icon={<PhotoIcon className="h-5 w-5" />}
    >
      {/* The drawer body ships without padding, so the panel owns its own
          gutters. The tab strip stays pinned while the long company form
          scrolls underneath it. */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-5 pb-3 pt-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
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
                    layoutId="brand-tab"
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

      <div className="px-5 pb-6 pt-4">
        {tab === "company" && (
          <div className="space-y-5">
            <LetterheadPreview
              company={company}
              brand={brand}
              assets={assets}
              page={page}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Company name"
                value={company.name}
                onChange={(v) => onCompanyChange({ name: v })}
                placeholder="Nexora Technologies"
                wide
              />
              <Field
                label="Registered / legal name"
                value={company.legalName}
                onChange={(v) => onCompanyChange({ legalName: v })}
                placeholder="Nexora Technologies (Private) Limited"
                wide
              />
              <Field
                label="Tagline"
                value={company.tagline}
                onChange={(v) => onCompanyChange({ tagline: v })}
                placeholder="The HRMS System"
                wide
              />
              <Field
                label="Address line 1"
                value={company.addressLine1}
                onChange={(v) => onCompanyChange({ addressLine1: v })}
                placeholder="12 Mall Road"
              />
              <Field
                label="Address line 2"
                value={company.addressLine2}
                onChange={(v) => onCompanyChange({ addressLine2: v })}
                placeholder="Suite 400"
              />
              <Field
                label="City"
                value={company.city}
                onChange={(v) => onCompanyChange({ city: v })}
                placeholder="Lahore"
              />
              <Field
                label="State / province"
                value={company.state}
                onChange={(v) => onCompanyChange({ state: v })}
                placeholder="Punjab"
              />
              <Field
                label="Postal code"
                value={company.postalCode}
                onChange={(v) => onCompanyChange({ postalCode: v })}
                placeholder="54000"
              />
              <Field
                label="Country"
                value={company.country}
                onChange={(v) => onCompanyChange({ country: v })}
                placeholder="Pakistan"
              />
              <Field
                label="Email"
                value={company.email}
                onChange={(v) => onCompanyChange({ email: v })}
                placeholder="hr@company.com"
              />
              <Field
                label="Phone"
                value={company.phone}
                onChange={(v) => onCompanyChange({ phone: v })}
                placeholder="+92 42 111 000 111"
              />
              <Field
                label="Website"
                value={company.website}
                onChange={(v) => onCompanyChange({ website: v })}
                placeholder="www.company.com"
              />
              <Field
                label="Registration no."
                value={company.registrationNo}
                onChange={(v) => onCompanyChange({ registrationNo: v })}
                placeholder="Company registration number"
              />
              <Field
                label="Tax ID"
                value={company.taxId}
                onChange={(v) => onCompanyChange({ taxId: v })}
                placeholder="NTN / VAT number"
              />
              <Field
                label="Reference prefix"
                value={company.referencePrefix}
                onChange={(v) => onCompanyChange({ referencePrefix: v })}
                placeholder="HR"
                hint="Reference numbers read PREFIX/TYPE/YEAR/0001."
              />
            </div>

            <div className="border-t border-gray-200/70 pt-4 dark:border-gray-700/50">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Default signatory
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={company.signatoryName}
                  onChange={(v) => onCompanyChange({ signatoryName: v })}
                  placeholder="Ayesha Khan"
                />
                <Field
                  label="Designation"
                  value={company.signatoryDesignation}
                  onChange={(v) => onCompanyChange({ signatoryDesignation: v })}
                  placeholder="Head of Human Resources"
                />
                <Field
                  label="Footer note"
                  value={company.footerNote}
                  onChange={(v) => onCompanyChange({ footerNote: v })}
                  placeholder="This is a system-generated document."
                  wide
                />
              </div>
            </div>
          </div>
        )}

        {tab === "assets" && (
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
              A designed letterhead banner takes priority over the composed
              letterhead, so upload one only if you already have company
              stationery. The logo alone is enough for the built-in layouts.
            </p>
          </div>
        )}

        {tab === "layout" && (
          <div className="space-y-5">
            <LetterheadPreview
              company={company}
              brand={brand}
              assets={assets}
              page={page}
            />

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                Letterhead layout
              </label>
              <Select
                value={brand.letterhead}
                onChange={(v) =>
                  onBrandChange({
                    letterhead: v as BrandSettings["letterhead"],
                  })
                }
                options={[
                  { value: "classic", label: "Classic - centred, double rule" },
                  {
                    value: "modern",
                    label: "Modern - logo left, details right",
                  },
                  { value: "minimal", label: "Minimal - single hairline" },
                  { value: "banner", label: "Banner - solid accent band" },
                ]}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                Footer layout
              </label>
              <Select
                value={brand.footer}
                onChange={(v) =>
                  onBrandChange({ footer: v as BrandSettings["footer"] })
                }
                options={[
                  { value: "line", label: "Single line" },
                  { value: "columns", label: "Three columns" },
                  { value: "bar", label: "Accent bar" },
                  { value: "none", label: "No footer" },
                ]}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                Heading font
              </label>
              <Select
                value={brand.headingFont}
                onChange={(v) => onBrandChange({ headingFont: v })}
                options={HEADING_FONT_FAMILIES.map((f) => ({
                  value: f,
                  label: f.split(",")[0].replace(/['"]/g, ""),
                }))}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                Document accent
              </label>
              <div className="flex flex-wrap gap-2">
                {BRAND_ACCENTS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => onBrandChange({ accent: a.value })}
                    title={a.label}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      brand.accent === a.value
                        ? "border-gray-900 dark:border-white"
                        : "border-transparent"
                    }`}
                    style={{ background: a.value }}
                  />
                ))}
                <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Custom
                  <input
                    type="color"
                    value={brand.accent}
                    onChange={(e) => onBrandChange({ accent: e.target.value })}
                    className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1 border-t border-gray-200/70 pt-3 dark:border-gray-700/50">
              {(
                [
                  ["showLogo", "Show logo in the letterhead"],
                  ["showTagline", "Show tagline under the company name"],
                  ["showRegistration", "Show registration number"],
                  ["showReference", "Show reference number on documents"],
                ] as [keyof BrandSettings, string][]
              ).map(([key, label]) => (
                <label
                  key={key as string}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-2 text-sm text-gray-800 dark:text-gray-200"
                >
                  {label}
                  <input
                    type="checkbox"
                    checked={Boolean(brand[key])}
                    onChange={(e) =>
                      onBrandChange({
                        [key]: e.target.checked,
                      } as Partial<BrandSettings>)
                    }
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default LetterheadManager;
