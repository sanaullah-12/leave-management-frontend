/**
 * The motion primitives.
 *
 * Seven components, each answering one question the app kept answering
 * differently: how does a section open, how does a skeleton give way to what
 * it stood in for, how does content below the fold arrive, how is success
 * shown, how does a changed value announce itself, how does a figure move, and
 * what does a non-button control do under a finger.
 *
 * The timings they use all come from `lib/motion.ts`. Nothing here invents a
 * duration or a curve, which is the whole point - a component that needed its
 * own easing would be evidence the scale is missing a step, and the fix would
 * be to add it there rather than here.
 */

export { default as Collapse } from "./Collapse";
export type { CollapseProps } from "./Collapse";

export { default as LoadSwap } from "./LoadSwap";
export type { LoadSwapProps } from "./LoadSwap";

export { default as Pressable } from "./Pressable";
export type { PressableProps } from "./Pressable";

export { default as Reveal, RevealGroup, RevealItem } from "./Reveal";
export type { RevealProps } from "./Reveal";

export { default as RollingNumber } from "./RollingNumber";
export type { RollingNumberProps } from "./RollingNumber";

export { default as SuccessCheck } from "./SuccessCheck";
export type { SuccessCheckProps } from "./SuccessCheck";

export { default as ValueSwap } from "./ValueSwap";
export type { ValueSwapProps } from "./ValueSwap";
