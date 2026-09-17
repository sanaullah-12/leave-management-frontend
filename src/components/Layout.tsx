import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Avatar from "./Avatar";
import MobileTabBar from "./MobileTabBar";
import NotificationBell from "./NotificationBell";
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
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

import Input from "./ui/Input";
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

  // The API returns `department` either populated or as a bare id string.
  const departmentName =
    typeof user?.department === "object" && (user?.department as any)?.name
      ? ((user.department as any).name as string)
      : typeof user?.department === "string"
      ? user.department
      : "";
  const leftOffset = collapsed ? "lg:left-16" : "lg:left-[19rem]";
  const mainOffset = collapsed ? "lg:ml-16" : "lg:ml-[19rem]";

  const badgeFor = (it: PanelItem) =>
    it.badge === "notifications" && unreadCount > 0
      ? unreadCount > 9 ? "9+" : String(unreadCount)
      : null;

  // ---- Reusable panel item (plain function so inputs keep focus) ----
  const renderRow = (it: PanelItem, onClick?: () => void) => {
    const active = itemActive(it);
    const badge = badgeFor(it);
    return (
      <Link
        key={it.href}
        to={it.href}
        onClick={onClick}
        className={`group flex items-center gap-2.5 rounded-full px-2.5 py-2 text-sm transition-colors ${
          active
            ? "font-medium"
            : "text-gray-600 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100"
        }`}
        style={
          active
            ? { backgroundColor: "var(--accent-soft)", color: "var(--accent)" }
            : undefined
        }
      >
        <it.icon className="h-[18px] w-[18px] flex-shrink-0" />
        <span className="min-w-0 flex-1 truncate">{it.name}</span>
        {badge && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
        {active && (
          <span
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
          />
        )}
      </Link>
    );
  };

  // ---- The secondary panel body (title + search + list) ----
  const renderPanelBody = (onNavigate?: () => void, attachRef = false) => (
    <div className="flex h-full flex-col">
      {/* Brand, then whose workspace this is.
          The product name stays - it is the identity of the thing they are
          using. The line under it names the employer instead of restating what
          the product is, because everyone signed in here already knows that
          and only one of the two lines was telling them anything. */}
      <div className="px-4 pt-4">
        <p className="text-lg font-bold leading-none tracking-tight text-gray-900 dark:text-white">
          {t("brand.name")}
        </p>
        <p
          className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.26em] text-gray-400 dark:text-gray-500"
          title={companyName || undefined}
        >
          {companyName
            ? `${companyName} ${t("brand.workspace")}`
            : t("brand.tagline")}
        </p>
      </div>

      {/* Search. Above the section heading, not under it: the heading names
          what the list below is currently showing, and typing a query is what
          changes that - so the control comes first and the heading answers it. */}
      <div className="px-3 pb-1 pt-3">
        <Input
          icon={MagnifyingGlassIcon}
          inputSize="sm"
          ref={attachRef ? searchRef : undefined}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          clearable
          placeholder={t("search.placeholder")}
        />
      </div>

      {/* Header */}
      <div className="mt-2 flex items-center justify-between px-4">
        <h2 className="truncate text-base font-bold text-gray-900 dark:text-white">
          {query ? t("search.title") : activeGroup.label}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(true)}
            className="hidden rounded-full p-1 text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white lg:block"
            title={t("actions.collapse")}
          >
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <nav className="scroll-pane flex-1 space-y-0.5 px-2 pb-4">
        {query ? (
          searchResults.length ? (
            searchResults.map((it) => renderRow(it, onNavigate))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-gray-500">
              {t("search.noResults", { query })}
            </p>
          )
        ) : (
          <>
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t("sections.pages")}
            </p>
            {activeGroup.items.map((it) => renderRow(it, onNavigate))}
          </>
        )}
      </nav>

      {/* Appearance and language, on mobile only.
          Both used to sit in the app bar, where they cost two of the five
          slots a 320px bar has. On desktop they are in the account dropdown;
          this is the drawer's equivalent of that dropdown. */}
      <div className="border-t border-black/5 px-2 py-2 pb-safe dark:border-white/10 lg:hidden">
        <button
          onClick={() => {
            onNavigate?.();
            setThemeOpen(true);
          }}
          className="flex w-full items-center gap-2.5 rounded-full px-2.5 py-2.5 text-sm text-gray-600 active:bg-black/5 dark:text-gray-400 dark:active:bg-white/5"
        >
          <PaintBrushIcon className="h-[18px] w-[18px] flex-shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{t("items.theme")}</span>
        </button>
        {/* Language goes to the settings screen rather than opening the header
            dropdown: that dropdown is anchored right and would open off the
            edge of a 288px drawer, and the screen it links to holds the same
            list with room to read it. */}
        <Link
          to="/theme"
          onClick={onNavigate}
          className="flex w-full items-center gap-2.5 rounded-full px-2.5 py-2.5 text-sm text-gray-600 active:bg-black/5 dark:text-gray-400 dark:active:bg-white/5"
        >
          <LanguageIcon className="h-[18px] w-[18px] flex-shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">
            {t("items.language")}
          </span>
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {language}
          </span>
        </Link>
      </div>
    </div>
  );

  // ---- The icon rail ----
  const renderRail = () => (
    <div
      className="flex h-full w-16 flex-col items-center bg-white/70 pb-safe pt-safe backdrop-blur-xl dark:bg-gray-900/50"
      style={{ backgroundImage: "linear-gradient(var(--accent-wash), var(--accent-wash))" }}
    >
      <Link
        to="/"
        className="mb-1 mt-3 flex h-11 w-11 items-center justify-center"
        title={t("brand.name")}
      >
        <AppLogo size={36} />
      </Link>

      <nav className="flex w-full flex-1 flex-col items-center gap-0.5 py-1">
        {groups.map((g) => {
          const active = activeGroup.key === g.key;
          const badge =
            g.items.some((i) => i.badge === "notifications") && unreadCount > 0
              ? unreadCount > 9 ? "9+" : String(unreadCount)
              : null;
          return (
            <button
              key={g.key}
              onClick={() => {
                setCollapsed(false);
                setQuery("");
                navigate(g.items[0].href);
              }}
              className="flex w-full flex-col items-center gap-1 py-1.5"
              title={g.label}
            >
              <span
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                  active
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
                style={active ? { backgroundColor: "var(--accent)" } : undefined}
              >
                <g.icon className="h-[22px] w-[22px]" />
                {badge && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    {badge}
                  </span>
                )}
              </span>
              <span
                className={`max-w-[60px] truncate text-[10px] font-medium ${
                  active ? "text-gray-900 dark:text-white" : "text-gray-500"
                }`}
              >
                {g.short}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex w-full flex-col items-center gap-1 border-t border-black/5 py-3 dark:border-white/10">
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            title={t("actions.expand")}
          >
            <ChevronDoubleRightIcon className="h-5 w-5" />
          </button>
        )}
        <Link to="/profile" title={user?.name} className="relative">
          <Avatar src={user?.profilePicture} name={user?.name} size="sm" />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
        </Link>
        <button
          onClick={logout}
          title={t("actions.logout")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-black/5 hover:text-red-500 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-red-400"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
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

      {/* ============ Desktop two-pane sidebar ============ */}
      <div
        className={`fixed inset-y-0 left-0 z-40 hidden lg:flex ${
          collapsed ? "w-16" : "w-[19rem]"
        }`}
      >
        {renderRail()}
        {/* The panel opens and closes by width rather than appearing and
            disappearing. The page's own left margin has always been animated
            (see <main>), so a panel that snapped was the one piece of the
            collapse not moving - the content slid out from under a sidebar
            that had already gone.

            It still unmounts when closed rather than sitting at zero width:
            a collapsed panel that is merely invisible keeps its search field
            and every nav link in the tab order, behind the page.

            The body inside is pinned at its full 15rem while the frame around
            it narrows. Without that the nav labels re-wrap on every frame of
            the close, which is both expensive and visibly wrong. */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="nav-panel"
              initial={{ width: 0 }}
              animate={{ width: "15rem" }}
              exit={{ width: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: DUR.slow, ease: EASE.out }
              }
              className="overflow-hidden border-r border-black/5 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-gray-900/50"
            >
              <div className="h-full w-60">
                {renderPanelBody(undefined, true)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============ Mobile drawer ============ */}
      {/* Mounted only while open, and animated in and out together with its
          scrim. The previous version kept the panel in the tree permanently,
          parked off-screen with a transform - which meant its search field and
          every nav link stayed in the tab order behind the page, and the scrim
          appeared instantly while the panel took 300ms to catch up.

          It drags: a leftward flick past a third of the width, or thrown
          quickly, dismisses it. That is the gesture people already use to put
          a drawer away, and having it do nothing is what makes a web app feel
          like a web app. */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.base }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("groups.home")}
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
              /* 19rem is 95% of a 320px screen. Capping at 86vw keeps a strip
                 of the page visible, which is what tells you the drawer is
                 over the page rather than a new screen. */
              className="absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] touch-pan-y shadow-2xl shadow-gray-900/30"
            >
              {renderRail()}
              <div className="flex min-w-0 flex-1 flex-col border-r border-black/5 bg-white pt-safe dark:border-white/5 dark:bg-gray-900">
                <div className="flex justify-end p-2">
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 active:bg-black/5 dark:text-gray-400 dark:active:bg-white/10"
                    aria-label={t("actions.closeMenu")}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                {renderPanelBody(() => setMobileOpen(false))}
              </div>
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

          {/* Two controls, not five.
              The bar previously carried language, appearance, notifications,
              install and the menu. Five 44px targets plus the logo is 300px of
              a 320px screen, so the screen title - the one thing the bar exists
              to tell you - was squeezed to a few characters and the buttons sat
              edge to edge with nothing to aim between. Appearance and language
              are settings, changed rarely, and both now live in the drawer
              where the rest of the settings are. What stays is what is
              genuinely per-screen: what needs your attention, and the way to
              everything else. */}
          <div className="flex shrink-0 items-center gap-0.5">
            <NotificationBell />
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
      {/* Search leads, account trails, utilities sit between them.
          It used to open with "Welcome back, <name>" over the department and
          role - three lines of chrome restating what the account menu already
          says, on every screen, forever. A greeting is worth reading once a
          session, and the dashboard banner already gives it. That space now
          holds the one control that earns permanent residence: a field that
          reaches every page in the product. */}
      <header
        className={`fixed right-0 top-0 z-30 hidden h-16 items-center gap-4 border-b border-gray-200/70 bg-white/70 px-6 backdrop-blur-xl transition-[left] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-gray-700/60 dark:bg-gray-900/55 lg:flex ${leftOffset}`}
      >
        <GlobalSearch
          entries={searchEntries}
          inputRef={globalSearchRef}
          className="w-full max-w-sm xl:max-w-md"
        />

        {/* One gap for the whole cluster, so the utilities read as a set
            rather than as four unrelated buttons. */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* Renders nothing once installed, or where the browser cannot
              install at all. */}
          <GetAppButton />
          <LanguageSwitcher />
          <NotificationBell compact />

          <span
            aria-hidden="true"
            className="mx-1.5 h-6 w-px bg-gray-200 dark:bg-white/10"
          />

          <Dropdown
            align="right"
            widthClass="w-72"
            showChevron
            bareButton
            buttonClassName="group flex items-center gap-2.5 rounded-full border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-gray-200/80 hover:bg-white/60 dark:hover:border-white/10 dark:hover:bg-white/10"
            header={
              <div className="flex items-center gap-3">
                <Avatar src={user?.profilePicture} name={user?.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                  <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 truncate rounded-md bg-[rgb(var(--blue-600))]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--blue-700))] dark:text-[rgb(var(--blue-300))]">
                    {departmentName ? `${departmentName} - ${roleLabel}` : roleLabel}
                  </p>
                </div>
              </div>
            }
            sections={[
              {
                items: [
                  { label: t("actions.manageAccount"), icon: Cog6ToothIcon, onClick: () => navigate("/profile") },
                  { label: t("items.theme"), icon: SwatchIcon, onClick: () => setThemeOpen(true) },
                  { label: t("items.notifications"), icon: BellIcon, onClick: () => navigate("/notifications") },
                ],
              },
              {
                items: [
                  { label: t("actions.logout"), icon: ArrowRightOnRectangleIcon, danger: true, onClick: logout },
                ],
              },
            ]}
          >
            <Avatar src={user?.profilePicture} name={user?.name} size="sm" />
            {/* Name over role, not name alone: the role is what tells an admin
                which account they are acting as, and it costs no extra height
                next to a 32px avatar. Hidden on narrow desktops, where the
                avatar alone still identifies the account. */}
            <span className="hidden min-w-0 flex-col items-start leading-tight xl:flex">
              <span className="max-w-[9rem] truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                {user?.name}
              </span>
              <span className="max-w-[9rem] truncate text-[11px] text-gray-500 dark:text-gray-400">
                {roleLabel}
              </span>
            </span>
          </Dropdown>
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
