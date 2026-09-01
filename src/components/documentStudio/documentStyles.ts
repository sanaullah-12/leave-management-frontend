/**
 * Document Studio - the single stylesheet for the printed page.
 *
 * Both the on-screen A4 canvas and the export pipeline (PDF / DOCX / print)
 * inject the exact string this module builds, so what HR edits is what leaves
 * the building. Every rule is scoped under `.ds-doc`, which is the only class
 * the two sides have to agree on.
 */
import type { BrandSettings, PageSettings } from "./types";

export interface DocumentStyleOptions {
  page: PageSettings;
  brand: BrandSettings;
}

/** Mix a hex colour towards white - used for soft rules and tinted bands. */
export function tintHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** The same colour at a given alpha, for washes behind content. */
export function alphaHex(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

/**
 * Build the document stylesheet. Sizes are expressed relative to the page font
 * size so the whole letter scales as one when HR changes it.
 */
export function documentCss({ page, brand }: DocumentStyleOptions): string {
  const accent = brand.accent;
  const soft = tintHex(accent, 0.86);
  const rule = tintHex(accent, 0.55);
  const base = page.fontSize;

  return `
.ds-doc {
  color: #1f2937;
  font-family: ${page.fontFamily};
  font-size: ${base}pt;
  line-height: ${page.lineHeight};
  -webkit-font-smoothing: antialiased;
}
.ds-doc * { box-sizing: border-box; }

/* ---------- letterhead ---------- */
.ds-doc .lh-logo { display: block; max-height: 68px; width: auto; }
.ds-doc .lh-name {
  font-family: ${brand.headingFont};
  font-size: ${base + 6}pt;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #111827;
  margin: 0;
}
.ds-doc .lh-tagline {
  font-size: ${base - 3.5}pt;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${accent};
  margin: 3px 0 0;
}
.ds-doc .lh-meta {
  font-size: ${base - 3}pt;
  line-height: 1.45;
  color: #4b5563;
  margin: 6px 0 0;
}
.ds-doc .lh-sep { color: #9ca3af; padding: 0 6px; }
.ds-doc .lh-rule-thick { height: 3px; background: ${accent}; margin-top: 12px; }
.ds-doc .lh-rule-thin { height: 1px; background: ${rule}; margin-top: 2px; }
.ds-doc .lh-classic { text-align: center; }
.ds-doc .lh-classic .lh-logo { margin: 0 auto 8px; }
.ds-doc .lh-modern { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; }
.ds-doc .lh-modern .lh-right { text-align: right; }
.ds-doc .lh-minimal { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.ds-doc .lh-minimal .lh-name { font-size: ${base + 2}pt; letter-spacing: 0.06em; }
.ds-doc .lh-minimal .lh-meta { margin: 0; text-align: right; }
.ds-doc .lh-minimal .lh-logo { max-height: 44px; }
.ds-doc .lh-band {
  background: ${accent};
  color: #ffffff;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.ds-doc .lh-band .lh-name { color: #ffffff; }
.ds-doc .lh-band .lh-tagline { color: rgba(255, 255, 255, 0.82); }
.ds-doc .lh-band .lh-logo { max-height: 46px; background: #ffffff; padding: 5px; border-radius: 6px; }
.ds-doc .lh-band-meta {
  background: ${soft};
  color: #374151;
  font-size: ${base - 3}pt;
  padding: 6px 18px;
  text-align: center;
}

/* ---------- document body ---------- */
.ds-doc .doc-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: ${base - 2}pt;
  color: #4b5563;
  margin: 22px 0 18px;
}
.ds-doc .doc-title {
  font-family: ${brand.headingFont};
  font-size: ${base + 6}pt;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 6px;
  color: #111827;
}
.ds-doc .doc-subtitle {
  text-align: center;
  font-size: ${base - 2}pt;
  color: #6b7280;
  margin: 0 0 4px;
}
.ds-doc .doc-title-rule {
  width: 72px;
  height: 2px;
  background: ${accent};
  margin: 0 auto 20px;
}
.ds-doc .doc-addressee { margin: 0 0 16px; font-size: ${base - 1}pt; line-height: 1.5; }
.ds-doc .doc-addressee strong { font-size: ${base}pt; }
.ds-doc .doc-concern {
  font-weight: 700;
  letter-spacing: 0.1em;
  text-align: center;
  margin: 0 0 18px;
}
.ds-doc .doc-salutation { margin: 0 0 12px; }
.ds-doc .doc-subject {
  margin: 0 0 14px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 700;
}
.ds-doc p { margin: 0 0 11px; text-align: justify; }
.ds-doc h1 { font-size: ${base + 6}pt; margin: 0 0 12px; }
.ds-doc h2 { font-size: ${base + 3}pt; margin: 18px 0 8px; }
.ds-doc h3 { font-size: ${base + 1}pt; margin: 14px 0 6px; }
.ds-doc ul, .ds-doc ol { margin: 0 0 12px 20px; padding: 0; }
.ds-doc li { margin: 0 0 5px; }
.ds-doc .doc-terms li::marker { color: ${accent}; }
.ds-doc table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: ${base - 1}pt; }
.ds-doc td, .ds-doc th { border: 1px solid #d1d5db; padding: 7px 10px; text-align: left; }
.ds-doc th { background: ${soft}; font-weight: 700; }
.ds-doc .doc-facts { margin: 14px 0; }
.ds-doc .doc-facts td { border: 0; padding: 4px 0; vertical-align: top; }
.ds-doc .doc-facts td:first-child { width: 38%; color: #6b7280; }
.ds-doc .doc-facts td:last-child { font-weight: 600; }
.ds-doc img { max-width: 100%; }
.ds-doc a { color: ${accent}; }
.ds-doc blockquote {
  margin: 0 0 12px;
  padding: 8px 14px;
  border-left: 3px solid ${accent};
  background: ${soft};
  color: #374151;
}

/* ---------- signature and acknowledgement ---------- */
.ds-doc .doc-closing { margin: 20px 0 0; }
.ds-doc .doc-signature { margin: 6px 0 0; page-break-inside: avoid; }
.ds-doc .doc-sign-image { min-height: 34px; }
.ds-doc .doc-sign-image img { max-height: 62px; width: auto; }
.ds-doc .doc-sign-line { width: 210px; border-bottom: 1px solid #374151; margin: 4px 0 6px; }
.ds-doc .doc-signatory { margin: 0; font-weight: 700; text-align: left; }
.ds-doc .doc-signatory-role { margin: 0; font-size: ${base - 2}pt; color: #4b5563; text-align: left; }
.ds-doc .doc-ack {
  margin: 26px 0 0;
  padding-top: 12px;
  border-top: 1px dashed #d1d5db;
  page-break-inside: avoid;
}
.ds-doc .doc-ack-title { font-weight: 700; font-size: ${base - 1}pt; margin: 0 0 10px; text-align: left; }
.ds-doc .doc-ack-grid { display: flex; gap: 40px; }
.ds-doc .doc-ack-grid > div { flex: 1; }
.ds-doc .doc-note {
  margin: 20px 0 0;
  font-size: ${base - 3}pt;
  color: #6b7280;
  font-style: italic;
  text-align: center;
}

/* ---------- footer ---------- */
.ds-doc .ft { font-size: ${base - 3.5}pt; color: #6b7280; }
.ds-doc .ft-line { border-top: 1px solid ${rule}; padding-top: 6px; text-align: center; }
.ds-doc .ft-columns { border-top: 1px solid ${rule}; padding-top: 8px; display: flex; gap: 18px; }
.ds-doc .ft-columns > div { flex: 1; line-height: 1.45; }
.ds-doc .ft-columns > div:last-child { text-align: right; }
.ds-doc .ft-bar { background: ${accent}; color: #ffffff; padding: 7px 14px; text-align: center; }
.ds-doc .ft-note { margin-top: 4px; text-align: center; font-size: ${base - 4}pt; color: #9ca3af; }

/* ---------- variants ---------- */
.ds-doc--certificate .doc-title { font-size: ${base + 11}pt; letter-spacing: 0.14em; }
.ds-doc--certificate .doc-title-rule { width: 110px; height: 3px; }
.ds-doc--certificate p { text-align: center; }
.ds-doc--certificate .doc-facts td { text-align: left; }
.ds-doc--notice .doc-title {
  text-align: left;
  border-left: 4px solid ${accent};
  padding-left: 12px;
  letter-spacing: 0.06em;
}
.ds-doc--notice .doc-title-rule { display: none; }
.ds-doc--notice .doc-subject { border-bottom-color: ${accent}; }
.ds-doc--memo .doc-title { text-align: left; font-size: ${base + 4}pt; letter-spacing: 0.16em; }
.ds-doc--memo .doc-title-rule { margin: 0 0 14px; width: 100%; height: 1px; }
.ds-doc--memo .doc-facts { border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 8px 0; }
.ds-doc--memo p { text-align: left; }
${brand.showReference ? "" : ".ds-doc .doc-meta { display: none; }"}
`.trim();
}
