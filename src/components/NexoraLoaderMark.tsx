import React, { useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import body from "../assets/nexora-mark-body.png";

/**
 * Nexora orbital mark - the official animated logo.
 *
 * The full Nexora monogram is preserved: the flowing wave "body" stays fixed,
 * while its two nodes (blue + green) gracefully detach, exchange positions
 * along a smooth circular orbit, and reattach into the body - a subtle
 * mid-motion "breath" along the way. One seamless six-second cycle, forever.
 * At rest (and under reduced motion) the nodes sit in their sockets, showing
 * the complete brand mark. Calm, precise, enterprise-grade.
 */

// Logo native geometry (matches nexora-mark-body.png, 198×198).
const VB = 198;
const CX = 98; // orbit centre = midpoint of the two nodes
const CY = 99.5;
const RD = 27; // node radius (fills the socket)
const Vx = 45 - CX; // blue node base offset  (-53)
const Vy = 142 - CY; // (42.5)  → green node is the exact opposite

const SWAP = 2.6; // seconds per exchange
const PAUSE = 0.4; // settle pause once swapped
const TOTAL = 2 * (SWAP + PAUSE); // one seamless cycle (6.0s)
const K = 20; // arc sampling resolution per swap

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const rot = (x: number, y: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
};

/** Pre-bake the orbit + scale keyframes once (identical every mount). */
const KEYS = (() => {
  const times: number[] = [];
  const theta: number[] = [];
  const scale: number[] = [];
  const add = (tSec: number, th: number, sc: number) => {
    times.push(+(tSec / TOTAL).toFixed(5));
    theta.push(th);
    scale.push(sc);
  };
  for (let k = 0; k <= K; k++) {
    const p = k / K;
    add(p * SWAP, 180 * easeInOut(p), 1 + 0.07 * Math.sin(Math.PI * p));
  }
  add(SWAP + PAUSE, 180, 1);
  for (let k = 1; k <= K; k++) {
    const p = k / K;
    add(SWAP + PAUSE + p * SWAP, 180 + 180 * easeInOut(p), 1 + 0.07 * Math.sin(Math.PI * p));
  }
  add(TOTAL, 360, 1);

  const blueCx: number[] = [];
  const blueCy: number[] = [];
  const greenCx: number[] = [];
  const greenCy: number[] = [];
  const r: number[] = [];
  theta.forEach((th, i) => {
    const [bx, by] = rot(Vx, Vy, th);
    const [gx, gy] = rot(-Vx, -Vy, th);
    blueCx.push(+(CX + bx).toFixed(2));
    blueCy.push(+(CY + by).toFixed(2));
    greenCx.push(+(CX + gx).toFixed(2));
    greenCy.push(+(CY + gy).toFixed(2));
    r.push(+(RD * scale[i]).toFixed(2));
  });
  return { times, blueCx, blueCy, greenCx, greenCy, r };
})();

interface Props {
  /** Rendered pixel size (square). Default 96. */
  size?: number;
  className?: string;
}

const NexoraLoaderMark: React.FC<Props> = ({ size = 96, className = "" }) => {
  const reduce = useReducedMotion();
  const uid = "nx" + useId().replace(/:/g, "");
  const idBlue = `${uid}b`;
  const idGreen = `${uid}g`;
  const idGlow = `${uid}f`;

  const transition = useMemo(
    () => ({
      duration: TOTAL,
      times: KEYS.times,
      ease: "linear" as const, // easing is pre-baked into the sampled arc
      repeat: Infinity,
      repeatType: "loop" as const,
    }),
    []
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="-9 -9 216 216"
      fill="none"
      className={className}
      role="img"
      aria-label="Nexora"
    >
      <defs>
        <linearGradient id={idBlue} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6E86FF" />
          <stop offset="100%" stopColor="#3E5BF6" />
        </linearGradient>
        <linearGradient id={idGreen} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2FC98D" />
          <stop offset="100%" stopColor="#08AF6C" />
        </linearGradient>
        <filter id={idGlow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Static wave body - the "main" of the mark, always present */}
      <image href={body} x="0" y="0" width={VB} height={VB} />

      {/* Two orbiting nodes */}
      <g filter={`url(#${idGlow})`}>
        {reduce ? (
          <>
            <circle cx={CX + Vx} cy={CY + Vy} r={RD} fill={`url(#${idBlue})`} />
            <circle cx={CX - Vx} cy={CY - Vy} r={RD} fill={`url(#${idGreen})`} />
          </>
        ) : (
          <>
            <motion.circle
              fill={`url(#${idBlue})`}
              initial={{ cx: KEYS.blueCx[0], cy: KEYS.blueCy[0], r: KEYS.r[0] }}
              animate={{ cx: KEYS.blueCx, cy: KEYS.blueCy, r: KEYS.r }}
              transition={transition}
            />
            <motion.circle
              fill={`url(#${idGreen})`}
              initial={{ cx: KEYS.greenCx[0], cy: KEYS.greenCy[0], r: KEYS.r[0] }}
              animate={{ cx: KEYS.greenCx, cy: KEYS.greenCy, r: KEYS.r }}
              transition={transition}
            />
          </>
        )}
      </g>
    </svg>
  );
};

export default NexoraLoaderMark;
