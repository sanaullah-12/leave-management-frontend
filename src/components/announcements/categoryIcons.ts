import type { ComponentType, SVGProps } from "react";
import {
  BookmarkIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  GiftIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Icon per announcement category. Lives here rather than in either page so the
 * dashboard highlight and the announcements list can't drift apart when a
 * category is added.54545
 */
const CATEGORY_ICONS: Record<string, IconComponent> = {
  general: BookmarkIcon,
  event: CalendarDaysIcon,
  policy: ClipboardDocumentListIcon,
  celebration: GiftIcon,
  update: SparklesIcon,
  urgent: ExclamationTriangleIcon,
};

/** Falls back to the generic megaphone for categories added server-side. */
export const categoryIcon = (category: string): IconComponent =>
  CATEGORY_ICONS[category] ?? MegaphoneIcon;
