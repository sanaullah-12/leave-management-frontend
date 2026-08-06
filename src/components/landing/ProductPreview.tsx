import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import AppLogo from "../AppLogo";
import { CountUp, EASE } from "./primitives";

/* ============================================================
   Animated product preview - a living Nexora dashboard.
   Not a static screenshot: KPIs count up, a leave request
   slides in and gets approved, a realtime toast arrives, and
   the mini analytics chart breathes. Reused in the hero and
   the dashboard showcase.
   ============================================================ */

const avatars = [
  { i: "AK", c: "from-blue-500 to-indigo-500" },
  { i: "MR", c: "from-emerald-500 to-teal-500" },
  { i: "SL", c: "from-amber-500 to-orange-500" },
  { i: "JD", c: "from-fuchsia-500 to-pink-500" },
  { i: "PT", c: "from-cyan-500 to-blue-500" },
];

const bars = [42, 68, 55, 80, 62, 91, 74];

const Ring: React.FC<{ value: number }> = ({ value }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-gray-200 dark:text-white/10" />
      <motion.circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="url(#ringGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c - (c * value) / 100 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: EASE }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3E5BF6" />
          <stop offset="100%" stopColor="#2FC98D" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const ProductPreview: React.FC<{ className?: string }> = ({ className = "" }) => {
  const reduce = useReducedMotion();
  const [approved, setApproved] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);

  React.useEffect(() => {
    if (reduce) {
      setApproved(true);
      return;
    }
    let alive = true;
    const loop = async () => {
      while (alive) {
        setApproved(false);
        setShowToast(false);
        await wait(2600);
        if (!alive) break;
        setApproved(true);
        await wait(500);
        setShowToast(true);
        await wait(2600);
        setShowToast(false);
        await wait(900);
      }
    };
    loop();
    return () => {
      alive = false;
    };
  }, [reduce]);

  return (
    <div className={"relative " + className}>
      {/* App window */}
      <div className="relative overflow-hidden rounded-[20px] border border-gray-200/80 bg-white shadow-[0_40px_120px_-30px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#0f1420]">
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1 text-caption text-gray-400 dark:bg-white/5">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z"/></svg>
            app.nexora.io/dashboard
          </div>
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden w-[168px] shrink-0 flex-col gap-1 border-r border-gray-100 p-3 dark:border-white/[0.06] sm:flex">
            <div className="mb-3 flex items-center gap-2 px-1">
              <AppLogo size={22} />
              <span className="text-card-title text-gray-900 dark:text-white">Nexora</span>
            </div>
            {[
              { l: "Dashboard", a: true },
              { l: "Employees" },
              { l: "Leave" },
              { l: "Attendance" },
              { l: "Documents" },
              { l: "Analytics" },
            ].map((n) => (
              <div
                key={n.l}
                className={
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-secondary " +
                  (n.a
                    ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "text-gray-500 dark:text-gray-400")
                }
              >
                <span className={"h-2 w-2 rounded-sm " + (n.a ? "bg-blue-500" : "bg-gray-300 dark:bg-white/20")} />
                {n.l}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-5">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-card-title font-semibold text-gray-900 dark:text-white">Good morning, Aisha</div>
                <div className="text-caption text-gray-400">Here's your team today</div>
              </div>
              <div className="flex -space-x-2">
                {avatars.map((a, i) => (
                  <motion.div
                    key={a.i}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, ease: EASE }}
                    className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${a.c} text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#0f1420]`}
                  >
                    {a.i}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Present", value: 248, tone: "text-emerald-600 dark:text-emerald-400", suffix: "" },
                { label: "On leave", value: 12, tone: "text-amber-600 dark:text-amber-400", suffix: "" },
                { label: "Requests", value: 7, tone: "text-blue-600 dark:text-blue-400", suffix: "" },
              ].map((k, i) => (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.1, ease: EASE }}
                  className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="text-caption text-gray-400">{k.label}</div>
                  <div className={"mt-1 text-2xl font-bold tracking-tight " + k.tone}>
                    <CountUp value={k.value} suffix={k.suffix} />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chart + attendance ring */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-caption font-semibold text-gray-600 dark:text-gray-300">Attendance trend</span>
                  <span className="text-caption text-emerald-500">▲ 4.2%</span>
                </div>
                <div className="flex h-20 items-end gap-2">
                  {bars.map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-indigo-400"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.06, duration: 0.7, ease: EASE }}
                      animate={
                        reduce ? undefined : { opacity: [0.85, 1, 0.85] }
                      }
                    />
                  ))}
                </div>
              </div>
              <div className="grid place-items-center rounded-xl border border-gray-100 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="relative grid place-items-center">
                  <Ring value={94} />
                  <div className="absolute text-center">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      <CountUp value={94} suffix="%" />
                    </div>
                    <div className="text-[9px] text-gray-400">rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave request → approval workflow */}
            <div className="rounded-xl border border-gray-100 bg-white p-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-caption font-semibold text-gray-600 dark:text-gray-300">Pending approval</span>
              </div>
              <motion.div
                layout
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-[10px] font-bold text-white">
                  JD
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-secondary font-medium text-gray-800 dark:text-gray-200">
                    Jordan Diaz · Annual leave
                  </div>
                  <div className="text-caption text-gray-400">Aug 4 - Aug 8 · 5 days</div>
                </div>
                <AnimatePresence mode="wait">
                  {approved ? (
                    <motion.span
                      key="ok"
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ ease: EASE }}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-caption font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                      Approved
                    </motion.span>
                  ) : (
                    <motion.div
                      key="btns"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-1.5"
                    >
                      <span className="rounded-md bg-blue-600 px-2.5 py-1 text-caption font-semibold text-white">Approve</span>
                      <span className="rounded-md border border-gray-200 px-2.5 py-1 text-caption text-gray-500 dark:border-white/10">Deny</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Realtime toast */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 16, x: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ ease: EASE }}
              className="absolute bottom-4 right-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 shadow-xl dark:border-emerald-500/20 dark:bg-[#141b29]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
              </span>
              <div>
                <div className="text-secondary font-semibold text-gray-900 dark:text-white">Leave approved</div>
                <div className="text-caption text-gray-400">Jordan was notified instantly</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default ProductPreview;
