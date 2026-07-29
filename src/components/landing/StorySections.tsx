import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Reveal,
  SectionHeading,
  GradientText,
  GlowOrb,
  stagger,
  rise,
  EASE,
} from "./primitives";

/* =========================================================
   THE PROBLEM
   ========================================================= */

const pains = [
  { t: "Scattered spreadsheets", d: "Leave balances live in ten places and none of them agree.", ic: "M4 5h16M4 10h16M4 15h10", rot: -3 },
  { t: "Email approval chaos", d: "Requests buried in inboxes, decisions lost in threads.", ic: "M4 6h16v12H4zM4 6l8 6 8-6", rot: 2 },
  { t: "Zero real-time visibility", d: "Who's in? Who's out? Nobody actually knows.", ic: "M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z", rot: -2 },
  { t: "Manual HR paperwork", d: "Offer letters and certificates typed by hand, every time.", ic: "M6 2h9l5 5v15H6zM15 2v5h5", rot: 3 },
];

export const ProblemSection: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          title={
            <>
              HR shouldn't feel like{" "}
              <span className="text-gray-400 line-through decoration-red-400/60 decoration-4">
                busywork
              </span>
            </>
          }
          description="Most teams run people operations on a patchwork of tools that don't talk to each other. It's slow, error-prone, and invisible."
        />

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {pains.map((p) => (
            <motion.div
              key={p.t}
              variants={rise}
              whileHover={reduce ? undefined : { rotate: 0, y: -6 }}
              style={{ rotate: reduce ? 0 : p.rot }}
              className="rounded-2xl border border-gray-200/70 bg-white/60 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={p.ic} /></svg>
              </span>
              <h3 className="mt-4 text-card-title text-gray-900 dark:text-white">{p.t}</h3>
              <p className="mt-1.5 text-secondary text-gray-500 dark:text-gray-400">{p.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

/* =========================================================
   THE SOLUTION
   ========================================================= */

const solutionPoints = [
  "One source of truth for every employee",
  "Approvals that take seconds, not days",
  "Real-time visibility across the whole org",
  "Documents generated automatically",
];

export const SolutionSection: React.FC = () => (
  <section id="solution" className="relative overflow-hidden py-24 sm:py-32">
    <div className="absolute inset-0 -z-10">
      <GlowOrb className="left-1/4 top-10" color="rgba(47,201,141,0.22)" size={560} />
      <GlowOrb className="right-1/4 bottom-0" color="rgba(62,91,246,0.22)" size={560} delay={2} />
    </div>
    <div className="mx-auto max-w-6xl px-5">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="The Nexora way"
            title={
              <>
                Everything HR, <GradientText>beautifully unified</GradientText>
              </>
            }
            description="Nexora replaces the patchwork with a single, elegant system. Every workflow connects — so nothing slips, and everyone stays in sync."
          />
          <motion.ul
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-8 space-y-3.5"
          >
            {solutionPoints.map((p) => (
              <motion.li key={p} variants={rise} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-white">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                <span className="text-[1.05rem] text-gray-700 dark:text-gray-200">{p}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Connective node diagram */}
        <Reveal delay={0.1}>
          <div className="relative aspect-square w-full max-w-md justify-self-center">
            <OrbitDiagram />
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

const OrbitDiagram: React.FC = () => {
  const reduce = useReducedMotion();
  const nodes = [
    { l: "Leave", a: 0 },
    { l: "Attendance", a: 60 },
    { l: "Docs", a: 120 },
    { l: "Voice", a: 180 },
    { l: "Reports", a: 240 },
    { l: "People", a: 300 },
  ];
  const R = 42;
  return (
    <div className="relative h-full w-full">
      {/* rings */}
      {[68, 90].map((s, i) => (
        <motion.div
          key={s}
          className="absolute left-1/2 top-1/2 rounded-full border border-dashed border-blue-300/40 dark:border-blue-400/20"
          style={{ width: `${s}%`, height: `${s}%`, x: "-50%", y: "-50%" }}
          animate={reduce ? undefined : { rotate: i % 2 ? -360 : 360 }}
          transition={{ duration: 40 + i * 12, repeat: Infinity, ease: "linear" }}
        />
      ))}
      {/* center */}
      <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/40">
        <span className="text-2xl font-bold">Nexora</span>
        <span className="text-[10px] opacity-80">core</span>
      </div>
      {/* nodes */}
      {nodes.map((n, i) => {
        const rad = (n.a * Math.PI) / 180;
        const x = 50 + R * Math.cos(rad);
        const y = 50 + R * Math.sin(rad);
        return (
          <motion.div
            key={n.l}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.09, ease: EASE }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/90 px-3 py-2 text-secondary font-medium text-gray-700 shadow-md backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500" />
            {n.l}
          </motion.div>
        );
      })}
    </div>
  );
};

