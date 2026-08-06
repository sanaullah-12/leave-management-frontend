import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import AppLogo from "./AppLogo";
import {
  UserIcon,
  PaperAirplaneIcon,
  CheckIcon,
  CalendarIcon,
  UserGroupIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ChartBarIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

type Tab = "login" | "signup";

interface AuthLayoutProps {
  activeTab: Tab;
  children: React.ReactNode;
}

const STEPS = [
  { icon: UserIcon, title: "Employee", step: "STEP 01", top: "6%", left: "16%", done: false },
  { icon: PaperAirplaneIcon, title: "Request leave", step: "STEP 02", top: "24%", left: "34%", done: false },
  { icon: CheckIcon, title: "Manager approval", step: "STEP 03", top: "42%", left: "10%", done: true },
  { icon: CalendarIcon, title: "Calendar sync", step: "STEP 04", top: "60%", left: "34%", done: false },
  { icon: UserGroupIcon, title: "Happy team", step: "STEP 05", top: "78%", left: "16%", done: false },
];

const CARDS = [
  {
    icon: CreditCardIcon,
    label: "BALANCE",
    value: "14.5 days",
    sub: "Remaining this year",
    top: "10%",
    right: "6%",
    delay: 0.15,
    float: 10,
  },
  {
    icon: CheckCircleIcon,
    label: "APPROVAL",
    value: "Approved",
    dots: true,
    top: "33%",
    right: "14%",
    delay: 0.3,
    float: -12,
  },
  {
    icon: ChartBarIcon,
    label: "TEAM TODAY",
    value: "92% online",
    sub: "2 on leave",
    top: "56%",
    right: "18%",
    delay: 0.45,
    float: 12,
  },
  {
    icon: BellIcon,
    label: "NOTIFY",
    value: "Request approved",
    top: "76%",
    right: "8%",
    delay: 0.6,
    float: -10,
  },
];

const FEATURES = [
  "Leave & approvals",
  "Attendance & time",
  "Employee voice",
];

const NavPill: React.FC<{ activeTab: Tab }> = ({ activeTab }) => {
  const item = (label: string, to: string, key: Tab | "onboarding") => {
    const active = key === activeTab;
    return (
      <Link
        to={to}
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
    <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-gray-200/70 bg-white/80 p-1 shadow-lg shadow-gray-900/5 backdrop-blur-md dark:border-white/10 dark:bg-gray-800/70">
        {item("Login", "/login", "login")}
        {item("Sign up", "/register", "signup")}
        {item("Onboarding", "/register", "onboarding")}
      </div>
    </div>
  );
};

const BrandPanel: React.FC = () => {
  const reduce = useReducedMotion();

  return (
    <div className="relative hidden overflow-hidden lg:block">
      {/* Layered brand gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px circle at 20% 8%, #2b2f6e 0%, transparent 55%), radial-gradient(1000px circle at 25% 100%, #0e5f57 0%, transparent 55%), linear-gradient(160deg, #0a0d1c 0%, #0b1020 55%, #071316 100%)",
        }}
      />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-8 top-7 z-20 flex items-center gap-3"
      >
        <AppLogo size={52} />
        <div className="leading-none">
          <span className="block text-lg font-bold text-white">Nexora</span>
          <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
            The HRMS System
          </span>
        </div>
      </motion.div>

      {/* Journey + floating cards */}
      <div className="absolute inset-x-0 top-24 bottom-[38%] mx-8">
        <div className="relative h-full w-full">
          {/* Connector path */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M20,8 C42,14 24,26 36,32 C50,39 6,44 12,52 C20,62 44,60 38,68 C32,76 18,74 20,86"
              fill="none"
              stroke="url(#pathGrad)"
              strokeWidth="0.5"
              strokeDasharray="1.6 2"
              vectorEffect="non-scaling-stroke"
            />
            <defs>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>

          {/* Steps */}
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
              className="absolute flex items-center gap-3"
              style={{ top: s.top, left: s.left }}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md ${
                  s.done
                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                    : "border-white/10 bg-white/10 text-white/90"
                }`}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                  {s.step}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Floating glass cards */}
          {CARDS.map((c) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{
                opacity: 1,
                y: reduce ? 0 : [0, c.float, 0],
              }}
              transition={{
                opacity: { delay: c.delay, duration: 0.5 },
                y: reduce
                  ? { delay: c.delay, duration: 0.5 }
                  : { duration: 6 + Math.abs(c.float) / 4, repeat: Infinity, ease: "easeInOut", delay: c.delay },
              }}
              className="absolute w-40 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 shadow-xl shadow-black/30 backdrop-blur-md"
              style={{ top: c.top, right: c.right }}
            >
              <div className="flex items-center gap-1.5 text-white/50">
                <c.icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {c.label}
                </span>
              </div>
              <p className="mt-1.5 text-base font-bold text-white">{c.value}</p>
              {c.sub && <p className="text-[11px] text-white/50">{c.sub}</p>}
              {c.dots && (
                <div className="mt-2 flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/30" />
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hero copy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 bottom-0 z-10 p-8"
      >
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
          Welcome to <span className="hrms-gradient">Nexora</span>
        </h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/45">
          The HRMS System
        </p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
          Manage your workforce smarter, faster, and more efficiently - leave,
          attendance, employee voice and performance, beautifully unified in one
          elegant workspace.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 300, damping: 26 }}
              className="rounded-xl border border-white/10 bg-white/[0.05] p-3 backdrop-blur-sm"
            >
              <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-md text-blue-600 dark:text-blue-400">
                <CheckIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-xs font-semibold leading-snug text-white/90">{f}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ activeTab, children }) => {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-950 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <NavPill activeTab={activeTab} />
      <BrandPanel />

      {/* Form side */}
      <div className="flex min-h-screen items-center justify-center px-6 py-16 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
