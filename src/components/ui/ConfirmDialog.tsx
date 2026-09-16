import React from "react";
import { motion } from "framer-motion";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Modal from "./Modal";
import InlineLoader from "../InlineLoader";

type Variant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  description?: string;
  consequences?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

const STYLES: Record<
  Variant,
  { ring: string; icon: React.ReactNode; confirm: string; dot: string }
> = {
  danger: {
    ring: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    icon: <TrashIcon className="h-7 w-7" />,
    confirm:
      "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25",
    dot: "bg-red-400",
  },
  warning: {
    ring: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    icon: <ExclamationTriangleIcon className="h-7 w-7" />,
    confirm:
      "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25",
    dot: "bg-amber-400",
  },
  info: {
    ring: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    icon: <InformationCircleIcon className="h-7 w-7" />,
    confirm:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25",
    dot: "bg-blue-400",
  },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title,
  description,
  consequences,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}) => {
  const s = STYLES[variant];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      /* On a phone the two actions fill the width and stand a thumb's width
         apart; a destructive confirm sized to its label, next to a Cancel
         sized to its own, is how the wrong one gets tapped. The sheet's footer
         already clears the home indicator. */
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="min-h-[46px] rounded-full border border-gray-200 px-3 py-2 text-[15px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 sm:min-h-0 sm:px-3.5 sm:text-sm"
          >
            {cancelLabel}
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            disabled={loading}
            className={`flex min-h-[46px] items-center justify-center rounded-full px-5 py-2.5 text-[15px] font-semibold transition-all disabled:opacity-70 sm:min-h-0 sm:text-sm ${s.confirm}`}
          >
            {loading ? <InlineLoader label="Working..." /> : confirmLabel}
          </motion.button>
        </div>
      }
    >
      <div className="px-5 pb-2 pt-7 text-center sm:px-6 sm:pt-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${s.ring}`}
        >
          {s.icon}
        </motion.div>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}

        {consequences && consequences.length > 0 && (
          <div className="mt-5 space-y-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 p-4 text-left">
            {consequences.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${s.dot}`} />
                {c}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
