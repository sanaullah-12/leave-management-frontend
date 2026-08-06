import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import AppLogo from "../AppLogo";
import { Magnetic, GlowOrb, GridBackdrop, GradientText, EASE } from "./primitives";
import ContactModal from "./ContactModal";

/* ============================================================
   Hero - a centered headline wrapped by an animated "workflow
   trace": a curved circuit path that loops around the copy with
   a raised top notch and inward side pockets that cradle the
   floating HR nodes. Trace + nodes share ONE centered, fixed
   stage so nothing clips or collides at any width. Below `lg`
   it collapses to a clean stacked layout.
   ============================================================ */

const VW = 1200;
const VH = 720;

type Pt = { x: number; y: number };

/** Rounded orthogonal path through waypoints (PCB-trace look). */
function roundedPath(pts: Pt[], r: number): string {
  const len = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const cur = pts[i];
    const prev = pts[i - 1];
    const next = pts[i + 1];
    const r1 = Math.min(r, len(prev, cur) / 2);
    const r2 = Math.min(r, len(cur, next) / 2);
    const a = {
      x: cur.x + ((prev.x - cur.x) / len(prev, cur)) * r1,
      y: cur.y + ((prev.y - cur.y) / len(prev, cur)) * r1,
    };
    const b = {
      x: cur.x + ((next.x - cur.x) / len(cur, next)) * r2,
      y: cur.y + ((next.y - cur.y) / len(cur, next)) * r2,
    };
    d += ` L ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cur.x} ${cur.y} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

// Curved loop: rounded rectangle (L120 R1080 T70 B650) with a raised
// top notch (cluster) and inward pockets on the right + left edges.
const WAYPOINTS: Pt[] = [
  { x: 120, y: 230 },
  { x: 120, y: 70 },
  { x: 430, y: 70 },
  { x: 430, y: 34 },
  { x: 690, y: 34 },
  { x: 690, y: 70 },
  { x: 1080, y: 70 },
  { x: 1080, y: 300 },
  { x: 1016, y: 300 },
  { x: 1016, y: 430 },
  { x: 1080, y: 430 },
  { x: 1080, y: 650 },
  { x: 120, y: 650 },
  { x: 120, y: 470 },
  { x: 184, y: 470 },
  { x: 184, y: 360 },
  { x: 120, y: 360 },
  { x: 120, y: 230 },
];
const D = roundedPath(WAYPOINTS, 26);

// Decorative circuit branches that stub off the main loop into the top,
// left and right gaps - each ends in a small node dot. Purely ambient.
const branch = (pts: Pt[]) => roundedPath(pts, 14);
const BRANCHES: { d: string; dot: Pt }[] = [
  // top
  { d: branch([{ x: 300, y: 70 }, { x: 300, y: 22 }]), dot: { x: 300, y: 22 } },
  { d: branch([{ x: 440, y: 70 }, { x: 440, y: 40 }, { x: 372, y: 40 }]), dot: { x: 372, y: 40 } },
  { d: branch([{ x: 760, y: 70 }, { x: 760, y: 30 }, { x: 826, y: 30 }]), dot: { x: 826, y: 30 } },
  { d: branch([{ x: 1004, y: 70 }, { x: 1004, y: 18 }]), dot: { x: 1004, y: 18 } },
  // left
  { d: branch([{ x: 120, y: 158 }, { x: 46, y: 158 }]), dot: { x: 46, y: 158 } },
  { d: branch([{ x: 120, y: 250 }, { x: 74, y: 250 }, { x: 74, y: 300 }]), dot: { x: 74, y: 300 } },
  { d: branch([{ x: 120, y: 560 }, { x: 40, y: 560 }]), dot: { x: 40, y: 560 } },
  // right
  { d: branch([{ x: 1080, y: 150 }, { x: 1158, y: 150 }]), dot: { x: 1158, y: 150 } },
  { d: branch([{ x: 1080, y: 250 }, { x: 1150, y: 250 }, { x: 1150, y: 200 }]), dot: { x: 1150, y: 200 } },
  { d: branch([{ x: 1080, y: 560 }, { x: 1160, y: 560 }]), dot: { x: 1160, y: 560 } },
];

const pct = (x: number, y: number): React.CSSProperties => ({
  left: `${(x / VW) * 100}%`,
  top: `${(y / VH) * 100}%`,
});

/* ---------- node building blocks ---------- */

const Chip: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <span className={"rounded-md px-2 py-0.5 text-[12px] font-semibold " + className}>
    {children}
  </span>
);

const Node: React.FC<{
  anchor: Pt;
  transform: string;
  delay: number;
  float?: number;
  children: React.ReactNode;
}> = ({ anchor, transform, delay, float = 9, children }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute z-20"
      style={pct(anchor.x, anchor.y)}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: EASE }}
    >
      <motion.div
        style={{ transform }}
        animate={reduce ? undefined : { y: [0, -float, 0] }}
        transition={{ duration: 5 + delay, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={
      "flex items-center gap-2 whitespace-nowrap rounded-xl border border-gray-200/80 bg-white/95 px-3 py-2 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#161d2b]/95 " +
      className
    }
  >
    {children}
  </div>
);

const Avatar: React.FC<{ i: string; c: string }> = ({ i, c }) => (
  <span className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${c} text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#161d2b]`}>
    {i}
  </span>
);

