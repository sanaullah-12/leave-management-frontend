/**
 * Document Studio — import pipeline.
 *
 * Turns an admin's existing company template (Word .docx, an .html letter, or
 * plain text/markdown) into editable canvas HTML. Heavy parsers are lazily
 * imported so they never weigh down the initial Studio bundle.
 */

export interface ImportResult {
  html: string;
  name: string;
}

const stripName = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, "").trim() || "Imported Template";

/** Remove anything unsafe/unwanted before it reaches the editor. */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script, style, link, meta, iframe, object, embed")
    .forEach((el) => el.remove());
  // Drop event-handler attributes (onclick, onload, …) and javascript: urls.
  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const n = attr.name.toLowerCase();
      if (n.startsWith("on")) el.removeAttribute(attr.name);
      if (
        (n === "href" || n === "src") &&
        attr.value.trim().toLowerCase().startsWith("javascript:")
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML.trim();
}

/** Escape + paragraph-wrap plain text / markdown-ish content. */
function textToHtml(text: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Light markdown: "# Heading"
      const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
      if (h) {
        const level = h[1].length;
        return `<h${level}>${esc(h[2])}</h${level}>`;
      }
      return `<p>${esc(trimmed).replace(/\n/g, "<br/>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("read-failed"));
    r.readAsText(file);
  });
}

async function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(new Error("read-failed"));
    r.readAsArrayBuffer(file);
  });
}

export const IMPORT_ACCEPT =
  ".docx,.html,.htm,.txt,.md,text/html,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Convert a user-supplied file into editable HTML. */
export async function importFile(file: File): Promise<ImportResult> {
  const name = stripName(file.name);
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".docx")) {
    const buffer = await readAsArrayBuffer(file);
    const mammoth: any = await import("mammoth");
    const convert = mammoth.convertToHtml || mammoth.default?.convertToHtml;
    const result = await convert({ arrayBuffer: buffer });
    return { html: sanitizeHtml(result.value || ""), name };
  }

  if (lower.endsWith(".doc")) {
    // Legacy binary .doc can't be parsed in-browser reliably.
    throw new Error(
      "Legacy .doc files aren't supported — please re-save as .docx, .html or paste the content."
    );
  }

  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    const text = await readAsText(file);
    return { html: sanitizeHtml(text), name };
  }

  // txt / md / anything text-like
  const text = await readAsText(file);
  return { html: textToHtml(text), name };
}

/** Convert pasted content (HTML or plain text) into editable HTML. */
export function importPasted(raw: string, isHtml: boolean): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (isHtml || /<[a-z][\s\S]*>/i.test(trimmed)) return sanitizeHtml(trimmed);
  return textToHtml(trimmed);
}
