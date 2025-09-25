import toast from 'react-hot-toast';

// Custom toast helper functions for consistent notifications across the app

export const showSuccessToast = (message: string, options?: { duration?: number; icon?: string }) => {
  return toast.success(message, {
    duration: options?.duration || 5000,
    icon: options?.icon || '✅',
    style: {
      borderLeft: '4px solid #10b981',
    },
  });
};

export const showErrorToast = (message: string, options?: { duration?: number; icon?: string }) => {
  return toast.error(message, {
    duration: options?.duration || 6000,
    icon: options?.icon || '❌',
    style: {
      borderLeft: '4px solid #ef4444',
    },
  });
};

export const showWarningToast = (message: string, options?: { duration?: number; icon?: string }) => {
  return toast(message, {
    duration: options?.duration || 5000,
    icon: options?.icon || '⚠️',
    style: {
      borderLeft: '4px solid #f59e0b',
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-primary)',
    },
  });
};

export const showInfoToast = (message: string, options?: { duration?: number; icon?: string }) => {
  return toast(message, {
    duration: options?.duration || 4000,
    icon: options?.icon || 'ℹ️',
    style: {
      borderLeft: '4px solid #3b82f6',
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-primary)',
    },
  });
};

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    style: {
      borderLeft: '4px solid #6b7280',
    },
  });
};

// Specialized toast functions for leave management
export const showLeaveSubmissionSuccess = (days: number, leaveType: string) => {
  const dayText = days === 1 ? 'day' : 'days';
  const typeEmoji = getLeaveTypeEmoji(leaveType);

  return showSuccessToast(
    `${typeEmoji} Leave request submitted! ${days} ${dayText} pending approval.`,
    { icon: '✅' }
  );
};

export const showLeaveApprovalSuccess = (employeeName: string, days: number) => {
  const dayText = days === 1 ? 'day' : 'days';
  return showSuccessToast(
    `${employeeName}'s ${days} ${dayText} leave request has been approved.`,
    { icon: '✅' }
  );
};

export const showLeaveRejectionSuccess = (employeeName: string) => {
  return showWarningToast(
    `${employeeName}'s leave request has been rejected.`,
    { icon: '❌' }
  );
};

export const showInviteSuccess = (employeeName: string, email: string) => {
  return showSuccessToast(
    `Invitation sent to ${employeeName} (${email}) successfully!`,
    { icon: '📧', duration: 6000 }
  );
};

export const showConnectionError = () => {
  return showErrorToast(
    'Connection error. Please check your internet connection and try again.',
    { icon: '🌐', duration: 8000 }
  );
};

// Helper function to get emoji for leave types
const getLeaveTypeEmoji = (leaveType: string): string => {
  switch (leaveType?.toLowerCase()) {
    case 'annual': return '🏖️';
    case 'sick': return '🏥';
    case 'casual': return '📅';
    case 'maternity': return '👶';
    case 'paternity': return '👨‍👶';
    case 'emergency': return '🚨';
    default: return '📋';
  }
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Toast with action info - simplified for TypeScript compatibility
export const showActionToast = (
  message: string,
  actionLabel: string,
  _onAction: () => void, // Prefixed with _ to indicate intentionally unused
  options?: { duration?: number; icon?: string }
) => {
  return toast(
    `${message} - ${actionLabel}`,
    {
      duration: options?.duration || 8000,
      icon: options?.icon || 'ℹ️',
    }
  );
};