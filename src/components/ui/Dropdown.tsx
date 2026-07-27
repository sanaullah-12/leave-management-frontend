import React from "react";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

/**
 * Reusable glassmorphic dropdown menu (built on Headless UI).
 *
 * Data-driven: pass `sections` of `items`. Each item supports an icon, a
 * keyboard-shortcut hint, an optional description, a danger style, and either
 * an `onClick` or an `href`. Fully theme-aware (light + dark) and accessible.
 *
 * <Dropdown sections={[{ items: [{ label: "Edit", icon: PencilIcon, shortcut: "⌘E", onClick }] }]}>
 *   Actions
 * </Dropdown>
 */

export interface DropdownItem {
  key?: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  /** Shows a check at the end (e.g. current filter/sort choice). */
  selected?: boolean;
}

export interface DropdownSection {
  key?: string;
  label?: string;
  items: DropdownItem[];
}

export interface DropdownProps {
  children: React.ReactNode; // trigger content
  sections: DropdownSection[];
  header?: React.ReactNode;
  align?: "left" | "right";
  widthClass?: string;
  buttonClassName?: string;
  showChevron?: boolean;
  /** When true, the trigger renders raw (no default pill styling). */
  bareButton?: boolean;
}

const DEFAULT_BUTTON =
  "inline-flex items-center gap-2 rounded-xl bg-[var(--card-surface)] px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200/70 transition-colors hover:bg-black/[0.03] dark:text-gray-200 dark:ring-white/10 dark:hover:bg-white/[0.04]";

const PANEL =
  "z-[110] mt-2 rounded-xl border border-black/5 bg-white/80 p-1.5 shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur-xl focus:outline-none dark:border-white/10 dark:bg-gray-900/80 dark:ring-white/10 " +
  "origin-top transition ease-out data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-100";

const Dropdown: React.FC<DropdownProps> = ({
  children,
  sections,
  header,
  align = "right",
  widthClass = "w-56",
  buttonClassName,
  showChevron = false,
  bareButton = false,
}) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        className={bareButton ? buttonClassName : buttonClassName ?? DEFAULT_BUTTON}
      >
        {children}
        {showChevron && (
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        )}
      </MenuButton>

      <MenuItems
        anchor={align === "right" ? "bottom end" : "bottom start"}
        className={`${PANEL} ${widthClass}`}
      >
        {header && (
          <div className="border-b border-black/5 px-3 py-2.5 dark:border-white/10">
            {header}
          </div>
        )}

        {sections.map((section, si) => (
          <div
            key={section.key ?? si}
            className={si > 0 ? "mt-1 border-t border-black/5 pt-1 dark:border-white/10" : ""}
          >
            {section.label && (
              <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.label}
              </p>
            )}
            {section.items.map((item, ii) => {
              const Icon = item.icon;
              const base =
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-40";
              const tone = item.danger
                ? "text-rose-600 data-[focus]:bg-rose-50 dark:text-rose-400 dark:data-[focus]:bg-rose-500/10"
                : "text-gray-700 data-[focus]:bg-black/[0.04] dark:text-gray-200 dark:data-[focus]:bg-white/[0.06]";

              const inner = (
                <>
                  {Icon && (
                    <Icon
                      className={`h-[18px] w-[18px] flex-shrink-0 ${
                        item.danger
                          ? "text-rose-500"
                          : "text-gray-400 group-data-[focus]:text-blue-500 dark:group-data-[focus]:text-blue-400"
                      }`}
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.label}</span>
                    {item.description && (
                      <span className="block truncate text-xs font-normal text-gray-400 dark:text-gray-500">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.shortcut && (
                    <kbd className="ml-auto flex-shrink-0 rounded-md bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 dark:bg-white/10 dark:text-gray-500">
                      {item.shortcut}
                    </kbd>
                  )}
                  {item.selected && !item.shortcut && (
                    <CheckIcon className="ml-auto h-4 w-4 flex-shrink-0 text-blue-500" />
                  )}
                </>
              );

              return (
                <MenuItem key={item.key ?? ii} disabled={item.disabled}>
                  {item.href ? (
                    <a href={item.href} className={`${base} ${tone}`}>
                      {inner}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className={`${base} ${tone}`}
                    >
                      {inner}
                    </button>
                  )}
                </MenuItem>
              );
            })}
          </div>
        ))}
      </MenuItems>
    </Menu>
  );
};

export default Dropdown;
