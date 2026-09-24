import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import Avatar from "./Avatar";
import MobileTabBar from "./MobileTabBar";
import ThemeToggle from "./ThemeToggle";
import GetAppButton from "./pwa/GetAppButton";
import BrandedLoader from "./BrandedLoader";
import { RouteFallback } from "./Skeletons";
import AppLogo from "./AppLogo";
import Dropdown from "./ui/Dropdown";
import GlobalSearch, { type SearchEntry } from "./header/GlobalSearch";
import ThemeModal from "./ThemeModal";
import VoiceNotificationToaster from "./voice/VoiceNotificationToaster";
import NexoraAssistant from "./assistant/NexoraAssistant";
import { useNotifications } from "../hooks/useNotifications";
import { companyNameOf } from "../lib/company";
import { useLocale } from "../i18n/LocaleProvider";
import { DUR, EASE, panelSpring, routeVariants } from "../lib/motion";
import {
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  PlusCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  SwatchIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  PlusIcon,
  EllipsisHorizontalIcon,
  PaintBrushIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  HomeIcon,
  HomeModernIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  DocumentDuplicateIcon,
  NewspaperIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  LanguageIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

type Icon = React.ComponentType<{ className?: string }>;

interface PanelItem {
  name: string;
  href: string;
  icon: Icon;
  badge?: "notifications";
  /** Match the path exactly - for section landing pages that own sub-routes. */
  exact?: boolean;
}
interface NavGroup {
  key: string;
  short: string; // rail label
  label: string; // panel header
  icon: Icon;
  items: PanelItem[];
}

/**
 * Extra search terms per route, for the words people use that the page titles
 * do not contain. Keyed by href so it survives the titles being translated -
 * the nav labels come from i18n, these do not.
 */
const SEARCH_KEYWORDS: Record<string, string> = {
  "/": "home overview summary kpi",
  "/apply-leave": "request time off holiday vacation book",
  "/leaves": "requests approvals time off holiday",
  "/leave-calendar": "schedule month who is out",
  "/leave-policies": "allocation entitlement rules days",
  "/my-leave-activity": "my requests history balance",
  "/attendance": "punch clock in out hours present",
  "/attendance/late-time": "late arrivals tardy punctuality",
  "/work-from-home": "wfh remote home office",
  "/employees": "staff people team members roster invite manage",
  // "my team" stays searchable: these two screens were called that until
  // recently, and a search box that cannot find a page by the name it had
  // last week is how people conclude the page was removed.
  "/team": "staff people colleagues my team profiles directory",
  "/departments": "org structure divisions teams",
  "/payroll": "salary pay wages compensation",
  "/payroll/salaries": "salary structure ctc compensation",
  "/payroll/run": "process generate payslips run",
  "/payroll/payslips": "payslip salary slip payment",
  "/payroll/history": "past runs archive payroll",
  "/payroll/settings": "tax deductions allowances payroll config",
  "/document-studio": "letter offer contract certificate template hr docs",
  "/announcements": "news updates company post",
  "/employee-voice": "feedback idea complaint suggestion appreciation report",
  "/notifications": "alerts activity inbox",
  "/reports": "analytics export pdf excel insights",
  "/profile": "account me my details password",
  "/theme": "appearance colour dark mode language settings customize",
};

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  // "nav" is preloaded at init, so these resolve without suspending.
  const { t } = useTranslation("nav");
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  // The one expanded section, or none. Opening a section closes the last one:
  // with several open at a time the panel grows past the height of the screen
  // and every section looks equally current, which is the opposite of what the
  // expansion is for.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const globalSearchRef = useRef<HTMLInputElement>(null);
  const { unreadCount } = useNotifications({ limit: 12 });
  const reduceMotion = useReducedMotion();
  const { language } = useLocale();

  const isAdmin = user?.role === "admin";
  /** The signed-in user's company, as the API serialises it (a display name). */
  const companyName = companyNameOf(user);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // The header field is the global one, so it takes the shortcut. It
        // only exists on desktop; below `lg` the panel's own search is the
        // one on screen, so the shortcut falls back to it.
        if (globalSearchRef.current) {
          globalSearchRef.current.focus();
          globalSearchRef.current.select();
          return;
        }
        setCollapsed(false);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // The drawer is an overlay, so the page behind it must not scroll - on iOS a
  // scrim without this lets a drag over the scrim scroll the page underneath,
  // and the drawer then closes onto a screen that has moved. Escape closes it
  // for anyone on a keyboard-attached tablet.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  // Navigating from inside the drawer, from the tab bar, or with the back
  // gesture all end on a new screen; leaving the drawer open over it is never
  // what was meant.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Areas → each rail icon opens a panel listing its pages.
  const groups: NavGroup[] = useMemo(() => {
    if (isAdmin) {
      return [
        {
          key: "home",
          short: t("short.home"),
          label: t("groups.home"),
          icon: HomeIcon,
          items: [
            { name: t("items.dashboard"), href: "/", icon: Squares2X2Icon },
            { name: t("items.announcements"), href: "/announcements", icon: NewspaperIcon },
            { name: t("items.reports"), href: "/reports", icon: ChartBarIcon },
            { name: t("items.notifications"), href: "/notifications", icon: BellIcon, badge: "notifications" },
          ],
        },
        {
          key: "leave",
          short: t("short.leave"),
          label: t("groups.leave"),
          icon: CalendarDaysIcon,
          items: [
            { name: t("items.leaveRequests"), href: "/leaves", icon: ClipboardDocumentListIcon },
            { name: t("items.leaveCalendar"), href: "/leave-calendar", icon: CalendarDaysIcon },
            { name: t("items.wfhRequests"), href: "/work-from-home", icon: HomeModernIcon },
          ],
        },
        {
          key: "team",
          short: t("short.team"),
          label: t("groups.team"),
          icon: UserGroupIcon,
          items: [
            { name: t("items.myTeam"), href: "/team", icon: UserGroupIcon },
            { name: t("items.employees"), href: "/employees", icon: IdentificationIcon },
            { name: t("items.departments"), href: "/departments", icon: BuildingOffice2Icon },
            { name: t("items.leavePolicies"), href: "/leave-policies", icon: ShieldCheckIcon },
          ],
        },
        {
          key: "attendance",
          short: t("short.attendance"),
          label: t("groups.attendance"),
          icon: ClockIcon,
          items: [
            { name: t("items.attendance"), href: "/attendance", icon: ClockIcon, exact: true },
            { name: t("items.lateTime"), href: "/attendance/late-time", icon: ExclamationTriangleIcon },
          ],
        },
        {
          key: "payroll",
          short: t("short.payroll"),
          label: t("groups.payroll"),
          icon: BanknotesIcon,
          items: [
            { name: t("items.payrollDashboard"), href: "/payroll", icon: Squares2X2Icon, exact: true },
            { name: t("items.employeeSalaries"), href: "/payroll/salaries", icon: CurrencyDollarIcon },
            { name: t("items.runPayroll"), href: "/payroll/run", icon: PlayCircleIcon },
            { name: t("items.payslips"), href: "/payroll/payslips", icon: DocumentTextIcon },
            { name: t("items.payrollHistory"), href: "/payroll/history", icon: ArchiveBoxIcon },
            { name: t("items.payrollSettings"), href: "/payroll/settings", icon: Cog6ToothIcon },
          ],
        },
        {
          key: "documents",
          short: t("short.documents"),
          label: t("groups.documents"),
          icon: DocumentDuplicateIcon,
          items: [
            { name: t("items.documentStudio"), href: "/document-studio", icon: DocumentDuplicateIcon },
          ],
        },
        {
          key: "voice",
          short: t("short.voice"),
          label: t("groups.voice"),
          icon: MegaphoneIcon,
          items: [
            { name: t("items.employeeVoice"), href: "/employee-voice", icon: MegaphoneIcon },
          ],
        },
        {
          key: "settings",
          short: t("short.settings"),
          label: t("groups.settings"),
          icon: Cog6ToothIcon,
          items: [
            { name: t("items.profileSettings"), href: "/profile", icon: Cog6ToothIcon },
            { name: t("items.theme"), href: "/theme", icon: SwatchIcon },
          ],
        },
      ];
    }
    return [
      {
        key: "home",
        short: t("short.home"),
        label: t("groups.home"),
        icon: HomeIcon,
        items: [
          { name: t("items.dashboard"), href: "/", icon: Squares2X2Icon },
          { name: t("items.announcements"), href: "/announcements", icon: NewspaperIcon },
          { name: t("items.notifications"), href: "/notifications", icon: BellIcon, badge: "notifications" },
        ],
      },
      {
        key: "leave",
        short: t("short.leave"),
        label: t("groups.leave"),
        icon: CalendarDaysIcon,
        items: [
          { name: t("items.leaveRequests"), href: "/leaves", icon: ClipboardDocumentListIcon },
          { name: t("items.applyLeave"), href: "/apply-leave", icon: PlusCircleIcon },
          { name: t("items.leaveCalendar"), href: "/leave-calendar", icon: CalendarDaysIcon },
          { name: t("items.myLeaveActivity"), href: "/my-leave-activity", icon: ClipboardDocumentCheckIcon },
          { name: t("items.workFromHome"), href: "/work-from-home", icon: HomeModernIcon },
        ],
      },
      {
        key: "attendance",
        short: t("short.attendance"),
        label: t("groups.attendance"),
        icon: ClockIcon,
        items: [
          { name: t("items.attendance"), href: "/attendance", icon: ClockIcon, exact: true },
          { name: t("items.lateTime"), href: "/attendance/late-time", icon: ExclamationTriangleIcon },
        ],
      },
      {
        key: "voice",
        short: t("short.voice"),
        label: t("groups.voice"),
        icon: MegaphoneIcon,
        items: [
          { name: t("items.employeeVoice"), href: "/employee-voice", icon: MegaphoneIcon },
        ],
      },
      {
        key: "settings",
        short: t("short.settings"),
        label: t("groups.settings"),
        icon: Cog6ToothIcon,
        items: [
          { name: t("items.profileSettings"), href: "/profile", icon: Cog6ToothIcon },
          { name: t("items.theme"), href: "/theme", icon: SwatchIcon },
        ],
      },
    ];
    // `t` is a dependency: its identity changes when the language changes, and
    // without it every label here would stay frozen in the language that was
    // active when the sidebar first mounted.
  }, [isAdmin, t]);

  const isActive = (path: string, exact = false) => {
    if (path === "/" || exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const itemActive = (it: PanelItem) => isActive(it.href, it.exact);

  // The active area = the group that owns the current route. Sub-routes count
  // here (unlike the per-item check) so /payroll/run still highlights Payroll.
  const activeGroup =
    groups.find((g) => g.items.some((i) => isActive(i.href))) ?? groups[0];

  // The specific page within that group, used as the mobile app-bar title.
  // Falls back to the group label for routes with no exact item match.
  const activeItem = activeGroup.items.find((i) => itemActive(i));

  const toggleGroup = (key: string) =>
    setOpenGroup((prev) => (prev === key ? null : key));

  // The section owning the current route is the open one. This covers the
  // first paint, a deep link, and arriving from anywhere that is not the panel
  // itself (a search result, the bottom tab bar, a link inside a page) - in all
  // of those the panel would otherwise show a highlighted section header with
  // its pages folded away under it, and leave the section you came from hanging
  // open behind it.
  useEffect(() => {
    setOpenGroup(activeGroup.key);
  }, [activeGroup.key]);

  // The bar holds three groups plus "More". Slicing the live `groups` array
  // (rather than hardcoding keys) keeps role-based groups respected: an
  // employee who never sees Payroll simply gets a different three.
  const tabGroups = groups.slice(0, 3);
  // "More" is highlighted when the current screen lives in one of the groups
  // the bar does not show, so the bar never looks like nothing is selected.
  const moreHasActive = !tabGroups.some((g) => g.key === activeGroup.key);

  const tabItems = [
    ...tabGroups.map((g) => ({
      key: g.key,
      label: g.short,
      icon: g.icon,
      badge:
        g.items.some((i) => i.badge === "notifications") && unreadCount > 0
          ? unreadCount > 9
            ? "9+"
            : String(unreadCount)
          : null,
      active: g.key === activeGroup.key,
      onClick: () => navigate(g.items[0].href),
    })),
    {
      key: "__more",
      label: t("actions.more"),
      icon: EllipsisHorizontalIcon,
      badge: null,
      active: mobileOpen || moreHasActive,
      onClick: () => setMobileOpen(true),
    },
  ];

  /**
   * What the header's search can find.
   *
   * Built from the same `groups` the rail and panel are built from, so a page
   * added to the navigation is searchable the moment it appears - there is no
   * second list to keep in step.
   *
   * `SEARCH_KEYWORDS` covers the gap between what a page is called and what
   * somebody types looking for it. "Salary" is not in the word "Payroll" and
   * "wfh" is not in "Work From Home", but both are what people search for.
   */
  const searchEntries: SearchEntry[] = useMemo(
    () =>
      groups.flatMap((g) =>
        g.items.map((i) => ({
          name: i.name,
          href: i.href,
          icon: i.icon,
          group: g.label,
          keywords: SEARCH_KEYWORDS[i.href],
        }))
      ),
    [groups]
  );

  // Global search across all pages.
  const searchResults: PanelItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return groups
      .flatMap((g) => g.items)
      .filter((i) => i.name.toLowerCase().includes(q));
  }, [query, groups]);

  if (isLoading) return <BrandedLoader message="Preparing your workspace..." />;
  if (!isAuthenticated) {
    // The bare root URL is the public front door - send anonymous visitors to
    // the marketing site instead of straight to the login form. Deep links
    // into the app (e.g. /leaves) still redirect to /login as before, so the
    // post-login redirect-back behavior is unaffected.
    return <Navigate to={location.pathname === "/" ? "/landing" : "/login"} replace />;
  }

  const roleLabel =
    user?.position ||
    (isAdmin ? t("header.administrator") : t("header.employee"));

  const leftOffset = collapsed ? "lg:left-20" : "lg:left-[17.5rem]";
  const mainOffset = collapsed ? "lg:ml-20" : "lg:ml-[17.5rem]";

  const badgeFor = (it: PanelItem) =>
    it.badge === "notifications" && unreadCount > 0
      ? unreadCount > 9 ? "9+" : String(unreadCount)
      : null;

  // The accordion carries the sections a person works in. Notifications and
  // the settings pair are pinned to the foot of the panel instead: they are
  // reached from everywhere, they are never what somebody is "working in",
  // and a two-item group that existed only to hold them made Settings read as
  // a place like Payroll.
  const navGroups = groups
    .filter((g) => g.key !== "settings")
    .map((g) => ({ ...g, items: g.items.filter((i) => i.badge !== "notifications") }));

  const utilityItems: PanelItem[] = [
    ...groups.flatMap((g) => g.items).filter((i) => i.badge === "notifications"),
    ...(groups.find((g) => g.key === "settings")?.items ?? []),
  ];

  // Eight collapsed section headers in an undifferentiated column is a list to
  // be read top to bottom every time. These three bands are what turn it into
  // a map: somebody looking for Payroll looks in Operations, not at item six.
  // Bands with nothing in them (an employee has no Payroll) do not render.
  const navBands = [
    { key: "workspace", label: t("bands.workspace"), keys: ["home"] },
    { key: "people", label: t("bands.people"), keys: ["leave", "team", "attendance"] },
    {
      key: "operations",
      label: t("bands.operations"),
      keys: ["payroll", "documents", "voice"],
    },
  ]
    .map((band) => ({
      ...band,
      groups: navGroups.filter((g) => band.keys.includes(g.key)),
    }))
    .filter((band) => band.groups.length > 0);

  // ---- Reusable leaf row (plain function so inputs keep focus) ----
  // `nested` rows sit under an open section and drop their icon: the section
  // header above already carries one, and a column of near-identical glyphs at
  // two indents is what turns a list of pages into a wall. They hang off a
  // hairline instead, so an open section reads as one branch rather than as
  // more top-level rows that happen to be indented.
  const renderRow = (it: PanelItem, onClick?: () => void, nested = false) => {
    const active = itemActive(it);
    const badge = badgeFor(it);
    return (
      <Link
        key={it.href}
        to={it.href}
        onClick={onClick}
        className={`relative flex items-center gap-2.5 rounded-full py-2.5 text-[13.5px] transition-colors ${
          nested ? "pl-4 pr-3" : "px-3"
        } ${active ? "font-semibold" : "hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg-strong)]"}`}
        style={{
          color: active ? "var(--sidebar-active-fg)" : "var(--sidebar-fg)",
          backgroundColor: active ? "var(--sidebar-active)" : undefined,
          // An active row is lit from inside rather than merely filled: the
          // top highlight is what keeps a flat translucent pill from reading
          // as a selection rectangle drawn over the panel.
          boxShadow: active ? "var(--sidebar-active-shadow)" : undefined,
        }}
      >
        {/* The marker lights the segment of the branch hairline beside the
            current page, and slides down it as you move between pages in the
            section. Only nested rows carry it: a top-level row is already a
            filled pill, and a bar inside a pill reads as a stray tick. */}
        {nested && active && !reduceMotion && (
          <motion.span
            layoutId="nav-marker"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="absolute -left-[11px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--sidebar-mark)]"
          />
        )}
        {nested && active && reduceMotion && (
          <span className="absolute -left-[11px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--sidebar-mark)]" />
        )}
        {!nested && <it.icon className="h-[18px] w-[18px] flex-shrink-0" />}
        <span className="min-w-0 flex-1 truncate">{it.name}</span>
        {badge && (
          <span
            className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white ring-1 ring-inset ring-[color:var(--sidebar-ring)]"
            style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  };

  // ---- A section header: icon, label, and the chevron that opens it ----
  const renderGroupRow = (g: NavGroup, onNavigate?: () => void) => {
    const open = openGroup === g.key;
    const current = activeGroup.key === g.key;
    return (
      <div key={g.key}>
        <button
          type="button"
          onClick={() => toggleGroup(g.key)}
          aria-expanded={open}
          className={`flex w-full items-center gap-2.5 rounded-full px-3 py-2.5 text-[13.5px] transition-colors ${
            current ? "font-semibold" : ""
          } ${current || open ? "" : "hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg-strong)]"}`}
          style={{
            color: current ? "var(--sidebar-active-fg)" : "var(--sidebar-fg)",
            // Two weights, not one. The section owning the current route gets
            // the lit pill; a section the user merely left open gets a flat
            // tint that shows it is expanded without claiming to be where you
            // are - with several sections open, one weight for both made half
            // the panel look selected.
            backgroundColor: current
              ? "var(--sidebar-active)"
              : open
              ? "var(--sidebar-open)"
              : undefined,
            boxShadow: current ? "var(--sidebar-active-shadow)" : undefined,
          }}
        >
          <g.icon className="h-[18px] w-[18px] flex-shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{g.label}</span>
          <ChevronDownIcon
            className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            style={{ color: "var(--sidebar-fg-muted)" }}
          />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: DUR.base, ease: EASE.out }
              }
              className="overflow-hidden"
            >
              {/* The hairline starts under the section icon, so the branch
                  visibly hangs off the row that owns it. */}
              <div
                className="ml-[23px] mb-1.5 mt-1.5 space-y-1 border-l pl-2.5"
                style={{ borderColor: "var(--sidebar-border)" }}
              >
                {g.items.map((it) => renderRow(it, onNavigate, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ---- The full panel: brand, search, sections, utilities, account ----
  // `scope` namespaces the active marker's shared layout. The desktop panel
  // stays mounted below `lg` (it is only display:none), so with one global id
  // the drawer's marker and the hidden panel's marker would be the same
  // element as far as the layout animation is concerned, and it would animate
  // between two panels the user never sees side by side.
  const renderSidebar = (
    scope: string,
    onNavigate?: () => void,
    attachRef = false
  ) => (
    <LayoutGroup id={scope}>
      <div
        className="relative flex h-full w-full flex-col pb-safe pt-safe"
        style={{ backgroundColor: "var(--sidebar-bg)" }}
      >
        {/* Two decorative layers, both pointer-transparent and both behind the
            content. The wash lifts the top of the panel where the brand sits so
            the column has a light source rather than being one flat fill; the
            grain breaks up the gradient, which at this size would otherwise band
            on a wide display. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--sidebar-wash)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
          style={{ backgroundImage: "var(--sidebar-grain)" }}
        />

        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* Brand. The product name is the identity of the thing being used; the
              line under it names the employer rather than restating the product,
              because everyone signed in here already knows what it is. */}
          <div className="flex items-center gap-3 px-4 pt-5">
            <Link
              to="/"
              onClick={onNavigate}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-[color:var(--sidebar-ring)]"
              style={{
                background: "var(--sidebar-tile)",
                boxShadow: "var(--sidebar-tile-shadow)",
              }}
              title={t("brand.name")}
            >
              <AppLogo size={26} />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-[color:var(--sidebar-fg-strong)]">
                {t("brand.name")}
              </p>
              <p
                className="truncate text-[10px] font-medium uppercase leading-tight tracking-[0.16em]"
                style={{ color: "var(--sidebar-fg-muted)" }}
                title={companyName || undefined}
              >
                {companyName || t("brand.tagline")}
              </p>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-[color:var(--sidebar-fg-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg-strong)] lg:flex"
              title={t("actions.collapse")}
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--sidebar-fg-muted)] active:bg-[var(--sidebar-hover)] lg:hidden"
              aria-label={t("actions.closeMenu")}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Search. Typing replaces the section list with matches from every page
              in the product, which is why it sits above that list. */}
          <div className="px-4 pt-4">
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--sidebar-fg-muted)" }}
              />
              <input
                ref={attachRef ? searchRef : undefined}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="h-10 w-full rounded-full border border-[color:var(--sidebar-ring)] pl-10 pr-9 text-[13.5px] text-[color:var(--sidebar-fg-strong)] outline-none transition-[border-color,box-shadow] placeholder:text-[color:var(--sidebar-fg-faint)] focus:border-[color:var(--brand)]"
                style={{
                  backgroundColor: "var(--sidebar-field)",
                  boxShadow: "var(--sidebar-field-shadow)",
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--sidebar-fg-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg-strong)]"
                  aria-label={t("search.clear")}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sections. The mask fades the first and last few pixels of the
              scroller, so a long list passes under the search field and the
              account card instead of being sliced off against them. */}
          <nav
            className="scroll-pane mt-4 min-h-0 flex-1 px-3"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent, #000 12px, #000 calc(100% - 12px), transparent)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, #000 12px, #000 calc(100% - 12px), transparent)",
            }}
          >
            {query ? (
              searchResults.length ? (
                <div className="space-y-1 py-1">
                  {searchResults.map((it) => renderRow(it, onNavigate))}
                </div>
              ) : (
                <p
                  className="px-3 py-6 text-center text-sm"
                  style={{ color: "var(--sidebar-fg-muted)" }}
                >
                  {t("search.noResults", { query })}
                </p>
              )
            ) : (
              navBands.map((band) => (
                <div key={band.key} className="pb-1.5 pt-1">
                  <p
                    className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: "var(--sidebar-fg-faint)" }}
                  >
                    {band.label}
                  </p>
                  <div className="space-y-1">
                    {band.groups.map((g) => renderGroupRow(g, onNavigate))}
                  </div>
                </div>
              ))
            )}
          </nav>

          {/* Utilities. Pinned, so the way to notifications and settings is in the
              same place however far the section list has been scrolled. */}
          {!query && (
            <div
              className="mt-1 space-y-1 border-t px-3 pt-2.5"
              style={{ borderColor: "var(--sidebar-border)" }}
            >
              {utilityItems.map((it) =>
                // Theme opens the picker in place rather than navigating - the
                // point of it is watching the app recolor behind the modal.
                it.href === "/theme" ? (
                  <button
                    key={it.href}
                    onClick={() => {
                      onNavigate?.();
                      setThemeOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-full px-3 py-2.5 text-[13.5px] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg-strong)]"
                    style={{ color: "var(--sidebar-fg)" }}
                  >
                    <PaintBrushIcon className="h-[18px] w-[18px] flex-shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-left">{it.name}</span>
                  </button>
                ) : (
                  renderRow(it, onNavigate)
                )
              )}
              {/* Language is a drawer-only row: on desktop it lives in the header
                  switcher, which the mobile layout has no room for. */}
              <Link
                to="/theme"
                onClick={onNavigate}
                className="flex w-full items-center gap-2.5 rounded-full px-3 py-2.5 text-[13.5px] lg:hidden"
                style={{ color: "var(--sidebar-fg)" }}
              >
                <LanguageIcon className="h-[18px] w-[18px] flex-shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">{t("items.language")}</span>
                <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--sidebar-fg-faint)]">
                  {language}
                </span>
              </Link>
            </div>
          )}

          {/* Account card */}
          <div className="p-3">
            <div
              className="flex items-center gap-3 rounded-2xl p-2.5 ring-1 ring-inset ring-[color:var(--sidebar-ring)]"
              style={{
                background: "var(--sidebar-card)",
                boxShadow: "var(--sidebar-card-shadow)",
              }}
            >
              <Link to="/profile" onClick={onNavigate} className="relative shrink-0">
                <Avatar src={user?.profilePicture} name={user?.name} size="sm" />
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-emerald-400"
                  style={{ borderColor: "var(--sidebar-bg)" }}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold leading-tight text-[color:var(--sidebar-fg-strong)]">
                  {user?.name}
                </p>
                <p
                  className="truncate text-[11px] leading-tight"
                  style={{ color: "var(--sidebar-fg-muted)" }}
                >
                  {roleLabel}
                </p>
              </div>
              <Dropdown
                align="right"
                widthClass="w-56"
                bareButton
                buttonClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[color:var(--sidebar-fg-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg-strong)]"
                sections={[
                  {
                    items: [
                      {
                        label: t("actions.manageAccount"),
                        icon: Cog6ToothIcon,
                        onClick: () => {
                          onNavigate?.();
                          navigate("/profile");
                        },
                      },
                      { label: t("items.theme"), icon: SwatchIcon, onClick: () => setThemeOpen(true) },
                    ],
                  },
                  {
                    items: [
                      {
                        label: t("actions.logout"),
                        icon: ArrowRightOnRectangleIcon,
                        danger: true,
                        onClick: logout,
                      },
                    ],
                  },
                ]}
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </LayoutGroup>
  );

  // ---- The collapsed rail: section icons only ----
  const renderCollapsedRail = () => (
    <div
      className="relative flex h-full w-20 flex-col items-center pb-safe pt-safe"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--sidebar-wash)" }}
      />
      <div className="relative flex min-h-0 w-full flex-1 flex-col items-center">
        <Link
          to="/"
          className="mt-5 flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ring-inset ring-[color:var(--sidebar-ring)]"
          style={{ background: "var(--sidebar-tile)" }}
          title={t("brand.name")}
        >
          <AppLogo size={26} />
        </Link>

        <button
          onClick={() => setCollapsed(false)}
          className="mt-3 flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--sidebar-fg-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg-strong)]"
          title={t("actions.expand")}
        >
          <ChevronDoubleRightIcon className="h-5 w-5" />
        </button>

        <nav className="scroll-pane mt-3 flex w-full min-h-0 flex-1 flex-col items-center gap-1 px-2">
          {navGroups.map((g) => {
            const active = activeGroup.key === g.key;
            return (
              <button
                key={g.key}
                onClick={() => {
                  setCollapsed(false);
                  setQuery("");
                  setOpenGroup(g.key);
                  navigate(g.items[0].href);
                }}
                title={g.label}
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                  active
                    ? "text-[color:var(--sidebar-active-fg)]"
                    : "text-[color:var(--sidebar-fg-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg-strong)]"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: "var(--sidebar-active)",
                        boxShadow: "var(--sidebar-active-shadow)",
                      }
                    : undefined
                }
              >
                <g.icon className="h-[22px] w-[22px]" />
              </button>
            );
          })}
        </nav>

        <div
          className="flex w-full flex-col items-center gap-1 border-t py-3"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <Link
            to="/notifications"
            title={t("items.notifications")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--sidebar-fg-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg-strong)]"
          >
            <BellIcon className="h-[22px] w-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <Link to="/profile" title={user?.name} className="relative my-1">
            <Avatar src={user?.profilePicture} name={user?.name} size="sm" />
            <span
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-emerald-400"
              style={{ borderColor: "var(--sidebar-bg)" }}
            />
          </Link>
          <button
            onClick={logout}
            title={t("actions.logout")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--sidebar-fg-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[color:var(--danger)]"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <VoiceNotificationToaster />
      {/* In-app guide. Mounted here so it exists on every authenticated
          screen and never on the public marketing or auth pages. */}
      <NexoraAssistant />
      <ThemeModal open={themeOpen} onClose={() => setThemeOpen(false)} />

      {/* ============ Desktop sidebar ============ */}
      {/* One solid panel rather than a rail plus a second pane. The two-pane
          version only ever showed the pages of the area you were already in,
          so reaching anything else was a click to switch rail icons and then a
          click to pick the page. Sections expand in place here: every area in
          the product is on screen at once, and the one you are in is the one
          that is open. */}
      <div
        className={`fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r shadow-xl shadow-gray-900/5 transition-[width] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:block ${
          collapsed ? "w-20" : "w-[17.5rem]"
        }`}
        style={{
          borderColor: "var(--sidebar-border)",
          // The frame carries the panel colour too, so the width animation
          // reads as the panel narrowing rather than as its contents sliding
          // off a blank strip.
          backgroundColor: "var(--sidebar-bg)",
        }}
      >
        {/* The inner panel keeps its full width while the frame narrows -
            without that, every label re-wraps on each frame of the collapse,
            which is both expensive and visibly wrong. */}
        <div className={collapsed ? "h-full w-20" : "h-full w-[17.5rem]"}>
          {collapsed ? renderCollapsedRail() : renderSidebar("desktop", undefined, true)}
        </div>
      </div>

      {/* ============ Mobile drawer ============ */}
      {/* Mounted only while open, and animated in and out together with its
          scrim. Keeping the panel in the tree permanently left its search field
          and every nav link in the tab order behind the page.

          It drags: a leftward flick past a third of the width, or thrown
          quickly, dismisses it. That is the gesture people already use to put a
          drawer away, and having it do nothing is what makes a web app feel
          like a web app. */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.base }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("brand.name")}
              initial={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : { x: 0, transition: panelSpring }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { x: "-100%", transition: { duration: DUR.base, ease: EASE.in } }
              }
              drag={reduceMotion ? false : "x"}
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.4, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -450) {
                  setMobileOpen(false);
                }
              }}
              /* 17.5rem is 87% of a 320px screen. Capping at 86vw keeps a strip
                 of the page visible, which is what tells you the drawer is over
                 the page rather than a new screen. */
              className="absolute inset-y-0 left-0 flex w-[min(17.5rem,86vw)] touch-pan-y shadow-2xl shadow-gray-900/30"
            >
              {renderSidebar("drawer", () => setMobileOpen(false))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============ Mobile header ============ */}
      {/* Title-first, like a native app bar: the current screen is what a user
          needs to see, not the brand on every page. The brand mark stays as a
          compact home affordance. Icon buttons are 44px hit areas (negative
          margins keep them visually aligned), and the bar reserves the iOS
          status-bar inset so it is not drawn under the clock. */}
      <header
        className="fixed left-0 right-0 top-0 z-30 border-b border-gray-200/70 bg-white/80 px-safe pt-safe backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/70 lg:hidden"
      >
        <div className="flex h-14 items-center gap-1 px-2">
          <Link
            to="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
            aria-label={t("brand.name")}
          >
            <AppLogo size={26} />
          </Link>

          <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {activeItem?.name || activeGroup.label}
          </h1>

          {/* Two controls, not five. Five 44px targets plus the logo is 300px
              of a 320px screen, which squeezes the screen title - the one
              thing the bar exists to tell you - down to a few characters and
              leaves nothing to aim between the buttons. Language and
              notifications are reachable from the drawer, so the bar keeps
              only appearance, which is changed often enough and from any
              screen, and the way to everything else. */}
          <div className="flex shrink-0 items-center gap-0.5">
            <ThemeToggle size="md" />
            {/* Renders nothing once installed. Icon-only: the mobile header
                has to hold at 320px. */}
            <GetAppButton compact className="!px-2.5 !py-2" />
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-gray-600 active:bg-black/5 dark:text-gray-300 dark:active:bg-white/10"
              aria-label={t("actions.openMenu")}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ============ Desktop header ============ */}
      {/* Search leads, utilities trail. The bar carries no greeting and no
          account block: both restate what the sidebar's account card already
          shows, on every screen, forever. The space goes to the one control
          that earns permanent residence - a field that reaches every page in
          the product. */}
      <header
        className={`fixed right-0 top-0 z-30 hidden h-16 items-center gap-4 border-b border-gray-200/70 bg-white/70 px-6 backdrop-blur-xl transition-[left] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-gray-700/60 dark:bg-gray-900/55 lg:flex ${leftOffset}`}
      >
        <GlobalSearch
          entries={searchEntries}
          inputRef={globalSearchRef}
          className="w-full max-w-sm xl:max-w-md"
        />

        {/* One gap for the whole cluster, so the utilities read as a set
            rather than as three unrelated buttons. */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* Renders nothing once installed, or where the browser cannot
              install at all. */}
          <GetAppButton />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* ============ Mobile bottom tabs ============ */}
      {/* Applying for leave is the single most frequent action in the product
          and previously sat two taps deep inside the Leave group. Promoting it
          to the bar's centre action is what the elevated button is for. */}
      <MobileTabBar
        items={tabItems}
        center={{
          label: t("items.applyLeave"),
          icon: PlusIcon,
          onClick: () => navigate("/apply-leave"),
        }}
      />

      {/* ============ Main content ============ */}
      {/* pt matches the 56px mobile app bar (64px from lg up). The bottom pad
          clears the tab bar plus the iOS home indicator, so the last row of a
          list is never trapped underneath it. */}
      <main
        className={`min-h-[100dvh] pt-[calc(var(--app-bar-h)+var(--safe-top))] transition-[margin] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:pt-16 ${mainOffset}`}
      >
        <div className="px-[max(0.75rem,var(--safe-left))] py-4 pb-[calc(var(--tab-bar-h)+1rem+var(--safe-bottom))] sm:px-4 lg:p-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            {/* The screen leaves before the next one arrives. `mode="wait"` is
                the whole reason this reads as navigation rather than as a
                repaint: two dashboards cross-dissolving through each other is
                legible on a phone and unreadable at 1600px, where the eye has
                nowhere to settle while both are half-present.

                The exit is a bare fade lasting a tenth of a second. The screen
                being left is already irrelevant, and giving it the same weight
                as the arrival would double how long every navigation feels -
                see `routeVariants`. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={routeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Routes are lazily loaded (see App.tsx). Keeping the boundary
                    here means only the content area swaps to a skeleton - the
                    rail, panel and header never unmount during navigation. */}
                <Suspense fallback={<RouteFallback />}>
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
