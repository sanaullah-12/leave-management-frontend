/**
 * Document Studio - company stationery.
 *
 * Turns the stored {@link CompanyProfile} plus the uploaded branding assets
 * into the header, footer and certificate frame that wrap every document. The
 * canvas and the export pipeline both call these functions, so a branding
 * change lands on screen and in the PDF at the same moment.
 *
 * An uploaded full-width header image always wins over the composed layouts:
 * a company that already has designed stationery should not have to rebuild it
 * here.
 */
import { tintHex } from "./documentStyles";
import type {
  BrandSettings,
  BrandingAsset,
  CompanyProfile,
  PageSettings,
} from "./types";

export interface StationeryContext {
  company: CompanyProfile;
  brand: BrandSettings;
  assets: BrandingAsset[];
  page: PageSettings;
}

export const assetFor = (
  assets: BrandingAsset[],
  slot: BrandingAsset["slot"]
): BrandingAsset | undefined =>
  assets.find((a) => a.slot === slot && a.enabled);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** "12 Mall Road, Suite 4, Lahore, Punjab 54000, Pakistan" */
export function companyAddressLine(company: CompanyProfile): string {
  const region = [company.city, company.state].filter(Boolean).join(", ");
  const cityLine = [region, company.postalCode].filter(Boolean).join(" ");
  return [
    company.addressLine1,
    company.addressLine2,
    cityLine,
    company.country,
  ]
    .filter((part) => part && part.trim())
    .join(", ");
}

/** The contact pieces, in the order they read best on a letterhead. */
export function companyContactParts(company: CompanyProfile): string[] {
  return [company.phone, company.email, company.website].filter(
    (part) => part && part.trim()
  ) as string[];
}

const joinWithSeparator = (parts: string[]): string =>
  parts
    .map((part) => `<span>${escapeHtml(part)}</span>`)
    .join('<span class="lh-sep">|</span>');

const logoTag = (
  asset: BrandingAsset | undefined,
  extraStyle = ""
): string =>
  asset
    ? `<img class="lh-logo" src="${asset.dataUrl}" alt="" style="transform:scale(${
        asset.scale / 100
      });transform-origin:left center;${extraStyle}" />`
    : "";

const identityBlock = (
  company: CompanyProfile,
  brand: BrandSettings
): string => {
  const tagline =
    brand.showTagline && company.tagline
      ? `<p class="lh-tagline">${escapeHtml(company.tagline)}</p>`
      : "";
  return `<p class="lh-name">${escapeHtml(
    company.name || "Your Company"
  )}</p>${tagline}`;
};

const metaBlock = (company: CompanyProfile, brand: BrandSettings): string => {
  const address = companyAddressLine(company);
  const contact = companyContactParts(company);
  const registration =
    brand.showRegistration && company.registrationNo
      ? `<div>Reg. No. ${escapeHtml(company.registrationNo)}</div>`
      : "";
  if (!address && !contact.length && !registration) return "";
  return `<div class="lh-meta">${
    address ? `<div>${escapeHtml(address)}</div>` : ""
  }${contact.length ? `<div>${joinWithSeparator(contact)}</div>` : ""}${registration}</div>`;
};

/**
 * The letterhead block that sits above the document body. Returns an empty
 * string when the page has letterheads switched off.
 */
export function renderLetterhead({
  company,
  brand,
  assets,
  page,
}: StationeryContext): string {
  if (!page.showLetterhead) return "";

  const header = assetFor(assets, "header");
  if (header) {
    return `<div class="lh-image" style="text-align:center;"><img src="${
      header.dataUrl
    }" alt="" style="max-width:100%;transform:scale(${
      header.scale / 100
    });transform-origin:top center;" /></div>`;
  }

  const logo = brand.showLogo ? assetFor(assets, "logo") : undefined;
  const identity = identityBlock(company, brand);
  const meta = metaBlock(company, brand);

  switch (brand.letterhead) {
    case "modern":
      return `<div class="lh-modern">
  <div class="lh-left">${logoTag(logo)}</div>
  <div class="lh-right">${identity}${meta}</div>
</div>
<div class="lh-rule-thick"></div>`;

    case "minimal":
      return `<div class="lh-minimal">
  <div style="display:flex;align-items:center;gap:10px;">${logoTag(
    logo
  )}<div>${identity}</div></div>
  ${meta}
</div>
<div class="lh-rule-thin"></div>`;

    case "banner":
      return `<div class="lh-band">
  ${logoTag(logo, "transform-origin:center;")}
  <div>${identity}</div>
</div>
${
  companyAddressLine(company) || companyContactParts(company).length
    ? `<div class="lh-band-meta">${[
        companyAddressLine(company),
        ...companyContactParts(company),
      ]
        .filter(Boolean)
        .map((part) => escapeHtml(part))
        .join(" &nbsp;|&nbsp; ")}</div>`
    : ""
}`;

    case "classic":
    default:
      return `<div class="lh-classic">
  ${logoTag(logo, "transform-origin:top center;")}
  ${identity}
  ${meta}
</div>
<div class="lh-rule-thick"></div>
<div class="lh-rule-thin"></div>`;
  }
}

