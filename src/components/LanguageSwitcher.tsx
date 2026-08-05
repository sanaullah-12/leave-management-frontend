/**
 * Language switcher.
 *
 * Two presentations of the same control, both driven entirely by the language
 * registry — neither hard-codes a language, so a new locale folder shows up
 * here automatically:
 *
 *  • `variant="menu"`   — compact dropdown for the app header.
 *  • `variant="cards"`  — full picker for the settings page.
 *
 * Language names are shown in their own script (`nativeName`), which is what
 * users scanning for their language actually recognise — an Urdu speaker looks
 * for "اردو", not "Urdu".
 */
import React from "react";
import { motion } from "framer-motion";
import { CheckIcon, LanguageIcon } from "@heroicons/react/24/outline";
import Dropdown from "./ui/Dropdown";
import { useLocale } from "../i18n/LocaleProvider";
import { CARD_HOVER } from "../lib/surfaces";

interface Props {
  variant?: "menu" | "cards";
  className?: string;
}

const LanguageSwitcher: React.FC<Props> = ({ variant = "menu", className = "" }) => {
  const { language, languages, setLanguage, meta, isChanging } = useLocale();

  /* ---------------- header dropdown ---------------- */
  if (variant === "menu") {
    return (
      <Dropdown
        align="right"
        widthClass="w-56"
        buttonClassName="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
        bareButton
        sections={[
          {
            items: languages.map((l) => ({
              label: `${l.flag}  ${l.nativeName}`,
              onClick: () => setLanguage(l.code),
              // A tick on the active language; the registry drives the rest.
              icon:
                l.code === language
                  ? (p: { className?: string }) => <CheckIcon {...p} />
                  : undefined,
            })),
          },
        ]}
      >
        <LanguageIcon className="h-5 w-5" />
        <span className="hidden sm:inline">{meta.nativeName}</span>
      </Dropdown>
    );
  }

  /* ---------------- settings cards ---------------- */
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${className}`}
      role="radiogroup"
      aria-label={meta.nativeName}
    >
      {languages.map((l) => {
        const active = l.code === language;
        return (
          <motion.button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={isChanging}
            whileTap={{ scale: 0.97 }}
            onClick={() => setLanguage(l.code)}
            className={`group relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all disabled:opacity-60 ${CARD_HOVER} ${
              active
                ? "border-transparent ring-2"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
            }`}
            style={
              active
                ? {
                    backgroundColor: "var(--accent-soft)",
                    // Ring colour can't come from a class — it's theme-driven.
                    boxShadow: "0 0 0 2px var(--accent)",
                  }
                : undefined
            }
          >
            <span className="flex w-full items-center justify-between">
              <span className="text-2xl leading-none">{l.flag}</span>
              {active && (
                <CheckIcon
                  className="h-4 w-4"
                  style={{ color: "var(--accent)" }}
                />
              )}
            </span>
            {/* The native name leads — it is what a speaker scans for. */}
            <span
              className="text-base font-semibold text-gray-900 dark:text-white"
              // Render each name in its own direction so Urdu doesn't
              // inherit the surrounding LTR layout (or vice versa).
              dir={l.dir}
              lang={l.code}
            >
              {l.nativeName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {l.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default React.memo(LanguageSwitcher);
