import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppLogo from "../AppLogo";
import AuthBrandPanel from "./AuthBrandPanel";
import AuthMobileBrand from "./AuthMobileBrand";
import useMediaQuery from "../../hooks/useMediaQuery";

type Tab = "login" | "signup";

interface AuthLayoutProps {
  activeTab: Tab;
  children: React.ReactNode;
}

/**
 * Shell for every unauthenticated screen - login, signup, forgot password,
 * invite acceptance.
 *
 * Two halves with one job each: `AuthBrandPanel` tells the Nexora product
 * story, this file owns nothing but layout and navigation, and the calling page
 * supplies the form. No authentication logic passes through here.
 *
 * Composition, not scaling, is what changes across breakpoints. Above `lg` the
 * brand panel mounts and the two columns each own their own scroll; below it
 * the panel is not rendered at all (so its chunk is never fetched) and
 * `AuthMobileBrand` carries the message in a fraction of the space.
 */

const AuthTabs: React.FC<{ activeTab: Tab }> = ({ activeTab }) => {
  const item = (label: string, to: string, key: Tab) => {
    const active = key === activeTab;
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          active
            ? "text-white"
            : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        }`}
      >
        {active && (
          <motion.span
            layoutId="authNavPill"
            className="absolute inset-0 rounded-full bg-gray-900 dark:bg-white/10"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <span className="relative">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="flex items-center gap-1 rounded-full border border-gray-200/70 bg-white/80 p-1 shadow-lg shadow-gray-900/5 backdrop-blur-md dark:border-white/10 dark:bg-gray-800/70">
      {item("Login", "/login", "login")}
      {item("Sign up", "/register", "signup")}
    </nav>
  );
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ activeTab, children }) => {
  // Mounted rather than CSS-hidden: below lg the brand panel and its GSAP
  // visualisation are never downloaded, let alone rendered.
  const showBrandPanel = useMediaQuery("(min-width: 1024px)");

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 lg:grid lg:h-screen lg:min-h-0 lg:grid-cols-[1.05fr_1fr] lg:overflow-hidden">
      {showBrandPanel && <AuthBrandPanel />}

      <div className="relative flex min-h-screen flex-col px-6 py-7 sm:px-10 lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:py-8">
        {/* Whisper of the active theme accent, so the form side reads as part
            of the product rather than as a blank sheet. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(38rem 30rem at 100% -5%, rgb(var(--blue-600) / 0.07), transparent 62%)",
          }}
        />

        <header className="relative flex shrink-0 items-center justify-between gap-4">
          <Link to="/landing" className="flex items-center gap-2.5 lg:hidden">
            <AppLogo size={34} />
            <span className="leading-none">
              <span className="block text-sm font-bold text-gray-900 dark:text-white">
                Nexora
              </span>
              <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">
                The HRMS System
              </span>
            </span>
          </Link>
          <div className="ms-auto">
            <AuthTabs activeTab={activeTab} />
          </div>
        </header>

        <main className="relative flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            {!showBrandPanel && <AuthMobileBrand />}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 lg:mt-0"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
