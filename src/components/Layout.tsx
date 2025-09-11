import React, { useState } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import NotificationBell from "./NotificationBell";
import {
  HomeIcon,
  CalendarDaysIcon,
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
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { name: "Leave Requests", href: "/leaves", icon: CalendarDaysIcon },
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--surface)" }}>
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
          fixed inset-y-0 left-0 z-50 w-64 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
        style={{ backgroundColor: "var(--surface-sidebar)" }}
      >
        {/* Logo */}
        <div
          className="sidebar-logo-area h-16 flex items-center justify-between px-6"
          style={{ borderBottom: "1px solid var(--border-color)" }}
        >
          <img src={Companylogo} alt="img" className="h-6 w-40" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* User Profile Section */}
        <div
          className="profile-background p-6"
          style={{ borderBottom: "1px solid var(--border-color)" }}
        >
          <div className="flex items-center space-x-3">
            <Avatar src={user?.profilePicture} name={user?.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.name}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {user?.email}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium badge-primary mt-1">
                {user?.role === "admin" ? "Administrator" : "Employee"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`nav-item ${isActive(item.href) ? "active" : ""}`}
              >
                <item.icon className="nav-icon" />
                <span className="nav-text">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Bottom Navigation */}
          <div
            className="mt-auto pt-6 space-y-2"
            style={{ borderTop: "1px solid var(--border-color)" }}
          >
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={`nav-item ${
                location.pathname === "/profile" ? "active" : ""
              }`}
            >
              <CogIcon className="nav-icon" />
              <span className="nav-text">Settings</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Fixed Mobile Header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 shadow-sm flex items-center justify-between px-4"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Comrex Leave Manager
        </h1>

        <div className="flex items-center space-x-3">
          <NotificationBell />
          <button
            onClick={logout}
            className="transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Fixed Desktop Header */}
      <header
        className="hidden lg:flex fixed top-0 left-64 right-0 z-30 h-16 shadow-sm items-center justify-between px-8"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div className="flex items-center space-x-6">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Welcome back, {user?.name}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
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
            className="h-8 w-px"
            style={{ backgroundColor: "var(--border-color)" }}
          ></div>

          <Link
            to="/profile"
            className="flex items-center space-x-3 p-2 rounded-lg transition-all group hover-theme"
          >
            <Avatar src={user?.profilePicture} name={user?.name} size="sm" />
            <span
              className="text-sm font-medium group-hover:opacity-80 transition-opacity"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.name}
            </span>
          </Link>

          <button
            onClick={logout}
            className="p-2 rounded-lg transition-all hover-theme"
            style={{ color: "var(--text-secondary)" }}
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16 lg:pt-16 lg:ml-64 min-h-screen overflow-y-auto">
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
