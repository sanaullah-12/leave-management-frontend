/**
 * Payroll - salary structure editor.
 *
 * Edits one employee's compensation: basic pay plus an arbitrary list of
 * earning/deduction components. The form holds only *definitions*; every figure
 * shown in the live summary comes from {@link computePayslip}, so what the admin
 * previews here is literally what the payroll run and the payslip will produce.
 *
 * Because components are data, supporting a brand-new pay element later means
 * adding a blueprint - this file already renders, validates and totals it.
 */
import React, { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  TrashIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeSlashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Avatar from "../Avatar";
import { computePayslip, validateStructure } from "./engine";
import { createComponent } from "./payrollService";
import {
  COMPONENT_BLUEPRINTS,
  COMPUTE_MODE_LABEL,
  SALARY_STATUS,
} from "./constants";
import { formatMoney, parseAmount } from "./formatters";
import type {
  ComponentKind,
  ComputeMode,
  PayrollPeriod,
  PayrollSettings,
  SalaryComponent,
  SalaryRow,
  SalaryStatus,
} from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  row: SalaryRow | null;
  settings: PayrollSettings;
  period: PayrollPeriod;
  onSave: (
    employeeId: string,
    patch: {
      basicSalary: number;
      components: SalaryComponent[];
      status: SalaryStatus;
    }
  ) => void;
}

const MODE_OPTIONS: { value: ComputeMode; label: string }[] = (
  Object.keys(COMPUTE_MODE_LABEL) as ComputeMode[]
).map((m) => ({ value: m, label: COMPUTE_MODE_LABEL[m] }));

const KIND_META: Record<
  ComponentKind,
  { label: string; icon: React.ReactNode; tint: string }
> = {
  earning: {
    label: "Earnings",
    icon: <ArrowTrendingUpIcon className="h-4 w-4" />,
    tint: "text-emerald-600 dark:text-emerald-400",
  },
  deduction: {
    label: "Deductions",
    icon: <ArrowTrendingDownIcon className="h-4 w-4" />,
    tint: "text-rose-600 dark:text-rose-400",
  },
};

