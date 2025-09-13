import React, { useState } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";
import {
  HomeIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";
import Companylogo from "../assets/companylogo.png";

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { colorScheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { name: "Leave Requests", href: "/leaves", icon: CalendarDaysIcon },
    { name: "Attendance", href: "/attendance", icon: ClockIcon },
    ...(user?.role === "employee"
      ? [
          {
            name: "My Leave Activity",
            href: "/my-leave-activity",
            icon: ClipboardDocumentListIcon,
          },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          { name: "Employees", href: "/employees", icon: UsersIcon },
          { name: "Reports", href: "/reports", icon: DocumentChartBarIcon },
          { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
        ]
      : []),
    { name: "Theme", href: "/theme", icon: SwatchIcon },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Theme-aware color classes
  const getThemeColors = () => {
    const colors = {
      blue: {
        gradient: "from-blue-600 to-blue-700",
        active: "bg-gradient-to-r from-blue-600 to-blue-700",
        hover: "hover:bg-slate-800 dark:hover:bg-gray-800"
      },
      purple: {
        gradient: "from-purple-600 to-purple-700", 
        active: "bg-gradient-to-r from-purple-600 to-purple-700",
        hover: "hover:bg-slate-800 dark:hover:bg-gray-800"
      },
      green: {
        gradient: "from-green-600 to-green-700",
        active: "bg-gradient-to-r from-green-600 to-green-700", 
        hover: "hover:bg-slate-800 dark:hover:bg-gray-800"
      },
      custom: {
        gradient: "from-custom-600 to-custom-700",
        active: "bg-gradient-to-r from-custom-600 to-custom-700",
        hover: "hover:bg-slate-800 dark:hover:bg-gray-800"
      }
    };
    return colors[colorScheme];
  };

  const themeColors = getThemeColors();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-6 bg-gradient-to-r ${themeColors.gradient} border-b border-opacity-50`}>
          <img src={Companylogo} alt="img" className="h-6 w-40" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-6 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Avatar src={user?.profilePicture} name={user?.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                {user?.name}
              </p>
              <p className="text-xs truncate text-gray-600 dark:text-gray-300">
                {user?.email}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium badge-primary mt-1">
                {user?.role === "admin" ? "Administrator" : "Employee"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto bg-white dark:bg-gray-800">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <item.icon className="nav-icon" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Bottom Navigation */}
          <div className="mt-auto pt-6 space-y-1 border-t border-gray-200 dark:border-gray-600">
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${location.pathname === "/profile" ? 'active' : ''}`}
            >
              <CogIcon className="nav-icon" />
              <span>Settings</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Fixed Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 shadow-sm flex items-center justify-between px-4 bg-white dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="transition-colors text-gray-600 dark:text-gray-300"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <h1
          className="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          Comrex Leave Manager
        </h1>

        <div className="flex items-center space-x-3">
          <NotificationBell />
          <button
            onClick={logout}
            className="transition-colors text-gray-600 dark:text-gray-300"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Fixed Desktop Header */}
      <header
        className="hidden lg:flex fixed top-0 left-64 right-0 z-30 h-16 shadow-sm items-center justify-between px-8 bg-white dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-6">
          <div>
            <h2
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
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

          <div
            className="h-8 w-px bg-gray-200 dark:bg-gray-700"
          ></div>

          <Link
            to="/profile"
            className="flex items-center space-x-3 p-2 rounded-lg transition-all group hover-theme"
          >
            <Avatar src={user?.profilePicture} name={user?.name} size="sm" />
            <span
              className="text-sm font-medium group-hover:opacity-80 transition-opacity text-gray-900 dark:text-gray-100"
            >
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
      <main className="pt-16 lg:pt-16 lg:ml-64 min-h-screen overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
