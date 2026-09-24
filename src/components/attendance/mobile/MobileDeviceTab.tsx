import React, { useState } from "react";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  ServerIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Input from "../../ui/Input";
import type { LateTimeForm } from "../DeviceSettingsPanel";
import { GroupLabel, PrimaryButton, SHEET, WELL } from "../../mobile/primitives";

/**
 * The device, and the rule the whole page is judged by.
 *
 * Both are set once and then left alone, which is why they are their own
 * screen rather than a strip of controls above the roster. The arrival rule in
 * particular is a decision, not a filter: saving it re-judges every record
 * everyone can see, so it gets a card, a confirm-shaped button and a line
 * underneath stating what is currently in force.
 */

const POLICIES = [
  {
    key: "flexible" as const,
    label: "Flexible arrival",
    field: "flexibleCutoff" as const,
    fallback: "09:15",
  },
  {
    key: "strict" as const,
    label: "Strict deadline",
    field: "strictCutoff" as const,
    fallback: "09:30",
  },
  {
    key: "custom" as const,
    label: "Another time",
    field: "cutoffTime" as const,
    fallback: "09:00",
  },
];

interface Action {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}

interface Props {
  ip: string;
  onIpChange: (next: string) => void;
  connected: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  /** Enrolled on the device, once the roster has been read. */
  employeeCount: number;
  statusText?: string;

  actions: Action[];
  /** Door feedback, shown under the connection card while it is live. */
  door?: {
    unlocking: boolean;
    countdown: number;
    message: { type: "success" | "error"; text: string } | null;
  };

  settings: LateTimeForm;
  onSettingsChange: (next: LateTimeForm) => void;
  onSave: () => void;
  canEdit: boolean;
  formatCutoff: (hhmm?: string) => string;
}

