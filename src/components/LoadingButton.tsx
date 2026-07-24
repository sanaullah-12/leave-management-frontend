import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import InlineLoader from "./InlineLoader";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  /** Briefly show an animated success state (parent toggles this). */
  success?: boolean;
  loadingText?: string;
  successText?: string;
}

/**
 * A button that swaps its label for an inline loader while `loading`, animates
 * a success check when `success`, and disables itself during processing.
 * Defaults to the app's `btn-primary` styling; override via `className`.
 */
const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  success = false,
  loadingText,
  successText = "Done",
  children,
  className = "btn-primary",
  disabled,
  ...rest
}) => (
  <button
    className={`${className} inline-flex items-center justify-center gap-2`}
    disabled={disabled || loading}
    aria-busy={loading}
    {...rest}
  >
    {loading ? (
      <InlineLoader label={loadingText} />
    ) : success ? (
      <span className="animate-pop-in inline-flex items-center gap-1.5">
        <CheckCircleIcon className="h-5 w-5" />
        {successText}
      </span>
    ) : (
      children
    )}
  </button>
);

export default LoadingButton;
