import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CARD } from "../../lib/surfaces";
import { AccentEdge } from "../ui/CardAccents";
import { useThemeAccent } from "../../hooks/useThemeAccent";

/**
 * Device connection and the arrival rule, in one panel.
 *
 * Both are configured once and then left alone, so they live behind a toggle
 * rather than on the dashboard. The arrival rule is here rather than beside the
 * figures on purpose: changing it re-judges every record on the page, which is
 * a decision, not a filter.
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
  onClose: () => void;

  ip: string;
  onIpChange: (ip: string) => void;
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  statusText?: string;

  settings: LateTimeForm;
  onSettingsChange: (next: LateTimeForm) => void;
  onSaveSettings: () => void;
  canEditSettings: boolean;
  formatCutoff: (hhmm?: string) => string;
}

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
    <section className={`relative overflow-hidden ${CARD} p-5`}>
      <AccentEdge color={accent} />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Device and settings
          </p>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            {statusText || (connected ? `Connected to ${ip}` : "Not connected")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Connection */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Connection
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={ip}
              onChange={(e) => onIpChange(e.target.value)}
              aria-label="Device IP address"
              placeholder="192.168.1.201"
              className="w-44 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            {connected ? (
              <button
                type="button"
                onClick={onDisconnect}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnect}
                disabled={connecting}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {connecting ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>

        {/* Arrival rule */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Arrival time that decides late
          </p>

          <div className="space-y-2.5">
            {(
              [
                { key: "flexible", label: "Flexible arrival", field: "flexibleCutoff", fallback: "09:15" },
                { key: "strict", label: "Strict deadline", field: "strictCutoff", fallback: "09:30" },
                { key: "custom", label: "Another time", field: "cutoffTime", fallback: "09:00" },
              ] as const
            ).map((option) => (
              <div key={option.key} className="flex items-center gap-3">
                <input
                  type="radio"
                  id={`policy-${option.key}`}
                  name="lateTimePolicy"
                  checked={policy === option.key}
                  disabled={!canEditSettings}
                  onChange={() =>
                    update({
                      policy: option.key,
                      useCustomCutoff: option.key === "custom",
                    })
                  }
                  className="text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`policy-${option.key}`}
                  className="flex-1 text-sm text-gray-700 dark:text-gray-200"
                >
                  {option.label}
                </label>
                <input
                  type="time"
                  value={(settings as any)[option.field] || option.fallback}
                  disabled={!canEditSettings || policy !== option.key}
                  onChange={(e) => update({ [option.field]: e.target.value } as any)}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-900 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              In force:{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCutoff(
                  settings.effectiveCutoffTime || settings.cutoffTime
                )}
              </span>
            </span>
            {canEditSettings && (
              <button
                type="button"
                onClick={onSaveSettings}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Save rule
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeviceSettingsPanel;