const MobileDeviceTab: React.FC<Props> = ({
  ip,
  onIpChange,
  connected,
  connecting,
  onConnect,
  onDisconnect,
  employeeCount,
  statusText,
  actions,
  door,
  settings,
  onSettingsChange,
  onSave,
  canEdit,
  formatCutoff,
}) => {
  /* The address is a field only while it is being changed. Left as an input it
     reads as something waiting to be filled in, when almost every visit to
     this screen is to confirm a connection rather than to move it. */
  const [editingIp, setEditingIp] = useState(false);

  const policy = settings.policy || "flexible";
  const update = (patch: Partial<LateTimeForm>) =>
    onSettingsChange({ ...settings, ...patch });

  return (
    <div className="space-y-3">
      {/* Connection */}
      <div
        className={`${SHEET} p-3.5`}
        style={{
          backgroundImage: connected
            ? "linear-gradient(180deg, rgba(16,185,129,0.10), rgba(16,185,129,0) 72%)"
            : undefined,
        }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`grid h-9 w-9 flex-none place-items-center rounded-[11px] ${
              connected
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-black/[0.05] text-gray-400 dark:bg-white/[0.07] dark:text-gray-500"
            }`}
          >
            <ServerIcon className="h-[18px] w-[18px]" />
          </span>

          <div className="min-w-0 flex-1">
            {editingIp ? (
              <Input
                inputSize="sm"
                value={ip}
                onChange={(e) => onIpChange(e.target.value)}
                aria-label="Device IP address"
                placeholder="192.168.1.201"
              />
            ) : (
              <>
                <p className="truncate text-[13.5px] font-bold tabular-nums text-gray-900 dark:text-white">
                  {ip || "No address set"}
                </p>
                <p
                  className={`mt-[2px] flex items-center gap-1.5 text-[11.5px] font-semibold ${
                    connected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <span className="h-[6px] w-[6px] rounded-full bg-current" />
                  {connected ? "Connected" : "Not connected"}
                </p>
              </>
            )}
          </div>

          {connected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="flex-none rounded-[10px] bg-red-500/10 px-3 py-2 text-[11.5px] font-bold text-red-600 transition-colors active:bg-red-500/20 dark:text-red-400"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={connecting || !ip}
              className="flex-none rounded-[10px] px-3 py-2 text-[11.5px] font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: "var(--brand-solid)" }}
            >
              {connecting ? "Connecting" : "Connect"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setEditingIp((v) => !v)}
            aria-label={editingIp ? "Done editing address" : "Change address"}
            className="grid h-9 w-9 flex-none place-items-center rounded-[10px] text-gray-400 transition-colors active:bg-black/5 dark:text-gray-500 dark:active:bg-white/10"
          >
            {editingIp ? (
              <CheckCircleIcon className="h-[18px] w-[18px]" />
            ) : (
              <PencilSquareIcon className="h-[17px] w-[17px]" />
            )}
          </button>
        </div>

        {(statusText || connected) && (
          <p className="mt-2.5 text-[11.5px] text-gray-400 dark:text-gray-500">
            {statusText ||
              (employeeCount
                ? `${employeeCount} employees enrolled, sorted by user ID`
                : "Refresh the roster to read the enrolled employees")}
          </p>
        )}

        {door && (door.unlocking || door.message) && (
          <div
            className={`mt-2.5 flex items-center gap-2 rounded-[11px] px-3 py-2.5 text-[12px] font-medium ${
              door.unlocking
                ? "bg-black/[0.03] text-gray-600 dark:bg-white/[0.05] dark:text-gray-300"
                : door.message?.type === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            {door.unlocking ? (
              <>
                <ArrowPathIcon className="h-4 w-4 flex-none animate-spin" />
                <span>
                  Unlocking the door
                  {door.countdown > 0
                    ? ` - ${door.countdown}s remaining`
                    : "..."}
                </span>
              </>
            ) : door.message?.type === "success" ? (
              <>
                <CheckCircleIcon className="h-4 w-4 flex-none" />
                <span>{door.message.text}</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 flex-none" />
                <span>{door.message?.text}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      {actions.length > 0 && (
        <>
          <GroupLabel className="px-1 pt-1">Quick actions</GroupLabel>
          <div className="grid grid-cols-2 gap-2.5">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled || action.busy}
                className={`${SHEET} flex min-h-[56px] items-center gap-2.5 p-3 text-left transition-transform active:scale-[0.98] disabled:opacity-50`}
              >
                <span
                  className={`grid h-8 w-8 flex-none place-items-center rounded-[9px] text-gray-500 dark:text-gray-400 ${WELL}`}
                >
                  <action.icon
                    className={`h-[15px] w-[15px] ${
                      action.busy ? "animate-spin" : ""
                    }`}
                  />
                </span>
                <span className="min-w-0 truncate text-[12px] font-semibold text-gray-900 dark:text-white">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* The arrival rule */}
      <div className={`${SHEET} p-4`}>
        <p className="text-[13.5px] font-semibold text-gray-900 dark:text-white">
          Arrival time that decides late
        </p>
        <p className="mt-0.5 text-[11.5px] text-gray-400 dark:text-gray-500">
          {canEdit
            ? "Saving this re-judges every record on this page."
            : "Set by your administrator."}
        </p>

        <div className="mt-3">
          {POLICIES.map((option, index) => {
            const on = policy === option.key;
            return (
              <label
                key={option.key}
                className={`flex items-center gap-3 py-3 ${
                  index ? "border-t border-gray-100 dark:border-white/5" : ""
                } ${canEdit ? "" : "opacity-60"}`}
              >
                <input
                  type="radio"
                  name="mobileLateTimePolicy"
                  className="sr-only"
                  checked={on}
                  disabled={!canEdit}
                  onChange={() =>
                    update({
                      policy: option.key,
                      useCustomCutoff: option.key === "custom",
                    })
                  }
                />
                <span
                  aria-hidden="true"
                  className="grid h-[19px] w-[19px] flex-none place-items-center rounded-full border-2 transition-colors"
                  style={{
                    borderColor: on ? "var(--accent)" : "rgba(128,128,128,0.4)",
                  }}
                >
                  {on && (
                    <span
                      className="h-[9px] w-[9px] rounded-full"
                      style={{ backgroundColor: "var(--brand-solid)" }}
                    />
                  )}
                </span>
                <span className="flex-1 text-[13px] font-medium text-gray-900 dark:text-white">
                  {option.label}
                </span>
                <Input
                  type="time"
                  inputSize="sm"
                  value={settings[option.field] || option.fallback}
                  disabled={!canEdit || !on}
                  onChange={(e) =>
                    update({ [option.field]: e.target.value } as Partial<LateTimeForm>)
                  }
                  className="w-[104px] flex-none"
                  inputClassName="text-xs tabular-nums"
                />
              </label>
            );
          })}
        </div>

        {canEdit && (
          <div className="mt-3">
            <PrimaryButton onClick={onSave} icon={ClockIcon}>
              Save rule
            </PrimaryButton>
          </div>
        )}

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
          <ClockIcon className="h-3.5 w-3.5 flex-none" />
          In force:{" "}
          <span className="font-semibold text-gray-600 dark:text-gray-300">
            {formatCutoff(settings.effectiveCutoffTime || settings.cutoffTime)}
          </span>
        </p>
      </div>
    </div>
  );
};

export default MobileDeviceTab;
