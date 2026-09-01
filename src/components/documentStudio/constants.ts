/**
 * Document Studio - seed content: the built-in template library and the
 * placeholder catalogue. Everything here is data, not UI, so it can later be
 * served from the backend (or authored by AI) without touching components.
 *
 * The templates themselves are assembled from {@link BLUEPRINTS}; this module
 * only turns those blueprints into stored `DocumentTemplate` records.
 */
import { BLUEPRINTS, buildTemplateContent } from "./blueprints";
import type {
  DocumentTemplate,
  PlaceholderDef,
  TemplateCategory,
} from "./types";

export const PAGE_FONT_FAMILIES = [
  "Georgia, 'Times New Roman', serif",
  "'Geist', ui-sans-serif, system-ui, sans-serif",
  "'Times New Roman', Times, serif",
  "Arial, Helvetica, sans-serif",
  "'Courier New', monospace",
] as const;

export const HEADING_FONT_FAMILIES = [
  "'Geist', ui-sans-serif, system-ui, sans-serif",
  "Georgia, 'Times New Roman', serif",
  "'Times New Roman', Times, serif",
  "Arial, Helvetica, sans-serif",
] as const;

/** Preset accents HR can pick without opening a colour wheel. */
export const BRAND_ACCENTS = [
  { label: "Nexora Blue", value: "#2563eb" },
  { label: "Deep Navy", value: "#1e3a5f" },
  { label: "Emerald", value: "#047857" },
  { label: "Burgundy", value: "#9f1239" },
  { label: "Graphite", value: "#374151" },
  { label: "Bronze", value: "#92400e" },
] as const;

export const CATEGORY_META: Record<
  TemplateCategory,
  { label: string; tint: string }
> = {
  Onboarding: { label: "Onboarding", tint: "emerald" },
  Employment: { label: "Employment", tint: "teal" },
  Compensation: { label: "Compensation", tint: "blue" },
  Recognition: { label: "Recognition", tint: "amber" },
  Disciplinary: { label: "Disciplinary", tint: "red" },
  Offboarding: { label: "Offboarding", tint: "slate" },
  Leave: { label: "Leave", tint: "violet" },
  Verification: { label: "Verification", tint: "cyan" },
  Certificate: { label: "Certificate", tint: "indigo" },
  Custom: { label: "Custom", tint: "gray" },
};

/** How a variant is described in the library and the properties panel. */
export const VARIANT_META: Record<
  string,
  { label: string; hint: string }
> = {
  letter: {
    label: "Letter",
    hint: "Addressed correspondence with a salutation and signature block.",
  },
  certificate: {
    label: "Certificate",
    hint: "Framed, centred attestation addressed to whom it may concern.",
  },
  notice: {
    label: "Notice",
    hint: "Formal notice with a ruled title and acknowledgement strip.",
  },
  memo: {
    label: "Memo",
    hint: "Internal memorandum with a To / From / Subject header.",
  },
};

/** The catalogue of tokens HR can drop into a document. */
export const PLACEHOLDERS: PlaceholderDef[] = [
  { key: "Employee Name", label: "Employee Name", group: "Employee", glyph: "employee", hint: "Full legal name" },
  { key: "Employee ID", label: "Employee ID", group: "Employee", glyph: "employeeId", hint: "Company employee code" },
  { key: "Department", label: "Department", group: "Employee", glyph: "department", hint: "Assigned department" },
  { key: "Designation", label: "Designation", group: "Employee", glyph: "designation", hint: "Job title / role" },
  { key: "Joining Date", label: "Joining Date", group: "Employee", glyph: "joiningDate", hint: "Date of joining" },
  { key: "Salary", label: "Salary", group: "Employee", glyph: "money", hint: "Monthly / annual salary" },
  { key: "Manager Name", label: "Manager Name", group: "Employee", glyph: "manager", hint: "Reporting manager" },
  { key: "Email", label: "Work Email", group: "Employee", glyph: "email", hint: "Employee work email" },
  { key: "Phone", label: "Employee Phone", group: "Employee", glyph: "phone", hint: "Employee contact number" },
  { key: "Company Name", label: "Company Name", group: "Company", glyph: "company", hint: "Registered company name" },
  { key: "Company Address", label: "Company Address", group: "Company", glyph: "address", hint: "Full postal address" },
  { key: "Company Email", label: "Company Email", group: "Company", glyph: "email", hint: "Official company email" },
  { key: "Company Phone", label: "Company Phone", group: "Company", glyph: "phone", hint: "Company contact number" },
  { key: "Company Website", label: "Company Website", group: "Company", glyph: "website", hint: "Company website" },
  { key: "Signatory Name", label: "Signatory Name", group: "Company", glyph: "signature", hint: "Who signs the document" },
  { key: "Signatory Designation", label: "Signatory Title", group: "Company", glyph: "designation", hint: "Signatory's designation" },
  { key: "Reference No", label: "Reference No", group: "Document", glyph: "reference", hint: "Auto-minted document reference" },
  { key: "Issue Date", label: "Issue Date", group: "Date", glyph: "issueDate", hint: "Date the document is issued" },
  { key: "Current Date", label: "Current Date", group: "Date", glyph: "currentDate", hint: "Today's date" },
];

const now = "2024-01-01T00:00:00.000Z";

/**
 * Revision of the built-in markup. Bumping it refreshes every stored system
 * template on the next load, so shipped template improvements reach HR teams
 * that already have studio state.
 */
export const BUILTIN_REVISION = 2;

export const DEFAULT_TEMPLATES: DocumentTemplate[] = BLUEPRINTS.map((bp) => ({
  id: bp.id,
  name: bp.name,
  description: bp.description,
  category: bp.category,
  icon: bp.icon,
  variant: bp.variant,
  refCode: bp.refCode,
  fields: bp.fields,
  content: buildTemplateContent(bp),
  system: true,
  revision: BUILTIN_REVISION,
  createdAt: now,
  updatedAt: now,
  usageCount: bp.usageCount ?? 0,
}));

/** A blank canvas users start from when creating a brand-new document. */
export const BLANK_TEMPLATE: DocumentTemplate = {
  id: "tpl-custom-blank",
  name: "Blank Document",
  description: "Start from a clean page and build your own layout.",
  category: "Custom",
  icon: "blank",
  variant: "letter",
  refCode: "DOC",
  system: true,
  revision: BUILTIN_REVISION,
  createdAt: now,
  updatedAt: now,
  usageCount: 0,
  content: [
    '<div class="doc-meta"><span>Ref: {{Reference No}}</span><span>Date: {{Issue Date}}</span></div>',
    '<h1 class="doc-title">Document Title</h1>',
    '<div class="doc-title-rule"></div>',
    '<div class="doc-addressee"><strong>{{Employee Name}}</strong><br />{{Designation}}<br />{{Department}} Department</div>',
    '<p class="doc-salutation">Dear {{Employee Name}},</p>',
    "<p>Start typing your content here. Drag a field from the Insert panel to drop in dynamic values such as {{Designation}} or {{Joining Date}}.</p>",
    '<p class="doc-closing">Yours sincerely,</p>',
    '<div class="doc-signature">',
    '  <div class="doc-sign-image" data-sign-slot="1"></div>',
    '  <div class="doc-sign-line"></div>',
    '  <p class="doc-signatory">{{Signatory Name}}</p>',
    '  <p class="doc-signatory-role">{{Signatory Designation}}</p>',
    '  <p class="doc-signatory-role">{{Company Name}}</p>',
    "</div>",
  ].join("\n"),
};
