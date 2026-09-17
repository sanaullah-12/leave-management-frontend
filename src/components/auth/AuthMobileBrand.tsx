import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import AuthMobileScene from "./AuthMobileScene";
import { EASE } from "../../lib/motion";

/**
 * The phone and tablet telling of the same story.
 *
 * Deliberately *not* a shrunken hero: below `lg` the ecosystem visualisation
 * never mounts at all. What survives is the part that has to - the promise
 * itself - as a compact band above the form, so the login fields stay the first
 * thing a thumb reaches.
 *
 * `AuthMobileScene` carries what the desktop panel says with nine module cards.
 * It is the reason this card no longer lists the modules by name: on a 390x844
 * phone the illustration and a three-row chip grid together pushed the sign-in
 * button off the screen, and between an ambient brand moment and a list of
 * labels the visitor has not asked for yet, the button wins. The desktop panel
 * still names every module, including the roadmap ones.
 *
 * Uses Framer Motion, already in the bundle, rather than pulling GSAP onto a
 * phone for two entrance tweens.
 */
const AuthMobileBrand: React.FC = () => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE.out }}
      className="relative overflow-hidden rounded-2xl border border-white/10 p-5 lg:hidden"
      style={{
        background:
          "radial-gradient(500px circle at 12% 0%, #2b2f6e 0%, transparent 60%), radial-gradient(500px circle at 90% 110%, #0e5f57 0%, transparent 60%), linear-gradient(150deg, #0a0d1c 0%, #0b1020 60%, #071316 100%)",
      }}
    >
      {/* Bleeds into the card's own padding: the vignette is a backdrop for
          the copy, so a visible margin around it would turn it into a second
          card sitting inside the first. */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE.out }}
        className="-mx-5 -mt-5 mb-4"
      >
        <AuthMobileScene />
      </motion.div>

      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/40">
        The HRMS System
      </p>
      <h2 className="mt-2 text-lg font-bold leading-snug tracking-tight text-white">
        One workspace for your entire{" "}
        <span className="hrms-gradient">employee lifecycle</span>.
      </h2>
    </motion.div>
  );
};

export default AuthMobileBrand;
