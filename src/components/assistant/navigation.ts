/**
 * Nexora Assistant - navigation logic.
 *
 * The assistant's most useful move is "take me there", so every answer can
 * carry route actions. This module is the guard rail around that: it knows
 * which routes the app actually declares (mirroring `App.tsx`), and refuses
 * to render a button that would navigate nowhere.
 *
 * Keeping it separate from the UI means a route rename is caught in one file,
 * and a future AI provider - which may well invent a path - is held to the
 * same registry as the static knowledge base.
 */
import type { AssistantAction, AssistantRole } from "./types";
import { allowsRole } from "./knowledge";
import { normalisePath } from "./paths";

/* ------------------------------------------------------------------ */
/* Route registry - mirrors the <Route> tree in App.tsx                */
/* ------------------------------------------------------------------ */

/** Every static authenticated route the assistant is allowed to link to. */
export const APP_ROUTES = [
  "/",
  "/leaves",
  "/apply-leave",
  "/leave-calendar",
  "/my-leave-activity",
  "/attendance",
  "/employees",
  "/team",
  "/departments",
  "/leave-policies",
  "/reports",
  "/notifications",
  "/announcements",
  "/employee-voice",
  "/document-studio",
  "/payroll",
  "/payroll/salaries",
  "/payroll/run",
  "/payroll/payslips",
  "/payroll/history",
  "/payroll/settings",
  "/profile",
  "/theme",
] as const;

const ROUTE_SET = new Set<string>(APP_ROUTES);

/** Parameterised routes, matched by pattern rather than equality. */
const DYNAMIC_ROUTES = [/^\/employees\/[^/]+$/];

/** Routes only an admin can reach - used to hide dead-end buttons. */
const ADMIN_ONLY = [
  "/employees",
  "/departments",
  "/leave-policies",
  "/reports",
  "/document-studio",
  "/payroll",
];

/** True when `path` resolves to a route the app actually declares. */
export function isNavigableRoute(path: string): boolean {
  const clean = normalisePath(path);
  return ROUTE_SET.has(clean) || DYNAMIC_ROUTES.some((re) => re.test(clean));
}

/** True when `role` is permitted to open `path`. */
export function canRoleOpen(path: string, role: AssistantRole): boolean {
  if (role === "admin") return true;
  const clean = normalisePath(path);
  return !ADMIN_ONLY.some((p) => clean === p || clean.startsWith(`${p}/`));
}

/* ------------------------------------------------------------------ */
/* Action resolution                                                   */
/* ------------------------------------------------------------------ */

export type ResolvedAction =
  | { kind: "route"; to: string; action: AssistantAction }
  | { kind: "external"; href: string; action: AssistantAction }
  | { kind: "entry"; entryId: string; action: AssistantAction };

/**
 * Turn a declared action into something the UI can execute, or null when it
 * is not for this user (wrong role) or not reachable (unknown route). Both
 * cases are silent by design - a hidden button beats a broken one.
 */
export function resolveAction(
  action: AssistantAction,
  role: AssistantRole
): ResolvedAction | null {
  if (!allowsRole(action.roles, role)) return null;

  if (action.to) {
    const to = normalisePath(action.to);
    if (!isNavigableRoute(to) || !canRoleOpen(to, role)) return null;
    return { kind: "route", to, action };
  }
  if (action.href) return { kind: "external", href: action.href, action };
  if (action.entryId) return { kind: "entry", entryId: action.entryId, action };
  return null;
}

/** Resolve a list, dropping everything this user cannot use. */
export function resolveActions(
  actions: AssistantAction[] | undefined,
  role: AssistantRole
): ResolvedAction[] {
  if (!actions?.length) return [];
  return actions
    .map((a) => resolveAction(a, role))
    .filter((a): a is ResolvedAction => a !== null);
}

/**
 * True when the target is where the user already is, so the panel can say
 * "you're already here" instead of firing a no-op navigation.
 */
export function isCurrentRoute(to: string, pathname: string): boolean {
  return normalisePath(to) === normalisePath(pathname);
}
