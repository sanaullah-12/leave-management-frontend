import React, { useState, useRef, useEffect, useMemo } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";
import BrandedLoader from "./BrandedLoader";
import AppLogo from "./AppLogo";
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
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

type Role = "admin" | "employee";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[]; // omitted = visible to everyone
}

interface NavSection {
  title: string | null;
  items: NavItem[];
}

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "admin";

  // Keyboard shortcut: ⌘K / Ctrl+K focuses the sidebar search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSidebarOpen(true);
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Sidebar navigation — mirrors the reference design (MAIN / MANAGEMENT / INSIGHTS
  // / PREFERENCES) with per-item role gating so each role sees only relevant pages.
  const sections: NavSection[] = useMemo(() => {
    const role: Role = isAdmin ? "admin" : "employee";
    const all: NavSection[] = [
      {
        title: null,
        items: [
          { name: "Dashboard", href: "/", icon: Squares2X2Icon },
          { name: "Leave Requests", href: "/leaves", icon: ClipboardDocumentListIcon },
          { name: "Apply Leave", href: "/apply-leave", icon: PlusCircleIcon, roles: ["employee"] },
          { name: "Leave Calendar", href: "/leave-calendar", icon: CalendarDaysIcon },
          { name: "Attendance", href: "/attendance", icon: ClockIcon },
          { name: "My Leave Activity", href: "/my-leave-activity", icon: ClipboardDocumentCheckIcon, roles: ["employee"] },
        ],
      },
      {
        title: "Management",
        items: [
          { name: "My Team", href: "/team", icon: UserGroupIcon, roles: ["admin"] },
          { name: "Employees", href: "/employees", icon: IdentificationIcon, roles: ["admin"] },
          { name: "Departments", href: "/departments", icon: BuildingOffice2Icon, roles: ["admin"] },
          { name: "Leave Policies", href: "/leave-policies", icon: ShieldCheckIcon, roles: ["admin"] },
        ],
      },
      {
        title: "Insights",
        items: [
          { name: "Reports", href: "/reports", icon: ChartBarIcon, roles: ["admin"] },
          { name: "Notifications", href: "/notifications", icon: BellIcon },
        ],
      },
      {
        title: "Preferences",
        items: [
          { name: "Settings", href: "/profile", icon: Cog6ToothIcon },
          { name: "Theme", href: "/theme", icon: SwatchIcon },
        ],
      },
    ];
    // Drop items the current role can't see, then drop any section left empty.
    return all
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => !i.roles || i.roles.includes(role)),
      }))
      .filter((s) => s.items.length > 0);
  }, [isAdmin]);

  // Live filter for the search box
  const filteredSections: NavSection[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.name.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [query, sections]);

  const hasResults = filteredSections.some((s) => s.items.length > 0);

  // Session is still being validated → premium branded loader, never a blank screen.
  if (isLoading) {
    return <BrandedLoader message="Preparing your workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const closeSidebar = () => setSidebarOpen(false);

  const roleLabel =
    user?.position || (isAdmin ? "Administrator" : "Employee");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Fixed Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            to="/"
            onClick={closeSidebar}
            className="flex flex-1 items-center gap-3 min-w-0"
          >
            <AppLogo size={36} className="flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-gray-900 dark:text-gray-100 truncate">
                Leave<span className="font-medium">Flow</span>
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">
                {user?.company || "Workspace"}
              </p>
            </div>
            <ChevronUpDownIcon className="ml-auto h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-4 pb-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-transparent bg-gray-100 dark:bg-gray-700/60 py-2 pl-9 pr-14 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-colors focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 dark:focus:border-blue-400"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {hasResults ? (
            filteredSections.map((section, idx) => (
              <div key={section.title ?? `section-${idx}`} className="mt-2">
                {section.title && (
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeSidebar}
                      className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                    >
                      <item.icon className="nav-icon" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No results for “{query}”
            </p>
          )}
        </nav>

        {/* User profile footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              onClick={closeSidebar}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/60"
            >
              <div className="relative flex-shrink-0">
                <Avatar src={user?.profilePicture} name={user?.name} size="sm" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-800">
                  <span className="soft-ping absolute inset-0 rounded-full text-green-500" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {roleLabel}
                </p>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Logout"
              className="flex-shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-red-400"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between px-4 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-700/60">
        <button
          onClick={() => setSidebarOpen(true)}
          className="transition-colors text-gray-600 dark:text-gray-300"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          LeaveFlow
        </h1>

        <div className="flex items-center space-x-3">
          <NotificationBell />
          <button
            onClick={logout}
            className="transition-colors text-gray-600 dark:text-gray-300"
            aria-label="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Fixed Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-72 right-0 z-30 h-16 items-center justify-between px-8 bg-white/70 dark:bg-gray-900/55 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-700/60">
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Welcome back, {user?.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {typeof user?.department === "object" &&
              (user?.department as any)?.name
                ? (user.department as any).name
                : user?.department}{" "}
              • {user?.position}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <NotificationBell />

          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

          <Link
            to="/profile"
            className="flex items-center space-x-3 p-2 rounded-lg transition-all group hover-theme"
          >
            <Avatar src={user?.profilePicture} name={user?.name} size="sm" />
            <span className="text-sm font-medium group-hover:opacity-80 transition-opacity text-gray-900 dark:text-gray-100">
              {user?.name}
            </span>
          </Link>

          <button
            onClick={logout}
            className="p-2 rounded-lg transition-all hover-theme text-gray-600 dark:text-gray-300"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 lg:pt-16 lg:ml-72 min-h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
            >
              <Outlet />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
