import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ReceiptPercentIcon,
  CheckIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import Select from "../../components/ui/Select";
import { staggerContainer, staggerItem } from "../../lib/motion";
import { CARD } from "../../lib/surfaces";
import { showSuccessToast } from "../../utils/toastHelpers";
import { usePayroll } from "../../components/payroll/PayrollProvider";
import {
  PayrollPageHeader,
  PayrollSection,
} from "../../components/payroll/PayrollUI";
import { CURRENCIES } from "../../components/payroll/constants";
import {
  formatDate,
  formatMoney,
  formatPeriod,
  ordinal,
  payDateFor,
} from "../../components/payroll/formatters";
import type { PayrollSettings } from "../../components/payroll/types";

import Input from "../../components/ui/Input";
/** Salary can be paid on any day of the month; 31 clamps to the month's end. */
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `${ordinal(i + 1)} of the month`,
}));

/**
 * Payroll Settings - intentionally minimal for V1.
 *
 * Four values, all of which the engine already reads through `PayrollContext`.
 * Anything more (tax slabs, pay cycles, per-company overrides) is a new field
 * here plus a resolver in the engine - no structural change.
 */
const PayrollSettingsPage: React.FC = () => {
  const { t } = useTranslation("payroll");
  const { state, updateSettings, period, totals } = usePayroll();
  const { settings } = state;

  // Local draft so typing never re-runs the engine for every keystroke; the
  // engine only sees the values once they're applied.
  const [draft, setDraft] = useState<PayrollSettings>(settings);

  /**
   * Follow the employer name the module resolved from the signed-in account.
   *
   * The draft is seeded once at mount, and the company is adopted by the
   * provider - so without this the field sits blank next to a payslip already
   * stamped with the company, and the form reads as unsaved when nothing was
   * edited. Only this one field is re-seeded, so nothing being typed is lost.
   */
  useEffect(() => {
    setDraft((d) =>
      d.companyName === settings.companyName
        ? d
        : { ...d, companyName: settings.companyName }
    );
  }, [settings.companyName]);

  const dirty = useMemo(
    () =>
      (Object.keys(draft) as (keyof PayrollSettings)[]).some(
        (k) => draft[k] !== settings[k]
      ),
    [draft, settings]
  );

  const patch = <K extends keyof PayrollSettings>(
    key: K,
    value: PayrollSettings[K]
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const handleSave = () => {
    updateSettings({
      ...draft,
      companyName: draft.companyName.trim() || settings.companyName,
      salaryDate: Math.min(31, Math.max(1, Math.round(draft.salaryDate) || 1)),
      defaultTaxPercent: Math.min(
        100,
        Math.max(0, Number(draft.defaultTaxPercent) || 0)
      ),
    });
    showSuccessToast("Payroll settings saved");
  };

  const handleReset = () => setDraft(settings);

  /* ---------------- effect preview ---------------- */

  // A concrete illustration of what the settings do, using this month's real
  // payroll total - far clearer than describing the fields in prose.
  const preview = useMemo(() => {
    const taxOnTotal = (totals.totalGross * (draft.defaultTaxPercent || 0)) / 100;
    return {
      payDate: payDateFor(period, draft.salaryDate || 1),
      gross: totals.totalGross,
      tax: taxOnTotal,
    };
  }, [totals.totalGross, draft.defaultTaxPercent, draft.salaryDate, period]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <PayrollPageHeader
          icon={Cog6ToothIcon}
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
          actions={
            <>
              {dirty && (
                <button onClick={handleReset} className="sh-action">
                  Discard
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!dirty}
                className="sh-action-primary"
              >
                <CheckIcon className="h-5 w-5" />
                Save Changes
              </button>
            </>
          }
        />
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <PayrollSection
            title="Company & Currency"
            description="Shown on every payslip and used to format all amounts."
            bodyClassName="grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            <Field
              label={t("fields.companyName")}
              hint="Appears in the payslip header and footer."
              icon={<BuildingOffice2Icon className="h-4 w-4" />}
            >
              <Input
                value={draft.companyName}
                onChange={(e) => patch("companyName", e.target.value)}
                placeholder="Your company"
              />
            </Field>

            <Field
              label={t("fields.currency")}
              hint="Applied across salaries, runs and payslips."
              icon={<CurrencyDollarIcon className="h-4 w-4" />}
            >
              <Select
                value={draft.currency}
                onChange={(v) => patch("currency", v)}
                options={CURRENCIES.map((c) => ({
                  value: c.code,
                  label: `${c.code} - ${c.label}`,
                }))}
              />
            </Field>

            <Field
              label={t("fields.salaryDate")}
              hint="Clamped automatically for shorter months."
              icon={<CalendarDaysIcon className="h-4 w-4" />}
            >
              <Select
                value={String(draft.salaryDate)}
                onChange={(v) => patch("salaryDate", Number(v))}
                options={DAY_OPTIONS}
              />
            </Field>

            <Field
              label={t("fields.defaultTax")}
              hint="Percentage of taxable earnings. Set 0 to disable."
              icon={<ReceiptPercentIcon className="h-4 w-4" />}
            >
              <Input
                inputMode="decimal"
                value={
                  draft.defaultTaxPercent === 0
                    ? ""
                    : String(draft.defaultTaxPercent)
                }
                onChange={(e) =>
                  patch(
                    "defaultTaxPercent",
                    Math.min(100, Math.max(0, Number(e.target.value) || 0))
                  )
                }
                placeholder="0"
                inputClassName="text-right tabular-nums"
                trailing={<span className="text-sm text-gray-400">%</span>}
              />
            </Field>
          </PayrollSection>
        </div>

        {/* ---- Live effect ---- */}
        <div className={`${CARD} p-5`}>
          <h3 className="text-card-title text-gray-900 dark:text-white">
            What This Means
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Applied to {formatPeriod(period)}.
          </p>
          <dl className="mt-4 space-y-3.5">
            <Row
              label="Payslips issued as"
              value={draft.companyName || "-"}
            />
            <Row
              label="Next pay date"
              value={formatDate(preview.payDate)}
            />
            <Row
              label="Current payroll gross"
              value={formatMoney(preview.gross, draft.currency)}
            />
            <Row
              label="Estimated tax"
              value={
                draft.defaultTaxPercent > 0
                  ? formatMoney(preview.tax, draft.currency)
                  : "Disabled"
              }
            />
          </dl>
          <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            Tax applies only to earnings marked taxable on each salary
            structure. Basic salary is always taxable.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Field primitives                                                    */
/* ------------------------------------------------------------------ */

const Field: React.FC<{
  label: string;
  hint: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, hint, icon, children }) => (
  <div>
    <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      <span className="text-gray-400">{icon}</span>
      {label}
    </label>
    {children}
    <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
    <dd className="truncate text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
      {value}
    </dd>
  </div>
);

export default PayrollSettingsPage;
