import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import AppLogo from "../AppLogo";
import {
  SectionHeading,
  GradientText,
  GlowCard,
  GlowOrb,
  CountUp,
  EASE,
} from "./primitives";

/* ============================================================
   Core features, consolidated.
   Document Studio, Smart Attendance, Leave Management, Role
   Management and Security & Trust used to be five separate
   full-height scroll stops. They're collapsed here into one
   continuously drifting row of cards instead — the actual idea
   in the reference clip (a row of cards endlessly sliding past,
   looping forever), reused here for feature cards rather than
   testimonials. Unlike a passive marquee, it also pauses on
   hover and can be grabbed and scrolled by hand (mouse drag or
   touch), so it never fights the user for control.
   ============================================================ */

/* ---------- mini product previews ---------- */

const DocMini: React.FC = () => (
  <div className="relative mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white p-3.5 shadow-inner dark:border-white/[0.06] dark:bg-white/[0.03]">
    <div className="flex items-center gap-2 border-b border-dashed border-gray-200 pb-2 dark:border-white/10">
      <AppLogo size={14} />
      <div className="h-1.5 w-16 rounded-full bg-gray-200 dark:bg-white/10" />
    </div>
    <div className="mt-2.5 space-y-1.5">
      {[100, 88, 64].map((w, i) => (
        <div key={i} className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06]" style={{ width: `${w}%` }} />
      ))}
    </div>
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4, ease: EASE }}
      className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 dark:border-emerald-500/20 dark:bg-emerald-500/10"
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-red-50 text-red-500 dark:bg-red-500/10">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l5 5v15H6zM9 15h6" /></svg>
      </span>
      <span className="text-caption font-semibold text-emerald-700 dark:text-emerald-300">Offer_Letter.pdf ready</span>
    </motion.div>
  </div>
);

const AttendanceMini: React.FC = () => {
  const reduce = useReducedMotion();
  const cells = Array.from({ length: 21 });
  return (
    <div className="mt-5 rounded-xl border border-gray-100 bg-white p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-caption text-gray-400">Present now</span>
        <motion.span
          animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
        </motion.span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((_, i) => {
          const state = i % 9 === 0 ? "off" : i % 7 === 5 ? "late" : "in";
          const color = state === "in" ? "bg-emerald-400" : state === "late" ? "bg-amber-400" : "bg-gray-200 dark:bg-white/10";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.02, ease: EASE }}
              className={"aspect-square rounded-sm " + color}
            />
          );
        })}
      </div>
    </div>
  );
};

