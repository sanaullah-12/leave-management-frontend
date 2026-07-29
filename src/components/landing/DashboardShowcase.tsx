import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import ProductPreview from "./ProductPreview";
import { SectionHeading, GradientText, GlowOrb, Reveal } from "./primitives";

const callouts = [
  { t: "Live team pulse", d: "Presence, leave and requests in one glance" },
  { t: "Instant approvals", d: "Act on requests without leaving the dashboard" },
  { t: "Realtime everywhere", d: "Every number updates the moment things change" },
];

const DashboardShowcase: React.FC = () => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [4, 0, -4]);

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10">
        <GlowOrb className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="rgba(62,91,246,0.16)" size={900} />
      </div>
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Interactive dashboard"
          title={
            <>
              Your whole company, <GradientText>in one view</GradientText>
            </>
          }
          description="A command center that feels alive. Watch the data move as your team clocks in, requests leave and gets approved — all in real time."
        />

        <div ref={ref} className="relative mx-auto mt-16 max-w-4xl">
          {/* glow platform */}
          <div className="pointer-events-none absolute -inset-x-10 -bottom-10 top-10 -z-10 rounded-[40px] bg-gradient-to-b from-blue-500/10 to-emerald-500/10 blur-2xl" />
          <motion.div
            style={reduce ? undefined : { y, rotateZ: rotate, transformPerspective: 1400 }}
          >
            <ProductPreview />
          </motion.div>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-3">
          {callouts.map((c, i) => (
            <Reveal key={c.t} delay={i * 0.08}>
              <div className="rounded-2xl border border-gray-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center gap-2 text-card-title text-gray-900 dark:text-white">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500" />
                  {c.t}
                </div>
                <p className="mt-1.5 text-secondary text-gray-500 dark:text-gray-400">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardShowcase;
