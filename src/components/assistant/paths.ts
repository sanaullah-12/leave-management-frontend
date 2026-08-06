/**
 * Nexora Assistant - path helpers.
 *
 * Deliberately tiny and dependency-free. The launcher needs to know whether
 * the assistant belongs on the current route, and that must not be a reason to
 * pull the whole knowledge base into the initial bundle - so path handling
 * lives here rather than inside `knowledge/`.
 */

/** Trailing slashes and query/hash noise removed. */
export function normalisePath(pathname: string): string {
  const clean = (pathname || "/").split("?")[0].split("#")[0];
  if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
  return clean || "/";
}
