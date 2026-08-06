/**
 * Nexora Assistant - icon resolution.
 *
 * The knowledge base is plain data and must stay free of React imports, so it
 * names an intent (`"create"`, `"money"`, ...) and this module maps it to a
 * glyph. Adding an icon name means adding a line here - knowledge files never
 * change shape.
 */
import React from "react";
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import type { ActionIcon } from "./types";

/** Heroicons are plain SVG components - typed loosely so callers may style. */
type Glyph = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export const ACTION_ICONS: Record<ActionIcon, Glyph> = {
  navigate: ArrowRightIcon,
  create: PlusIcon,
  search: MagnifyingGlassIcon,
  settings: Cog6ToothIcon,
  calendar: CalendarDaysIcon,
  money: BanknotesIcon,
  document: DocumentTextIcon,
  chart: ChartBarIcon,
  megaphone: MegaphoneIcon,
  question: QuestionMarkCircleIcon,
};

/** Glyph for an action, defaulting to a forward arrow. */
export const iconFor = (name?: ActionIcon): Glyph =>
  (name && ACTION_ICONS[name]) || ArrowRightIcon;

export { ArrowTopRightOnSquareIcon as ExternalIcon };
