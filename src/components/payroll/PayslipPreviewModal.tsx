/**
 * Payroll — payslip preview.
 *
 * Renders the composed payslip document inside a sandboxed iframe and scales it
 * to fit the modal. Using the real document (rather than a React lookalike)
 * means the preview *is* the PDF — there is no second rendering path that could
 * disagree with what the employee receives.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  PrinterIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Modal from "../ui/Modal";
import InlineLoader from "../InlineLoader";
import { buildPayslipHtml } from "./exporters";
import { formatPeriod } from "./formatters";
import type { PayrollSettings, Payslip } from "./types";

/** A4 width at 96dpi — the natural width of the composed document. */
const A4_WIDTH_PX = 794;

interface Props {
  open: boolean;
  onClose: () => void;
  payslip: Payslip | null;
  settings: PayrollSettings;
  payDate?: string;
  onDownload: (payslip: Payslip) => void;
  onPrint: (payslip: Payslip) => void;
}

const PayslipPreviewModal: React.FC<Props> = ({
  open,
  onClose,
  payslip,
  settings,
  payDate,
  onDownload,
  onPrint,
}) => {
  const [html, setHtml] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const shellRef = useRef<HTMLDivElement>(null);

  // Compose only while open — building the document (and inlining the logo)
  // has no reason to run for a closed modal.
  useEffect(() => {
    let cancelled = false;
    if (!open || !payslip) {
      setHtml(null);
      return;
    }
    setHtml(null);
    buildPayslipHtml(payslip, { settings, payDate }).then((doc) => {
      if (!cancelled) setHtml(doc);
    });
    return () => {
      cancelled = true;
    };
  }, [open, payslip, settings, payDate]);

  // Scale the A4 page down to whatever width the modal actually has.
  useEffect(() => {
    if (!open) return;
    const el = shellRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / A4_WIDTH_PX));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, html]);

  const title = useMemo(
    () =>
      payslip
        ? `${payslip.employee.name} — ${formatPeriod(payslip.period)}`
        : "Payslip",
    [payslip]
  );

  if (!payslip) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title="Payslip"
      description={title}
      icon={<DocumentTextIcon className="h-5 w-5" />}
      bodyClassName="bg-gray-100 dark:bg-gray-900/60"
      footer={
        <div className="flex w-full justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">
            Close
          </button>
          <button
            onClick={() => onPrint(payslip)}
            className="btn-secondary inline-flex items-center gap-1.5 text-sm"
          >
            <PrinterIcon className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={() => onDownload(payslip)}
            className="btn-primary inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      }
    >
      <div ref={shellRef} className="w-full">
        {html ? (
          <div
            className="mx-auto overflow-hidden rounded-lg shadow-xl ring-1 ring-black/5"
            style={{
              width: A4_WIDTH_PX * scale,
              // The iframe renders at full A4 and is visually scaled, so text
              // stays vector-sharp instead of being resampled.
              height: 1123 * scale,
            }}
          >
            <iframe
              title="Payslip preview"
              srcDoc={html}
              sandbox=""
              scrolling="no"
              style={{
                width: A4_WIDTH_PX,
                height: 1123,
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center">
            <InlineLoader label="Preparing payslip…" />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PayslipPreviewModal;
