import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AppLogo from "../AppLogo";
import { useTheme } from "../../context/ThemeContext";
import { Magnetic, EASE } from "./primitives";

const links = [
  { l: "Features", href: "#features" },
  { l: "Pricing", href: "#pricing" },
];

/** Icon-only sun/moon toggle with an animated crossfade + rotate swap. */
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const reduce = useReducedMotion();

  return (
    <button
      onClick={toggleTheme}
      className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      role="switch"
      aria-checked={isDark}
    >
      <AnimatePresence initial={false} mode="wait">
        {isDark ? (
          <motion.svg
            key="moon"
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? undefined : { opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </motion.svg>
        ) : (
          <motion.svg
            key="sun"
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? undefined : { opacity: 0, rotate: 90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, rotate: -90, scale: 0.6 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
};

const LandingNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={reduce ? undefined : { y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4"
    >
      <nav
        className={
          "flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-5 " +
          (scrolled
            ? "border border-gray-200/70 bg-white/80 shadow-lg shadow-gray-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1420]/80"
            : "border border-transparent bg-transparent")
        }
      >
        <Link to="/landing" className="flex items-center gap-2.5">
          <AppLogo size={30} />
          <div className="leading-none">
            <span className="block text-[1.05rem] font-bold tracking-tight text-gray-900 dark:text-white">
              Nexora
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((n) => (
            <a
              key={n.l}
              href={n.href}
              className="rounded-lg px-3.5 py-2 text-nav text-gray-600 transition-colors hover:bg-gray-100/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              {n.l}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="hidden rounded-lg px-4 py-2 text-nav font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-200 dark:hover:text-white sm:block"
          >
            Sign in
          </Link>
          <Magnetic strength={0.35}>
            <Link
              to="/register"
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gray-900 px-4 py-2 text-nav font-semibold text-white shadow-sm transition-shadow hover:shadow-lg dark:bg-white dark:text-gray-900"
            >
              <span className="relative z-10">Start free</span>
              <svg className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </Magnetic>
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5 lg:hidden"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-[68px] mx-4 w-[calc(100%-2rem)] max-w-6xl rounded-2xl border border-gray-200/70 bg-white/95 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1420]/95 lg:hidden"
          >
            {links.map((n) => (
              <a
                key={n.l}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-nav text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
              >
                {n.l}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default LandingNav;
