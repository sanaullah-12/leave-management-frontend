/**
 * Employee report - printable document.
 *
 * Composes a standalone, fully inline-styled A4 document, the same way Document
 * Studio and Payroll build their outputs. Rasterising the live dashboard was the
 * source of the export bugs: it inherits CSS variables, neumorphic shadows, the
 * dark theme and whatever width the browser window happened to be, and it slices
 * cards in half at page boundaries.
 *
 * Authoring for paper does not mean authoring something plain. This mirrors the
 * on-screen report section for section - gradient hero, profile card, metadata
 * tiles, the three coloured leave cards with their progress rings, the usage
 * chart, the distribution donut and the activity timeline - rendered with the
 * primitives that rasterise reliably: inline styles, flexbox, and inline SVG for
 * anything circular. No CSS variables, no theme classes, no `conic-gradient`
 * (html2canvas silently drops it), no web fonts.
 *
 * It emits one `.rp-page` per printed page - the exporter turns each into its
 * own PDF page - so sections break where we say they do, and long leave
 * histories paginate by row count rather than by pixel.
 */
import type { ReportModel, ReportHistoryRow, ReportBalanceRow } from "./reportModel";

const INK = "#111827";
const MUTED = "#6b7280";
const FAINT = "#9ca3af";
const LINE = "#e5e7eb";
const ACCENT = "#2563eb";
const ACCENT_DARK = "#1d4ed8";
const WASH = "#f8fafc";

/**
 * Rows of leave history per printed page. Sized against the worst case - a
 * reason long enough to wrap onto a third line - so a page never clips.
 */
const HISTORY_ROWS_FIRST_PAGE = 18;
const HISTORY_ROWS_PER_PAGE = 20;
/** Timeline entries on the analytics page. */
const TIMELINE_EVENTS = 8;

const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const STATUS_COLOR: Record<string, string> = {
  approved: "#059669",
  rejected: "#e11d48",
  pending: "#d97706",
  cancelled: "#64748b",
};

const STATUS_WASH: Record<string, string> = {
  approved: "#ecfdf5",
  rejected: "#fff1f2",
  pending: "#fffbeb",
  cancelled: "#f1f5f9",
};

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

/** Inline SVG icon. Stroked paths survive rasterisation cleanly at any scale. */
const icon = (path: string, color: string, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:block;">${path}</svg>`;

const ICONS = {
  report: `<path d="M4 4h9l7 7v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M13 4v7h7"/><path d="M9 18v-3M12 18v-5M15 18v-2"/>`,
  id: `<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M14 10h4M14 14h4M6 16.5c.9-1.6 4.2-1.6 5.1 0"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  building: `<path d="M4 21V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15"/><path d="M14 10h5a1 1 0 0 1 1 1v10"/><path d="M7 9h3M7 13h3M7 17h3M17 14h1M17 18h1"/>`,
  check: `<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>`,
  chart: `<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>`,
};

/* ------------------------------------------------------------------ */
/* Shells                                                              */
/* ------------------------------------------------------------------ */

const page = (inner: string, footer: string) => `
<section class="rp-page">
  <div class="rp-body">${inner}</div>
  <div class="rp-foot">${footer}</div>
</section>`;

/**
 * White card with the soft border/shadow the on-screen report uses. `width:100%`
 * matters: these sit inside flex rows, where a card would otherwise shrink to
 * its content and leave the column looking half-empty.
 */
const card = (inner: string, extra = "") => `
<div style="width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,0.04);${extra}">${inner}</div>`;

const sectionTitle = (text: string, sub?: string) => `
<div style="margin:0 0 8px;">
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="display:inline-block;width:4px;height:17px;border-radius:2px;background:${ACCENT};"></span>
    <h2 style="margin:0;font-size:12.5pt;color:${INK};letter-spacing:-0.01em;">${esc(text)}</h2>
  </div>
  ${
    sub
      ? `<p style="margin:3px 0 0 12px;font-size:8.5pt;color:${MUTED};">${esc(sub)}</p>`
      : ""
  }
</div>`;

/** Rounded chip used for the hero facts and status labels. */
const chip = (
  label: string,
  opts: { bg?: string; fg?: string; dot?: string; glyph?: string } = {}
) => `
<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;
  background:${opts.bg ?? "rgba(255,255,255,0.16)"};color:${opts.fg ?? "#ffffff"};
  font-size:8.5pt;font-weight:600;white-space:nowrap;">
  ${
    opts.dot
      ? `<span style="width:7px;height:7px;border-radius:50%;background:${opts.dot};"></span>`
      : opts.glyph ?? ""
  }
  ${esc(label)}
</span>`;

/** Horizontal meter - plain divs, which rasterise far more reliably than SVG. */
const meter = (percent: number, color: string, height = 7) => `
<div style="height:${height}px;border-radius:4px;background:#eef2f7;overflow:hidden;">
  <div style="height:${height}px;width:${Math.max(
  0,
  Math.min(100, percent)
)}%;border-radius:4px;background:${color};"></div>
</div>`;

/** Hollow progress ring, mirroring the on-screen `ProgressRing`. */
const ring = (percent: number, color: string, size = 52) => {
  const p = Math.max(0, Math.min(100, percent));
  const ARC =
    "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";
  return `
