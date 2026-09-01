import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowsPointingOutIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { composeDocumentHtml } from "./exporters";
import type {
  BrandSettings,
  BrandingAsset,
  CompanyProfile,
  PageSettings,
  TemplateVariant,
} from "./types";

/** A4 at 96dpi, the width the composed page is authored against. */
const PAGE_PX = 794;

interface Props {
  title: string;
  /** Body HTML with placeholders already resolved for the preview subject. */
  bodyHtml: string;
  page: PageSettings;
  assets: BrandingAsset[];
  company: CompanyProfile;
  brand: BrandSettings;
  variant: TemplateVariant;
  /** Placeholders still without a value, surfaced as a gentle warning. */
  unresolved: string[];
  /** Line under the heading, e.g. who the preview is resolved for. */
  subjectLabel?: string;
  onExpand?: () => void;
  /** Collapse the pane and give the editor the full width. */
  onHide?: () => void;
}

/**
 * Read-only companion to the editor: the document exactly as it will print,
 * with employee data merged in. It renders inside an iframe so the letter's
 * own stylesheet can never inherit from - or leak into - the app shell.
 */
const DocumentPreview: React.FC<Props> = ({
  title,
  bodyHtml,
  page,
  assets,
  company,
  brand,
  variant,
  unresolved,
  subjectLabel,
  onExpand,
  onHide,
}) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  // Long letters run past one page - measure the rendered document so the
  // preview scrolls through all of it instead of clipping at A4.
  const [docHeight, setDocHeight] = useState(1123);

  const html = useMemo(
    () =>
      composeDocumentHtml({
        title,
        bodyHtml,
        page,
        assets,
        company,
        brand,
        variant,
      }),
    [title, bodyHtml, page, assets, company, brand, variant]
  );

  // Keep the page fitted to whatever width the pane is given.
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const fit = () => {
      const width = el.clientWidth - 24;
      if (width > 0) setScale(Math.min(1, +(width / PAGE_PX).toFixed(3)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200/70 px-4 py-2.5 dark:border-gray-700/50">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
            <EyeIcon className="h-4 w-4 text-gray-400" />
            Live preview
          </h3>
          <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
            {subjectLabel || "Pick an employee to merge real data"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unresolved.length > 0 ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {unresolved.length} to fill
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="h-4 w-4" />
              Ready
            </span>
          )}
          {onExpand && (
            <button
              onClick={onExpand}
              title="Open full-size preview"
              className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          )}
          {onHide && (
            <button
              onClick={onHide}
              title="Hide preview"
              className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={shellRef}
        className="flex-1 overflow-auto rounded-b-2xl bg-gray-100/70 p-3 dark:bg-gray-900/40"
      >
        <div
          className="mx-auto shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          style={{ width: PAGE_PX * scale, height: docHeight * scale }}
        >
          <iframe
            title="Document preview"
            srcDoc={html}
            scrolling="no"
            onLoad={(e) => {
              const body = e.currentTarget.contentDocument?.body;
              if (body) setDocHeight(Math.max(1123, body.scrollHeight));
            }}
            style={{
              width: PAGE_PX,
              height: docHeight,
              border: 0,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              background: "#ffffff",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
