/**
 * Document Studio - persistence & domain service.
 *
 * This is the single seam between the UI and where data lives. Today it reads
 * and writes `localStorage`; swapping the body of these functions for `axios`
 * calls (or an AI generation endpoint) is all it takes to move server-side -
 * no component needs to change because they only ever import this module.
 */
import {
  DEFAULT_TEMPLATES,
  BLANK_TEMPLATE,
  BUILTIN_REVISION,
  PLACEHOLDERS,
} from "./constants";
import { companyAddressLine } from "./letterhead";
import type {
  BrandSettings,
  BrandingAsset,
  CompanyProfile,
  DocumentTemplate,
  PageSettings,
  StudioDocument,
  StudioState,
  DocumentSubject,
} from "./types";

const STORAGE_KEY = "nexora.documentStudio.v1";

export const DEFAULT_PAGE: PageSettings = {
  margin: 22,
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 12,
  lineHeight: 1.6,
  showLetterhead: true,
  showFooter: true,
  showWatermark: false,
  showPageNumbers: false,
  showBackground: true,
};

/**
 * An empty company card. HR fills this in once from Branding & Letterhead and
 * every document issued afterwards carries it.
 */
export const DEFAULT_COMPANY: CompanyProfile = {
  name: "",
  legalName: "",
  tagline: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  email: "",
  phone: "",
  website: "",
  registrationNo: "",
  taxId: "",
  signatoryName: "",
  signatoryDesignation: "Head of Human Resources",
  referencePrefix: "HR",
  footerNote: "",
};

export const DEFAULT_BRAND: BrandSettings = {
  accent: "#2563eb",
  letterhead: "classic",
  footer: "line",
  headingFont: "'Geist', ui-sans-serif, system-ui, sans-serif",
  showLogo: true,
  showTagline: true,
  showRegistration: false,
  showReference: true,
};

/** Small id helper - stable, dependency-free. */
export const uid = (prefix = "id"): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;

const isoNow = () => new Date().toISOString();

function seed(): StudioState {
  return {
    templates: DEFAULT_TEMPLATES.map((t) => ({ ...t })),
    documents: [],
    assets: [],
    company: { ...DEFAULT_COMPANY },
    brand: { ...DEFAULT_BRAND },
    page: { ...DEFAULT_PAGE },
  };
}

/**
 * Bring stored templates up to the shipped revision.
 *
 * System templates are never edited in place by the UI - editing one and
 * saving produces a new custom template - so refreshing their markup is safe.
 * The name and usage counter are the user's, and are kept.
 */
function reconcileTemplates(
  stored: DocumentTemplate[] | undefined
): DocumentTemplate[] {
  const list = stored ?? [];
  const builtIns = new Map(DEFAULT_TEMPLATES.map((t) => [t.id, t]));
  const merged = list.map((tpl) => {
    const builtIn = builtIns.get(tpl.id);
    if (!builtIn || !tpl.system) {
      // Custom templates keep their markup; only fill in fields added later.
      return { ...tpl, variant: tpl.variant ?? "letter" };
    }
    if (tpl.revision === builtIn.revision) return tpl;
    return {
      ...builtIn,
      name: tpl.name,
      usageCount: tpl.usageCount ?? builtIn.usageCount,
      archived: tpl.archived,
      createdAt: tpl.createdAt ?? builtIn.createdAt,
      updatedAt: isoNow(),
    };
  });
  const existing = new Set(merged.map((t) => t.id));
  return [
    ...merged,
    ...DEFAULT_TEMPLATES.filter((t) => !existing.has(t.id)).map((t) => ({
      ...t,
    })),
  ];
}

/** Load the full studio state, seeding built-ins on first ever run. */
export function loadState(): StudioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seed();
      saveState(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<StudioState>;
    return {
      templates: reconcileTemplates(parsed.templates),
      documents: parsed.documents ?? [],
      assets: parsed.assets ?? [],
      company: { ...DEFAULT_COMPANY, ...(parsed.company ?? {}) },
      brand: { ...DEFAULT_BRAND, ...(parsed.brand ?? {}) },
      page: { ...DEFAULT_PAGE, ...(parsed.page ?? {}) },
    };
  } catch {
    return seed();
  }
}

export function saveState(state: StudioState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private-mode - non-fatal, studio still works in-memory */
  }
}

/* ------------------------------------------------------------------ */
/* Template operations                                                 */
/* ------------------------------------------------------------------ */