<svg width="${size}" height="${size}" viewBox="0 0 36 36" style="display:block;">
  <path d="${ARC}" fill="none" stroke="#e8edf3" stroke-width="3.6"/>
  ${
    // A round line cap on a zero-length dash paints a stray dot on the ring.
    p > 0
      ? `<path d="${ARC}" fill="none" stroke="${color}" stroke-width="3.6" stroke-linecap="round"
    stroke-dasharray="${p}, 100"/>`
      : ""
  }
  <text x="18" y="20.5" text-anchor="middle" font-size="8.5" font-weight="700" fill="${color}"
    font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif">${p}%</text>
</svg>`;
};

/* ------------------------------------------------------------------ */
/* Page 1 - overview                                                   */
/* ------------------------------------------------------------------ */

function heroBand(model: ReportModel): string {
  const logo = model.logoDataUrl
    ? `<img src="${model.logoDataUrl}" style="height:26px;object-fit:contain;" />`
    : "";

  return `
<div style="position:relative;overflow:hidden;border-radius:16px;padding:18px 20px;
  background:linear-gradient(120deg, ${ACCENT} 0%, ${ACCENT_DARK} 55%, #1e3a8a 100%);color:#ffffff;">
  <div style="position:absolute;top:-60px;right:-40px;width:190px;height:190px;border-radius:50%;background:rgba(255,255,255,0.10);"></div>
  <div style="position:absolute;bottom:-80px;right:70px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>

  <div style="position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;">
    <div style="display:flex;gap:13px;align-items:flex-start;">
      <span style="display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;
        background:rgba(255,255,255,0.18);">${icon(ICONS.report, "#ffffff", 22)}</span>
      <div>
        <h1 style="margin:0;font-size:18pt;letter-spacing:-0.02em;color:#ffffff;">Employee Leave Report</h1>
        <p style="margin:3px 0 0;font-size:9pt;color:rgba(255,255,255,0.82);">
          Comprehensive leave analysis · ${esc(model.period)}
        </p>
      </div>
    </div>
    <div style="text-align:right;">
      ${logo}
      <div style="margin-top:${logo ? "8px" : "0"};font-size:7.5pt;line-height:1.55;color:rgba(255,255,255,0.8);">
        <div style="color:#ffffff;font-weight:700;">Generated</div>
        <div>${esc(model.generatedAt)}</div>
        <div>by ${esc(model.generatedBy)}</div>
      </div>
    </div>
  </div>

  <div style="position:relative;margin-top:14px;display:flex;flex-wrap:wrap;gap:7px;">
    ${chip(`Status: ${model.employee.status}`, {
      dot:
        model.employee.status.toLowerCase() === "active" ? "#34d399" : "#fbbf24",
    })}
    ${chip(`Balance: ${model.totals.remaining} days`)}
    ${chip(model.employee.department || "-")}
    ${model.employee.tenureYears ? chip(`${model.employee.tenureYears} years`) : ""}
  </div>
</div>`;
}

function profileCard(model: ReportModel): string {
  const e = model.employee;
  const active = e.status.toLowerCase() === "active";
  const avatar = e.avatarDataUrl
    ? `<img src="${e.avatarDataUrl}" style="width:66px;height:66px;border-radius:50%;object-fit:cover;border:3px solid #dbeafe;" />`
    : `<div style="width:66px;height:66px;border-radius:50%;background:linear-gradient(135deg,${ACCENT},${ACCENT_DARK});color:#fff;display:flex;align-items:center;justify-content:center;font-size:20pt;font-weight:700;border:3px solid #dbeafe;">${esc(
        e.name.trim().charAt(0).toUpperCase() || "?"
      )}</div>`;

  const field = (glyph: string, label: string, value: string) => `
<div style="display:flex;gap:9px;align-items:flex-start;width:50%;padding:7px 0;">
  <span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:${WASH};flex:none;">
    ${icon(glyph, MUTED, 14)}
  </span>
  <div style="min-width:0;">
    <div style="font-size:7pt;letter-spacing:0.07em;text-transform:uppercase;color:${FAINT};font-weight:700;">${esc(
    label
  )}</div>
    <div style="margin-top:1px;font-size:9.5pt;font-weight:600;color:${INK};word-break:break-word;">${esc(
    value
  )}</div>
  </div>
</div>`;

  return card(`
<div style="padding:16px 18px;">
  <div style="display:flex;align-items:center;gap:16px;">
    ${avatar}
    <div style="flex:1;min-width:0;">
      <div style="font-size:15pt;font-weight:700;color:${INK};letter-spacing:-0.015em;">${esc(
    e.name
  )}</div>
      <div style="margin-top:2px;font-size:9.5pt;color:${MUTED};">${esc(
    e.position || "-"
  )} · ${esc(e.department || "-")}</div>
      <div style="margin-top:7px;">
        ${chip(active ? "Active Employee" : e.status || "Inactive", {
          bg: active ? "#ecfdf5" : "#fffbeb",
          fg: active ? "#047857" : "#b45309",
          glyph: icon(ICONS.check, active ? "#047857" : "#b45309", 12),
        })}
      </div>
    </div>
    <div style="text-align:right;padding-left:14px;border-left:1px solid ${LINE};">
      <div style="font-size:7pt;letter-spacing:0.07em;text-transform:uppercase;color:${FAINT};font-weight:700;">Remaining balance</div>
      <div style="font-size:30pt;font-weight:800;color:${ACCENT};line-height:1.05;letter-spacing:-0.03em;">${
    model.totals.remaining
  }</div>
      <div style="font-size:8.5pt;color:${MUTED};">of ${model.totals.allocated} days allocated</div>
    </div>
  </div>

  <div style="margin-top:12px;padding-top:6px;border-top:1px solid ${LINE};display:flex;flex-wrap:wrap;">
    ${field(ICONS.id, "Employee ID", e.employeeId || "-")}
    ${field(ICONS.building, "Department", e.department || "-")}
    ${field(ICONS.report, "Email", e.email || "-")}
    ${field(ICONS.calendar, "Joining date", e.joinDate || "-")}
    ${field(ICONS.check, "Position", e.position || "-")}
    ${field(ICONS.clock, "Tenure", e.tenureYears ? `${e.tenureYears} years` : "-")}
  </div>
</div>`);
}

/** The three colour-washed leave cards from the on-screen report. */
function leaveCards(model: ReportModel): string {
  const cards = model.balance
    .map((r: ReportBalanceRow) => {
      const usedPct = pct(r.used, r.allocated);
      return `
<div style="flex:1;position:relative;overflow:hidden;border:1px solid ${r.hex}55;border-radius:14px;padding:13px 14px;
  background:linear-gradient(180deg, ${r.hex}12 0%, #ffffff 62%);">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
    <div style="min-width:0;">
      <div style="font-size:10pt;font-weight:700;color:${INK};">${esc(r.label)}</div>
      <div style="margin-top:2px;font-size:8pt;color:${MUTED};">Allocated ${
        r.allocated
      } days</div>
    </div>
    ${ring(usedPct, r.hex, 48)}
  </div>
  <div style="margin-top:10px;display:flex;align-items:flex-end;gap:6px;">
    <span style="font-size:26pt;font-weight:800;line-height:1;color:${r.hex};letter-spacing:-0.03em;">${
        r.remaining
      }</span>
    <span style="padding-bottom:3px;font-size:8pt;color:${MUTED};">days remaining</span>
  </div>
  <div style="margin-top:9px;">${meter(usedPct, r.hex, 6)}</div>
  <div style="margin-top:4px;display:flex;justify-content:space-between;font-size:7.5pt;color:${MUTED};">
    <span>${r.used} used</span><span>${usedPct}% of quota</span>
  </div>
</div>`;
    })
    .join("");

  return `<div style="display:flex;gap:11px;">${cards}</div>`;
}

function balanceTable(model: ReportModel): string {
  const th = (label: string, align = "left") =>
    `<th style="padding:7px 9px;text-align:${align};font-size:7.5pt;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${label}</th>`;

  const rows = model.balance
    .map(
      (r, i) => `
<tr style="background:${i % 2 ? WASH : "#ffffff"};">
  <td style="padding:8px 9px;border-bottom:1px solid ${LINE};font-size:9pt;color:${INK};font-weight:600;">
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${
      r.hex
    };margin-right:7px;"></span>${esc(r.label)}
  </td>
  <td style="padding:8px 9px;border-bottom:1px solid ${LINE};font-size:9pt;text-align:center;">${
        r.allocated
      }</td>
  <td style="padding:8px 9px;border-bottom:1px solid ${LINE};font-size:9pt;text-align:center;">${
        r.used
      }</td>
  <td style="padding:8px 9px;border-bottom:1px solid ${LINE};font-size:9pt;text-align:center;font-weight:700;color:${
        r.hex
      };">${r.remaining}</td>
  <td style="padding:8px 9px;border-bottom:1px solid ${LINE};width:130px;">
    ${meter(pct(r.used, r.allocated), r.hex, 6)}
  </td>
</tr>`
    )
    .join("");

  return card(
    `
<table style="width:100%;border-collapse:collapse;overflow:hidden;border-radius:14px;">
  <thead>
    <tr style="background:${ACCENT};color:#fff;">
      ${th("Leave type")}${th("Allocated", "center")}${th("Used", "center")}${th(
      "Remaining",
      "center"
    )}${th("Utilisation")}
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr style="background:#eef2ff;">
      <td style="padding:8px 9px;font-size:9pt;font-weight:700;color:${INK};">Total</td>
      <td style="padding:8px 9px;font-size:9pt;font-weight:700;text-align:center;">${
        model.totals.allocated
      }</td>
      <td style="padding:8px 9px;font-size:9pt;font-weight:700;text-align:center;">${
        model.totals.used
      }</td>
      <td style="padding:8px 9px;font-size:9pt;font-weight:700;text-align:center;color:${ACCENT};">${
      model.totals.remaining
    }</td>
      <td style="padding:8px 9px;font-size:7.5pt;color:${MUTED};">${pct(
      model.totals.used,
      model.totals.allocated
    )}% of total quota used</td>
    </tr>
  </tbody>
</table>`,
    "overflow:hidden;"
  );
}

/* ------------------------------------------------------------------ */
/* Page 2 - analytics                                                  */
/* ------------------------------------------------------------------ */

function monthlyChart(model: ReportModel): string {
  const max = Math.max(1, ...model.monthly.map((m) => m.days));
  const hasData = model.monthly.some((m) => m.days > 0);
  const PLOT = 118;

  const body = hasData
    ? `
<div style="display:flex;gap:8px;">
  <div style="display:flex;flex-direction:column;justify-content:space-between;height:${
    PLOT + 18
  }px;padding-bottom:18px;font-size:7pt;color:${FAINT};text-align:right;width:16px;">
    <span>${max}</span><span>${Math.round(max / 2)}</span><span>0</span>
  </div>
  <div style="flex:1;position:relative;height:${PLOT + 18}px;">
    <div style="position:absolute;left:0;right:0;top:0;border-top:1px dashed ${LINE};"></div>
    <div style="position:absolute;left:0;right:0;top:${
      PLOT / 2
    }px;border-top:1px dashed ${LINE};"></div>
    <div style="position:absolute;left:0;right:0;top:${PLOT}px;border-top:1px solid ${LINE};"></div>
    <div style="display:flex;align-items:flex-end;height:${PLOT}px;">
      ${model.monthly
        .map((m) => {
          const h = Math.max(m.days > 0 ? 6 : 2, Math.round((m.days / max) * (PLOT - 16)));
          return `
<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:${PLOT}px;">
  <div style="font-size:7.5pt;font-weight:700;color:${INK};margin-bottom:3px;">${
            m.days || ""
          }</div>
  <div style="width:24px;height:${h}px;border-radius:6px 6px 2px 2px;
    background:${m.days > 0 ? `linear-gradient(180deg, #60a5fa, ${ACCENT})` : "#e5e7eb"};"></div>
</div>`;
        })
        .join("")}
    </div>
    <div style="display:flex;">
      ${model.monthly
        .map(
          (m) =>
            `<div style="flex:1;text-align:center;padding-top:5px;font-size:7.5pt;color:${MUTED};">${esc(
              m.month
            )}</div>`
        )
        .join("")}
    </div>
  </div>
</div>`
    : `<div style="height:${
        PLOT + 18
      }px;display:flex;align-items:center;justify-content:center;font-size:9pt;color:${FAINT};">No approved leave recorded in this period</div>`;

  return card(`
<div style="padding:14px 15px;">
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:#eff6ff;">${icon(
      ICONS.chart,
      ACCENT,
      15
    )}</span>
    <div>
      <div style="font-size:10pt;font-weight:700;color:${INK};">Monthly usage</div>
      <div style="font-size:8pt;color:${MUTED};">Approved leave days · last ${
    model.monthly.length
  } months</div>
    </div>
  </div>
  <div style="margin-top:12px;">${body}</div>
</div>`);
}

/** Donut + legend, mirroring the on-screen distribution card. */
function distributionCard(model: ReportModel): string {
  const used = model.balance.filter((r) => r.used > 0);
  const totalUsed = used.reduce((s, r) => s + r.used, 0);

  const donut = () => {
    // Circumference of an r=15.9155 circle is exactly 100 - segment lengths are
    // therefore percentages, which keeps the arithmetic honest.
    let offset = 25; // rotate so the first slice starts at 12 o'clock
    const segments = used
      .map((r) => {
        const share = (r.used / totalUsed) * 100;
        const seg = `
<circle cx="18" cy="18" r="15.9155" fill="none" stroke="${r.hex}" stroke-width="4.4"
  stroke-dasharray="${share.toFixed(2)} ${(100 - share).toFixed(2)}"
  stroke-dashoffset="${offset.toFixed(2)}"/>`;
        offset -= share;
        return seg;
      })
      .join("");

    return `
<svg width="122" height="122" viewBox="0 0 36 36" style="display:block;">
  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#eef2f7" stroke-width="4.4"/>
  ${segments}
  <text x="18" y="17" text-anchor="middle" font-size="6" font-weight="700" fill="${INK}"
    font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif">${totalUsed}</text>
  <text x="18" y="22" text-anchor="middle" font-size="2.8" fill="${MUTED}"
    font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif">DAYS USED</text>
</svg>`;
  };

  const body =
    used.length > 0
      ? `
<div style="display:flex;align-items:center;gap:16px;">
  ${donut()}
  <div style="flex:1;min-width:0;">
    ${used
      .map(
        (r) => `
<div style="margin-bottom:9px;">
  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:8.5pt;color:${INK};">
    <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${
      r.hex
    };margin-right:6px;"></span>${esc(r.label)}</span>
    <span style="font-weight:700;white-space:nowrap;">${r.used} · ${pct(
        r.used,
        totalUsed
      )}%</span>
  </div>
  <div style="margin-top:4px;">${meter(pct(r.used, totalUsed), r.hex, 5)}</div>
</div>`
      )
      .join("")}
  </div>
</div>`
      : `<div style="height:122px;display:flex;align-items:center;justify-content:center;font-size:9pt;color:${FAINT};">No leave usage recorded yet</div>`;

  return card(`
<div style="padding:14px 15px;">
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:8px;background:#eff6ff;">${icon(
      ICONS.report,
      ACCENT,
      15
    )}</span>
    <div>
      <div style="font-size:10pt;font-weight:700;color:${INK};">Leave distribution</div>
      <div style="font-size:8pt;color:${MUTED};">Days used by leave type</div>
    </div>
  </div>
  <div style="margin-top:12px;">${body}</div>
</div>`);
}

/** Status split - the three-up strip under the analytics row. */
function statusStrip(model: ReportModel): string {
  const counts = model.history.reduce<Record<string, number>>((acc, h) => {
    const key = h.status.toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const total = model.history.length;

  const tile = (label: string, key: string) => {
    const value = counts[key] ?? 0;
    const color = STATUS_COLOR[key] ?? MUTED;
    return `
<div style="flex:1;border:1px solid ${LINE};border-radius:12px;padding:10px 12px;background:${
      STATUS_WASH[key] ?? WASH
    };">
  <div style="display:flex;align-items:baseline;justify-content:space-between;">
    <span style="font-size:8.5pt;font-weight:700;color:${color};">${label}</span>
    <span style="font-size:7.5pt;color:${MUTED};">${pct(value, total)}%</span>
  </div>
  <div style="margin-top:2px;font-size:17pt;font-weight:800;color:${INK};line-height:1.1;">${value}</div>
</div>`;
  };

  return `<div style="display:flex;gap:10px;">
  ${tile("Approved", "approved")}${tile("Pending", "pending")}${tile(
    "Rejected",
    "rejected"
  )}
  <div style="flex:1;border:1px solid ${LINE};border-radius:12px;padding:10px 12px;background:#eff6ff;">
    <div style="font-size:8.5pt;font-weight:700;color:${ACCENT};">Total requests</div>
    <div style="margin-top:2px;font-size:17pt;font-weight:800;color:${INK};line-height:1.1;">${total}</div>
  </div>
</div>`;
}

/** Recent activity timeline, mirroring the on-screen `ActivityTimeline`. */
function timeline(model: ReportModel): string {
  const events = model.history.slice(0, TIMELINE_EVENTS);
  if (events.length === 0) {
    return card(
      `<div style="padding:22px;text-align:center;font-size:9pt;color:${FAINT};">No leave activity recorded yet</div>`
    );
  }

  const rows = events
    .map((e, i) => {
      const color = STATUS_COLOR[e.status.toLowerCase()] ?? ACCENT;
      const last = i === events.length - 1;
      const verb =
        e.status.toLowerCase() === "approved"
          ? "approved"
          : e.status.toLowerCase() === "rejected"
          ? "rejected"
          : "requested";
      return `
<div style="display:flex;gap:11px;">
  <div style="display:flex;flex-direction:column;align-items:center;width:11px;flex:none;">
    <span style="margin-top:4px;width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 0 3px ${
        STATUS_WASH[e.status.toLowerCase()] ?? "#eef2f7"
      };"></span>
    ${last ? "" : `<span style="flex:1;width:1px;background:${LINE};margin:4px 0;"></span>`}
  </div>
  <div style="flex:1;min-width:0;padding-bottom:${last ? 0 : 12}px;">
    <div style="display:flex;justify-content:space-between;gap:10px;">
      <span style="font-size:9.5pt;font-weight:700;color:${INK};">${esc(
        e.type
      )} leave ${verb}</span>
      <span style="font-size:8pt;color:${FAINT};white-space:nowrap;">${esc(
        e.appliedOn
      )}</span>
    </div>
    <div style="margin-top:1px;font-size:8.5pt;color:${MUTED};">${esc(e.from)} - ${esc(
        e.to
      )} · ${e.days} ${e.days === 1 ? "day" : "days"}</div>
    ${
      e.reason && e.reason !== "-"
        ? `<div style="margin-top:2px;font-size:8pt;font-style:italic;color:${FAINT};overflow:hidden;">“${esc(
            e.reason.length > 96 ? `${e.reason.slice(0, 96)}...` : e.reason
          )}”</div>`
        : ""
    }
  </div>
</div>`;
    })
    .join("");

  return card(`
<div style="padding:14px 16px;">
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;margin-bottom:12px;border-bottom:1px solid ${LINE};">
    <span style="font-size:8pt;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${FAINT};">Timeline</span>
    <span style="font-size:7.5pt;color:${FAINT};">Showing ${events.length} of ${
    model.history.length
  } requests</span>
  </div>
  ${rows}
</div>`);
}

/* ------------------------------------------------------------------ */
/* History table                                                       */
/* ------------------------------------------------------------------ */

function historyTable(rows: ReportHistoryRow[], startIndex: number): string {
  if (rows.length === 0) {
    return card(
      `<div style="padding:22px;text-align:center;font-size:9pt;color:${FAINT};">No leave requests on record</div>`
    );
  }

  const th = (label: string, width = "", align = "left") =>
    `<th style="padding:7px 9px;text-align:${align};font-size:7.5pt;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;${
      width ? `width:${width};` : ""
    }">${label}</th>`;

  const body = rows
    .map((r, i) => {
      const key = r.status.toLowerCase();
      return `
<tr style="background:${(startIndex + i) % 2 ? WASH : "#ffffff"};">
  <td style="padding:7px 9px;border-bottom:1px solid ${LINE};font-size:8.5pt;color:${FAINT};">${
        startIndex + i + 1
      }</td>
  <td style="padding:7px 9px;border-bottom:1px solid ${LINE};font-size:8.5pt;font-weight:600;color:${INK};">${esc(
        r.type
      )}</td>
  <td style="padding:7px 9px;border-bottom:1px solid ${LINE};font-size:8.5pt;white-space:nowrap;">${esc(
        r.from
      )}</td>
  <td style="padding:7px 9px;border-bottom:1px solid ${LINE};font-size:8.5pt;white-space:nowrap;">${esc(r.to)}</td>
  <td style="padding:7px 9px;border-bottom:1px solid ${LINE};font-size:8.5pt;text-align:center;font-weight:600;">${
        r.days
      }</td>
  <td style="padding:7px 9px;border-bottom:1px solid ${LINE};">
    <span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:7.5pt;font-weight:700;text-transform:capitalize;
      background:${STATUS_WASH[key] ?? "#f1f5f9"};color:${
        STATUS_COLOR[key] ?? INK
      };">${esc(r.status)}</span>
  </td>
  <td style="padding:7px 9px;border-bottom:1px solid ${LINE};font-size:8pt;color:${MUTED};">${esc(
        r.reason
      )}</td>
</tr>`;
    })
    .join("");

  return card(
    `
<table style="width:100%;border-collapse:collapse;table-layout:fixed;">
  <thead>
    <tr style="background:${ACCENT};color:#fff;">
      ${th("#", "26px")}${th("Type", "62px")}${th("From", "88px")}${th(
      "To",
      "88px"
    )}${th("Days", "40px", "center")}${th("Status", "70px")}${th("Reason")}
    </tr>
  </thead>
  <tbody>${body}</tbody>
</table>`,
    "overflow:hidden;"
  );
}

/* ------------------------------------------------------------------ */
/* Document                                                            */
/* ------------------------------------------------------------------ */

/** Wrap composed pages in the A4 document shell. */
function document(model: ReportModel, pages: string[]): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${esc(
    model.employee.name
  )} - Employee Leave Report</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #ffffff;
    color: ${INK};
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .rp-page {
    position: relative;
    width: 210mm;
    height: 297mm;
    padding: 12mm 12mm 9mm;
    background: #ffffff;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .rp-body { flex: 1; min-height: 0; }
  .rp-foot {
    padding-top: 7px;
    border-top: 1px solid ${LINE};
    font-size: 7.5pt;
    color: ${MUTED};
  }
  table { border-collapse: collapse; }
  h1, h2 { font-weight: 700; }
  p { margin: 0; }
</style></head>
<body>${pages.join("")}</body></html>`;
}

/**
 * Build the complete printable document. Page breaks are decided here, so the
 * exporter never has to guess where it is safe to cut.
 */
export function composeReportHtml(model: ReportModel): string {
  const foot = (n: number, total: number) =>
    `${esc(model.employee.name)} · Employee Leave Report · ${esc(
      model.period
    )} <span style="float:right;">Page ${n} of ${total}</span>`;

  const history = model.history;

  // A brand-new employee has no history and no usage: analytics, outcomes and
  // the history table would all be empty states spread over two extra sheets.
  // Collapse the whole thing to one honest page instead.
  const nothingRecorded = history.length === 0 && model.totals.used === 0;
  if (nothingRecorded) {
    return document(
      model,
      [
        page(
          `
    ${heroBand(model)}
    <div style="margin-top:14px;">${profileCard(model)}</div>
    <div style="margin-top:16px;">
      ${sectionTitle("Leave summary", "Allocation, usage and remaining balance by type")}
      ${leaveCards(model)}
    </div>
    <div style="margin-top:12px;">${balanceTable(model)}</div>
    <div style="margin-top:16px;">
      ${sectionTitle("Leave activity")}
      ${card(`
        <div style="padding:22px;text-align:center;">
          <div style="font-size:10pt;font-weight:700;color:${INK};">No leave activity yet</div>
          <div style="margin-top:3px;font-size:9pt;color:${MUTED};">
            This employee has not requested any leave, so the full allocation of ${
              model.totals.allocated
            } days remains available.
          </div>
        </div>`)}
    </div>
  `,
          foot(1, 1)
        ),
      ]
    );
  }

  // Paginate the history. With nothing on record there is no history page at
  // all - an empty table on its own sheet is just a wasted page.
  const chunks: ReportHistoryRow[][] = [];
  if (history.length === 0) {
    // no history pages
  } else if (history.length <= HISTORY_ROWS_FIRST_PAGE) {
    chunks.push(history);
  } else {
    chunks.push(history.slice(0, HISTORY_ROWS_FIRST_PAGE));
    for (
      let i = HISTORY_ROWS_FIRST_PAGE;
      i < history.length;
      i += HISTORY_ROWS_PER_PAGE
    ) {
      chunks.push(history.slice(i, i + HISTORY_ROWS_PER_PAGE));
    }
  }

  // 1 = overview, 2 = analytics, then one page per history chunk.
  const totalPages = 2 + chunks.length;

  const pageOne = page(
    `
    ${heroBand(model)}
    <div style="margin-top:14px;">${profileCard(model)}</div>
    <div style="margin-top:16px;">
      ${sectionTitle("Leave summary", "Allocation, usage and remaining balance by type")}
      ${leaveCards(model)}
    </div>
    <div style="margin-top:12px;">${balanceTable(model)}</div>
    <div style="margin-top:16px;">
      ${sectionTitle("Request outcomes", "Across every request on record")}
      ${statusStrip(model)}
    </div>
  `,
    foot(1, totalPages)
  );

  const pageTwo = page(
    `
    ${sectionTitle("Leave analytics", "How this employee's time off is distributed")}
    <div style="display:flex;gap:12px;align-items:stretch;">
      <div style="flex:1;display:flex;">${monthlyChart(model)}</div>
      <div style="flex:1;display:flex;">${distributionCard(model)}</div>
    </div>
    <div style="margin-top:16px;">
      ${sectionTitle("Recent activity", "Latest leave requests and decisions")}
      ${timeline(model)}
    </div>
  `,
    foot(2, totalPages)
  );

  let consumed = 0;
  const historyPages = chunks.map((chunk, i) => {
    const startIndex = consumed;
    consumed += chunk.length;
    return page(
      `
      ${sectionTitle(
        i === 0 ? "Leave history" : "Leave history (continued)",
        i === 0 ? `${history.length} requests on record` : undefined
      )}
      ${historyTable(chunk, startIndex)}
    `,
      foot(3 + i, totalPages)
    );
  });

  return document(model, [pageOne, pageTwo, ...historyPages]);
}
