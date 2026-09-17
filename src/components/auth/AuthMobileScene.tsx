import React from "react";
import "./auth-mobile-scene.css";

/**
 * The ambient vignette at the top of the phone login card.
 *
 * Above `lg` the brand panel runs a GSAP ecosystem visualisation. That is far
 * too much machinery for a handset, so this is the phone's own telling of the
 * same idea: a doorway into the workspace, a climb towards it, and the small
 * signs of a workday happening around it - a shift being clocked in, a field
 * being typed into, an approval landing.
 *
 * Every moving part is a looping CSS keyframe declared in
 * `auth-mobile-scene.css`; this file is markup and geometry only. The split is
 * deliberate and matches the desktop hero's: the component says what is on
 * stage, the stylesheet says how it moves and what colour it is. Colour in
 * particular cannot live here - `var()` does not resolve inside an SVG
 * presentation attribute, so a fill written as an attribute would be stuck on
 * one theme.
 *
 * Coordinates are in the 320x128 viewBox below, which scales to whatever width
 * the card gives it. The ground line at y=118 is what the arch, the steps and
 * the frond all stand on; move it and they all have to move with it. The ten
 * units left under the ground are the illustration's own footer - enough for
 * the arch's halo to fade out, not so much that the card reads as half empty.
 *
 * `aria-hidden`: it is decoration, and the card states the product message in
 * real text directly underneath.
 */

/** Ground plane. The whole composition is measured from this line. */
const GROUND = 118;

/** Step treads, left to right, climbing towards the arch. */
const STEPS = [
  { x: 22, y: 104 },
  { x: 52, y: 90 },
  { x: 82, y: 76 },
];

const STEP_W = 30;

/** Spokes of the burst, drawn from a shared centre. */
const BURST_CENTRE = { x: 268, y: 54 };
const BURST_SPOKES = 12;

