import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FaceKind, ScenePalette } from "./scenes";

/**
 * The onboarding character.
 *
 * A soft gradient body with a face on it - no outline, no hard edge. Three
 * layers stacked, which is what produces the look rather than any one of them:
 *
 *   aura   a much larger, heavily blurred wash of the same hue. This is what
 *          makes the character feel lit rather than pasted on, and it is the
 *          layer that bleeds to the edges of the screen.
 *   body   a radial gradient with the highlight off-centre near the top, so
 *          the form reads as round. Its border-radius is deliberately
 *          asymmetric and animated, which is what keeps it organic instead of
 *          a circle.
 *   face   drawn in SVG rather than CSS, because the expressions are the whole
 *          character and a wedge-shaped eye is a path, not a border-radius.
 *
 * Idle motion is a slow breath plus a drift, on a sine rather than a spring -
 * a spring settles, and a character that settles looks switched off. Blinks
 * fire on their own timer at an uneven interval; a blink exactly every three
 * seconds reads as a loop.
 */

const BREATH_SECONDS = 2.8;
const DRIFT_SECONDS = 4.6;
/** Blink gap, randomised within these bounds so the rhythm never repeats. */
const BLINK_MIN_MS = 3200;
const BLINK_MAX_MS = 6400;

/* ------------------------------------------------------------------ */
/* Faces                                                               */
/* ------------------------------------------------------------------ */

/**
 * All faces are drawn on one 200x200 box with the eyes around y=96, so a
 * character keeps its gaze at the same height as the expression changes.
 */
const Face: React.FC<{ kind: FaceKind }> = ({ kind }) => {
  switch (kind) {
    case "glasses":
      // Solid lenses joined by a bridge - the analyst. The lenses stay well
      // under the eye spacing and the bridge stays thin: widen either and the
      // pair stops reading as spectacles and starts reading as a barbell.
      return (
        <g>
          <circle cx="75" cy="96" r="18" />
          <circle cx="125" cy="96" r="18" />
          <rect x="92" y="92.5" width="16" height="7" rx="3.5" />
        </g>
      );

    case "focused":
      // Wedges angled down toward the nose. The eye itself carries the brow,
      // so the character reads as determined without needing a second shape.
      return (
        <g>
          <path d="M55 86 C70 84 85 94 91 106 C77 110 60 100 55 86 Z" />
          <path d="M145 86 C130 84 115 94 109 106 C123 110 140 100 145 86 Z" />
        </g>
      );

    case "resting":
      // Eyes closed: the one scene that is about not working. The halo is not
      // here - it floats clear of the head, so it is its own layer.
      return (
        <g>
          <ellipse cx="74" cy="96" rx="20" ry="13" transform="rotate(-8 74 96)" />
          <ellipse cx="126" cy="96" rx="20" ry="13" transform="rotate(8 126 96)" />
        </g>
      );

    case "alert":
      // Wide and awake - this is the scene about being told something.
      return (
        <g>
          <circle cx="73" cy="94" r="23" />
          <circle cx="127" cy="94" r="23" />
        </g>
      );

    case "friendly":
    default:
      // The neutral, open face the reference leads with.
      return (
        <g>
          <ellipse cx="74" cy="94" rx="15" ry="22" />
          <ellipse cx="126" cy="94" rx="15" ry="22" />
        </g>
      );
  }
};

/* ------------------------------------------------------------------ */
/* Character                                                           */
/* ------------------------------------------------------------------ */

export const CharacterBlob: React.FC<{
  palette: ScenePalette;
  face: FaceKind;
  /** Centre character or a neighbour peeking in from the edge of the track. */
  variant?: "active" | "peek";
  size?: number;
}> = ({ palette, face, variant = "active", size = 190 }) => {
  const reduce = useReducedMotion();
  const [blinking, setBlinking] = React.useState(false);
  const isPeek = variant === "peek";

  // A closed eye cannot blink, and a neighbour is too blurred to read one.
  const blinks = !isPeek && !reduce && face !== "resting";

  React.useEffect(() => {
    if (!blinks) return;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlinking(true);
        window.setTimeout(() => setBlinking(false), 120);
        schedule();
      }, BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [blinks]);

  const breathing = !reduce && !isPeek;

  return (
    <motion.div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      animate={
        breathing
          ? { y: [0, -7, 0] }
          : undefined
      }
      transition={{
        duration: DRIFT_SECONDS,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Aura. Sits behind everything and is the only layer allowed to bleed. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          width: size * 1.85,
          height: size * 1.85,
          background: `radial-gradient(circle, ${palette.base}66 0%, ${palette.base}22 42%, transparent 70%)`,
          filter: `blur(${isPeek ? 34 : 26}px)`,
        }}
      />

      {/* Body. The animated border-radius is what keeps it from being a ball. */}
      <motion.div
        aria-hidden="true"
        className="absolute"
        style={{
          width: size,
          height: size * 0.96,
          // A small specular spot high on a body that is otherwise saturated -
          // not a broad wash. The stops are tight for a reason: spread the
          // highlight out to the eye line at 48% and white eyes land on
          // near-white and disappear, which is exactly what swallowed the
          // wedge and resting faces the first time round.
          background: `radial-gradient(circle at 42% 15%, #ffffffcc 0%, ${palette.light} 11%, ${palette.base} 31%, ${palette.deep} 100%)`,
          filter: `blur(${isPeek ? 18 : 9}px)`,
        }}
        initial={{ borderRadius: "50% 50% 47% 53% / 55% 56% 44% 45%" }}
        animate={
          breathing
            ? {
                scale: [1, 1.045, 1],
                borderRadius: [
                  "50% 50% 47% 53% / 55% 56% 44% 45%",
                  "53% 47% 52% 48% / 52% 53% 47% 48%",
                  "50% 50% 47% 53% / 55% 56% 44% 45%",
                ],
              }
            : undefined
        }
        transition={{
          duration: BREATH_SECONDS,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* The halo floats above the head rather than being drawn on it, which
          needs room the body-sized face box does not have. Its own layer, and
          it rides the body's breath by sitting inside the same wrapper. */}
      {face === "resting" && (
        <svg
          aria-hidden="true"
          viewBox="0 0 120 40"
          className="absolute text-white"
          style={{
            width: size * 0.5,
            top: -size * 0.06,
            filter: `blur(${isPeek ? 8 : 1}px)`,
            opacity: 0.92,
          }}
        >
          <ellipse
            cx="60"
            cy="20"
            rx="48"
            ry="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
          />
        </svg>
      )}

      {/* Face. Slightly blurred so it belongs to the body rather than sitting
          on top of it, and scaled on Y to blink. */}
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="absolute text-white"
        style={{
          width: size,
          height: size,
          // Just enough to seat the face on the body. Past about 1.5px the
          // thin shapes - a glasses bridge, a halo - dissolve entirely.
          filter: `blur(${isPeek ? 10 : 1.2}px)`,
          fill: "currentColor",
        }}
        animate={{ scaleY: blinking ? 0.12 : 1 }}
        transition={{ duration: 0.09, ease: "easeInOut" }}
      >
        <Face kind={face} />
      </motion.svg>
    </motion.div>
  );
};

export default CharacterBlob;