/* ---------- the trace + nodes (desktop only) ---------- */

const Trace: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="traceGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3E5BF6" />
            <stop offset="50%" stopColor="#6E86FF" />
            <stop offset="100%" stopColor="#2FC98D" />
          </linearGradient>
        </defs>

        {/* decorative branches + node dots */}
        <g className="text-gray-400 dark:text-slate-600">
          {BRANCHES.map((b, i) => (
            <motion.path
              key={i}
              d={b.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={reduce ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: 1.2 + i * 0.06 }}
            />
          ))}
          {BRANCHES.map((b, i) => (
            <motion.circle
              key={"d" + i}
              cx={b.dot.x}
              cy={b.dot.y}
              r={4}
              className="fill-blue-400/70 dark:fill-blue-400/50"
              initial={reduce ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ease: EASE, delay: 2 + i * 0.08 }}
              style={{ transformOrigin: `${b.dot.x}px ${b.dot.y}px` }}
            />
          ))}
        </g>

        <motion.path
          d={D}
          fill="none"
          stroke="currentColor"
          className="text-gray-300 dark:text-slate-600"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: EASE }}
        />
        {!reduce && (
          <>
            <motion.path
              d={D}
              fill="none"
              stroke="url(#traceGrad)"
              strokeWidth={3}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="15 85"
              vectorEffect="non-scaling-stroke"
              animate={{ strokeDashoffset: [0, -100] }}
              transition={{ duration: 7.5, ease: "linear", repeat: Infinity, delay: 1.6 }}
            />
            <motion.path
              d={D}
              fill="none"
              stroke="url(#traceGrad)"
              strokeWidth={3}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray="8 92"
              vectorEffect="non-scaling-stroke"
              animate={{ strokeDashoffset: [-52, -152] }}
              transition={{ duration: 7.5, ease: "linear", repeat: Infinity, delay: 2.6 }}
            />
          </>
        )}
      </svg>

      <div className="pointer-events-auto absolute inset-0">
        {/* 1 · top-left speech bubble */}
        <Node anchor={{ x: 120, y: 70 }} transform="translate(-8%, -100%)" delay={1.0}>
          <div className="relative">
            <Card>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/15">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
              </span>
              <div className="leading-tight">
                <div className="text-[14px] font-bold text-gray-900 dark:text-white">Approve leave</div>
                <Chip className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">one tap</Chip>
              </div>
            </Card>
            <span className="absolute -bottom-1.5 left-7 h-3.5 w-3.5 rotate-45 rounded-sm border-b border-r border-gray-200/80 bg-white/95 dark:border-white/10 dark:bg-[#161d2b]/95" />
          </div>
        </Node>

        {/* 2 · top-center agent cluster (raised notch) */}
        <Node anchor={{ x: 560, y: 34 }} transform="translate(-50%, -50%)" delay={0.5} float={6}>
          <div className="flex items-center -space-x-2.5">
            <Avatar i="AK" c="from-amber-400 to-orange-500" />
            <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border border-blue-200 bg-white shadow-md dark:border-white/10 dark:bg-[#161d2b]">
              <AppLogo size={24} />
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-500 text-white shadow-md ring-2 ring-white dark:ring-[#161d2b]">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.7 5.7 21l2.3-7.2-6-4.4h7.6z" /></svg>
            </span>
          </div>
        </Node>

        {/* 3 · integration icon */}
        <Node anchor={{ x: 880, y: 70 }} transform="translate(-50%, -50%)" delay={0.8} float={7}>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white shadow-md dark:border-white/10 dark:bg-[#161d2b]">
            <svg className="h-5 w-5 text-gray-500 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>
          </span>
        </Node>

        {/* 4 · right pocket - check card */}
        <Node anchor={{ x: 1016, y: 365 }} transform="translate(-34%, -50%)" delay={1.6} float={10}>
          <Card>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            </span>
            <span className="text-[14px] font-semibold text-gray-900 dark:text-white">Leave approved!</span>
          </Card>
        </Node>

        {/* 5 · bottom-right corner - approve request */}
        <Node anchor={{ x: 1080, y: 650 }} transform="translate(-90%, -38%)" delay={1.4}>
          <Card>
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 11a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" /></svg>
            </span>
            <span className="text-[14px] font-semibold text-gray-900 dark:text-white">Approve request</span>
            <Avatar i="JD" c="from-fuchsia-500 to-pink-500" />
          </Card>
        </Node>

        {/* 6 · bottom-center avatars + chip */}
        <Node anchor={{ x: 600, y: 650 }} transform="translate(-50%, -45%)" delay={0.9} float={8}>
          <Card>
            <div className="flex -space-x-2">
              <Avatar i="MR" c="from-emerald-500 to-teal-500" />
              <Avatar i="SL" c="from-cyan-500 to-blue-500" />
            </div>
            <Chip className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Team synced</Chip>
          </Card>
        </Node>

        {/* 7 · left pocket - attendance chip */}
        <Node anchor={{ x: 184, y: 415 }} transform="translate(-42%, -50%)" delay={0.7} float={6}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-semibold text-blue-700 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
            Attendance
          </span>
        </Node>

        {/* 8 · bottom-left corner - document card */}
        <Node anchor={{ x: 120, y: 650 }} transform="translate(-8%, -38%)" delay={1.2}>
          <Card>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2h9l5 5v15H6zM15 2v5h5" /></svg>
            </span>
            <div className="leading-tight">
              <div className="text-[14px] font-bold text-gray-900 dark:text-white">Offer letter</div>
              <Chip className="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300">Documents</Chip>
            </div>
          </Card>
        </Node>
      </div>
    </div>
  );
};

/* ---------- shared copy block ---------- */

const HeroCopy: React.FC = () => {
  const [contactOpen, setContactOpen] = useState(false);
  return (
  <div className="mx-auto w-full max-w-xl text-center">
    <motion.h1
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.7, ease: EASE }}
      className="text-[clamp(2.5rem,4.8vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.03em] text-gray-900 dark:text-white"
    >
      The OS for
      <br />
      <GradientText>high-performance</GradientText> teams
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.7, ease: EASE }}
      className="mx-auto mt-5 max-w-md text-[1.0625rem] leading-relaxed text-gray-500 dark:text-gray-400"
    >
      Leave, attendance, documents and employee voice, one elegant HRMS that
      helps your whole team get things done.
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.7, ease: EASE }}
      className="mx-auto mt-8 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
    >
      <Magnetic strength={0.4} className="w-full sm:w-auto">
        <button
          onClick={() => setContactOpen(true)}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gray-900 px-7 py-3.5 text-[1rem] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(15,23,42,0.5)] dark:bg-white dark:text-gray-900 sm:w-auto"
        >
          <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">Start free</span>
          <svg className="relative h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </Magnetic>
      <Magnetic strength={0.25} className="w-full sm:w-auto">
        <button className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-gray-200 bg-white/70 px-6 py-3.5 text-[1rem] font-semibold text-gray-800 backdrop-blur transition-colors hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white sm:w-auto">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white transition-transform group-hover:scale-110">
            <svg className="ml-0.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
          Watch demo
        </button>
      </Magnetic>
    </motion.div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-secondary text-gray-500 dark:text-gray-400"
    >
      {["Guided onboarding", "Dedicated support", "Enterprise-grade security"].map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5">
          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
          {t}
        </span>
      ))}
    </motion.div>

    <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
  </div>
  );
};

