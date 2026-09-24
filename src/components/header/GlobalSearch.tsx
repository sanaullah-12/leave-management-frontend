import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

import Input from "../ui/Input";
import { DUR, EASE, spring } from "../../lib/motion";
/**
 * The header's global search.
 *
 * One field that reaches every screen in the product. It is the answer to
 * "where is that page again?" - a question the rail and panel only answer if
 * you already know which area a page lives in.
 *
 * Two states, both useful:
 *
 *   - **Focused, empty** - a shortlist of suggestions, so the control teaches
 *     what is in the app rather than demanding you already know it. Somebody
 *     who opens it by accident learns the vocabulary; somebody who opens it on
 *     purpose usually finds their destination without typing.
 *   - **Typing** - matches the page name, its area, and any extra keywords the
 *     entry carries, so "salary" finds Payroll and "wfh" finds Work From Home
 *     even though neither word appears in those page titles.
 *
 * Results stay grouped by area. A flat list of twenty page names is a wall of
 * words; the same list under "Leave" and "Payroll" headings can be scanned.
 *
 * Fully keyboard-driven, because a search this prominent that needs the mouse
 * to pick a result is slower than the navigation it replaces.
 */

export interface SearchEntry {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** The area the page belongs to - shown as the result group heading. */
  group: string;
  /** Extra words that should match this entry but are not in its name. */
  keywords?: string;
}

interface Props {
  entries: SearchEntry[];
  /** Focused by the Cmd-K / Ctrl-K handler that Layout owns. */
  inputRef?: React.RefObject<HTMLInputElement>;
  placeholder?: string;
  className?: string;
}

/** How many entries the empty state offers before anything is typed. */
const SUGGESTION_COUNT = 6;

const GlobalSearch: React.FC<Props> = ({
  entries,
  inputRef,
  placeholder = "Search pages, settings, actions...",
  className = "",
}) => {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, SUGGESTION_COUNT);
    return entries.filter((e) =>
      `${e.name} ${e.group} ${e.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [query, entries]);

  // A stale index would highlight a row that is no longer there, and Enter
  // would open whatever slid into its place.
  React.useEffect(() => setActive(0), [query]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted row in view when the keyboard moves past the fold.
  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const go = (entry: SearchEntry) => {
    setOpen(false);
    setQuery("");
    inputRef?.current?.blur();
    navigate(entry.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef?.current?.blur();
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  /** Results in source order, split under their area heading. */
  const grouped = React.useMemo(() => {
    const out: { group: string; items: SearchEntry[] }[] = [];
    for (const entry of results) {
      const last = out[out.length - 1];
      if (last && last.group === entry.group) last.items.push(entry);
      else out.push({ group: entry.group, items: [entry] });
    }
    return out;
  }, [results]);

  // Runs across the grouped render so keyboard position matches what is shown.
  let index = -1;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="group relative">
        <Input
          icon={MagnifyingGlassIcon}
          inputSize="sm"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="global-search-results"
          aria-label="Search the app"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          inputClassName="pr-16"
        />

        {/* The shortcut hint doubles as the clear button once there is a query,
            so this corner never shows two controls competing for it. */}
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef?.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-gray-400 xl:block dark:border-white/10 dark:bg-white/5 dark:text-gray-500">
            Ctrl K
          </kbd>
        )}
      </div>

      {/* The panel grows out of the field rather than appearing over it, on
          the same curve as every other menu in the app - see the POPOVER note
          in Dropdown. Search is the one surface people summon and dismiss
          dozens of times a day, so it also leaves faster than it arrives. */}
      <AnimatePresence>
        {open && (
        <motion.div
          id="global-search-results"
          ref={listRef}
          role="listbox"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: DUR.base, ease: EASE.out }}
          className="glass-panel absolute left-0 right-0 top-full z-[60] mt-2 max-h-[24rem] origin-top overflow-y-auto rounded-2xl p-1.5"
        >
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MagnifyingGlassIcon className="mx-auto h-7 w-7 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No page matches that.
              </p>
            </div>
          ) : (
            <>
              {!query && (
                <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Suggested
                </p>
              )}
              {grouped.map((section) => (
                <div key={section.group} className="mb-0.5 last:mb-0">
                  {query && (
                    <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                      {section.group}
                    </p>
                  )}
                  {section.items.map((entry) => {
                    index += 1;
                    const i = index;
                    const Icon = entry.icon;
                    const isActive = i === active;
                    return (
                      <button
                        key={entry.href + entry.name}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        data-active={isActive}
                        onMouseEnter={() => setActive(i)}
                        // mousedown, not click: the input's blur would tear the
                        // panel down before a click ever landed on the row.
                        onMouseDown={(e) => {
                          e.preventDefault();
                          go(entry);
                        }}
                        className={`relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
                          isActive
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {/* The highlight slides down the list with the arrow
                            keys instead of switching rows. On a list that is
                            navigated by keyboard as often as this one, a tint
                            that jumps gives no sense of direction - which is
                            the only thing arrow keys are communicating. */}
                        {isActive && (
                          <motion.span
                            layoutId={reduce ? undefined : "global-search-active"}
                            transition={spring}
                            aria-hidden="true"
                            className="absolute inset-0 rounded-xl bg-[rgb(var(--brand-600))]/10"
                          />
                        )}
                        <span
                          className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-[rgb(var(--brand-600))] text-white"
                              : "bg-black/[0.04] text-gray-500 dark:bg-white/10 dark:text-gray-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="relative z-10 min-w-0 flex-1 truncate text-sm font-medium">
                          {entry.name}
                        </span>
                        {/* Only where there is no heading above to say it.
                            Searching prints the area once per group; repeating
                            it on every row under that heading is noise. */}
                        {!query && (
                          <span className="relative z-10 shrink-0 text-[11px] text-gray-400">
                            {entry.group}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
