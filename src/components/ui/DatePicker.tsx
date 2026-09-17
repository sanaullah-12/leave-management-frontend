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
 *
 * The trigger is a flat h-10, which is Input's `md` height. These three - a
 * text field, a Select and this - are the same field family and are routinely
 * laid out in one row, so the height is fixed rather than left to the padding
 * and line-height of whatever each happens to contain.
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
        className="flex w-full items-center gap-2.5 rounded-full bg-[var(--card-surface)] h-11 sm:h-10 px-4 text-left text-sm font-medium text-gray-800 ring-1 ring-inset ring-gray-200/70 transition-[box-shadow,transform] duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[0.98] disabled:opacity-60 dark:text-gray-100 dark:ring-white/10"
      >
        <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
        <span className={`flex-1 truncate ${selected ? "" : "text-gray-400"}`}>
          {display}
        </span>
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        /* 19rem is 304px, which does not fit inside the gutters of a 320px
           screen - the calendar was being clipped at its edge on the
           narrowest phones. It now takes whatever the screen has, down to
           that. */
        className="glass-panel z-[110] mt-2 w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl p-3 focus:outline-none sm:p-4 origin-top transition duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] data-[closed]:-translate-y-1 data-[closed]:scale-95 data-[closed]:opacity-0 data-[leave]:duration-[160ms] data-[leave]:ease-[cubic-bezier(0.64,0,0.78,0)]"
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
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm shadow-blue-600/25 transition-transform hover:scale-105 active:scale-95 sm:h-8 sm:w-8"
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView(new Date(year, month + 1, 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm shadow-blue-600/25 transition-transform hover:scale-105 active:scale-95 sm:h-8 sm:w-8"
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
                    className={`flex h-11 items-center justify-center rounded-full text-sm font-medium transition-colors sm:h-9 ${
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
