import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { motion } from "framer-motion";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";
import BrandedLoader from "./BrandedLoader";
import { RouteFallback } from "./Skeletons";
import AppLogo from "./AppLogo";
import Dropdown from "./ui/Dropdown";
import ThemeModal from "./ThemeModal";
import VoiceNotificationToaster from "./voice/VoiceNotificationToaster";
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
  XMarkIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  HomeIcon,
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
  /** Match the path exactly — for section landing pages that own sub-routes. */
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
    // The bare root URL is the public front door — send anonymous visitors to
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
      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/70 bg-white/70 px-4 backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/60 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="text-gray-600 dark:text-gray-300" aria-label={t("actions.openMenu")}>
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <AppLogo size={26} />
          <div className="leading-none">
            <p className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {t("brand.name")}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
              {t("brand.tagline")}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <NotificationBell />
          <button onClick={logout} className="text-gray-600 dark:text-gray-300" aria-label={t("actions.logout")}>
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
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

      {/* ============ Main content ============ */}
      <main className={`min-h-screen overflow-y-auto pt-16 transition-[margin] duration-300 ${mainOffset}`}>
        <div className="p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate">
              {/* Routes are lazily loaded (see App.tsx). Keeping the boundary
                  here means only the content area swaps to a skeleton — the
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
