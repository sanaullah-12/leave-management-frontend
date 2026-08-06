import React, { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import AppLogo from "../AppLogo";
import { GradientText, Reveal, GlowOrb } from "./primitives";

/* ============================================================
   "The Nexora way" - work in context.
   A pinned scene: the Nexora core sits dead-centre while six real
   HR product cards fly INTO the core as you scroll down (and back
   OUT as you scroll up) - a scroll-scrubbed radial convergence.
   Everything, unified into one living core.
   ============================================================ */

/* ---------- card visuals ---------- */

const CardShell: React.FC<{ title: string; ic: string; children: React.ReactNode }> = ({ title, ic, children }) => (
  <div className="rounded-2xl border border-gray-200/70 bg-white/90 p-3 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-[#141b29]/90">
    <div className="mb-2 flex items-center gap-1.5">
      <span className="grid h-5 w-5 place-items-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={ic} /></svg>
      </span>
      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-100">{title}</span>
    </div>
    {children}
  </div>
);

const AnalyticsCard = () => (
  <CardShell title="Analytics" ic="M4 20V10M10 20V4M16 20v-7">
    <div className="flex items-end justify-between">
      <div><div className="text-lg font-bold text-gray-900 dark:text-white">63%</div><div className="text-[9px] text-gray-400">approval rate</div></div>
      <div className="flex items-end gap-0.5">{[5, 8, 6, 10, 7, 11].map((h, i) => <span key={i} className="w-1.5 rounded-t bg-gradient-to-t from-blue-500 to-indigo-400" style={{ height: h * 3 }} />)}</div>
    </div>
  </CardShell>
);
const LeaveCard = () => (
  <CardShell title="Leave" ic="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z">
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-1.5 dark:bg-white/[0.04]">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-[9px] font-bold text-white">JD</span>
      <div className="min-w-0 flex-1"><div className="truncate text-[9.5px] font-medium text-gray-800 dark:text-gray-200">Jordan · Annual</div><div className="text-[8px] text-gray-400">Aug 4 - 8</div></div>
      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-500">Approved</span>
    </div>
  </CardShell>
);
const AttendanceCard = () => (
  <CardShell title="Attendance" ic="M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z">
    <div className="mb-1.5 flex items-baseline gap-1"><span className="text-lg font-bold text-emerald-500">248</span><span className="text-[9px] text-gray-400">/ 260 present</span></div>
    <div className="grid grid-cols-10 gap-0.5">{Array.from({ length: 20 }).map((_, i) => <span key={i} className={"aspect-square rounded-sm " + (i % 9 === 0 ? "bg-amber-400" : "bg-emerald-400/80")} />)}</div>
  </CardShell>
);
const AnnounceCard = () => (
  <CardShell title="Announcements" ic="M11 5L6 9H2v6h4l5 4zM19 12a7 7 0 00-2-5">
    <div className="rounded-lg bg-gray-50 p-1.5 dark:bg-white/[0.04]"><span className="inline-block rounded bg-blue-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-blue-500">Company</span><div className="mt-1 text-[9.5px] font-semibold text-gray-800 dark:text-gray-200">Q3 all-hands · Friday</div><div className="text-[8px] text-gray-400">Join us at 3pm</div></div>
  </CardShell>
);
const VoiceCard = () => (
  <CardShell title="Employee Voice" ic="M3 11l18-5v12L3 14v-3z">
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-1.5 dark:bg-white/[0.04]">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-[9px] font-bold text-white">MR</span>
      <div className="min-w-0 flex-1"><div className="truncate text-[9.5px] font-medium text-gray-800 dark:text-gray-200">Break-room idea</div><div className="text-[8px] text-gray-400">Workplace</div></div>
      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-500">Resolved</span>
    </div>
  </CardShell>
);
const DocsCard = () => (
  <CardShell title="Documents" ic="M6 2h9l5 5v15H6zM15 2v5h5">
    <div className="rounded-lg bg-white p-2 shadow-inner dark:bg-white/[0.06]"><div className="mb-1 h-1 w-8 rounded bg-fuchsia-400" />{[100, 82, 92, 68].map((w, i) => <div key={i} className="mb-1 h-1 rounded-full bg-gray-200 dark:bg-white/10" style={{ width: `${w}%` }} />)}<div className="mt-1 text-[8px] font-semibold text-gray-400">Offer_Letter.pdf</div></div>
  </CardShell>
);

/* ---------- spread geometry (cards start out here, fly to centre) ---------- */

const RX = 430;
const RY = 320;
const CARD_ELS = [<LeaveCard />, <AnalyticsCard />, <AttendanceCard />, <AnnounceCard />, <VoiceCard />, <DocsCard />];
// the Announcements card (i === 3) sits below the character in the spread, so it needs
// to render in front of the core (z-30) instead of behind it like the other cards.
const CARDS = CARD_ELS.map((el, i) => {
  const a = (-90 + i * 60) * (Math.PI / 180);
  return { el, sx: +(RX * Math.cos(a)).toFixed(0), sy: +(RY * Math.sin(a)).toFixed(0), i, z: i === 3 ? 35 : 20 };
});

/* ---------- animated HR character (polished, full-body illustration) ---------- */

const HrCharacter: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <svg
          width="340"
          height="521"
          viewBox="0 0 300 460"
          className="drop-shadow-[0_30px_55px_-12px_rgba(37,99,235,0.45)]"
        >
          <defs>
            <linearGradient id="jacketGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6E86FF" />
              <stop offset="100%" stopColor="#3547D6" />
            </linearGradient>
            <linearGradient id="pantsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2B3A8F" />
              <stop offset="100%" stopColor="#1D2766" />
            </linearGradient>
            <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3E5BF6" />
              <stop offset="100%" stopColor="#26327A" />
            </linearGradient>
            <linearGradient id="visorGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3E5BF6" />
              <stop offset="100%" stopColor="#2FC98D" />
            </linearGradient>
            <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBD3AA" />
              <stop offset="100%" stopColor="#F0B888" />
            </linearGradient>
            <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1D2A5C" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1D2A5C" stopOpacity="0" />
            </radialGradient>
            <clipPath id="visorClip"><rect x="106" y="92" width="88" height="28" rx="14" /></clipPath>

            {/* reusable limb / shoe shapes, mirrored on the right via <use> */}
            <path id="leg" d="M95 314 L145 314 L141 420 C141 429 130 433 118 433 C106 433 97 429 95 420 Z" />
            <ellipse id="shoe" cx="118" cy="430" rx="24" ry="10" />
            <path id="arm" d="M66 198 C44 216 34 256 41 294 C43 308 58 316 71 309 L83 300 C72 268 70 228 87 200 Z" />
            <ellipse id="hand" cx="52" cy="301" rx="15" ry="16" />
            <path id="piping" d="M84 300 C86 250 108 210 150 204" />
          </defs>

          {/* ground shadow */}
          <ellipse cx="150" cy="446" rx="98" ry="15" fill="url(#shadowGrad)" />

          {/* legs */}
          <use href="#leg" fill="url(#pantsGrad)" />
          <use href="#leg" fill="url(#pantsGrad)" transform="matrix(-1 0 0 1 300 0)" />
          <use href="#shoe" fill="#1E2A52" />
          <use href="#shoe" fill="#1E2A52" transform="matrix(-1 0 0 1 300 0)" />

          {/* arms (behind torso) */}
          <use href="#arm" fill="url(#jacketGrad)" />
          <use href="#arm" fill="url(#jacketGrad)" transform="matrix(-1 0 0 1 300 0)" />
          <use href="#hand" fill="url(#skinGrad)" />
          <use href="#hand" fill="url(#skinGrad)" transform="matrix(-1 0 0 1 300 0)" />

          {/* jacket / torso */}
          <path
            d="M64 198 C64 186 92 178 150 178 C208 178 236 186 236 198 C236 250 222 296 206 320 L94 320 C78 296 64 250 64 198 Z"
            fill="url(#jacketGrad)"
          />
          {/* collar */}
          <path d="M110 178 C110 198 126 210 150 210 C174 210 190 198 190 178 Z" fill="#2B3A8F" opacity="0.9" />
          {/* jacket piping */}
          <use href="#piping" stroke="#2FC98D" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
          <use href="#piping" stroke="#2FC98D" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" transform="matrix(-1 0 0 1 300 0)" />

          {/* badge */}
          <rect x="130" y="250" width="40" height="30" rx="6" fill="#FFFFFF" />
          <rect x="130" y="250" width="40" height="30" rx="6" fill="none" stroke="#D8E0FF" strokeWidth="1.5" />

          {/* neck */}
          <rect x="136" y="150" width="28" height="32" fill="url(#skinGrad)" />

          {/* head */}
          <circle cx="150" cy="110" r="54" fill="url(#skinGrad)" />

          {/* hair cap */}
          <path
            d="M96 104 C92 60 118 44 150 44 C182 44 208 60 204 104 C204 78 186 66 150 66 C114 66 96 78 96 104 Z"
            fill="url(#capGrad)"
          />

          {/* headset band + ear cups */}
          <path d="M100 92 C100 50 200 50 200 92" stroke="#26327A" strokeWidth="7" strokeLinecap="round" fill="none" />
          <rect x="86" y="92" width="20" height="34" rx="9" fill="#3E5BF6" />
          <rect x="194" y="92" width="20" height="34" rx="9" fill="#3E5BF6" />

          {/* visor / goggles */}
          <rect x="106" y="92" width="88" height="28" rx="14" fill="url(#visorGrad)" />
          <rect x="116" y="97" width="26" height="9" rx="4" fill="#ffffff" opacity="0.35" />

          {/* smile */}
          <path d="M132 148 C140 156 160 156 168 148" stroke="#8A4B2C" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.75" />

          {/* visor scan light */}
          {!reduce && (
            <g clipPath="url(#visorClip)">
              <motion.rect y="92" width="16" height="28" fill="#ffffff" opacity="0.45" animate={{ x: [100, 186, 100] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            </g>
          )}
        </svg>
        {/* Nexora mark on the badge */}
        <div className="absolute" style={{ left: "50%", top: "300px", transform: "translate(-50%, -50%)" }}>
          <AppLogo size={20} />
        </div>
      </motion.div>
    </div>
  );
};

const FloatCard: React.FC<{ cfg: (typeof CARDS)[number]; progress: MotionValue<number>; reduce: boolean }> = ({ cfg, progress, reduce }) => {
  // spread (progress 0) → centre (progress ~0.62), then shrink + fade into the core
  const x = useTransform(progress, [0, 0.62], [cfg.sx, 0]);
  const y = useTransform(progress, [0, 0.62], [cfg.sy, 0]);
  const scale = useTransform(progress, [0.34, 0.64], [1, 0.1]);
  const opacity = useTransform(progress, [0, 0.08, 0.5, 0.62], [0, 1, 1, 0]);
  return (
    <div
      className="absolute left-1/2 top-1/2 w-[clamp(150px,15vw,196px)] -translate-x-1/2 -translate-y-1/2"
      style={{ zIndex: cfg.z }}
    >
      <motion.div style={reduce ? { x: cfg.sx, y: cfg.sy } : { x, y, scale, opacity }} className="will-change-transform">
        {cfg.el}
      </motion.div>
    </div>
  );
};

/* ---------- section ---------- */

const NexoraWaySection: React.FC = () => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const coreScale = useTransform(scrollYProgress, [0, 0.62], [0.92, 1.16]);
  const coreGlow = useTransform(scrollYProgress, [0.3, 0.62], [0.2, 0.5]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section id="solution" ref={ref} className="relative" style={{ height: reduce ? undefined : "220vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <GlowOrb className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="rgba(62,91,246,0.16)" size={780} />
          <GlowOrb className="right-1/4 top-16" color="rgba(47,201,141,0.12)" size={460} delay={2} />
        </div>

        {/* full-screen scene - everything centres on the middle of the viewport */}
        <div className="absolute inset-0">
          {CARDS.map((c) => (
            <FloatCard key={c.i} cfg={c} progress={scrollYProgress} reduce={reduce ?? false} />
          ))}

          {/* central character (dead centre of the screen) */}
          <div className="absolute left-1/2 top-[63%] z-30 -translate-x-1/2 -translate-y-1/2">
            <motion.div style={reduce ? undefined : { scale: coreScale }}>
              <div className="relative grid place-items-center">
                {!reduce && [0, 1, 2].map((i) => (
                  <motion.span key={i} className="absolute top-[54%] rounded-full border border-blue-400/25" style={{ width: 260, height: 260 }} initial={{ scale: 0.7, opacity: 0.45 }} animate={{ scale: 2.1, opacity: 0 }} transition={{ duration: 3.4, repeat: Infinity, delay: i * 1.1, ease: "easeOut" }} />
                ))}
                <motion.div className="absolute top-[54%] h-64 w-64 -translate-y-1/2 rounded-full bg-blue-500 blur-3xl" style={reduce ? { opacity: 0.18 } : { opacity: coreGlow }} />
                <HrCharacter />
              </div>
            </motion.div>
          </div>
        </div>

        {/* heading overlay (top) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 mx-auto max-w-2xl px-5 pt-20 text-center sm:pt-24">
          <Reveal>
            <h2 className="text-[clamp(1.8rem,4.4vw,3.2rem)] font-bold leading-[1.02] tracking-[-0.03em] text-gray-900 dark:text-white">
              Everything HR, working <GradientText>in context</GradientText>
            </h2>
          </Reveal>
        </div>

        {/* scroll hint */}
        {!reduce && (
          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-caption text-gray-400"
            style={{ opacity: hintOpacity }}
          >
            <span className="flex flex-col items-center gap-1">
              Scroll
              <svg className="h-4 w-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default NexoraWaySection;
