import type { ComponentType, SVGProps } from "react";
import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ArrowRightCircleIcon,
  ArrowLeftOnRectangleIcon,
  BanknotesIcon,
  BellAlertIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PhoneIcon,
  PhotoIcon,
  GlobeAltIcon,
  HashtagIcon,
  SparklesIcon,
  TrophyIcon,
  UserCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Template and placeholder icons are referenced BY NAME, not by component.
 *
 * Templates are persisted to localStorage, so whatever sits in `icon` has to
 * survive JSON.stringify. Storing a key and resolving it here keeps the data
 * serialisable while still rendering a real icon.
 */
const ICONS: Record<string, IconComponent> = {
  // Template icons
  offer: PaperAirplaneIcon,
  contract: PencilSquareIcon,
  internship: AcademicCapIcon,
  promotion: ArrowTrendingUpIcon,
  salary: BanknotesIcon,
  appraisal: ChartBarIcon,
  warning: ExclamationTriangleIcon,
  termination: NoSymbolIcon,
  policy: DocumentTextIcon,
  approval: CheckBadgeIcon,
  agreement: HandRaisedIcon,
  visa: IdentificationIcon,
  award: TrophyIcon,
  verification: MagnifyingGlassIcon,
  transfer: ArrowRightCircleIcon,
  relieving: ArrowLeftOnRectangleIcon,
  notice: BellAlertIcon,
  blank: SparklesIcon,

  // Placeholder icons
  employee: UserIcon,
  employeeId: IdentificationIcon,
  department: BuildingOffice2Icon,
  designation: BriefcaseIcon,
  joiningDate: CalendarDaysIcon,
  money: CurrencyDollarIcon,
  manager: UserCircleIcon,
  email: EnvelopeIcon,
  phone: PhoneIcon,
  company: BuildingLibraryIcon,
  address: MapPinIcon,
  website: GlobeAltIcon,
  signature: PencilSquareIcon,
  reference: HashtagIcon,
  issueDate: CalendarDaysIcon,
  currentDate: ClockIcon,

  // Letterhead slots
  image: PhotoIcon,
};

/** Unknown names (e.g. a template saved before this registry) fall back. */
export const studioIcon = (name: string): IconComponent =>
  ICONS[name] ?? DocumentTextIcon;
