/**
 * Document Studio — persistence & domain service.
 *
 * This is the single seam between the UI and where data lives. Today it reads
 * and writes `localStorage`; swapping the body of these functions for `axios`
 * calls (or an AI generation endpoint) is all it takes to move server-side —
 * no component needs to change because they only ever import this module.
 */
import {
  DEFAULT_TEMPLATES,
  BLANK_TEMPLATE,
  PLACEHOLDERS,
} from "./constants";
import type {
  BrandingAsset,
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
  showWatermark: false,
  showPageNumbers: false,
  showBackground: true,
};

/** Small id helper — stable, dependency-free. */
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
    page: { ...DEFAULT_PAGE },
  };
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
    // Merge in any newly-shipped built-in templates the user hasn't seen yet.
    const existingIds = new Set((parsed.templates ?? []).map((t) => t.id));
    const mergedTemplates = [
      ...(parsed.templates ?? []),
      ...DEFAULT_TEMPLATES.filter((t) => !existingIds.has(t.id)),
    ];
    return {
      templates: mergedTemplates,
      documents: parsed.documents ?? [],
      assets: parsed.assets ?? [],
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
    /* quota / private-mode — non-fatal, studio still works in-memory */
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
    icon: "✨",
    content: BLANK_TEMPLATE.content,
    system: false,
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
  companyName?: string;
  companyAddress?: string;
  managerName?: string;
  salary?: string;
  phone?: string;
  /** Overrides keyed by placeholder key, win over everything else. */
  overrides?: Record<string, string>;
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

/** Build the token → value map for a given context. */
export function buildResolutionMap(
  ctx: ResolutionContext
): Record<string, string> {
  const s = ctx.subject ?? undefined;
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
    "Company Name": ctx.companyName ?? "",
    Address: ctx.companyAddress ?? "",
    "Joining Date": "", // filled by override/subject below if available
    "Issue Date": today,
    "Current Date": today,
  };
  if (ctx.overrides) Object.assign(map, ctx.overrides);
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
