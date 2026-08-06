import type { ReactElement } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
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

export const TOAST_ICON = {
  success: <CheckCircleIcon className={`${ICON_CLASS} text-emerald-500`} />,
  error: <XCircleIcon className={`${ICON_CLASS} text-red-500`} />,
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
