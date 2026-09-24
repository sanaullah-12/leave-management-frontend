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
 *
 * The trigger is a flat h-10, which is Input's `md` height. These three - a
 * text field, this and DatePicker - are the same field family and are
 * routinely laid out in one row, so the height is fixed rather than left to
 * the padding and line-height of whatever each happens to contain. It steps
 * to 44px below `sm` in step with Input, for the same reason.
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

/** Shared with Dropdown and DatePicker - see the note in Dropdown. */
const POPOVER =
  "origin-top transition duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "data-[closed]:-translate-y-1 data-[closed]:scale-95 data-[closed]:opacity-0 " +
  "data-[leave]:duration-[160ms] data-[leave]:ease-[cubic-bezier(0.64,0,0.78,0)]";

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
        <ListboxButton className="group flex w-full items-center gap-2.5 rounded-full bg-[var(--card-surface)] h-11 sm:h-10 px-4 text-left text-sm font-medium text-gray-800 ring-1 ring-inset ring-gray-200/70 transition-[box-shadow,transform] duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[0.98] disabled:opacity-60 dark:text-gray-100 dark:ring-white/10">
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
          <ChevronUpDownIcon className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[open]:rotate-180" />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom"
          // Capped and scrollable: a long list - times of day, a department
          // roster - would otherwise run off the bottom of the screen with its
          // last options unreachable. Short lists are unaffected, since a
          // max-height only applies to a list that exceeds it.
          className={`glass-panel scroll-pane z-[110] mt-2 max-h-[min(18rem,55dvh)] w-[var(--button-width)] rounded-xl p-1.5 focus:outline-none ${POPOVER}`}
        >
          {options.map((opt) => (
            <ListboxOption
              key={opt.value}
              value={opt.value}
              className="group flex min-h-[42px] cursor-pointer items-center gap-2.5 rounded-full px-3 py-2 text-sm text-gray-700 transition-colors data-[focus]:bg-black/[0.04] dark:text-gray-200 dark:data-[focus]:bg-white/[0.06] sm:min-h-0"
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
                    "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                  }`}
                >
                  {opt.badge}
                </span>
              )}
              <CheckIcon className="h-4 w-4 flex-shrink-0 scale-75 text-blue-500 opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[selected]:scale-100 group-data-[selected]:opacity-100" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
};

export default Select;
