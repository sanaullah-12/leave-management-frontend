import toast from "react-hot-toast";

// Helper function to detect if dark mode is active
const isDarkMode = () => {
  return (
    document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
};

// Get themed styles for different toast types
const getThemedToastStyle = (
  type: "success" | "error" | "warning" | "info" | "loading"
) => {
  const isDark = isDarkMode();

  const baseStyle = {
    background: isDark ? "#1f2937" : "#ffffff", // gray-800 : white
    color: isDark ? "#f9fafb" : "#111827", // gray-50 : gray-900
    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`, // gray-700 : gray-200
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    padding: "12px 16px",
    boxShadow: isDark
      ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)"
      : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  };

  const borderColors = {
    success: "#10b981", // emerald-500
    error: "#ef4444", // red-500
    warning: "#f59e0b", // amber-500
    info: "#3b82f6", // blue-500
    loading: "#6b7280", // gray-500
  };

  return {
    ...baseStyle,
    borderLeft: `4px solid ${borderColors[type]}`,
  };
};

// Custom toast helper functions with consistent theming
export const showSuccessToast = (
  message: string,
  options?: { duration?: number; icon?: string }
) => {
  return toast.success(message, {
    duration: options?.duration || 5000,
    icon: options?.icon || "✅",
    style: getThemedToastStyle("success"),
  });
};

export const showErrorToast = (
  message: string,
  options?: { duration?: number; icon?: string }
) => {
  return toast.error(message, {
    duration: options?.duration || 6000,
    icon: options?.icon || "❌",
    style: getThemedToastStyle("error"),
  });
};

export const showWarningToast = (
  message: string,
  options?: { duration?: number; icon?: string }
) => {
  return toast(message, {
    duration: options?.duration || 5000,
    icon: options?.icon || "⚠️",
    style: getThemedToastStyle("warning"),
  });
};

export const showInfoToast = (
  message: string,
  options?: { duration?: number; icon?: string }
) => {
  return toast(message, {
    duration: options?.duration || 4000,
    icon: options?.icon || "ℹ️",
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
  const typeEmoji = getLeaveTypeEmoji(leaveType);
  const isDark = isDarkMode();

  return toast.success(
    `${typeEmoji} Leave request submitted! ${days} ${dayText} pending approval.`,
    {
      icon: "✅",
      duration: 6000,
      style: {
        ...getThemedToastStyle("success"),
        background: isDark
          ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" // dark emerald gradient
          : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", // light emerald gradient
      },
    }
  );
};

export const showLeaveApprovalSuccess = (
  employeeName: string,
  days: number
) => {
  const dayText = days === 1 ? "day" : "days";
  const isDark = isDarkMode();

  return toast.success(
    `${employeeName}'s ${days} ${dayText} leave request has been approved.`,
    {
      icon: "✅",
      duration: 6000,
      style: {
        ...getThemedToastStyle("success"),
        background: isDark
          ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
          : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
      },
    }
  );
};

export const showLeaveRejectionSuccess = (employeeName: string) => {
  const isDark = isDarkMode();

  return toast(`${employeeName}'s leave request has been rejected.`, {
    icon: "❌",
    duration: 5000,
    style: {
      ...getThemedToastStyle("warning"),
      background: isDark
        ? "linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)" // dark amber gradient
        : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", // light amber gradient
    },
  });
};

export const showInviteSuccess = (employeeName: string, email: string) => {
  const isDark = isDarkMode();

  return toast.success(
    `Invitation sent to ${employeeName} (${email}) successfully!`,
    {
      icon: "📧",
      duration: 7000,
      style: {
        ...getThemedToastStyle("success"),
        background: isDark
          ? "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)" // dark blue gradient
          : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", // light blue gradient
      },
    }
  );
};

export const showConnectionError = () => {
  const isDark = isDarkMode();

  return toast.error(
    "Connection error. Please check your internet connection and try again.",
    {
      icon: "🌐",
      duration: 8000,
      style: {
        ...getThemedToastStyle("error"),
        background: isDark
          ? "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)" // dark red gradient
          : "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)", // light red gradient
      },
    }
  );
};

// Helper function to get emoji for leave types
const getLeaveTypeEmoji = (leaveType: string): string => {
  switch (leaveType?.toLowerCase()) {
    case "annual":
      return "🏖️";
    case "sick":
      return "🏥";
    case "casual":
      return "📅";
    case "maternity":
      return "👶";
    case "paternity":
      return "👨‍👶";
    case "emergency":
      return "🚨";
    default:
      return "📋";
  }
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
  options?: { duration?: number; icon?: string; type?: "info" | "warning" }
) => {
  const type = options?.type || "info";
  const isDark = isDarkMode();

  return toast(`${message} - ${actionLabel}`, {
    duration: options?.duration || 8000,
    icon: options?.icon || (type === "warning" ? "⚠️" : "ℹ️"),
    style: {
      ...getThemedToastStyle(type),
      background: isDark
        ? type === "warning"
          ? "linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)"
          : "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)"
        : type === "warning"
        ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
        : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    },
  });
};

// Enhanced toast for critical system messages
export const showSystemToast = (
  message: string,
  type: "maintenance" | "update" | "security" = "update",
  options?: { duration?: number }
) => {
  const isDark = isDarkMode();
  const icons = { maintenance: "🔧", update: "🔄", security: "🔒" };

  return toast(message, {
    duration: options?.duration || 10000,
    icon: icons[type],
    style: {
      ...getThemedToastStyle("info"),
      background: isDark
        ? "linear-gradient(135deg, #312e81 0%, #3730a3 100%)" // dark indigo gradient
        : "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", // light sky gradient
      borderLeft: "4px solid #6366f1", // indigo-500
    },
  });
};

// Quick success feedback for form submissions
export const showQuickSuccess = (message: string = "Success!") => {
  const isDark = isDarkMode();

  return toast.success(message, {
    duration: 3000,
    icon: "🎉",
    style: {
      ...getThemedToastStyle("success"),
      background: isDark
        ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
        : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
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
