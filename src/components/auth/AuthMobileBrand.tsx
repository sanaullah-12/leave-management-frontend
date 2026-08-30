import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOBILE_MODULE_CHIPS } from "./ecosystem";

/**
 * The phone and tablet telling of the same story.
 *
 * Deliberately *not* a shrunken hero: below `lg` the ecosystem visualisation
 * never mounts at all. What survives is the part that has to - the promise and
 * the breadth of the platform - as a compact band above the form, so the login
 * fields stay the first thing a thumb reaches.
 *
 * Uses Framer Motion, already in the bundle, rather than pulling GSAP onto a
 * phone for a seven-item stagger.
 */
const AuthMobileBrand: React.FC = () => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/10 p-5 lg:hidden"
      style={{
        background:
          "radial-gradient(500px circle at 12% 0%, #2b2f6e 0%, transparent 60%), radial-gradient(500px circle at 90% 110%, #0e5f57 0%, transparent 60%), linear-gradient(150deg, #0a0d1c 0%, #0b1020 60%, #071316 100%)",
      }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/40">
        The HRMS System
      </p>
      <h2 className="mt-2 text-lg font-bold leading-snug tracking-tight text-white">
        One workspace for your entire{" "}
        <span className="hrms-gradient">employee lifecycle</span>.
      </h2>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {MOBILE_MODULE_CHIPS.map(({ label, icon: Icon }, i) => (
          <motion.span
            key={label}
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 + i * 0.05, duration: 0.32 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[10.5px] font-medium text-white/70"
          >
            <Icon className="h-3 w-3 text-white/45" />
            {label}
          </motion.span>
        ))}
        <span className="inline-flex items-center rounded-full border border-violet-400/25 bg-violet-500/15 px-2.5 py-1 text-[10.5px] font-medium text-violet-100/80">
          Recruitment & Performance soon
        </span>
      </div>
    </motion.div>
  );
};

export default AuthMobileBrand;
