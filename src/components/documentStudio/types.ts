/**
 * Document Studio - domain types.
 *
 * These types describe the whole module's data model. They are intentionally
 * transport-agnostic: today the {@link studioService} persists them to
 * localStorage, but the same shapes map 1:1 onto a future REST/GraphQL API or
 * an AI generation endpoint without any UI changes.
 */

export type TemplateCategory =
  | "Onboarding"
  | "Employment"
  | "Compensation"
  | "Recognition"
  | "Disciplinary"
  | "Offboarding"
  | "Leave"
  | "Verification"
  | "Certificate"
  | "Custom";

/**
 * The four document shapes the studio knows how to lay out. The variant drives
 * typography, the title treatment and the decorative frame - it is the reason
 * a certificate does not look like a disciplinary notice while both still read
 * as the same company's stationery.
 */
export type TemplateVariant = "letter" | "certificate" | "notice" | "memo";

/** Letterhead compositions available to the company branding. */
export type LetterheadLayout = "classic" | "modern" | "minimal" | "banner";

/** Footer strip compositions available to the company branding. */
export type FooterLayout = "none" | "line" | "columns" | "bar";

/** A field that is resolved from employee/company data at generation time. */
export interface PlaceholderDef {
  /** The token used inside the document, e.g. "Employee Name" -> {{Employee Name}} */
  key: string;
  /** Human label shown in the placeholder palette. */
  label: string;
  /** Grouping in the palette. */
  group: "Employee" | "Company" | "Document" | "Date" | "Custom";
  /** Short helper describing what it resolves to. */
  hint?: string;
  /** Key into the studio icon registry (see `icons.ts`). */
  glyph: string;
}

/**
 * An extra merge field a template needs that no employee record can supply -
 * a revised salary, an incident date, a transfer location. Declaring it on the
 * template is what makes the generation form build itself: adding a new
 * template never means touching the generate modal.
 */
export interface TemplateField {
  /** Placeholder key this field fills, e.g. "Effective Date". */
  key: string;
  label: string;
  type: "text" | "date" | "number" | "textarea";
  placeholder?: string;
  /** Pre-fill from the selected employee record where one exists. */
  source?: "salary" | "joinDate" | "designation" | "department";
  /** Rendered full-width in the generation form. */
  wide?: boolean;
}

/** A reusable document blueprint. */
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Key into the studio icon registry (see `icons.ts`). */
  icon: string;
  /** Layout family used for the page frame and typography. */
  variant: TemplateVariant;
  /** HTML body of the template (contentEditable-ready). Contains {{placeholders}}. */
  content: string;
  /** Extra merge fields the generation form should collect. */
  fields?: TemplateField[];
  /** Short code used when a reference number is minted, e.g. "OFR". */
  refCode?: string;
  /** Whether this is a built-in system template (cannot be deleted, only duplicated). */
  system: boolean;
  /**
   * Bumped whenever a built-in's markup is reworked. Stored copies with an
   * older revision are refreshed on load so shipped improvements reach HR
   * teams that already have studio state.
   */
  revision?: number;
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
  /** Layout family the document was composed with. */
  variant?: TemplateVariant;
  /** Reference number minted at generation time. */
  referenceNo?: string;
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
  /** 0-100 opacity, primarily for watermark. */
  opacity: number;
  /** Scale factor in %. */
  scale: number;
  enabled: boolean;
}

/**
 * The company's own details. Captured once by HR/Admin and merged into every
 * letterhead, footer and {{Company ...}} placeholder from then on.
 */
export interface CompanyProfile {
  name: string;
  legalName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  registrationNo: string;
  taxId: string;
  /** Who signs off documents by default. */
  signatoryName: string;
  signatoryDesignation: string;
  /** Reference numbers are minted as PREFIX/CODE/YEAR/0001. */
  referencePrefix: string;
  /** Small print rendered under the footer rule. */
  footerNote: string;
}

/** How the company's stationery is drawn. Applies to every document. */
export interface BrandSettings {
  /** Hex colour used for rules, titles and accents on the page. */
  accent: string;
  letterhead: LetterheadLayout;
  footer: FooterLayout;
  /** Heading font stack for document titles. */
  headingFont: string;
  showLogo: boolean;
  showTagline: boolean;
  showRegistration: boolean;
  /** Print the reference number / date meta row above the title. */
  showReference: boolean;
}

/** Page-level presentation settings for the canvas. */
export interface PageSettings {
  margin: number; // mm
  fontFamily: string;
  fontSize: number; // pt
  lineHeight: number;
  showLetterhead: boolean;
  showFooter: boolean;
  showWatermark: boolean;
  showPageNumbers: boolean;
  /** Render an uploaded full-page design behind the text. */
  showBackground: boolean;
}

export interface StudioState {
  templates: DocumentTemplate[];
  documents: StudioDocument[];
  assets: BrandingAsset[];
  company: CompanyProfile;
  brand: BrandSettings;
  page: PageSettings;
}

export type ExportFormat = "pdf" | "docx" | "print";