const LeaveMini: React.FC = () => {
  const bars = [
    { l: "Annual", v: 18, tot: 24, c: "from-blue-500 to-indigo-500" },
    { l: "Sick", v: 6, tot: 10, c: "from-emerald-500 to-teal-500" },
    { l: "Personal", v: 3, tot: 5, c: "from-fuchsia-500 to-pink-500" },
  ];
  return (
    <div className="mt-5 space-y-2.5 rounded-xl border border-gray-100 bg-white p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
      {bars.map((b, i) => (
        <div key={b.l}>
          <div className="mb-1 flex items-center justify-between text-caption text-gray-500 dark:text-gray-400">
            <span>{b.l}</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              <CountUp value={b.v} />/{b.tot}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
            <motion.div
              className={"h-full rounded-full bg-gradient-to-r " + b.c}
              initial={{ width: 0 }}
              whileInView={{ width: `${(b.v / b.tot) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: EASE }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const RoleMini: React.FC = () => {
  const roles = ["Admin", "Manager", "Employee"];
  const grants = [true, true, false];
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.03]">
      {roles.map((r, ri) => (
        <div key={r} className="flex items-center justify-between border-b border-gray-50 px-3.5 py-2 last:border-0 dark:border-white/[0.04]">
          <span className="text-caption font-medium text-gray-600 dark:text-gray-300">{r}</span>
          {grants[ri] ? (
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: ri * 0.1, ease: EASE }}
              className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-white"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            </motion.span>
          ) : (
            <span className="h-1 w-4 rounded-full bg-gray-200 dark:bg-white/10" />
          )}
        </div>
      ))}
    </div>
  );
};

const SecurityMini: React.FC = () => {
  const reduce = useReducedMotion();
  const badges = [
    { ic: "M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z", l: "Encrypted" },
    { ic: "M12 2a10 10 0 100 20 10 10 0 000-20zM8 12l3 3 5-6", l: "SSO / 2FA" },
    { ic: "M9 5h6M9 9h6M9 13h4M5 3h14v18l-3-2-2 2-2-2-2 2-3-2z", l: "Audit log" },
  ];
  return (
    <div className="mt-5 grid grid-cols-3 gap-2.5">
      {badges.map((b, i) => (
        <motion.div
          key={b.l}
          initial={{ opacity: 0, y: 8 }}
          animate={reduce ? { opacity: 1, y: 0 } : { opacity: [0, 1, 0.7, 1], y: 0 }}
          transition={{ delay: i * 0.15, duration: 1.6, ease: EASE }}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white py-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/10 text-blue-600 dark:text-blue-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={b.ic} /></svg>
          </span>
          <span className="text-[9.5px] font-medium text-gray-500 dark:text-gray-400">{b.l}</span>
        </motion.div>
      ))}
    </div>
  );
};

const InstantMini: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <div className="relative mt-5 flex h-32 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.03]">
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full border border-blue-400/40"
            initial={{ width: 30, height: 30, opacity: 0.6 }}
            animate={{ width: 120, height: 120, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
          />
        ))}
      <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9z" /></svg>
      </div>
      <span className="absolute bottom-2.5 rounded-full bg-gray-50 px-2 py-0.5 text-[9.5px] font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400">
        No refresh needed
      </span>
    </div>
  );
};

/* ---------- card shell ---------- */

interface FeatureCardCfg {
  key: string;
  title: string;
  desc: string;
  ic: string;
  tone: string;
  mini: React.ReactNode;
}

const FEATURES: FeatureCardCfg[] = [
  {
    key: "document-studio",
    title: "Document Studio",
    desc: "Pick a template, drop in your letterhead, edit live and export a pixel-perfect PDF. Offer letters and certificates in seconds.",
    ic: "M6 2h9l5 5v15H6zM15 2v5h5M9 13h6M9 17h6",
    tone: "from-fuchsia-500/10 to-pink-500/10 text-fuchsia-600 dark:text-fuchsia-400",
    mini: <DocMini />,
  },
  {
    key: "attendance",
    title: "Smart Attendance",
    desc: "Clock-ins, shifts and live presence in one view. Spot who's in, late or off, instantly.",
    ic: "M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z",
    tone: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
    mini: <AttendanceMini />,
  },
  {
    key: "leave",
    title: "Leave Management",
    desc: "Policies, accruals, approvals and a shared calendar, automated end to end.",
    ic: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    tone: "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400",
    mini: <LeaveMini />,
  },
  {
    key: "roles",
    title: "Role Management",
    desc: "Granular, role-based access. Admins, managers and employees each get a tailored view.",
    ic: "M12 11a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    tone: "from-indigo-500/10 to-blue-500/10 text-indigo-600 dark:text-indigo-400",
    mini: <RoleMini />,
  },
  {
    key: "security",
    title: "Security & Trust",
    desc: "End-to-end encryption, audit logs, SSO/2FA and automated backups, enterprise-grade by default.",
    ic: "M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z",
    tone: "from-blue-500/10 to-emerald-500/10 text-blue-600 dark:text-blue-400",
    mini: <SecurityMini />,
  },
  {
    key: "instant",
    title: "Instant Everything",
    desc: "Powered by Socket.IO, notifications, counters and dashboards update the instant something happens, with no reload, ever.",
    ic: "M13 2L3 14h9l-1 8 10-12h-9z",
    tone: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400",
    mini: <InstantMini />,
  },
];

const FeatureCard: React.FC<{ cfg: FeatureCardCfg }> = ({ cfg }) => (
  <div className="w-[300px] shrink-0 sm:w-[340px]">
    <GlowCard className="flex h-[430px] flex-col p-6">
      <span className={"grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br " + cfg.tone}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d={cfg.ic} /></svg>
      </span>
      <h3 className="mt-4 text-card-title font-bold text-gray-900 dark:text-white">{cfg.title}</h3>
      <p className="mt-1.5 text-secondary text-gray-500 dark:text-gray-400">{cfg.desc}</p>
      <div className="mt-auto">{cfg.mini}</div>
    </GlowCard>
  </div>
);

/**
 * A row that drifts continuously on its own, but hands control to the
 * user the moment they touch it: hovering pauses the auto-drift, and
 * the row can be grabbed with a mouse (or swiped on touch) and scrolled
 * by hand like any native horizontal scroller. The item list is
 * rendered twice back-to-back so the loop point is invisible — once
 * the scroll position passes the first copy, it's silently rewound by
 * exactly that width.
 */
const DragMarquee: React.FC<{ items: FeatureCardCfg[] }> = ({ items }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    let raf: number;
    const tick = () => {
      if (!paused.current && !drag.current.active) {
        el.scrollLeft += 0.55;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  };
  const stopDrag = () => {
    drag.current.active = false;
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      className="flex cursor-grab gap-5 overflow-x-auto active:cursor-grabbing [-ms-overflow-style:none] [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {[0, 1].map((copy) => (
        <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-5 pr-5">
          {items.map((f) => (
            <FeatureCard key={`${copy}-${f.key}`} cfg={f} />
          ))}
        </div>
      ))}
    </div>
  );
};

const FeatureShowcaseSection: React.FC = () => (
  <section id="features" className="relative overflow-hidden py-24 sm:py-32">
    <div className="absolute inset-0 -z-10">
      <GlowOrb className="left-1/4 top-10" color="rgba(47,201,141,0.16)" size={560} />
      <GlowOrb className="right-1/4 bottom-0" color="rgba(62,91,246,0.16)" size={560} delay={2} />
    </div>
    <div className="mx-auto max-w-6xl px-5">
      <SectionHeading
        title={
          <>
            One platform, <GradientText>every workflow</GradientText>
          </>
        }
        description="From the first clock-in to the final approval, Nexora covers the entire employee lifecycle, with the polish of a product people actually enjoy."
      />
    </div>

    <div className="mt-16">
      <DragMarquee items={FEATURES} />
    </div>
  </section>
);

export default FeatureShowcaseSection;
