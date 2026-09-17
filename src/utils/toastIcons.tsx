import type { ReactElement } from "react";
import { motion } from "framer-motion";
import SuccessCheck from "../components/ui/motion/SuccessCheck";
import { DUR, EASE } from "../lib/motion";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  LockClosedIcon,
  SparklesIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/solid";

/**
 * Icons for the toast helpers.
 *
 * They live in their own .tsx file so `toastHelpers.ts` can stay a plain .ts
 * module - it is imported from roughly twenty screens, and renaming it churns
 * every one of those import paths.
 */

// 20px lines up with the single-line message text next to it.
const ICON_CLASS = "w-5 h-5";

/**
 * The two outcome marks draw themselves.
 *
 * A toast is the app's main answer to "did that work", and it appears in the
 * corner of the screen rather than where the user was looking. A mark that
 * draws pulls the eye the way a static glyph sliding in does not - and because
 * both marks are the same ones used on buttons and in dialogs, an outcome is
 * recognised before the sentence beside it is read.
 *
 * `SuccessCheck` is the shared component. The cross is drawn here rather than
 * given one of its own: an error mark is two strokes, it appears in exactly
 * this one place, and a component for it would be indirection with nothing in
 * it. The two strokes overlap in time deliberately - drawn strictly one after
 * the other reads as hesitant, which is the wrong note for a failure.
 */
const ErrorMark = () => (
  <span className="relative grid h-5 w-5 place-items-center">
    <span
      aria-hidden="true"
      className="absolute inset-0 rounded-full bg-red-500"
    />
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="relative h-3 w-3"
      fill="none"
    >
      {["M6 6 18 18", "M18 6 6 18"].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: DUR.base,
            ease: EASE.out,
            delay: i * 0.06,
          }}
        />
      ))}
    </svg>
  </span>
);

export const TOAST_ICON = {
  success: <SuccessCheck size={20} />,
  error: <ErrorMark />,
  warning: (
    <ExclamationTriangleIcon className={`${ICON_CLASS} text-amber-500`} />
  ),
  info: <InformationCircleIcon className={`${ICON_CLASS} text-blue-500`} />,
  email: <EnvelopeIcon className={`${ICON_CLASS} text-blue-500`} />,
  network: <GlobeAltIcon className={`${ICON_CLASS} text-red-500`} />,
  celebrate: <SparklesIcon className={`${ICON_CLASS} text-emerald-500`} />,
  announce: <MegaphoneIcon className={`${ICON_CLASS} text-blue-500`} />,
  maintenance: (
    <WrenchScrewdriverIcon className={`${ICON_CLASS} text-indigo-500`} />
  ),
  update: <ArrowPathIcon className={`${ICON_CLASS} text-indigo-500`} />,
  security: <LockClosedIcon className={`${ICON_CLASS} text-indigo-500`} />,
};

export type ToastIconName = keyof typeof TOAST_ICON;

/**
 * Resolve a caller-supplied icon: either a named preset or a ready-made
 * element. react-hot-toast renders elements only, so this is narrower than
 * ReactNode.
 */
export const resolveIcon = (
  icon: ToastIconName | ReactElement | undefined
): ReactElement | undefined =>
  typeof icon === "string" ? TOAST_ICON[icon] : icon;
