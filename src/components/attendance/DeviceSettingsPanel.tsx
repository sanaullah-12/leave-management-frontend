import React from "react";
import { ServerIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CARD } from "../../lib/surfaces";
import { AccentEdge } from "../ui/CardAccents";
import { useThemeAccent } from "../../hooks/useThemeAccent";

import Input from "../ui/Input";
import TimePicker from "../ui/TimePicker";
/**
 * The unit, and the arrival rule the rest of attendance is judged by.
 *
 * Two cards rather than two columns of one: they are answered at different
 * times by different people - the address is set once when the device is
 * installed, the rule is a policy decision that re-judges every record on the
 * page - and a single row of controls made them look like one form with one
 * Save button.
 */

export interface LateTimeForm {
  policy?: "flexible" | "strict" | "custom";
  flexibleCutoff?: string;
  strictCutoff?: string;
  cutoffTime: string;
  effectiveCutoffTime?: string;
  useCustomCutoff: boolean;
}

interface Props {
  open: boolean;
  /** Left out where the panel is the whole point of the screen it is on. */
  onClose?: () => void;

  ip: string;
  onIpChange: (ip: string) => void;
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  statusText?: string;
  /** What else the unit can be told to do - unlock, re-read the roster. */
  actions?: React.ReactNode;

  settings: LateTimeForm;
  onSettingsChange: (next: LateTimeForm) => void;
  onSaveSettings: () => void;
  canEditSettings: boolean;
  formatCutoff: (hhmm?: string) => string;
}

const POLICIES = [
  {
    key: "flexible",
    label: "Flexible arrival",
    caption: "A grace period after the start of the day",
    field: "flexibleCutoff",
    fallback: "09:15",
  },
  {
    key: "strict",
    label: "Strict deadline",
    caption: "One time, applied to everybody",
    field: "strictCutoff",
    fallback: "09:30",
  },
  {
    key: "custom",
    label: "Another time",
    caption: "A cutoff of your own",
    field: "cutoffTime",
    fallback: "09:00",
  },
] as const;

const SECTION_LABEL =
  "text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500";

const DeviceSettingsPanel: React.FC<Props> = ({
  open,
  onClose,
  ip,
  onIpChange,
  connected,
  connecting,
  onConnect,
  onDisconnect,
  statusText,
  actions,
  settings,
  onSettingsChange,
  onSaveSettings,
  canEditSettings,
  formatCutoff,
}) => {
  const accent = useThemeAccent(600);

  if (!open) return null;

  const policy = settings.policy || "flexible";
  const update = (patch: Partial<LateTimeForm>) =>
    onSettingsChange({ ...settings, ...patch });

  return (
    <div className="space-y-6">
      {/* ---------------- The unit ---------------- */}
      <section className={`relative overflow-hidden ${CARD} p-5`}>
        <AccentEdge color={accent} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <ServerIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Attendance device
              </p>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {statusText ||
                  "The unit every punch on this page is read from"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* State first, in the same dot pill every list uses for a
                status, so "is it on" is answered before anything is read. */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                connected
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                  : "bg-gray-100 text-gray-600 ring-gray-200/60 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-500/20"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              {connected ? "Connected" : "Not connected"}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 h-px bg-gray-100 dark:bg-gray-800" />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={SECTION_LABEL}>Address</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input
                inputSize="sm"
                value={ip}
                onChange={(e) => onIpChange(e.target.value)}
                aria-label="Device IP address"
                placeholder="192.168.1.201"
                className="w-44"
              />
              {connected ? (
                <button
                  type="button"
                  onClick={onDisconnect}
                  className="rounded-full border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onConnect}
                  disabled={connecting}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      </section>

      {/* ---------------- The rule ---------------- */}
      <section className={`relative overflow-hidden ${CARD} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Arrival time that decides late
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Changing this re-judges every record on this page
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200/60 dark:bg-gray-700/50 dark:text-gray-200 dark:ring-gray-600/50">
            In force
            <span className="font-semibold tabular-nums">
              {formatCutoff(settings.effectiveCutoffTime || settings.cutoffTime)}
            </span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {POLICIES.map((option) => {
            const on = policy === option.key;
            return (
              <div
                key={option.key}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  on
                    ? "border-blue-200 bg-blue-50/60 dark:border-blue-500/30 dark:bg-blue-500/10"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <input
                  type="radio"
                  id={`policy-${option.key}`}
                  name="lateTimePolicy"
                  checked={on}
                  disabled={!canEditSettings}
                  onChange={() =>
                    update({
                      policy: option.key,
                      useCustomCutoff: option.key === "custom",
                    })
                  }
                  /* A native radio ignores a text colour - its dot is drawn
                     by the browser, which is why it stayed default blue under
                     every theme. accent-color is the one that themes it. */
                  className="h-4 w-4 flex-none accent-[var(--accent)]"
                />
                <label
                  htmlFor={`policy-${option.key}`}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {option.label}
                  </span>
                  <span className="block truncate text-[11px] text-gray-400 dark:text-gray-500">
                    {option.caption}
                  </span>
                </label>
                <TimePicker
                  size="sm"
                  value={(settings as any)[option.field] || option.fallback}
                  disabled={!canEditSettings || !on}
                  onChange={(next) =>
                    update({ [option.field]: next } as any)
                  }
                  aria-label={`${option.label} time`}
                  className="w-[124px] flex-none"
                />
              </div>
            );
          })}
        </div>

        {canEditSettings && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onSaveSettings}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Save rule
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default DeviceSettingsPanel;
