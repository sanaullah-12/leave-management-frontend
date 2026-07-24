import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Blob {
  color: string;
  size: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  x: number;
  y: number;
  dur: number;
}

const BLOBS: Blob[] = [
  {
    color: "bg-blue-400/30 dark:bg-blue-500/20",
    size: 340,
    top: "-30%",
    left: "2%",
    x: 40,
    y: 28,
    dur: 15,
  },
  {
    color: "bg-emerald-400/25 dark:bg-emerald-500/15",
    size: 300,
    top: "-10%",
    right: "4%",
    x: -34,
    y: 40,
    dur: 19,
  },
  {
    color: "bg-indigo-400/20 dark:bg-indigo-500/15",
    size: 280,
    bottom: "-45%",
    left: "34%",
    x: 26,
    y: -30,
    dur: 17,
  },
];

/**
 * Soft animated mesh gradient made of slowly-drifting blurred blobs.
 * Performance-friendly (only transforms animate) and reduced-motion aware.
 */
const MeshBackground: React.FC<{ className?: string }> = ({ className = "" }) => {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${b.color}`}
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            bottom: b.bottom,
            left: b.left,
            right: b.right,
          }}
          animate={reduce ? undefined : { x: [0, b.x, 0], y: [0, b.y, 0] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

export default MeshBackground;
