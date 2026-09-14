/**
 * The tenant's own name, from whatever shape the caller is holding.
 *
 * The API serialises `user.company` as the display name, but a user object can
 * also arrive from an endpoint that populated the reference instead - and an
 * object reaching a `.trim()` or a JSX text node is a crash, not a fallback.
 * One reader, used everywhere the company is named, so neither form can get
 * through unhandled.
 */
export function companyNameOf(user: any): string {
  const company = user?.company;
  if (!company) return "";
  if (typeof company === "string") return company.trim();
  return String(company.name || "").trim();
}
