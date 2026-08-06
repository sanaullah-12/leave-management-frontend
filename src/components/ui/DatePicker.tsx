import React, { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

/**
 * Reusable glassmorphic calendar date-picker (built on Headless UI Popover).
 *
 * Drop-in replacement for <input type="date">: `value`/`onChange` use the same
 * `yyyy-mm-dd` string format, so it works directly with react-hook-form via a
 * Controller. Theme-aware, accessible, and renders above modals (z-[110]).
 */

export interface DatePickerProps {
  value: string; // yyyy-mm-dd (or "")
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const parseISO = (s?: string): Date | null => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  min,
  max,
  className = "",
  disabled = false,
}) => {
  const selected = parseISO(value);
  const today = new Date();
  const [view, setView] = useState<Date>(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const minDate = parseISO(min);
  const maxDate = parseISO(max);

  const year = view.getFullYear();
  const month = view.getMonth();
  const monthLabel = view.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Mon-first offset for the 1st of the month.
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const isDisabled = (d: Date) =>
    (minDate && d < minDate) || (maxDate && d > maxDate);

  const display = selected
    ? selected.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : placeholder;

  return (
    <Popover className={`relative ${className}`}>
      <PopoverButton
        disabled={disabled}
        className="flex w-full items-center gap-2.5 rounded-xl bg-[var(--card-surface)] px-4 py-2.5 text-left text-sm font-medium text-gray-800 min-h-[44px] sm:min-h-0 ring-1 ring-inset ring-gray-200/70 transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60 dark:text-gray-100 dark:ring-white/10"
      >
        <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
        <span className={`flex-1 truncate ${selected ? "" : "text-gray-400"}`}>
          {display}
        </span>
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className="z-[110] mt-2 w-[19rem] rounded-2xl border border-black/5 bg-white/85 p-4 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur-xl focus:outline-none dark:border-white/10 dark:bg-gray-900/85 dark:ring-white/10 origin-top transition ease-out data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-100"
      >
        {({ close }) => (
          <>
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {monthLabel}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView(new Date(year, month - 1, 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/25 transition-transform hover:scale-105"
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView(new Date(year, month + 1, 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/25 transition-transform hover:scale-105"
                  aria-label="Next month"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 h-px bg-gray-100 dark:bg-white/10" />

            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="py-1 text-center text-xs font-semibold text-gray-400 dark:text-gray-500"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <div key={`e${i}`} />;
                const isSel = selected && sameDay(d, selected);
                const isToday = sameDay(d, today);
                const off = isDisabled(d);
                return (
                  <button
                    key={toISO(d)}
                    type="button"
                    disabled={!!off}
                    onClick={() => {
                      onChange(toISO(d));
                      close();
                    }}
                    className={`flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      isSel
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                        : isToday
                        ? "text-blue-600 ring-1 ring-inset ring-blue-500/40 dark:text-blue-400"
                        : "text-gray-700 hover:bg-black/[0.05] dark:text-gray-200 dark:hover:bg-white/[0.08]"
                    } ${off ? "cursor-not-allowed opacity-30 hover:bg-transparent" : ""}`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  const t = new Date();
                  if (!isDisabled(t)) {
                    setView(new Date(t.getFullYear(), t.getMonth(), 1));
                    onChange(toISO(t));
                    close();
                  }
                }}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Today
              </button>
              {selected && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    close();
                  }}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
};

export default DatePicker;
