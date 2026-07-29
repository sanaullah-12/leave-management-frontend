import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import AppLogo from "../AppLogo";
import { Magnetic, Reveal, GridBackdrop } from "./primitives";

export const FinalCTA: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <section className="relative px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="relative isolate overflow-hidden rounded-[32px] px-6 py-20 text-center shadow-2xl sm:px-16">
          {/* animated gradient backdrop */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(900px circle at 20% 0%, #2b3ce0 0%, transparent 55%), radial-gradient(900px circle at 85% 100%, #0e8f68 0%, transparent 55%), linear-gradient(150deg, #0b1020 0%, #0e1430 55%, #071316 100%)",
            }}
          />
          <GridBackdrop fade={false} className="opacity-40" />
          {!reduce && (
            <motion.div
              aria-hidden
              className="absolute -inset-40 -z-10"
              style={{ background: "conic-gradient(from 0deg, transparent, rgba(110,134,255,0.18), transparent 40%)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            />
          )}

          <Reveal>
            <div className="mx-auto mb-6 flex w-fit items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
              <AppLogo size={24} />
              <span className="text-secondary font-semibold text-white">Nexora</span>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mx-auto max-w-2xl text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.03] tracking-[-0.03em] text-white">
              Ready to give your team an HRMS they'll love?
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/70">
              Join the teams running people operations the modern way. Start free, no credit
              card, up and running in minutes.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic strength={0.4}>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[1rem] font-semibold text-gray-900 shadow-lg transition-shadow hover:shadow-xl"
                >
                  Start free
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </Magnetic>
              <Link
                to="/login"
                className="rounded-xl border border-white/20 px-6 py-3.5 text-[1rem] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-secondary text-white/60">
              {["No credit card", "Free up to 10 employees", "Cancel anytime"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const footerCols = [
  { h: "Product", links: ["Features", "Document Studio", "Analytics", "Security", "Pricing"] },
  { h: "Company", links: ["About", "Careers", "Blog", "Contact"] },
  { h: "Resources", links: ["Documentation", "Help center", "Changelog", "Status"] },
  { h: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
];

export const LandingFooter: React.FC = () => (
  <footer className="border-t border-gray-200/70 py-14 dark:border-white/[0.06]">
    <div className="mx-auto max-w-6xl px-5">
      <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <AppLogo size={30} />
            <span className="text-card-title font-bold text-gray-900 dark:text-white">Nexora</span>
          </div>
          <p className="mt-4 max-w-xs text-secondary text-gray-500 dark:text-gray-400">
            The modern HRMS platform built for high-performance teams.
          </p>
          <div className="mt-5 flex gap-2.5">
            {["M22 12a10 10 0 10-11.5 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0022 12z", "M23 5a8 8 0 01-2.4.7A4 4 0 0022.4 3a8 8 0 01-2.6 1A4 4 0 0013 7.7 11 11 0 013 3.6a4 4 0 001.2 5.3A4 4 0 012.4 8.4a4 4 0 003.2 4 4 4 0 01-1.8.1 4 4 0 003.7 2.8A8 8 0 012 17.5a11 11 0 006 1.8c7.2 0 11.2-6 11.2-11.2v-.5A8 8 0 0023 5z", "M16 8a6 6 0 016 6v6h-4v-6a2 2 0 00-4 0v6h-4v-6a6 6 0 016-6zM6 9H2v11h4zM4 3a2 2 0 100 4 2 2 0 000-4z"].map((d, i) => (
              <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-gray-400">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
              </a>
            ))}
          </div>
        </div>
        {footerCols.map((col) => (
          <div key={col.h}>
            <div className="text-overline text-gray-400">{col.h}</div>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-secondary text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 text-secondary text-gray-400 dark:border-white/[0.06] sm:flex-row">
        <span>© 2026 Nexora. All rights reserved.</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          All systems operational
        </span>
      </div>
    </div>
  </footer>
);
