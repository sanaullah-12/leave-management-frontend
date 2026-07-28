/**
 * Document Studio — domain types.
 *
 * These types describe the whole module's data model. They are intentionally
 * transport-agnostic: today the {@link studioService} persists them to
 * localStorage, but the same shapes map 1:1 onto a future REST/GraphQL API or
 * an AI generation endpoint without any UI changes.
 */

export type TemplateCategory =
  | "Onboarding"
  | "Compensation"
  | "Recognition"
  | "Disciplinary"
  | "Offboarding"
  | "Leave"
  | "Verification"
  | "Certificate"
  | "Custom";

/** A field that is resolved from employee/company data at generation time. */
export interface PlaceholderDef {
  /** The token used inside the document, e.g. "Employee Name" → {{Employee Name}} */
  key: string;
  /** Human label shown in the placeholder palette. */
  label: string;
  /** Grouping in the palette. */
  group: "Employee" | "Company" | "Date" | "Custom";
  /** Short helper describing what it resolves to. */
  hint?: string;
  /** Heroicon-ish emoji used as a lightweight glyph in the palette. */
  glyph: string;
}

/** A reusable document blueprint. */
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Emoji/glyph shown on the template card. */
  icon: string;
  /** HTML body of the template (contentEditable-ready). Contains {{placeholders}}. */
  content: string;
  /** Whether this is a built-in system template (cannot be deleted, only duplicated). */
  system: boolean;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  /** Usage counter powering the "Most Used Template" overview card. */
  usageCount: number;
}

export type DocumentStatus = "draft" | "generated" | "downloaded" | "printed";

/** Snapshot of who a document was generated for. */
export interface DocumentSubject {
  employeeId?: string;
  name: string;
  designation?: string;
  department?: string;
  email?: string;
}

/** A concrete, generated (or draft) document instance. */
export interface StudioDocument {
  id: string;
  name: string;
  templateId: string | null;
  templateName: string;
  subject: DocumentSubject | null;
  /** Rendered HTML with placeholders already resolved (for generated docs). */
  content: string;
  status: DocumentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  downloadedAt?: string;
  printedAt?: string;
}

/** Positions a branding asset can be pinned to on the page. */
export type AssetSlot =
  | "header"
  | "footer"
  | "logo"
  | "watermark"
  | "signature"
  | "background";

/** A piece of uploaded company branding (data-URL encoded for portability). */
export interface BrandingAsset {
  id: string;
  slot: AssetSlot;
  name: string;
  /** data: URL (png/jpg/svg) or object metadata for pdf. */
  dataUrl: string;
  mime: string;
  /** 0–100 opacity, primarily for watermark. */
  opacity: number;
  /** Scale factor in %. */
  scale: number;
  enabled: boolean;
}

/** Page-level presentation settings for the canvas. */
export interface PageSettings {
  margin: number; // mm
  fontFamily: string;
  fontSize: number; // pt
  lineHeight: number;
  showLetterhead: boolean;
  showWatermark: boolean;
  showPageNumbers: boolean;
  /** Render an uploaded full-page design behind the text. */
  showBackground: boolean;
}

export interface StudioState {
  templates: DocumentTemplate[];
  documents: StudioDocument[];
  assets: BrandingAsset[];
  page: PageSettings;
}

export type ExportFormat = "pdf" | "docx" | "print";
