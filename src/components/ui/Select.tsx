import React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/24/outline";

/**
 * Reusable glassmorphic select (built on Headless UI Listbox).
 *
 * Options can carry a semantic status dot (`dotColor`) and a `badge`, matching
 * the "Status Select" pattern. Theme-aware and accessible. Controlled:
 *
 * <Select value={status} onChange={setStatus} options={[
 *   { value: "active", label: "Active", dotColor: "#10b981", badge: "AVAILABLE",
 *     badgeClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
 * ]} />
 */

export interface SelectOption {
  value: string;
  label: string;
  dotColor?: string;
  badge?: string;
  badgeClass?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  disabled = false,
}) => {
  const selected = options.find((o) => o.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className={`relative ${className}`}>
        <ListboxButton className="flex w-full items-center gap-2.5 rounded-xl bg-[var(--card-surface)] px-4 py-2.5 text-left text-sm font-medium text-gray-800 min-h-[44px] sm:min-h-0 ring-1 ring-inset ring-gray-200/70 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60 dark:text-gray-100 dark:ring-white/10">
          {selected?.dotColor && (
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: selected.dotColor }}
            />
          )}
          {selected?.icon &&
            React.createElement(selected.icon, {
              className: "h-4 w-4 flex-shrink-0 text-gray-400",
            })}
          <span className={`flex-1 truncate ${selected ? "" : "text-gray-400"}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronUpDownIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom"
          className="z-[110] mt-2 w-[var(--button-width)] rounded-xl border border-black/5 bg-white/80 p-1.5 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur-xl focus:outline-none dark:border-white/10 dark:bg-gray-900/80 dark:ring-white/10 origin-top transition ease-out data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-100"
        >
          {options.map((opt) => (
            <ListboxOption
              key={opt.value}
              value={opt.value}
              className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors data-[focus]:bg-black/[0.04] dark:text-gray-200 dark:data-[focus]:bg-white/[0.06]"
            >
              {opt.dotColor && (
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: opt.dotColor }}
                />
              )}
              {opt.icon &&
                React.createElement(opt.icon, {
                  className: "h-4 w-4 flex-shrink-0 text-gray-400",
                })}
              <span className="flex-1 truncate font-medium">{opt.label}</span>
              {opt.badge && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    opt.badgeClass ??
                    "bg-slate-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                  }`}
                >
                  {opt.badge}
                </span>
              )}
              <CheckIcon className="h-4 w-4 flex-shrink-0 text-blue-500 opacity-0 group-data-[selected]:opacity-100" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
};

export default Select;
