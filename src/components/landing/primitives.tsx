import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type Variants,
} from "framer-motion";

/* ============================================================
   Nexora landing - shared design primitives
   A small, cohesive kit of scroll-reveal, motion and layout
   helpers used across every marketing section. Everything is
   GPU-friendly (transform/opacity/filter only) and degrades
   gracefully under prefers-reduced-motion.
   ============================================================ */

export const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------- Scroll reveal ---------- */

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** stagger delay in seconds */
  delay?: number;
  /** vertical travel distance */
  y?: number;
  /** enable a soft blur-in */
  blur?: boolean;
  as?: keyof typeof motion;
  once?: boolean;
}

/** Fade + rise + optional blur as the element scrolls into view. */
export const Reveal: React.FC<RevealProps> = ({
  children,
  className,
  delay = 0,
  y = 24,
  blur = true,
  once = true,
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, y, filter: blur ? "blur(10px)" : "blur(0px)" }
      }
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
};

/** Container that staggers its <Reveal>-like children. */
export const stagger = (staggerChildren = 0.08): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren } },
});

export const rise: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: EASE },
  },
};

/* ---------- Magnetic button ---------- */

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
}

/** Button/link wrapper that leans toward the cursor and springs back. */
export const Magnetic: React.FC<MagneticProps> = ({
  children,
  className,
  strength = 0.4,
  onClick,
}) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      onClick={onClick}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ---------- Count-up (fires when scrolled into view) ---------- */

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 1600,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

/* ---------- Section heading ---------- */

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}

export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <span
    className={
      "inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-3.5 py-1.5 text-overline text-blue-700 backdrop-blur dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 " +
      className
    }
  >
    <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500" />
    {children}
  </span>
);

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}) => (
  <div
    className={
      (align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl") +
      " " +
      className
    }
  >
    {eyebrow && (
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
    )}
    <Reveal delay={0.06}>
      <h2 className="mt-5 text-[clamp(1.9rem,4vw,3.15rem)] font-bold leading-[1.05] tracking-[-0.025em] text-gray-900 dark:text-white">
        {title}
      </h2>
    </Reveal>
    {description && (
      <Reveal delay={0.12}>
        <p className="mt-5 text-[1.0625rem] leading-relaxed text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </Reveal>
    )}
  </div>
);

/* ---------- Gradient text (Nexora brand sheen) ---------- */

export const GradientText: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <span
    className={"bg-clip-text text-transparent " + className}
    style={{
      backgroundImage:
        "linear-gradient(100deg, #3E5BF6 0%, #6E86FF 35%, #2FC98D 100%)",
    }}
  >
    {children}
  </span>
);

/* ---------- Ambient glow orb ---------- */

export const GlowOrb: React.FC<{
  className?: string;
  color?: string;
  size?: number;
  drift?: boolean;
  delay?: number;
}> = ({
  className = "",
  color = "rgba(62,91,246,0.5)",
  size = 480,
  drift = true,
  delay = 0,
}) => {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className={"pointer-events-none absolute rounded-full " + className}
      style={{ width: size, height: size }}
    >
      <motion.div
        className="h-full w-full rounded-full"
        style={{
          background: `radial-gradient(circle at center, ${color}, transparent 68%)`,
          filter: "blur(40px)",
        }}
        animate={
          reduce || !drift
            ? undefined
            : { scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] }
        }
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay }}
      />
    </div>
  );
};

/* ---------- Grid / dot backdrop ---------- */

export const GridBackdrop: React.FC<{ className?: string; fade?: boolean }> = ({
  className = "",
  fade = true,
}) => (
  <div
    aria-hidden
    className={"pointer-events-none absolute inset-0 " + className}
    style={{
      backgroundImage:
        "linear-gradient(to right, rgba(100,116,139,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.09) 1px, transparent 1px)",
      backgroundSize: "56px 56px",
      maskImage: fade
        ? "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)"
        : undefined,
      WebkitMaskImage: fade
        ? "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)"
        : undefined,
    }}
  />
);

/* ---------- Infinite marquee ---------- */

export const Marquee: React.FC<{
  children: React.ReactNode;
  speed?: number;
  className?: string;
}> = ({ children, speed = 34, className = "" }) => {
  const reduce = useReducedMotion();
  return (
    <div className={"group relative flex overflow-hidden " + className}>
      <motion.div
        className="flex shrink-0 items-center gap-14 pr-14"
        animate={reduce ? undefined : { x: ["0%", "-100%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {children}
      </motion.div>
      <motion.div
        aria-hidden
        className="flex shrink-0 items-center gap-14 pr-14"
        animate={reduce ? undefined : { x: ["0%", "-100%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {children}
      </motion.div>
    </div>
  );
};

/* ---------- Tilt / spotlight card ---------- */

export const GlowCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50, active: false });
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      active: true,
    });
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setPos((p) => ({ ...p, active: false }))}
      className={
        "group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_24px_60px_-24px_rgba(37,99,235,0.35)] dark:border-white/10 dark:bg-white/[0.03] " +
        className
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(420px circle at ${pos.x}% ${pos.y}%, rgba(62,91,246,0.14), transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
};