const HeroSection: React.FC = () => (
  <section className="relative overflow-hidden">
    {/* Ambient background */}
    <div className="absolute inset-0 -z-10">
      <GridBackdrop />
      <GlowOrb className="-left-32 top-10" color="rgba(62,91,246,0.26)" size={600} />
      <GlowOrb className="-right-40 top-40" color="rgba(47,201,141,0.2)" size={540} delay={2} />
      <GlowOrb className="left-1/2 top-1/2" color="rgba(110,134,255,0.13)" size={600} />
    </div>

    {/* ===== Desktop stage: curved loop wraps the centered copy ===== */}
    <div className="mx-auto hidden max-w-[1400px] px-6 pb-24 pt-44 lg:block">
      <div className="relative mx-auto h-[820px] w-full max-w-[1280px]">
        <Trace />
        <div className="absolute inset-0 z-30 grid place-items-center px-6">
          <HeroCopy />
        </div>
      </div>
    </div>

    {/* ===== Mobile / tablet: clean stacked layout ===== */}
    <div className="px-5 pb-16 pt-28 sm:pt-32 lg:hidden">
      <HeroCopy />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-2.5"
      >
        {[
          { l: "Leave approved", c: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
          { l: "Attendance", c: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
          { l: "Documents", c: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300" },
          { l: "Team synced", c: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
        ].map((t) => (
          <span key={t.l} className={"rounded-full px-3.5 py-1.5 text-secondary font-semibold " + t.c}>
            {t.l}
          </span>
        ))}
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