/** The footer strip. Empty when the layout is "none" or footers are hidden. */
export function renderFooter({
  company,
  brand,
  assets,
  page,
}: StationeryContext): string {
  if (!page.showFooter) return "";

  const footerAsset = assetFor(assets, "footer");
  if (footerAsset) {
    return `<div style="text-align:center;"><img src="${
      footerAsset.dataUrl
    }" alt="" style="max-width:100%;transform:scale(${
      footerAsset.scale / 100
    });transform-origin:bottom center;" /></div>`;
  }

  if (brand.footer === "none") return "";

  const address = companyAddressLine(company);
  const contact = companyContactParts(company);
  const note = company.footerNote
    ? `<div class="ft-note">${escapeHtml(company.footerNote)}</div>`
    : "";

  if (brand.footer === "bar") {
    const line = [company.name, address, ...contact]
      .filter(Boolean)
      .map((part) => escapeHtml(part as string))
      .join(" &nbsp;|&nbsp; ");
    return `<div class="ft"><div class="ft-bar">${line}</div>${note}</div>`;
  }

  if (brand.footer === "columns") {
    const registration = [
      company.registrationNo ? `Reg. No. ${company.registrationNo}` : "",
      company.taxId ? `Tax ID ${company.taxId}` : "",
    ]
      .filter(Boolean)
      .map((part) => escapeHtml(part))
      .join("<br />");
    return `<div class="ft"><div class="ft-columns">
  <div>${escapeHtml(company.name)}${
      address ? `<br />${escapeHtml(address)}` : ""
    }</div>
  <div style="text-align:center;">${contact
    .map((part) => escapeHtml(part))
    .join("<br />")}</div>
  <div>${registration}</div>
</div>${note}</div>`;
  }

  const line = [address, ...contact]
    .filter(Boolean)
    .map((part) => escapeHtml(part as string))
    .join(" &nbsp;|&nbsp; ");
  return `<div class="ft"><div class="ft-line">${line}</div>${note}</div>`;
}

/** Decorative border drawn behind certificates. */
export function renderFrame(
  variant: string | undefined,
  brand: BrandSettings
): string {
  if (variant !== "certificate") return "";
  return `<div class="doc-frame" style="position:absolute;inset:8mm;border:2px solid ${
    brand.accent
  };outline:1px solid ${tintHex(
    brand.accent,
    0.55
  )};outline-offset:3px;pointer-events:none;z-index:0;"></div>`;
}

/**
 * Drop the uploaded signature image into the signature block a template
 * declares. Documents authored before signature slots existed simply keep the
 * image appended at the end of the body.
 */
export function injectSignature(
  bodyHtml: string,
  signature: BrandingAsset | undefined
): string {
  if (!signature) return bodyHtml;
  const img = `<img src="${signature.dataUrl}" alt="" style="max-height:62px;transform:scale(${
    signature.scale / 100
  });transform-origin:left bottom;" />`;
  if (bodyHtml.includes("data-sign-slot")) {
    return bodyHtml.replace(
      /(<div[^>]*data-sign-slot="1"[^>]*>)(\s*)(<\/div>)/,
      `$1${img}$3`
    );
  }
  return `${bodyHtml}<div class="doc-signature" style="margin-top:18px;">${img}</div>`;
}

/**
 * Show the signature inside the editor without writing it into the document.
 *
 * The signature slot lives in editable content, so painting the image as a
 * background keeps the asset out of the HTML HR is editing while still showing
 * exactly where it will land on export.
 */
export function signaturePreviewCss(
  signature: BrandingAsset | undefined
): string {
  if (!signature) return "";
  return `.ds-doc .doc-sign-image[data-sign-slot] {
  background-image: url(${signature.dataUrl});
  background-repeat: no-repeat;
  background-position: left bottom;
  background-size: auto ${Math.round(56 * (signature.scale / 100))}px;
  height: ${Math.round(60 * (signature.scale / 100))}px;
}`;
}

/** Watermark layer shared by the canvas and the exporters. */
export function renderWatermark({
  assets,
  page,
}: Pick<StationeryContext, "assets" | "page">): string {
  const watermark = page.showWatermark ? assetFor(assets, "watermark") : undefined;
  if (!watermark) return "";
  return `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;"><img src="${
    watermark.dataUrl
  }" alt="" style="max-width:60%;opacity:${
    watermark.opacity / 100
  };transform:scale(${watermark.scale / 100});" /></div>`;
}
