/**
 * Payroll - small shared presentational pieces.
 *
 * Status pills, section headers, empty states, loading skeletons and the period
 * picker. Each is presentational and memoised; none of them import the store,
 * so they can be reused anywhere in the module (and unit-tested standalone).
 */
import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  BanknotesIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Select from "../ui/Select";
import SectionHeader from "../ui/SectionHeader";
import { sectionIllustration } from "../ui/illustrations";
import { Skeleton } from "../Skeletons";
import { CARD } from "../../lib/surfaces";
import type { StatusStyle } from "./constants";
import {
  formatPeriod,
  parsePeriodKey,
  periodKey,
  recentPeriods,
} from "./formatters";
import type { PayrollPeriod } from "./types";

import Input from "../ui/Input";
/* ------------------------------------------------------------------ */
/* Status pill                                                         */
/* ------------------------------------------------------------------ */

/**
 * Colour-coded status chip driven by the shared status vocabularies.
 *
 * The label is resolved here rather than baked into the constant: the status
 * objects live at module scope, so a literal string could never react to a
 * language change. `useTranslation` also subscribes this component to language
 * switches, which is what makes every pill in a table update at once.
 */
export const StatusPill: React.FC<{ status: StatusStyle; className?: string }> =
  React.memo(({ status, className = "" }) => {
    const { t } = useTranslation("common");
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className} ${className}`}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: status.dot }}
        />
        {t(status.labelKey)}
      </span>
    );
  });
StatusPill.displayName = "StatusPill";

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

interface PageHeaderProps {
  title: string;
  subtitle: string;
  /** Screen icon, shown in the eyebrow. Defaults to the payroll banknotes mark. */
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  actions?: React.ReactNode;
}

/**
 * The heading every payroll screen opens with.
 *
 * It is the app's `SectionHeader` with the payroll variant already chosen, so
 * all six screens share one banner, one gradient and one animation without
 * each of them having to say so. Payroll has a single animation because it is
 * a single subject: Payslips and Processing are two views of the same thing,
 * and arriving on either should look like arriving in payroll.
 *
 * What separates the screens is the icon in the eyebrow, which is why the
 * `icon` prop survived the move to a banner.
 *
 * Actions belong on the gradient, so they take the `sh-action` classes rather
 * than the app's card-surface `btn-*` pair - see styles/section-header.css.
 */
export const PayrollPageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon = BanknotesIcon,
  actions,
}) => (
  <SectionHeader
    variant="payroll"
    eyebrow={
      <span className="inline-flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        Payroll
      </span>
    }
    title={title}
    description={subtitle}
    illustration={sectionIllustration("payroll")}
    action={actions}
  />
);

/* ------------------------------------------------------------------ */
/* Section card                                                        */
/* ------------------------------------------------------------------ */

interface SectionProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

/** A titled neumorphic card - the container every payroll table sits in. */
export const PayrollSection: React.FC<SectionProps> = ({
  title,
  description,
  actions,
  className = "",
  bodyClassName = "",
  children,
}) => (
  <div className={`${CARD} p-5 ${className}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-card-title text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
    <div className={`mt-4 ${bodyClassName}`}>{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Search input                                                        */
/* ------------------------------------------------------------------ */

/**
 * The default height, not the compact one: every toolbar this sits in puts a
 * Select beside it, and those are the field family's h-10. It used to be `sm`
 * to match a Select that sized itself from its padding, which only ever lined
 * up on desktop - the two were 4px apart on a phone.
 */

export const PayrollSearch: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}> = React.memo(({ value, onChange, placeholder = "Search", className = "w-52" }) => (
  <Input
    icon={MagnifyingGlassIcon}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onClear={() => onChange("")}
    clearable
    placeholder={placeholder}
    className={className}
  />
));
PayrollSearch.displayName = "PayrollSearch";

/* ------------------------------------------------------------------ */
/* Period picker                                                       */
/* ------------------------------------------------------------------ */

interface PeriodPickerProps {
  value: PayrollPeriod;
  onChange: (period: PayrollPeriod) => void;
  /** How many past months to offer. */
  months?: number;
  /** Show the ‹ › stepper alongside the dropdown. */
  withStepper?: boolean;
  className?: string;
}

/**
 * Month selector for payroll periods. Built on the shared `Select` so it picks
 * up the app's glassmorphic listbox styling and keyboard behaviour for free.
 */
export const PeriodPicker: React.FC<PeriodPickerProps> = React.memo(
  ({ value, onChange, months = 24, withStepper = true, className = "w-44" }) => {
    const options = React.useMemo(
      () =>
        recentPeriods(months).map((p) => ({
          value: periodKey(p),
          label: formatPeriod(p),
        })),
      [months]
    );

    // Keep a period that predates the window selectable rather than blank.
    const selectedKey = periodKey(value);
    const allOptions = React.useMemo(
      () =>
        options.some((o) => o.value === selectedKey)
          ? options
          : [{ value: selectedKey, label: formatPeriod(value) }, ...options],
      [options, selectedKey, value]
    );

    const step = (delta: number) => {
      const zero = value.year * 12 + (value.month - 1) + delta;
      onChange({ year: Math.floor(zero / 12), month: (zero % 12) + 1 });
    };

    return (
      <div className="flex items-center gap-1.5">
        {withStepper && (
          <button
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="grid h-9 w-9 place-items-center rounded-full text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
        )}
        <div className={className}>
          <Select
            value={selectedKey}
            onChange={(v) => onChange(parsePeriodKey(v))}
            options={allOptions}
          />
        </div>
        {withStepper && (
          <button
            onClick={() => step(1)}
            aria-label="Next month"
            className="grid h-9 w-9 place-items-center rounded-full text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
PeriodPicker.displayName = "PeriodPicker";

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

interface EmptyProps {
  headline: string;
  sub: string;
  ctaLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  compact?: boolean;
}

/**
 * Premium empty state - a floating payslip illustration tinted with the active
 * theme accent, so payroll never shows a bare table.
 */
export const PayrollEmptyState: React.FC<EmptyProps> = ({
  headline,
  sub,
  ctaLabel,
  onAction,
  icon,
  compact = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className={`flex flex-col items-center justify-center px-6 text-center ${
      compact ? "py-12" : "py-16"
    }`}
  >
    {compact ? (
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl text-blue-600 dark:text-blue-400">
        {icon ?? <BanknotesIcon className="h-7 w-7 text-gray-400" />}
      </div>
    ) : (
      <div className="relative mb-8 h-40 w-40">
        {/* Soft accent halo */}
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: "var(--accent-soft)" }}
        />
        {/* Back payslip */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-6, -4, -6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="glass-card absolute left-3 top-5 w-24 rounded-xl"
          style={{ height: "7.5rem" }}
        />
        {/* Front payslip with money rows */}
        <motion.div
          animate={{ y: [0, 8, 0], rotate: [6, 4, 6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="glass-card absolute right-2 top-7 flex w-28 flex-col gap-2 rounded-xl p-3"
          style={{ height: "8.5rem" }}
        >
          <div
            className="h-2 w-12 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          {[100, 70, 100, 55].map((w, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-600"
                style={{ width: `${w * 0.55}%` }}
              />
              <div className="ml-auto h-1.5 w-5 rounded-full bg-gray-200 dark:bg-gray-600" />
            </div>
          ))}
          <div
            className="mt-auto h-2 w-full rounded-full opacity-70"
            style={{ background: "var(--accent-soft)" }}
          />
        </motion.div>
        {/* Coin badge */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-1 top-1 grid h-9 w-9 place-items-center rounded-full text-white shadow-lg"
          style={{ background: "var(--accent)" }}
        >
          <BanknotesIcon className="h-5 w-5" />
        </motion.div>
      </div>
    )}

    <h3
      className={
        compact
          ? "text-sm font-semibold text-gray-900 dark:text-gray-100"
          : "text-section-heading text-gray-900 dark:text-white"
      }
    >
      {headline}
    </h3>
    <p
      className={`mt-1 max-w-md text-gray-500 dark:text-gray-400 ${
        compact ? "text-xs" : "mt-2 text-sm"
      }`}
    >
      {sub}
    </p>

    {ctaLabel && onAction && (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onAction}
        className="btn-primary mt-6 inline-flex items-center gap-2"
      >
        {ctaLabel}
      </motion.button>
    )}
  </motion.div>
);

/* ------------------------------------------------------------------ */
/* Skeletons                                                           */
/* ------------------------------------------------------------------ */

/** Loading placeholder for a payroll table, matched to its real row height. */
export const PayrollTableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 6,
  cols = 7,
}) => (
  <div className="space-y-3">
    <div className="flex gap-4 border-b border-gray-200/70 pb-2 dark:border-gray-700/50">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 flex-1 rounded" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center gap-4 py-2">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton
            key={c}
            className={`h-4 flex-1 rounded ${c === 0 ? "max-w-[180px]" : ""}`}
          />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Loading placeholder for the KPI row. Internal metrics mirror the real tile
 * exactly (16px label → 36px value line → 16px caption, 44px icon) so the row
 * doesn't change height when the figures arrive.
 */
export const PayrollStatsSkeleton: React.FC<{ count?: number }> = ({
  count = 5,
}) => (
  <div
    className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
      count >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"
    }`}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${CARD} flex h-full flex-col p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="mt-2 h-9 w-28 rounded" />
          </div>
          <Skeleton className="h-11 w-11 flex-shrink-0 rounded-xl" />
        </div>
        <Skeleton className="mt-3 h-4 w-32 rounded" />
      </div>
    ))}
  </div>
);
