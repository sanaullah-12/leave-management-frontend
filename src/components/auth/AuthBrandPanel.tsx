import React, { Suspense } from "react";
import { motion } from "framer-motion";
import AppLogo from "../AppLogo";

const EcosystemVisual = React.lazy(() => import("./EcosystemVisual"));

/**
 * The desktop brand half of the authentication screen.
 *
 * It carries the product story - Nexora is a full HRMS platform, not a leave
 * tool - and nothing else. No authentication state reaches this file, which is
 * what lets the visual layer be swapped or restyled without going near the
 * login logic.
 *
 * The visualisation is code-split: the parent only renders this panel above
 * `lg`, so GSAP and the hero markup are never fetched on a phone.
 */

const PROOF_POINTS = [
  "One employee record",
  "Real-time workforce insight",
  "Built to scale with you",
];

/** Holds the stage's footprint while the hero chunk is in flight. */
const VisualPlaceholder: React.FC = () => (
  <div
    className="relative"
    style={{ width: "min(100%, 560px)", maxHeight: "100%", aspectRatio: "1 / 1" }}
    aria-hidden="true"
  >
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-[118px] w-[118px] rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-xl" />
    </div>
  </div>
);

const AuthBrandPanel: React.FC = () => (
  <aside className="relative flex flex-col overflow-hidden">
    {/* Layered brand gradient - unchanged Nexora palette, deeper canvas. */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(900px circle at 20% 8%, #2b2f6e 0%, transparent 55%), radial-gradient(1000px circle at 25% 100%, #0e5f57 0%, transparent 55%), linear-gradient(160deg, #0a0d1c 0%, #0b1020 55%, #071316 100%)",
      }}
    />
    {/* Faint dot grid, faded out towards the edges. */}
    <div
      className="absolute inset-0 opacity-[0.5]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
        backgroundSize: "26px 26px",
        maskImage:
          "radial-gradient(70% 55% at 50% 45%, #000 0%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(70% 55% at 50% 45%, #000 0%, transparent 100%)",
      }}
    />

    {/* Brand lockup */}
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex shrink-0 items-center gap-3 px-8 pt-7"
    >
      <AppLogo size={48} />
      <div className="leading-none">
        <span className="block text-lg font-bold text-white">Nexora</span>
        <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/55">
          The HRMS System
        </span>
      </div>
    </motion.div>

    {/* Ecosystem visualisation */}
    <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-8 py-4">
      <Suspense fallback={<VisualPlaceholder />}>
        <EcosystemVisual />
      </Suspense>
    </div>

    {/* Product story */}
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 shrink-0 px-8 pb-7 xl:pb-8"
    >
      <p className="mb-3 text-[10px] text-white/30">
        Sample workspace. Modules marked{" "}
        <span className="text-white/45">Soon</span> are on the Nexora roadmap.
      </p>

      <h1 className="max-w-xl text-[26px] font-bold leading-[1.15] tracking-tight text-white xl:text-[32px]">
        One workspace for your entire{" "}
        <span className="hrms-gradient">employee lifecycle</span>.
      </h1>
      <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-white/55 xl:mt-3 xl:text-sm">
        From hiring and onboarding to attendance, leave, payroll, documents and
        performance - Nexora brings every part of HR into a single, intelligent
        platform.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 xl:mt-5">
        {PROOF_POINTS.map((point, i) => (
          <motion.span
            key={point}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.09, duration: 0.45 }}
            className="flex items-center gap-2 text-[11px] font-medium text-white/50 xl:text-xs"
          >
            <span className="h-1 w-1 rounded-full bg-emerald-400/70" />
            {point}
          </motion.span>
        ))}
      </div>
    </motion.div>
  </aside>
);

export default AuthBrandPanel;
