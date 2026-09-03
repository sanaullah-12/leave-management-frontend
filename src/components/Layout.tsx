import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { motion } from "framer-motion";
import Avatar from "./Avatar";
import MobileTabBar from "./MobileTabBar";
import NotificationBell from "./NotificationBell";
import BrandedLoader from "./BrandedLoader";
import { RouteFallback } from "./Skeletons";
import AppLogo from "./AppLogo";
import Dropdown from "./ui/Dropdown";
import ThemeModal from "./ThemeModal";
import VoiceNotificationToaster from "./voice/VoiceNotificationToaster";
import NexoraAssistant from "./assistant/NexoraAssistant";
import { useNotifications } from "../hooks/useNotifications";
import { pageVariants } from "../lib/motion";
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
  const { unreadCount } = useNotifications({ limit: 12 });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCollapsed(false);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
          items: [{ name: t("items.attendance"), href: "/attendance", icon: ClockIcon }],
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
        items: [{ name: t("items.attendance"), href: "/attendance", icon: ClockIcon }],
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
        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
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
      {/* Brand */}
      <div className="px-4 pt-4">
        <p className="text-lg font-bold leading-none tracking-tight text-gray-900 dark:text-white">
          {t("brand.name")}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-gray-400 dark:text-gray-500">
          {t("brand.tagline")}
        </p>
      </div>

      {/* Header */}
      <div className="mt-3 flex items-center justify-between px-4">
        <h2 className="truncate text-base font-bold text-gray-900 dark:text-white">
          {query ? t("search.title") : activeGroup.label}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(true)}
            className="hidden rounded-md p-1 text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white lg:block"
            title={t("actions.collapse")}
          >
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 pt-3">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            ref={attachRef ? searchRef : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="w-full rounded-lg border border-gray-200 bg-white/70 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-white/20"
          />
        </div>
      </div>

      {/* List */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
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
    </div>
  );

  // ---- The icon rail ----
  const renderRail = () => (
    <div
      className="flex h-full w-16 flex-col items-center bg-white/70 backdrop-blur-xl dark:bg-gray-900/50"
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
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
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
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-black/5 hover:text-red-500 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-red-400"
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
        {!collapsed && (
          <div className="w-60 border-r border-black/5 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-gray-900/50">
            {renderPanelBody(undefined, true)}
          </div>
        )}
      </div>

      {/* ============ Mobile drawer ============ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[19rem] transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderRail()}
        <div className="w-60 border-r border-black/5 bg-white dark:border-white/5 dark:bg-gray-900">
          <div className="flex justify-end p-2">
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-md p-1 text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={t("actions.closeMenu")}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          {renderPanelBody(() => setMobileOpen(false))}
        </div>
      </div>

      {/* ============ Mobile header ============ */}
      {/* Title-first, like a native app bar: the current screen is what a user
          needs to see, not the brand on every page. The brand mark stays as a
          compact home affordance. Icon buttons are 44px hit areas (negative
          margins keep them visually aligned), and the bar reserves the iOS
          status-bar inset so it is not drawn under the clock. */}
      <header
        className="fixed left-0 right-0 top-0 z-30 border-b border-gray-200/70 bg-white/80 backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/70 lg:hidden"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex h-14 items-center gap-2 px-2">
          <Link
            to="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl active:bg-black/5 dark:active:bg-white/10"
            aria-label={t("brand.name")}
          >
            <AppLogo size={26} />
          </Link>

          <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {activeItem?.name || activeGroup.label}
          </h1>

          <div className="flex shrink-0 items-center">
            {/* Language. The `menu` variant already drops its label below sm,
                so it renders icon-only here and keeps the row within 320px. */}
            <LanguageSwitcher />

            {/* Appearance. On desktop this sits in the account dropdown beside
                the word "Theme"; here it stands alone with no label, so it uses
                a paint brush rather than the swatch icon - a swatch on its own
                reads as a tag or a bookmark, not as "change how this looks". */}
            <button
              onClick={() => setThemeOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 active:bg-black/5 dark:text-gray-300 dark:active:bg-white/10"
              aria-label={t("items.theme")}
            >
              <PaintBrushIcon className="h-[21px] w-[21px]" />
            </button>
            <NotificationBell />
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 active:bg-black/5 dark:text-gray-300 dark:active:bg-white/10"
              aria-label={t("actions.openMenu")}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ============ Desktop header ============ */}
      <header
        className={`fixed right-0 top-0 z-30 hidden h-16 items-center justify-between border-b border-gray-200/70 bg-white/70 px-8 backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/55 lg:flex ${leftOffset}`}
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("header.welcome", { name: user?.name ?? "" })}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {typeof user?.department === "object" && (user?.department as any)?.name
              ? (user.department as any).name
              : user?.department}{" "}
            • {roleLabel}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <NotificationBell />
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <Dropdown
            align="right"
            widthClass="w-64"
            showChevron
            bareButton
            buttonClassName="group flex items-center gap-2.5 rounded-xl p-1.5 pr-2.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            header={
              <div className="flex items-center gap-3">
                <Avatar src={user?.profilePicture} name={user?.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
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
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.name}
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
        className={`min-h-screen overflow-y-auto pt-[calc(3.5rem+env(safe-area-inset-top,0px))] transition-[margin] duration-300 lg:pt-16 ${mainOffset}`}
      >
        <div className="px-3 py-4 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:px-4 lg:p-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate">
              {/* Routes are lazily loaded (see App.tsx). Keeping the boundary
                  here means only the content area swaps to a skeleton - the
                  rail, panel and header never unmount during navigation. */}
              <Suspense fallback={<RouteFallback />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