export function createTemplate(
  partial: Partial<DocumentTemplate> & { name: string }
): DocumentTemplate {
  const ts = isoNow();
  return {
    id: uid("tpl"),
    description: "",
    category: "Custom",
    icon: "blank",
    variant: "letter",
    refCode: "DOC",
    content: BLANK_TEMPLATE.content,
    system: false,
    revision: BUILTIN_REVISION,
    usageCount: 0,
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

export function duplicateTemplate(source: DocumentTemplate): DocumentTemplate {
  const ts = isoNow();
  return {
    ...source,
    id: uid("tpl"),
    name: `${source.name} (Copy)`,
    system: false,
    archived: false,
    usageCount: 0,
    createdAt: ts,
    updatedAt: ts,
  };
}

/* ------------------------------------------------------------------ */
/* Document operations                                                 */
/* ------------------------------------------------------------------ */

export function createDocument(partial: {
  name: string;
  templateId: string | null;
  templateName: string;
  content: string;
  subject: DocumentSubject | null;
  createdBy: string;
  variant?: StudioDocument["variant"];
  referenceNo?: string;
  status?: StudioDocument["status"];
}): StudioDocument {
  const ts = isoNow();
  return {
    id: uid("doc"),
    status: partial.status ?? "generated",
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

/**
 * Mint the next reference number, in the shape PREFIX/CODE/YEAR/0001.
 *
 * The sequence counts documents issued in the current year, which is stable
 * for a single HR team and moves to a server-side counter the day this service
 * talks to an API.
 */
export function nextReferenceNumber(
  company: CompanyProfile,
  refCode: string | undefined,
  documents: StudioDocument[]
): string {
  const year = new Date().getFullYear();
  const issuedThisYear = documents.filter(
    (d) => new Date(d.createdAt).getFullYear() === year
  ).length;
  const seq = String(issuedThisYear + 1).padStart(4, "0");
  return [company.referencePrefix || "HR", refCode || "DOC", year, seq]
    .filter(Boolean)
    .join("/");
}

/* ------------------------------------------------------------------ */
/* Branding assets                                                     */
/* ------------------------------------------------------------------ */

export function createAsset(partial: {
  slot: BrandingAsset["slot"];
  name: string;
  dataUrl: string;
  mime: string;
}): BrandingAsset {
  return {
    id: uid("asset"),
    opacity: partial.slot === "watermark" ? 10 : 100,
    scale: 100,
    enabled: true,
    ...partial,
  };
}

/* ------------------------------------------------------------------ */
/* Placeholder resolution                                              */
/* ------------------------------------------------------------------ */

/** Source values used to resolve {{tokens}} at generation time. */
export interface ResolutionContext {
  subject?: DocumentSubject | null;
  /** The stored company card - fills every {{Company ...}} token. */
  company?: CompanyProfile;
  /** Reference number minted for this document. */
  referenceNo?: string;
  /** Values collected from the template's own fields, keyed by placeholder. */
  overrides?: Record<string, string>;
  /** Direct scalars, used when no company card is available. */
  companyName?: string;
  companyAddress?: string;
  managerName?: string;
  salary?: string;
  phone?: string;
}

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/** Format an ISO date, passing through anything that is not one. */
export const formatDocumentDate = fmtDate;

/** Build the token -> value map for a given context. */
export function buildResolutionMap(
  ctx: ResolutionContext
): Record<string, string> {
  const s = ctx.subject ?? undefined;
  const c = ctx.company;
  const today = fmtDate(isoNow());
  const map: Record<string, string> = {
    "Employee Name": s?.name ?? "",
    "Employee ID": s?.employeeId ?? "",
    Department: s?.department ?? "",
    Designation: s?.designation ?? "",
    Email: s?.email ?? "",
    Phone: ctx.phone ?? "",
    Salary: ctx.salary ?? "",
    "Manager Name": ctx.managerName ?? "",
    "Company Name": c?.name || ctx.companyName || "",
    "Company Address": c ? companyAddressLine(c) : ctx.companyAddress ?? "",
    "Company Email": c?.email ?? "",
    "Company Phone": c?.phone ?? "",
    "Company Website": c?.website ?? "",
    "Signatory Name": c?.signatoryName ?? "",
    "Signatory Designation": c?.signatoryDesignation ?? "",
    // Retained so documents authored against the older catalogue keep resolving.
    Address: c ? companyAddressLine(c) : ctx.companyAddress ?? "",
    "Reference No": ctx.referenceNo ?? "",
    "Joining Date": "",
    "Issue Date": today,
    "Current Date": today,
  };
  if (ctx.overrides) {
    Object.entries(ctx.overrides).forEach(([key, value]) => {
      if (value !== undefined && value !== "") map[key] = value;
    });
  }
  return map;
}

const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Replace every {{Token}} in `html` using the resolution map. Unknown or empty
 * tokens are wrapped in a subtle highlight so HR can spot gaps before sending.
 */
export function resolvePlaceholders(
  html: string,
  map: Record<string, string>,
  { highlightMissing = false }: { highlightMissing?: boolean } = {}
): string {
  return html.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_full, rawKey: string) => {
    const key = rawKey.trim();
    const value = map[key];
    if (value !== undefined && value !== "") return escapeHtml(value);
    if (highlightMissing) {
      return `<span data-missing="1" style="background:rgba(234,179,8,0.25);border-radius:3px;padding:0 2px;">{{${key}}}</span>`;
    }
    return `{{${key}}}`;
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Which placeholder keys are still unresolved in a given html string. */
export function findUnresolved(html: string): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([^}]+?)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) found.add(m[1].trim());
  return [...found];
}

/** Highlight a token in a live preview (used when hovering the palette). */
export function highlightToken(html: string, key: string): string {
  const re = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, "g");
  return html.replace(
    re,
    `<mark style="background:var(--accent-soft);color:var(--accent);border-radius:3px;">{{${key}}}</mark>`
  );
}

export const ALL_PLACEHOLDER_KEYS = PLACEHOLDERS.map((p) => p.key);
