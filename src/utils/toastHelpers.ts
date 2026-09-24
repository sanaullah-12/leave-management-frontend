import type { ReactElement } from "react";
import toast from "react-hot-toast";
import {
  TOAST_ICON,
  resolveIcon,
  type ToastIconName,
} from "./toastIcons";

export type { ToastIconName };

type ToastType = "success" | "error" | "warning" | "info" | "loading";

/**
 * One toast surface, shared by every helper below.
 *
 * Two things changed here.
 *
 * The colours are CSS variables rather than hexes. react-hot-toast takes
 * inline styles, and a `var()` in an inline style resolves against the
 * element's own computed context - so `var(--surface-overlay)` is the light
 * panel on a light page and the dark panel on a dark one, with nothing in
 * JavaScript deciding which.
 *
 * That let the `isDarkMode()` helper go, which was also wrong: it fell back to
 * `prefers-color-scheme`, so someone who had picked Light while their OS was
 * in dark mode got dark toasts over a light app. The app's mode lives on
 * `<html class="dark">`, and letting CSS answer the question means the toast
 * cannot disagree with the page it is sitting on.
 *
 * The per-type gradients are gone too. Every toast is now the same panel as
 * every menu and modal, marked by a 4px rail in the status colour - one
 * surface, one signal. The gradients were eight hand-written pairs (a "dark
 * emerald gradient", a "light amber gradient", and so on) that between them
 * put five different backgrounds behind what is, in every case, a line of
 * text and an icon.
 */
const TOAST_BASE = {
  background: "var(--surface-overlay)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-default)",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: "500",
  padding: "12px 16px",
  boxShadow: "var(--shadow-lg)",
} as const;

/** The rail down the leading edge - the only thing that differs by type. */
const RAIL: Record<ToastType, string> = {
  success: "var(--success)",
  error: "var(--danger)",
  warning: "var(--warning)",
  info: "var(--brand)",
  loading: "var(--text-muted)",
};

const getThemedToastStyle = (type: ToastType) => ({
  ...TOAST_BASE,
  // Logical, not `borderLeft`: this app ships an RTL locale, and the rail
  // belongs on the side the text starts from.
  borderInlineStart: `4px solid ${RAIL[type]}`,
});

// Custom toast helper functions with consistent theming
export const showSuccessToast = (
  message: string,
  options?: { duration?: number; icon?: ToastIconName | ReactElement }
) => {
  return toast.success(message, {
    duration: options?.duration || 5000,
    icon: resolveIcon(options?.icon) ?? TOAST_ICON.success,
    style: getThemedToastStyle("success"),
  });
};

export const showErrorToast = (
  message: string,
  options?: { duration?: number; icon?: ToastIconName | ReactElement }
) => {
  return toast.error(message, {
    duration: options?.duration || 6000,
    icon: resolveIcon(options?.icon) ?? TOAST_ICON.error,
    style: getThemedToastStyle("error"),
  });
};

export const showWarningToast = (
  message: string,
  options?: { duration?: number; icon?: ToastIconName | ReactElement }
) => {
  return toast(message, {
    duration: options?.duration || 5000,
    icon: resolveIcon(options?.icon) ?? TOAST_ICON.warning,
    style: getThemedToastStyle("warning"),
  });
};

export const showInfoToast = (
  message: string,
  options?: { duration?: number; icon?: ToastIconName | ReactElement }
) => {
  return toast(message, {
    duration: options?.duration || 4000,
    icon: resolveIcon(options?.icon) ?? TOAST_ICON.info,
    style: getThemedToastStyle("info"),
  });
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    style: getThemedToastStyle("loading"),
  });
};

// Specialized toast functions for leave management with enhanced theming
export const showLeaveSubmissionSuccess = (days: number, leaveType: string) => {
  const dayText = days === 1 ? "day" : "days";
  return toast.success(
    `${leaveType} leave request submitted. ${days} ${dayText} pending approval.`,
    {
      icon: TOAST_ICON.success,
      duration: 6000,
      style: {
        ...getThemedToastStyle("success"),
      },
    }
  );
};

export const showLeaveApprovalSuccess = (
  employeeName: string,
  days: number
) => {
  const dayText = days === 1 ? "day" : "days";
  return toast.success(
    `${employeeName}'s ${days} ${dayText} leave request has been approved.`,
    {
      icon: TOAST_ICON.success,
      duration: 6000,
      style: {
        ...getThemedToastStyle("success"),
      },
    }
  );
};

export const showLeaveRejectionSuccess = (employeeName: string) => {
  return toast(`${employeeName}'s leave request has been rejected.`, {
    icon: TOAST_ICON.error,
    duration: 5000,
    style: {
      ...getThemedToastStyle("warning"),
    },
  });
};

export const showInviteSuccess = (employeeName: string, email: string) => {
  return toast.success(
    `Invitation sent to ${employeeName} (${email}) successfully!`,
    {
      icon: TOAST_ICON.email,
      duration: 7000,
      style: {
        ...getThemedToastStyle("success"),
      },
    }
  );
};

export const showConnectionError = () => {
  return toast.error(
    "Connection error. Please check your internet connection and try again.",
    {
      icon: TOAST_ICON.network,
      duration: 8000,
      style: {
        ...getThemedToastStyle("error"),
      },
    }
  );
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Toast with action info - enhanced with theming
export const showActionToast = (
  message: string,
  actionLabel: string,
  _onAction: () => void, // Prefixed with _ to indicate intentionally unused
  options?: {
    duration?: number;
    icon?: ToastIconName | ReactElement;
    type?: "info" | "warning";
  }
) => {
  const type = options?.type || "info";
  return toast(`${message} - ${actionLabel}`, {
    duration: options?.duration || 8000,
    icon:
      resolveIcon(options?.icon) ??
      (type === "warning" ? TOAST_ICON.warning : TOAST_ICON.info),
    style: {
      ...getThemedToastStyle(type),
    },
  });
};

// Enhanced toast for critical system messages
export const showSystemToast = (
  message: string,
  type: "maintenance" | "update" | "security" = "update",
  options?: { duration?: number }
) => {
  return toast(message, {
    duration: options?.duration || 10000,
    icon: TOAST_ICON[type],
    // The info style already carries the brand rail, so there is nothing to
    // override - this used to restate it, and restate it as `borderLeft`,
    // which put the rail on the wrong side in RTL.
    style: getThemedToastStyle("info"),
  });
};

// Quick success feedback for form submissions
export const showQuickSuccess = (message: string = "Success!") => {
  return toast.success(message, {
    duration: 3000,
    icon: TOAST_ICON.celebrate,
    style: {
      ...getThemedToastStyle("success"),
      fontSize: "13px",
      padding: "10px 14px",
    },
  });
};

// Promise-based toast for async operations
export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: (data) =>
        typeof messages.success === "function"
          ? messages.success(data)
          : messages.success,
      error: (error) =>
        typeof messages.error === "function"
          ? messages.error(error)
          : messages.error,
    },
    {
      style: getThemedToastStyle("loading"),
      success: {
        style: getThemedToastStyle("success"),
      },
      error: {
        style: getThemedToastStyle("error"),
      },
    }
  );
};