const SalaryStructureModal: React.FC<Props> = ({
  open,
  onClose,
  row,
  settings,
  period,
  onSave,
}) => {
  const { t } = useTranslation("common");
  const [basic, setBasic] = useState("");
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [status, setStatus] = useState<SalaryStatus>("active");
  const [showIssues, setShowIssues] = useState(false);
  // Remount key: reset the form whenever a different employee is opened.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Hydrate from the row on open. Done during render (not an effect) so the
  // modal never flashes the previous employee's numbers.
  const key = open && row ? `${row.employee.id}:${row.structure?.revision ?? 0}` : null;
  if (key && key !== loadedFor) {
    setLoadedFor(key);
    setBasic(row!.structure ? String(row!.structure.basicSalary || "") : "");
    setComponents(
      row!.structure ? row!.structure.components.map((c) => ({ ...c })) : []
    );
    setStatus(row!.structure?.status ?? "active");
    setShowIssues(false);
  }
  if (!open && loadedFor !== null) setLoadedFor(null);

  const basicValue = useMemo(() => parseAmount(basic), [basic]);

  /* ---------------- component mutators ---------------- */

  const patchComponent = useCallback(
    (id: string, patch: Partial<SalaryComponent>) =>
      setComponents((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    []
  );

  const removeComponent = useCallback(
    (id: string) => setComponents((cs) => cs.filter((c) => c.id !== id)),
    []
  );

  const addBlueprint = useCallback((code: string) => {
    const bp = COMPONENT_BLUEPRINTS.find((b) => b.code === code);
    if (!bp) return;
    setComponents((cs) => [...cs, createComponent(bp, { order: cs.length })]);
  }, []);

  const addCustom = useCallback((kind: ComponentKind) => {
    setComponents((cs) => [
      ...cs,
      createComponent(
        {
          code: "",
          name: "",
          kind,
          mode: "fixed",
          value: 0,
          taxable: kind === "earning",
        },
        { order: cs.length }
      ),
    ]);
  }, []);

  /* ---------------- live preview ---------------- */

  // The preview runs the real engine over a throwaway structure, so the summary
  // can never drift from what payroll will actually pay.
  const preview = useMemo(() => {
    const draft = {
      id: "preview",
      employeeId: row?.employee.id ?? "",
      basicSalary: basicValue,
      components,
      effectiveFrom: new Date().toISOString(),
      status,
      revision: 0,
      createdAt: "",
      updatedAt: "",
    };
    return computePayslip(draft, { settings, period, employeeId: row?.employee.id });
  }, [basicValue, components, status, settings, period, row?.employee.id]);

  const issues = useMemo(
    () => validateStructure(basicValue, components),
    [basicValue, components]
  );

  const availableBlueprints = useMemo(() => {
    const used = new Set(components.map((c) => c.code.toUpperCase()));
    return COMPONENT_BLUEPRINTS.filter((b) => !used.has(b.code));
  }, [components]);

  const handleSave = () => {
    if (!row) return;
    if (issues.length) {
      setShowIssues(true);
      return;
    }
    onSave(row.employee.id, {
      basicSalary: basicValue,
      // Normalise codes on the way out so payslips stay consistent.
      components: components.map((c, i) => ({
        ...c,
        code: c.code.trim().toUpperCase(),
        name: c.name.trim(),
        order: i,
      })),
      status,
    });
    onClose();
  };

  if (!row) return null;
  const { employee } = row;
  const currency = settings.currency;

  const grouped: Record<ComponentKind, SalaryComponent[]> = {
    earning: components.filter((c) => c.kind === "earning"),
    deduction: components.filter((c) => c.kind === "deduction"),
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title="Salary Structure"
      description={`${employee.name} • ${employee.designation}`}
      icon={<BanknotesIcon className="h-5 w-5" />}
      iconClassName="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Net Salary
            </span>
            <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
              {formatMoney(preview.netSalary, currency)}
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary text-sm">
              Save Structure
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ---- Employee + basics ---- */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200/70 p-4 sm:flex-row sm:items-center dark:border-gray-700/50">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar src={employee.profilePicture} name={employee.name} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900 dark:text-white">
                {employee.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {employee.employeeCode} • {employee.department}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-44">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Basic Salary
            </label>
            <input
              inputMode="decimal"
              value={basic}
              onChange={(e) => setBasic(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold tabular-nums outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="w-full sm:w-36">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Status
            </label>
            <Select
              value={status}
              onChange={(v) => setStatus(v as SalaryStatus)}
              options={(["active", "draft", "inactive"] as SalaryStatus[]).map(
                (s) => ({
                  value: s,
                  label: t(`common:${SALARY_STATUS[s].labelKey}`),
                  dotColor: SALARY_STATUS[s].dot,
                })
              )}
            />
          </div>
        </div>

        {/* ---- Validation ---- */}
        <AnimatePresence>
          {showIssues && issues.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2.5 rounded-xl bg-rose-50 p-3 text-sm dark:bg-rose-500/10">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-rose-500" />
                <ul className="space-y-0.5 text-rose-700 dark:text-rose-300">
                  {issues.map((i, idx) => (
                    <li key={`${i.field}-${idx}`}>{i.message}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Component groups ---- */}
        {(["earning", "deduction"] as ComponentKind[]).map((kind) => (
          <div key={kind}>
            <div className="mb-2 flex items-center justify-between">
              <h4
                className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${KIND_META[kind].tint}`}
              >
                {KIND_META[kind].icon}
                {KIND_META[kind].label}
              </h4>
              <button
                onClick={() => addCustom(kind)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add custom
              </button>
            </div>

            {grouped[kind].length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 dark:border-gray-700">
                No {kind === "earning" ? "allowances" : "deductions"} yet.
              </p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {grouped[kind].map((c) => (
                    <ComponentRow
                      key={c.id}
                      component={c}
                      currency={currency}
                      amount={
                        (kind === "earning"
                          ? preview.earnings
                          : preview.deductions
                        ).find((l) => l.code === c.code.toUpperCase())?.amount ?? 0
                      }
                      onPatch={patchComponent}
                      onRemove={removeComponent}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}

        {/* ---- Blueprint shortcuts ---- */}
        {availableBlueprints.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Quick add
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableBlueprints.map((b) => (
                <button
                  key={b.code}
                  onClick={() => addBlueprint(b.code)}
                  title={b.hint}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-black/[0.03] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <PlusIcon className="h-3 w-3" />
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- Live summary ---- */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-4 dark:bg-gray-800/60">
          {[
            { label: "Basic", value: preview.basicSalary },
            { label: "Allowances", value: preview.totalAllowances },
            { label: "Deductions", value: preview.totalDeductions },
            { label: "Net Salary", value: preview.netSalary, strong: true },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {s.label}
              </p>
              <p
                className={`mt-1 tabular-nums ${
                  s.strong
                    ? "text-base font-bold text-gray-900 dark:text-white"
                    : "text-sm font-semibold text-gray-700 dark:text-gray-300"
                }`}
              >
                {formatMoney(s.value, currency)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Component row                                                       */
/* ------------------------------------------------------------------ */

interface RowProps {
  component: SalaryComponent;
  currency: string;
  amount: number;
  onPatch: (id: string, patch: Partial<SalaryComponent>) => void;
  onRemove: (id: string) => void;
}

/**
 * One editable component line. Memoised on its own props so typing in one row
 * never re-renders the other twenty.
 */
const ComponentRow: React.FC<RowProps> = React.memo(
  ({ component: c, currency, amount, onPatch, onRemove }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-gray-200/70 p-2 transition-opacity dark:border-gray-700/50 ${
        c.enabled ? "" : "opacity-50"
      }`}
    >
      <input
        value={c.name}
        onChange={(e) => onPatch(c.id, { name: e.target.value })}
        placeholder="Component name"
        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium outline-none focus:border-gray-200 focus:bg-white dark:text-gray-100 dark:focus:border-gray-700 dark:focus:bg-gray-800"
      />
      <input
        value={c.code}
        onChange={(e) => onPatch(c.id, { code: e.target.value.toUpperCase() })}
        placeholder="CODE"
        maxLength={8}
        className="w-20 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 outline-none focus:border-gray-200 focus:bg-white dark:focus:border-gray-700 dark:focus:bg-gray-800"
      />
      <div className="w-32">
        <Select
          value={c.mode}
          onChange={(v) => onPatch(c.id, { mode: v as ComputeMode })}
          options={MODE_OPTIONS}
        />
      </div>
      <input
        inputMode="decimal"
        value={c.value === 0 ? "" : String(c.value)}
        onChange={(e) => onPatch(c.id, { value: parseAmount(e.target.value) })}
        placeholder="0"
        className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
      <span className="w-28 text-right text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300">
        {formatMoney(amount, currency)}
      </span>

      {c.kind === "earning" && (
        <button
          onClick={() => onPatch(c.id, { taxable: !c.taxable })}
          title={c.taxable ? "Taxable" : "Tax exempt"}
          className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            c.taxable
              ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
              : "bg-gray-100 text-gray-400 dark:bg-gray-700/60"
          }`}
        >
          Tax
        </button>
      )}
      <button
        onClick={() => onPatch(c.id, { enabled: !c.enabled })}
        title={c.enabled ? "Disable" : "Enable"}
        className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10"
      >
        {c.enabled ? (
          <EyeIcon className="h-4 w-4" />
        ) : (
          <EyeSlashIcon className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={() => onRemove(c.id)}
        title="Remove"
        className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </motion.div>
  )
);
ComponentRow.displayName = "ComponentRow";

export default SalaryStructureModal;