const AuthMobileScene: React.FC = () => (
  <svg
    className="nxs-scene"
    viewBox="0 0 320 128"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      {/* One period is 160 user units - roughly twice the arch's width - so the
          doorway always frames half a sweep rather than the flat slice a
          full-width gradient would give it. `repeat` tiles that period across
          the oversized rect below, and because the first and last stop are the
          same colour the tiling seam is invisible. */}
      <linearGradient
        id="nxs-arch-flow"
        gradientUnits="userSpaceOnUse"
        x1="0"
        y1="0"
        x2="160"
        y2="56"
        spreadMethod="repeat"
      >
        <stop offset="0%" className="nxs-arch-stop-a" />
        <stop offset="27%" className="nxs-arch-stop-b" />
        <stop offset="50%" className="nxs-arch-stop-c" />
        <stop offset="75%" className="nxs-arch-stop-d" />
        <stop offset="100%" className="nxs-arch-stop-e" />
      </linearGradient>

      {/* Faded to nothing at the rim, so the halo has no visible edge of its
          own - a flat ellipse at any alpha reads as a second shape. */}
      <radialGradient id="nxs-glow">
        <stop offset="0%" className="nxs-glow-stop-in" />
        <stop offset="100%" className="nxs-glow-stop-out" />
      </radialGradient>

      <clipPath id="nxs-arch-clip">
        <path d={`M128,${GROUND} L128,64 A42,42 0 0 1 212,64 L212,${GROUND} Z`} />
      </clipPath>
    </defs>

    {/* --- the doorway ------------------------------------------------ */}
    <g className="nxs-float">
      {/* The same halo the desktop core sits in, flattened. It is what stops
          the arch reading as a slab pasted onto the card. */}
      <ellipse fill="url(#nxs-glow)" cx="170" cy="76" rx="76" ry="62" />
      <g clipPath="url(#nxs-arch-clip)">
        {/* Slid by the `nxs-flow` keyframe. Starts at -160 so the gradient is
            already mid-sweep on the first frame rather than snapping in. */}
        <rect
          className="nxs-flow"
          x="-160"
          y="0"
          width="640"
          height={GROUND}
          fill="url(#nxs-arch-flow)"
        />
      </g>
      <path
        className="nxs-arch-rim"
        d={`M128,${GROUND} L128,64 A42,42 0 0 1 212,64 L212,${GROUND}`}
      />
    </g>

    {/* --- the climb -------------------------------------------------- */}
    {STEPS.map(({ x, y }) => (
      <g key={x}>
        <rect
          className="nxs-step"
          x={x}
          y={y}
          width={STEP_W}
          height={GROUND - y}
          rx="3"
        />
        {/* A lit tread edge, so the steps read as solid rather than as flat
            bars of a chart. */}
        <rect className="nxs-step-edge" x={x} y={y} width={STEP_W} height="2" rx="1" />
      </g>
    ))}

    {/* Sits on the first tread; the keyframe carries it up the other two and
        on through the doorway. */}
    <circle className="nxs-climb nxs-climber" cx={STEPS[0].x + 15} cy={STEPS[0].y - 6} r="5" />

    <line
      className="nxs-ground"
      x1="14"
      y1={GROUND}
      x2="306"
      y2={GROUND}
      strokeLinecap="round"
    />

    {/* --- clocking in ------------------------------------------------ */}
    <g>
      <rect className="nxs-toggle-track" x="22" y="24" width="34" height="18" rx="9" />
      <circle className="nxs-toggle-knob" cx="31" cy="33" r="6.5" />
    </g>

    {/* --- a field being typed into ----------------------------------- */}
    <g>
      <line className="nxs-field-text" x1="23" y1="56" x2="47" y2="56" />
      <rect className="nxs-blink nxs-caret" x="51" y="49" width="2" height="14" rx="1" />
      <line className="nxs-field-line" x1="22" y1="66" x2="82" y2="66" />
    </g>

    {/* --- the burst -------------------------------------------------- */}
    <g className="nxs-spin">
      {Array.from({ length: BURST_SPOKES }, (_, i) => {
        const a = (i / BURST_SPOKES) * Math.PI * 2;
        return (
          <line
            key={i}
            className="nxs-burst"
            x1={BURST_CENTRE.x + Math.cos(a) * 7}
            y1={BURST_CENTRE.y + Math.sin(a) * 7}
            x2={BURST_CENTRE.x + Math.cos(a) * 13}
            y2={BURST_CENTRE.y + Math.sin(a) * 13}
          />
        );
      })}
    </g>
    <circle className="nxs-burst-core" cx={BURST_CENTRE.x} cy={BURST_CENTRE.y} r="5" />

    {/* --- the frond -------------------------------------------------- */}
    {/* Stem plus paired leaflets. Drawn as strokes rather than filled blades
        so it stays legible at the ~1px-per-unit scale a phone renders this at,
        where a filled leaf collapses into a smudge. */}
    <g className="nxs-sway">
      <path className="nxs-frond" d={`M248,${GROUND} C247,104 243,92 240,78`} />
      <path className="nxs-frond" d="M245,104 C239,103 234,100 231,95" />
      <path className="nxs-frond" d="M246,103 C252,101 256,97 258,92" />
      <path className="nxs-frond" d="M243,94 C237,93 233,90 230,86" />
      <path className="nxs-frond" d="M244,93 C250,91 253,88 255,83" />
      <path className="nxs-frond" d="M241,85 C236,84 233,81 231,77" />
      <path className="nxs-frond" d="M242,84 C247,82 250,79 251,75" />
    </g>

    {/* --- an approval landing ---------------------------------------- */}
    <g className="nxs-pop">
      <circle className="nxs-check-ring" cx="232" cy="34" r="11" />
      <path className="nxs-check" d="M227,34 L231,38 L238,30" />
    </g>

    {/* --- sparkles ---------------------------------------------------- */}
    {/* Two, on different offsets so they never twinkle together. */}
    <path
      className="nxs-twinkle nxs-sparkle"
      style={{ animationDelay: "-1.4s" }}
      d="M108,30 L110.4,35.6 L116,38 L110.4,40.4 L108,46 L105.6,40.4 L100,38 L105.6,35.6 Z"
    />
    <path
      className="nxs-twinkle nxs-sparkle"
      style={{ animationDelay: "-2.9s" }}
      d="M290,92 L291.8,96.2 L296,98 L291.8,99.8 L290,104 L288.2,99.8 L284,98 L288.2,96.2 Z"
    />
  </svg>
);

export default React.memo(AuthMobileScene);
