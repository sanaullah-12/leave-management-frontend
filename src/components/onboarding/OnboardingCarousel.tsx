import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { XMarkIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/24/solid";
import { EASE, MORPH_REVEAL_DELAY, MORPH_REVEAL_STAGGER, morphRevealSpring, morphSpring } from "../../lib/motion";
import { SCENES } from "./scenes";
import CharacterBlob from "./CharacterBlob";

/**
 * The animated introduction, built to the reference's composition.
 *
 * The character sits on a horizontal track rather than being swapped out, so
 * the neighbouring scenes stay visible at both edges - blurred and dimmed, but
 * present. That peek is what tells you there is more here and that it is one
 * continuous thing, and it is the single detail that separates this from a
 * stack of cross-fading slides.
 *
 * The track slides on the app's morph spring. The words do not travel with it:
 * they cross-fade and rise, staggered, arriving once the character has landed.
 * Text sliding alongside a moving character reads as busy at this size, and
 * the reference does the same thing.
 */

/**
 * Distance between character centres, in px.
 *
 * Set against the 210px character and a phone's 390px width so roughly 40px of
 * each neighbour clears the screen edge. Widen it and the neighbours vanish,
 * which loses the peek; narrow it and they crowd the one you are reading.
 */
const TRACK_STEP = 260;

/** Past this much horizontal travel, a swipe commits to the next scene. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 320;

export interface OnboardingCarouselProps {
  /** Both the skip control and the final call to action land here. */
  onFinish: () => void;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  onFinish,
}) => {
  const [index, setIndex] = React.useState(0);
  const reduce = useReducedMotion();
  const scene = SCENES[index];
  const isLast = index === SCENES.length - 1;

  const go = React.useCallback((next: number) => {
    setIndex(Math.min(Math.max(next, 0), SCENES.length - 1));
  }, []);

  const advance = () => (isLast ? onFinish() : go(index + 1));

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "Escape") onFinish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, onFinish]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-white dark:bg-gray-950">
      {/* The wash. Keyed to the scene and cross-faded underneath everything,
          so the whole screen changes temperature as the character does. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={scene.id}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[62%]"
          style={{
            background: `linear-gradient(to bottom, ${scene.palette.base}38, ${scene.palette.base}12 46%, transparent 100%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE.out }}
        />
      </AnimatePresence>

      <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col px-5">
        {/* Top bar, as the reference: dismiss on the left, the confirm circle
            on the right. The circle fills in on the last scene, which is the
            reference's own trick for showing that the control now commits. */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ paddingTop: "max(0.75rem, var(--safe-top))" }}
        >
          <button
            type="button"
            onClick={onFinish}
            aria-label="Skip the introduction"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-gray-700 backdrop-blur-xl transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] dark:bg-white/10 dark:text-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <p className="text-[15px] font-bold text-gray-900 dark:text-white">
            Nexora
          </p>

          <button
            type="button"
            onClick={advance}
            aria-label={isLast ? "Finish the introduction" : "Next"}
            className={`grid h-10 w-10 place-items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              isLast
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-white/60 text-gray-500 backdrop-blur-xl dark:bg-white/10 dark:text-gray-300"
            }`}
          >
            {isLast ? (
              <CheckIcon className="h-5 w-5" />
            ) : (
              <ArrowRightIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Character and words ride together in the space the header and the
            call to action leave behind, so a tall phone spreads the gap above
            and below rather than dumping all of it under the description. */}
        <div className="flex flex-1 flex-col justify-center">

        {/* The stage. Drag anywhere on it, or on the words below. */}
        <motion.div
          className="relative h-[300px] shrink-0 cursor-grab active:cursor-grabbing"
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          onDragEnd={(_, info) => {
            const far = Math.abs(info.offset.x) > SWIPE_DISTANCE;
            const flicked = Math.abs(info.velocity.x) > SWIPE_VELOCITY;
            if (!far && !flicked) return;
            go(index + (info.offset.x < 0 ? 1 : -1));
          }}
        >
          <motion.div
            className="absolute inset-y-0 left-1/2 flex items-center"
            animate={{ x: -(index * TRACK_STEP) - TRACK_STEP / 2 }}
            transition={reduce ? { duration: 0 } : morphSpring}
          >
            {SCENES.map((s, i) => (
              <div
                key={s.id}
                className="grid shrink-0 place-items-center"
                style={{ width: TRACK_STEP }}
              >
                <motion.div
                  animate={{ opacity: i === index ? 1 : 0.55 }}
                  transition={{ duration: 0.4 }}
                >
                  <CharacterBlob
                    palette={s.palette}
                    face={s.face}
                    variant={i === index ? "active" : "peek"}
                  />
                </motion.div>
              </div>
            ))}
          </motion.div>

          {/* The speech bubble overlaps the character's lower edge, which is
              what makes the line read as spoken rather than captioned. */}
          <div className="pointer-events-none absolute inset-x-1 bottom-0">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={scene.id}
                // Narrow enough that the line wraps to two, which is the shape
                // the reference's bubble always takes and the reason it reads
                // as speech rather than a caption bar.
                className="relative mx-auto max-w-[268px] rounded-[22px] bg-white px-5 py-3.5 text-center shadow-[0_10px_30px_-12px_rgba(16,24,40,0.35)] dark:bg-gray-800"
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
                transition={{ ...morphRevealSpring, delay: MORPH_REVEAL_DELAY }}
              >
                <span
                  aria-hidden="true"
                  className="absolute -top-2 left-[22%] h-6 w-6 rotate-45 rounded-[8px] bg-white dark:bg-gray-800"
                />
                <p className="relative text-[15px] font-semibold leading-snug text-gray-900 dark:text-white">
                  {scene.line}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Dots sit between the bubble and the name, as in the reference. */}
        <div className="mt-5 flex justify-center gap-1.5">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to ${s.name}`}
              aria-current={i === index}
              className="grid h-5 w-5 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <motion.span
                className="block rounded-full bg-gray-900 dark:bg-white"
                animate={{
                  width: i === index ? 7 : 5,
                  height: i === index ? 7 : 5,
                  opacity: i === index ? 1 : 0.22,
                }}
                transition={morphSpring}
              />
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={scene.id}
            className="mt-3 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2 }}
          >
            <motion.h1
              className="text-[27px] font-bold tracking-[-0.02em] text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...morphRevealSpring, delay: MORPH_REVEAL_DELAY }}
            >
              {scene.name}
            </motion.h1>

            <motion.div
              className="mt-3 flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                ...morphRevealSpring,
                delay: MORPH_REVEAL_DELAY + MORPH_REVEAL_STAGGER,
              }}
            >
              {scene.traits.map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 shadow-[0_2px_8px_-3px_rgba(16,24,40,0.28)] ring-1 ring-black/[0.04] dark:bg-white/10 dark:text-gray-200 dark:ring-white/10"
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: scene.palette.base }}
                  />
                  {label}
                </span>
              ))}
            </motion.div>

            <motion.p
              className="mx-auto mt-4 max-w-[330px] text-[14px] leading-relaxed text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                ...morphRevealSpring,
                delay: MORPH_REVEAL_DELAY + MORPH_REVEAL_STAGGER * 2,
              }}
            >
              {scene.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        </div>

        <div
          className="flex shrink-0 flex-col items-center gap-3 pb-6 pt-6"
          style={{ paddingBottom: "max(1.5rem, var(--safe-bottom))" }}
        >
          <button
            type="button"
            onClick={advance}
            className="w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white shadow-lg transition-transform active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${scene.palette.base}, ${scene.palette.deep})`,
            }}
          >
            {isLast ? "Get started" : "Next"}
          </button>

          {!isLast && (
            <button
              type="button"
              onClick={onFinish}
              className="text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
