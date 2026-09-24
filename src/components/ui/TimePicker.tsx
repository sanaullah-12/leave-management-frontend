import React from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ClockIcon } from "@heroicons/react/24/outline";

/**
 * Glassmorphic time picker (built on Headless UI Popover).
 *
 * Drop-in replacement for <input type="time">: `value`/`onChange` use the same
 * 24-hour "HH:MM" string, so a stored cutoff needs no conversion. The native
 * field was the one control on the page the theme could not reach - the panel
 * it drops is drawn by the browser, white and square in the middle of a dark
 * themed card - which is the whole reason this exists.
 *
 * Hours and minutes are two columns rather than a spinner: picking 9:30 is two
 * taps in a list you can see, where a spinner is a drag against momentum.
 */

export interface TimePickerProps {
  /** 24-hour "HH:MM", or "" for none. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** `sm` for dense rows; `md` matches Input and DatePicker. */
  size?: "sm" | "md";
  placeholder?: string;
  "aria-label"?: string;
  /** Minute granularity offered in the list. */
  step?: number;
}

/** Shared with Select, Dropdown and DatePicker. */
const POPOVER =
  "origin-top transition duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "data-[closed]:-translate-y-1 data-[closed]:scale-95 data-[closed]:opacity-0 " +
  "data-[leave]:duration-[160ms] data-[leave]:ease-[cubic-bezier(0.64,0,0.78,0)]";

const pad = (n: number) => String(n).padStart(2, "0");

const parse = (value?: string) => {
  const [h, m] = (value || "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
};

export const formatTimeLabel = (value?: string) => {
  const t = parse(value);
  if (!t) return "";
  const suffix = t.h >= 12 ? "PM" : "AM";
  const hour12 = t.h % 12 === 0 ? 12 : t.h % 12;
  return `${hour12}:${pad(t.m)} ${suffix}`;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

const COLUMN_BUTTON =
  "flex h-9 w-full items-center justify-center rounded-full text-sm font-medium tabular-nums transition-colors";

/**
 * One scrolling column of values.
 *
 * It scrolls itself to its selection on open. A minute list opening at :00
 * with :30 chosen shows no sign of what is set, which reads as nothing being
 * set at all - and the scroll is set directly rather than through
 * scrollIntoView, which would take the page along with it.
 */
const TimeColumn: React.FC<{
  label: string;
  items: number[];
  selected: number;
  print: (n: number) => string;
  onPick: (n: number) => void;
}> = ({ label, items, selected, print, onPick }) => {
  const list = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = list.current;
    if (!el) return;
    const index = items.indexOf(selected);
    if (index < 0) return;
    const row = 38; // h-9 plus the 2px gap between rows
    el.scrollTop = Math.max(0, index * row - el.clientHeight / 2 + row / 2);
    // On open only: re-running on every pick would yank the list under the
    // finger that just chose something.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <div ref={list} className="scroll-pane max-h-44 space-y-0.5 pe-0.5">
        {items.map((n) => {
          const on = selected === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              className={`${COLUMN_BUTTON} ${
                on
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-gray-700 hover:bg-black/[0.05] dark:text-gray-200 dark:hover:bg-white/[0.08]"
              }`}
            >
              {print(n)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  disabled = false,
  className = "",
  size = "md",
  placeholder = "Select time",
  step = 5,
  ...rest
}) => {
  const current = parse(value);
  const pm = (current?.h ?? 9) >= 12;
  const hour12 = current ? (current.h % 12 === 0 ? 12 : current.h % 12) : 9;
  const minute = current?.m ?? 0;

  /* Off-step minutes are kept rather than rounded away: a cutoff saved as
     09:07 must still be selectable, and silently moving it on open would
     change a rule nobody asked to change. */
  const minutes = React.useMemo(() => {
    const list = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
    return list.includes(minute) ? list : [...list, minute].sort((a, b) => a - b);
  }, [step, minute]);

  const emit = (h12: number, m: number, isPm: boolean) =>
    onChange(`${pad((h12 % 12) + (isPm ? 12 : 0))}:${pad(m)}`);

  const trigger =
    size === "sm"
      ? "h-9 gap-1.5 px-3 text-xs"
      : "h-11 gap-2.5 px-4 text-sm sm:h-10";

  return (
    <Popover className={`relative ${className}`}>
      <PopoverButton
        disabled={disabled}
        aria-label={rest["aria-label"]}
        className={`flex w-full items-center rounded-full bg-[var(--card-surface)] text-left font-medium text-gray-800 ring-1 ring-inset ring-gray-200/70 transition-[box-shadow,transform] duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[0.98] disabled:opacity-60 dark:text-gray-100 dark:ring-white/10 ${trigger}`}
      >
        <ClockIcon
          className={`flex-shrink-0 text-gray-400 ${
            size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
          }`}
        />
        <span
          className={`flex-1 truncate tabular-nums ${
            current ? "" : "text-gray-400"
          }`}
        >
          {current ? formatTimeLabel(value) : placeholder}
        </span>
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className={`glass-panel z-[110] mt-2 w-[min(15rem,calc(100vw-1.5rem))] rounded-2xl p-3 focus:outline-none ${POPOVER}`}
      >
        {({ close }) => (
          <>
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <p className="text-base font-bold tabular-nums text-gray-900 dark:text-white">
                {current ? formatTimeLabel(value) : "--:--"}
              </p>
              {/* AM and PM as one strip, the same segmented control the rest
                  of the app uses for a two-way choice. */}
              <div className="flex gap-1 rounded-full bg-gray-100 p-1 dark:bg-white/10">
                {[
                  { label: "AM", on: !pm },
                  { label: "PM", on: pm },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => emit(hour12, minute, option.label === "PM")}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      option.on
                        ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2 h-px bg-gray-100 dark:bg-white/10" />

            <div className="grid grid-cols-2 gap-2">
              <TimeColumn
                label="Hour"
                items={HOURS}
                selected={hour12}
                print={(n) => String(n)}
                onPick={(n) => emit(n, minute, pm)}
              />
              <TimeColumn
                label="Minute"
                items={minutes}
                selected={minute}
                print={pad}
                onPick={(n) => emit(hour12, n, pm)}
              />
            </div>

            <div className="mt-2.5 flex items-center justify-end border-t border-gray-100 pt-2.5 dark:border-white/10">
              <button
                type="button"
                onClick={() => close()}
                className="rounded-full px-3 py-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Done
              </button>
            </div>
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
};

export default TimePicker;
