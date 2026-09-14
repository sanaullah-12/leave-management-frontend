import React from "react";

/**
 * The two smallest pieces every detail screen is built from.
 *
 * Shared rather than redeclared per page: the employee record and the employee
 * report state the same facts about the same person, and when each page owned
 * its own heading and field markup the two drifted into different type scales
 * for identical information.
 */

/** Label over value. How a screen states one fact about someone. */
export const Meta: React.FC<{
  label: string;
  value: React.ReactNode;
  /** Let long values wrap instead of truncating - email, reasons, notes. */
  wrap?: boolean;
}> = ({ label, value, wrap = false }) => (
  <div className="min-w-0">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {label}
    </p>
    <p
      className={`mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 ${
        wrap ? "break-words" : "truncate"
      }`}
    >
      {value}
    </p>
  </div>
);

/**
 * The heading a card carries.
 *
 * One level, everywhere. A page that mixes an h2 hero, an accent-bar h3 and a
 * bold h4 is asking the reader to rank three things that are all just "the
 * next card".
 */
export const CardHeading: React.FC<{
  title: string;
  sub?: string;
  action?: React.ReactNode;
}> = ({ title, sub, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {sub && (
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{sub}</p>
      )}
    </div>
    {action}
  </div>
);
