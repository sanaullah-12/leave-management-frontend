import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import AppLogo from "../AppLogo";
import { CountUp, GlowOrb, GridBackdrop, Reveal, EASE } from "./primitives";

/* ============================================================
   Flagship Product Showcase.
   A realistic MacBook mockup whose screen runs a LIVE, fully
   component-built recreation of the real Nexora app - two-tier
   sidebar, "Welcome back" header, and faithful Team Management,
   Document Studio and Employee Voice surfaces (violet product
   accent). The lid opens on scroll to boot the dashboard, then
   the screen scrubs through each surface. Floating feature cards
   orbit the device over an animated backdrop.
   ============================================================ */

/* ---------- atoms ---------- */

const Avatar: React.FC<{ i: string; c?: string; size?: number }> = ({
  i,
  c = "from-violet-500 to-purple-500",
  size = 26,
}) => (
  <span
    className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${c} font-bold text-white`}
    style={{ width: size, height: size, fontSize: size * 0.36 }}
  >
    {i}
  </span>
);

const Badge: React.FC<{ children: React.ReactNode; tone?: "green" | "amber" | "red" | "violet" }> = ({
  children,
  tone = "green",
}) => {
  const map = {
    green: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    red: "bg-red-500/15 text-red-400",
    violet: "bg-violet-500/15 text-violet-300",
  };
  return <span className={"rounded px-1.5 py-0.5 text-[8px] font-semibold " + map[tone]}>{children}</span>;
};

const Btn: React.FC<{ children: React.ReactNode; ic?: string; ghost?: boolean }> = ({ children, ic, ghost }) => (
  <span
    className={
      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[8.5px] font-semibold " +
      (ghost
        ? "border border-white/10 bg-white/[0.03] text-gray-300"
        : "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-[0_6px_16px_-6px_rgba(139,92,246,0.7)]")
    }
  >
    {ic && <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={ic} /></svg>}
    {children}
  </span>
);

/* ---------- HOME / dashboard (with live workflow) ---------- */

const Gauge: React.FC<{ value: number; label: string; sub: string }> = ({ value, label, sub }) => {
  const circ = Math.PI * 52;
  return (
    <div className="flex flex-col items-center">
      <div className="text-[8px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="relative mt-0.5">
        <svg width="112" height="62" viewBox="0 0 120 66">
          <path d="M8 60 A52 52 0 0 1 112 60" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" className="text-white/10" />
          <motion.path
            d="M8 60 A52 52 0 0 1 112 60"
            fill="none"
            stroke="url(#gGrad)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - value / 100) }}
            transition={{ duration: 1.4, ease: EASE }}
          />
          <defs>
            <linearGradient id="gGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center text-base font-bold text-white">
          <CountUp value={value} suffix="%" />
        </div>
      </div>
      <div className="text-[8px] text-gray-500">{sub}</div>
    </div>
  );
};

const HomeScreen: React.FC = () => {
  const reduce = useReducedMotion();
  const [pending, setPending] = useState(0);
  const [approved, setApproved] = useState(10);
  const [toast, setToast] = useState<null | "new" | "ok">(null);
  const [cursor, setCursor] = useState({ x: 80, y: 26, click: false });

  useEffect(() => {
    if (reduce) return;
    let alive = true;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      while (alive) {
        setPending(0); setApproved(10); setToast(null); setCursor({ x: 82, y: 24, click: false });
        await wait(1400); if (!alive) break;
        setToast("new"); setPending(1);
        await wait(1300);
        setCursor({ x: 47, y: 80, click: false });
        await wait(700);
        setCursor({ x: 47, y: 80, click: true });
        await wait(250);
        setToast(null); setPending(0); setApproved(11); setToast("ok");
        setCursor({ x: 47, y: 80, click: false });
        await wait(1800);
      }
    })();
    return () => { alive = false; };
  }, [reduce]);

  const kpis = [
    { l: "Employees", v: 12, tone: "text-violet-400", ic: "M17 20a5 5 0 00-10 0M12 11a4 4 0 100-8 4 4 0 000 8z" },
    { l: "Pending", v: pending, tone: "text-amber-400", ic: "M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z" },
    { l: "This month", v: 3, tone: "text-purple-400", ic: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
    { l: "Approved", v: approved, tone: "text-emerald-400", ic: "M20 6L9 17l-5-5" },
  ];

  return (
    <div className="relative flex h-full flex-col gap-2 p-3">
      <div className="grid grid-cols-4 gap-2">
        {kpis.map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
            <div className="flex items-center justify-between">
              <span className="text-[7.5px] font-semibold uppercase tracking-wide text-gray-500">{k.l}</span>
              <svg className={"h-3 w-3 " + k.tone} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={k.ic} /></svg>
            </div>
            <div className={"mt-0.5 text-lg font-bold " + k.tone}>
              <motion.span key={k.v} initial={{ scale: 1.4, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}>{k.v}</motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-2">
        <div className="relative overflow-hidden rounded-lg border border-white/[0.06] p-2.5" style={{ background: "linear-gradient(120deg,#241a45,#1a1330 60%,#241a45)" }}>
          <div className="text-[7.5px] font-semibold uppercase tracking-wider text-violet-300/80">Welcome back</div>
          <div className="mt-0.5 text-sm font-bold text-white">Good evening, HR</div>
          <div className="mt-0.5 text-[8.5px] leading-snug text-gray-300/80">Here's how your team's leave is tracking today.</div>
          <div className="mt-1.5"><Btn ic="M12 5v14M5 12h14">View Requests</Btn></div>
        </div>
        <div className="grid place-items-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
          <Gauge value={63} label="Approval rate" sub="of decided" />
        </div>
      </div>

      <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold text-gray-300">Recent activity</span>
          <span className="text-[8px] font-semibold text-violet-400">View all</span>
        </div>
        <div className="space-y-1.5">
          {[{ n: "Sick Leave · Khan18", ok: true, s: "Approved" }, { n: "Annual Leave · Sunny", ok: false, s: "Rejected" }].map((a) => (
            <div key={a.n} className="flex items-center gap-2 rounded-md bg-white/[0.02] px-2 py-1.5">
              <span className={"h-1.5 w-1.5 rounded-full " + (a.ok ? "bg-emerald-400" : "bg-red-400")} />
              <span className="flex-1 truncate text-[9px] text-gray-300">{a.n}</span>
              <Badge tone={a.ok ? "green" : "red"}>{a.s}</Badge>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/[0.08] px-2 py-1.5">
            <Avatar i="JD" c="from-fuchsia-500 to-pink-500" size={18} />
            <span className="flex-1 truncate text-[9px] text-gray-200">Annual Leave · Jordan</span>
            <span className="rounded bg-gradient-to-br from-violet-500 to-purple-500 px-1.5 py-0.5 text-[8px] font-semibold text-white">Approve</span>
          </div>
        </div>
      </div>

      {!reduce && (
        <motion.div className="pointer-events-none absolute z-30" animate={{ left: `${cursor.x}%`, top: `${cursor.y}%`, scale: cursor.click ? 0.82 : 1 }} transition={{ ease: EASE, duration: 0.6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" className="drop-shadow-lg"><path d="M4 2l7 18 2.5-7L20 10z" fill="white" stroke="#0f1420" strokeWidth="1.5" strokeLinejoin="round" /></svg>
          {cursor.click && <motion.span className="absolute -left-1 -top-1 h-4 w-4 rounded-full border border-violet-400" initial={{ scale: 0.4, opacity: 0.8 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 0.5 }} />}
        </motion.div>
      )}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 10, x: 10 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-3 right-3 z-40 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0b0814]/95 px-2.5 py-1.5 shadow-xl backdrop-blur">
            <span className={"grid h-5 w-5 place-items-center rounded-full " + (toast === "ok" ? "bg-emerald-500/20 text-emerald-400" : "bg-violet-500/20 text-violet-300")}>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={toast === "ok" ? "M20 6L9 17l-5-5" : "M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z"} /></svg>
            </span>
            <span className="text-[9px] font-semibold text-white">{toast === "ok" ? "Leave approved · Jordan notified" : "New leave request · Jordan"}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- LEAVE / analytics ---------- */

const AnalyticsScreen: React.FC = () => {
  const w = 440, h = 140;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    const y = Math.min(1, Math.exp(-Math.pow((x - 0.5) / 0.07, 2)) + 0.62 * Math.exp(-Math.pow((x - 0.78) / 0.06, 2)));
    pts.push([x * w, h - 8 - y * (h - 20)]);
  }
  const line = pts.map((p, i) => (i ? `L${p[0].toFixed(1)},${p[1].toFixed(1)}` : `M${p[0].toFixed(1)},${p[1].toFixed(1)}`)).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex-[1.6] rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
        <div className="flex items-center justify-between">
          <div><div className="text-[10px] font-bold text-white">Leave Trends</div><div className="text-[7.5px] text-gray-500">Company leave activity across recent requests</div></div>
          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[7.5px] text-gray-300">2026 (Current)</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 h-[52%] w-full overflow-visible">
          <defs><linearGradient id="anFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(139,92,246,0.4)" /><stop offset="100%" stopColor="rgba(139,92,246,0)" /></linearGradient></defs>
          <motion.path d={area} fill="url(#anFill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} />
          <motion.path d={line} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EASE }} />
        </svg>
        <div className="mt-0.5 flex justify-between px-1 text-[7.5px] text-gray-500">{["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m) => <span key={m}>{m}</span>)}</div>
      </div>
      <div className="grid flex-1 grid-cols-[1fr_1.2fr] gap-2">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
          <div className="text-[9px] font-bold text-white">Leave by Type</div>
          <div className="mt-1.5 flex items-end justify-around" style={{ height: 50 }}>
            {[{ l: "Sick", v: 42 }, { l: "Annual", v: 88 }].map((b, i) => (
              <div key={b.l} className="flex flex-col items-center gap-1">
                <motion.div className="w-5 rounded-t bg-gradient-to-t from-violet-500 to-purple-400" initial={{ height: 0 }} animate={{ height: (b.v / 100) * 46 }} transition={{ delay: 0.3 + i * 0.15, ease: EASE }} />
                <span className="text-[7.5px] text-gray-400">{b.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[{ l: "Approved", v: 10, c: "text-emerald-400" }, { l: "Pending", v: 0, c: "text-amber-400" }, { l: "This Month", v: 3, c: "text-violet-400" }, { l: "Employees", v: 12, c: "text-purple-400" }].map((s) => (
            <div key={s.l} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1"><div className="text-[7.5px] text-gray-500">{s.l}</div><div className={"text-sm font-bold " + s.c}><CountUp value={s.v} /></div></div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- TEAM management ---------- */

const team = [
  { n: "Khan18", id: "90", d: "Product & Dev", p: "UX/UI Designer", i: "K", c: "from-violet-500 to-purple-500", date: "7/27/2026" },
  { n: "Sunnyoffical", id: "3", d: "Engineering", p: "Jr. Software Engineer", i: "S", c: "from-sky-500 to-blue-500", date: "10/8/2025" },
  { n: "Danish Mehmood", id: "EMP0019", d: "Engineering", p: "Jr. Software Engineer", i: "DM", c: "from-fuchsia-500 to-pink-500", date: "9/25/2025" },
  { n: "Mubashir Hussain", id: "EMP0017", d: "Engineering", p: "Frontend Developer", i: "MH", c: "from-violet-500 to-indigo-500", date: "9/10/2025" },
  { n: "Faisal Ghafoor", id: "EMP0012", d: "Engineering", p: "Frontend Developer", i: "FG", c: "from-emerald-500 to-teal-500", date: "9/10/2025" },
];

const TeamScreen: React.FC = () => (
  <div className="flex h-full flex-col gap-2 p-3">
    <div className="flex items-start justify-between">
      <div><div className="text-[13px] font-bold text-white">Team Management</div><div className="text-[8px] text-gray-500">Manage your company team members</div></div>
      <div className="flex gap-1.5"><Btn ghost ic="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-15-2M4 16a8 8 0 0015 2">Refresh</Btn><Btn ic="M12 5v14M5 12h14">Invite Employee</Btn></div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-md bg-violet-500/15 px-2 py-1.5 text-center text-[9px] font-semibold text-violet-300">Employees (12/12)</div>
      <div className="rounded-md border border-white/[0.06] px-2 py-1.5 text-center text-[9px] font-semibold text-gray-400">Admins (3)</div>
    </div>
    <div className="flex-1 overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.03]">
      <div className="grid grid-cols-[1.5fr_1.1fr_1.3fr_1fr_0.8fr_1fr] border-b border-white/[0.06] px-3 py-1.5 text-[7px] font-semibold uppercase tracking-wide text-gray-500">
        <span>Employee</span><span>Department</span><span>Position</span><span>Join date</span><span>Status</span><span>Actions</span>
      </div>
      {team.map((e, i) => (
        <motion.div key={e.n} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, ease: EASE }} className="grid grid-cols-[1.5fr_1.1fr_1.3fr_1fr_0.8fr_1fr] items-center border-b border-white/[0.04] px-3 py-1.5 last:border-0">
          <span className="flex items-center gap-1.5">
            <Avatar i={e.i} c={e.c} size={20} />
            <span className="leading-tight"><span className="block text-[9px] font-semibold text-gray-200">{e.n}</span><span className="block text-[7px] text-gray-500">{e.id}</span></span>
          </span>
          <span className="text-[8.5px] text-gray-400">{e.d}</span>
          <span className="text-[8.5px] text-gray-400">{e.p}</span>
          <span className="text-[8.5px] text-gray-400">{e.date}</span>
          <span className="flex items-center gap-1 text-[8.5px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Active</span>
          <span className="flex items-center gap-1">
            <span className="rounded border border-red-500/30 px-1.5 py-0.5 text-[7.5px] font-semibold text-red-400">Deactivate</span>
            <span className="rounded border border-violet-500/30 px-1.5 py-0.5 text-[7.5px] font-semibold text-violet-300">Report</span>
          </span>
        </motion.div>
      ))}
    </div>
  </div>
);

/* ---------- VOICE ---------- */

const VoiceScreen: React.FC = () => (
  <div className="flex h-full flex-col gap-2 p-3">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-1.5">
        <svg className="h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 01-5.8-1.6" /></svg>
        <div><div className="text-[12px] font-bold text-white">Employee Voice</div><div className="text-[8px] text-gray-500">Every submission from your team, reports, ideas and appreciation.</div></div>
      </div>
      <Btn ic="M12 5v14M5 12h14">Share your voice</Btn>
    </div>
    <div className="grid grid-cols-4 gap-2">
      {[{ l: "Pending", v: 1, c: "text-amber-400", ic: "M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z" }, { l: "Resolved", v: 1, c: "text-emerald-400", ic: "M20 6L9 17l-5-5" }, { l: "New today", v: 0, c: "text-violet-400", ic: "M12 3l1.9 5.8H20l-4.9 3.6L17 18l-5-3.6L7 18l1.9-5.6L4 8.8h6.1z" }, { l: "High priority", v: 1, c: "text-red-400", ic: "M12 2C8 6 6 9 6 13a6 6 0 0012 0c0-4-2-7-6-11z" }].map((s, i) => (
        <motion.div key={s.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
          <span className={"grid h-6 w-6 place-items-center rounded-md bg-white/5 " + s.c}><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={s.ic} /></svg></span>
          <div><div className={"text-base font-bold " + s.c}><CountUp value={s.v} /></div><div className="text-[7px] uppercase tracking-wide text-gray-500">{s.l}</div></div>
        </motion.div>
      ))}
    </div>
    <div className="flex gap-1.5 overflow-hidden">
      {["All 2", "Pending", "Under Review", "In Progress", "Waiting 1", "Resolved 1", "Closed"].map((t, i) => (
        <span key={t} className={"whitespace-nowrap rounded-full px-2 py-1 text-[8px] font-semibold " + (i === 0 ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white" : "border border-white/[0.06] text-gray-400")}>{t}</span>
      ))}
    </div>
    <div className="flex-1 space-y-2">
      {[{ t: "I need pen", d: "urgently i want pen", n: "Khan18", pr: "High", prc: "text-amber-400", st: "Waiting for Employee", ok: false, ago: "1 day ago" }, { t: "I need keyboard and mouse", d: "because it's not working properly", n: "Sunnyoffical", pr: "Medium", prc: "text-violet-300", st: "Resolved", ok: true, ago: "4 days ago" }].map((v, i) => (
        <motion.div key={v.t} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.12 }} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
          <div className="flex items-start gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber-500/15 text-amber-400"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-white">{v.t}</span>
                <span className={"text-[8px] font-semibold " + (v.ok ? "text-emerald-400" : "text-amber-400")}>● {v.st}</span>
              </div>
              <div className="text-[8.5px] text-gray-500">{v.d}</div>
              <div className="mt-1 flex items-center gap-2 text-[7.5px] text-gray-500">
                <span>{v.n}</span><span className={v.prc}>● {v.pr}</span><span>Workplace Issue</span><span className="ml-auto">{v.ago}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

/* ---------- DOCUMENTS / Document Studio ---------- */

const DocsScreen: React.FC = () => (
  <div className="flex h-full flex-col gap-2 p-3">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-1.5">
        <svg className="h-4 w-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2h9l5 5v15H6zM15 2v5h5" /></svg>
        <div><div className="text-[12px] font-bold text-white">Document Studio</div><div className="text-[8px] text-gray-500">Create, manage and generate professional HR documents.</div></div>
      </div>
      <Btn ic="M12 5v14M5 12h14">New Document</Btn>
    </div>
    <div className="grid grid-cols-5 gap-2">
      {[
        { l: "Total templates", v: "14", s: "Ready-to-use", ic: "M3 7h18M3 12h18M3 17h18", tone: "from-violet-500 to-purple-500" },
        { l: "Generated", v: "0", s: "Issued", ic: "M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z", tone: "from-emerald-500 to-teal-500" },
        { l: "Drafts", v: "0", s: "In progress", ic: "M12 20h9M16.5 3.5a2 2 0 013 3L7 19l-4 1 1-4z", tone: "from-orange-500 to-amber-500" },
        { l: "Recent", v: "0", s: "Last 7 days", ic: "M12 3l1.9 5.8H20l-4.9 3.6L17 18l-5-3.6L7 18l1.9-5.6L4 8.8h6.1z", tone: "from-purple-500 to-fuchsia-500" },
        { l: "Most used", v: "Leave...", s: "48 gens", ic: "M6 2h12v6a6 6 0 01-12 0zM6 22h12v-2a6 6 0 00-12 0z", tone: "from-pink-500 to-rose-500", small: true },
      ].map((c, i) => (
        <motion.div key={c.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
          <div className="flex items-start justify-between">
            <span className="text-[7px] font-semibold uppercase leading-tight tracking-wide text-gray-500">{c.l}</span>
            <span className={"grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br text-white " + c.tone}><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={c.ic} /></svg></span>
          </div>
          <div className={"mt-1 font-bold text-white " + (c.small ? "text-[10px]" : "text-lg")}>{c.v}</div>
          <div className="text-[7px] text-gray-500">{c.s}</div>
        </motion.div>
      ))}
    </div>
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
      <div className="flex gap-3 text-[8.5px] font-semibold text-gray-300">
        <span className="flex items-center gap-1"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h18v13H3zM3 7l2-3h14l2 3" /></svg>Templates</span>
        <span className="flex items-center gap-1 text-gray-500"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M7 8l5-5 5 5M5 21h14" /></svg>Import</span>
      </div>
      <span className="flex items-center gap-1 text-[8.5px] text-gray-500"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M7 12h10M10 18h4" /></svg>Properties</span>
    </div>
    <div className="relative flex flex-1 flex-col items-center justify-center rounded-lg border border-white/[0.06] bg-gradient-to-b from-violet-500/[0.04] to-transparent">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative">
        <div className="h-16 w-12 rounded-md border border-white/10 bg-white/[0.04] p-2">
          <div className="mb-1 h-1 w-6 rounded bg-violet-400" />
          {[10, 8, 9, 6].map((wd, i) => <div key={i} className="mb-1 h-0.5 rounded bg-white/15" style={{ width: wd * 3 }} />)}
        </div>
        <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-white"><svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.9 5.8H20l-4.9 3.6L17 18l-5-3.6L7 18l1.9-5.6L4 8.8h6.1z" /></svg></span>
      </motion.div>
      <div className="mt-2 text-[10px] font-bold text-white">Your document canvas</div>
      <div className="mt-1 max-w-[220px] text-center text-[7.5px] leading-snug text-gray-500">Start blank, open Templates for a ready-made letter, or Import your own company template.</div>
      <div className="mt-2"><Btn ic="M12 5v14M5 12h14">Start a blank document</Btn></div>
    </div>
  </div>
);

/* ---------- screens registry ---------- */

const SCREENS = [
  { key: "home", rail: "Home", panel: "Overview", pages: [["Dashboard", true], ["My Leave", false], ["Notifications", false]], el: <HomeScreen /> },
  { key: "leave", rail: "Leave", panel: "Leave", pages: [["Overview", true], ["Apply Leave", false], ["Calendar", false], ["Policies", false]], el: <AnalyticsScreen /> },
  { key: "team", rail: "Team", panel: "Team & people", pages: [["My Team", false], ["Employees", true], ["Departments", false], ["Leave Policies", false]], el: <TeamScreen /> },
  { key: "voice", rail: "Voice", panel: "Employee Voice", pages: [["Employee Voice", true]], el: <VoiceScreen /> },
  { key: "documents", rail: "Documents", panel: "Document Studio", pages: [["Document Studio", true]], el: <DocsScreen /> },
] as const;

const RAIL = [
  { k: "Home", ic: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { k: "Leave", ic: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
  { k: "Team", ic: "M16 21v-2a4 4 0 00-8 0v2M12 7a3 3 0 100 6 3 3 0 000-6z" },
  { k: "Attendance", ic: "M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z" },
  { k: "Documents", ic: "M6 2h9l5 5v15H6zM15 2v5h5" },
  { k: "Voice", ic: "M3 11l18-5v12L3 14v-3z" },
  { k: "Settings", ic: "M12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7zM19.4 13l1.4 1.1-1.4 2.5-1.7-.6a6 6 0 01-1.5.9L15.4 19h-2.8l-.5-2a6 6 0 01-1.5-.9l-1.7.6-1.4-2.5L8.6 13a6 6 0 010-2L7.2 9.9l1.4-2.5 1.7.6a6 6 0 011.5-.9L12.6 5h2.8l.5 2a6 6 0 011.5.9l1.7-.6 1.4 2.5L18.4 11a6 6 0 011 2z" },
];

/* ---------- laptop ---------- */

const Laptop: React.FC<{
  active: number;
  lidRotate: MotionValue<number> | number;
}> = ({ active, lidRotate }) => {
  const s = SCREENS[active];
  return (
    <div className="relative w-full [perspective:1800px]">
      <motion.div
        style={{ rotateX: lidRotate, transformOrigin: "center bottom", transformPerspective: 1800 }}
        className="relative rounded-[16px] border border-white/15 bg-gradient-to-b from-[#23272f] to-[#15181d] p-[8px] pt-[15px] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)] will-change-transform"
      >
        <span className="absolute left-1/2 top-[5px] h-1 w-1 -translate-x-1/2 rounded-full bg-white/20" />
        <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] bg-[#0a0812]">
          <div className="flex h-full">
            {/* icon rail */}
            <div className="flex w-[40px] shrink-0 flex-col items-center gap-1.5 border-r border-white/[0.06] bg-[#08060f] py-2">
              <div className="mb-1"><AppLogo size={18} /></div>
              {RAIL.map((r) => {
                const on = r.k === s.rail;
                return (
                  <div key={r.k} className="flex flex-col items-center gap-0.5">
                    <div className={"relative grid h-6 w-6 place-items-center rounded-lg " + (on ? "bg-violet-500/20 text-violet-300" : "text-gray-500")}>
                      {on && <motion.span layoutId="railpill" className="absolute inset-0 rounded-lg ring-1 ring-violet-400/40" transition={{ ease: EASE }} />}
                      <svg className="relative h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={r.ic} /></svg>
                    </div>
                    <span className={"text-[5.5px] " + (on ? "text-violet-300" : "text-gray-600")}>{r.k}</span>
                  </div>
                );
              })}
              <div className="mt-auto"><Avatar i="HC" c="from-violet-500 to-emerald-400" size={18} /></div>
            </div>

            {/* contextual panel */}
            <div className="flex w-[118px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0814] p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-bold text-white">{s.panel}</span>
                <svg className="h-2.5 w-2.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
              </div>
              <div className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-1 text-[7.5px] text-gray-600">
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3" /></svg>Search
              </div>
              <div className="mb-1 mt-2 text-[6.5px] font-semibold uppercase tracking-wider text-gray-600">Pages</div>
              <div className="space-y-0.5">
                {s.pages.map(([label, on]) => (
                  <div key={label as string} className={"flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[8.5px] " + (on ? "bg-violet-500/15 font-semibold text-violet-300" : "text-gray-400")}>
                    <span className={"h-1 w-1 rounded-full " + (on ? "bg-violet-400" : "bg-gray-600")} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* main */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
                <div><div className="text-[10px] font-bold text-white">Welcome back, HR Comrex</div><div className="text-[7px] text-gray-500">Administration • Administrator</div></div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 01-6 0" /></svg>
                  <span className="h-4 w-px bg-white/10" />
                  <Avatar i="HC" c="from-violet-500 to-purple-500" size={18} />
                  <span className="text-[9px] font-semibold text-white">HR Comrex</span>
                  <svg className="h-2.5 w-2.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
              <div className="relative min-h-0 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div key={s.key} initial={{ opacity: 0, y: 16, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -16, filter: "blur(6px)" }} transition={{ duration: 0.45, ease: EASE }} className="absolute inset-0">
                    {s.el}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="relative mx-auto h-[10px] w-[112%] -translate-x-[5.35%] rounded-b-[10px] bg-gradient-to-b from-[#3a3f47] to-[#1b1e23] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
        <span className="absolute left-1/2 top-0 h-[4px] w-[14%] -translate-x-1/2 rounded-b-md bg-[#0e1116]" />
      </div>
    </div>
  );
};

/* ---------- section ---------- */

const LaptopShowcase: React.FC = () => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const p = Math.max(0, (v - 0.18) / (1 - 0.18));
    setActive(Math.min(SCREENS.length - 1, Math.max(0, Math.floor(p * SCREENS.length * 0.999))));
  });

  const lidRotate = useSpring(useTransform(scrollYProgress, [0.02, 0.18], [-80, 0]), { stiffness: 70, damping: 18 });
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.18], [0.92, 1]), { stiffness: 80, damping: 20 });

  useEffect(() => {
    if (!reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % SCREENS.length), 3500);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <section ref={ref} className="relative" style={{ height: reduce ? undefined : "560vh" }}>
      <div className="sticky top-0 isolate flex min-h-screen flex-col items-center justify-center overflow-hidden py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg,#080611 0%,#0b0a1c 55%,#0d1526 100%)" }}>
          <GridBackdrop />
          <GlowOrb className="-left-20 top-1/4" color="rgba(139,92,246,0.24)" size={560} />
          <GlowOrb className="-right-20 top-1/3" color="rgba(47,201,141,0.16)" size={520} delay={2} />
          {!reduce && Array.from({ length: 18 }).map((_, i) => (
            <motion.span key={i} className="absolute h-1 w-1 rounded-full bg-white/30" style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%` }} animate={{ y: [0, -18, 0], opacity: [0.15, 0.6, 0.15] }} transition={{ duration: 4 + (i % 5), repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }} />
          ))}
        </div>

        <Reveal className="mb-8 text-center">
          <span className="text-overline text-violet-300">Product experience</span>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,3.1rem)] font-bold tracking-[-0.025em] text-white">See Nexora in action</h2>
          <p className="mx-auto mt-3 max-w-xl text-[1.0625rem] text-gray-400">Manage employees, attendance, leave, documents, announcements and analytics from one intelligent platform.</p>
        </Reveal>

        <div className="relative flex w-full max-w-6xl items-center justify-center px-4">
          <motion.div style={reduce ? undefined : { scale }} className="w-full max-w-[900px]">
            <Laptop active={active} lidRotate={reduce ? 0 : lidRotate} />
          </motion.div>
        </div>

        <div className="mt-8 flex items-center gap-2">
          {SCREENS.map((s, i) => (
            <span key={s.key} className={"h-1.5 rounded-full transition-all duration-300 " + (i === active ? "w-6 bg-violet-400" : "w-1.5 bg-white/20")} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LaptopShowcase;
