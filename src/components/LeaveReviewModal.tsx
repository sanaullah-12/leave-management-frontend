import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesAPI } from '../services/api';
import { showLeaveApprovalSuccess, showLeaveRejectionSuccess, showErrorToast } from '../utils/toastHelpers';
// import { useNotifications } from '../components/NotificationSystem'; // Removed for Socket.IO implementation
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentTextIcon, 
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type ReviewData = {
  reviewComments: string;
  action: 'approve' | 'reject';
};

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: any;
  action: 'approve' | 'reject';
}

const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  leave, 
  action 
}) => {
  const queryClient = useQueryClient();
  // const { addNotification } = useNotifications(); // Removed for Socket.IO implementation

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewData>({
    defaultValues: { action }
  });

  const reviewLeaveMutation = useMutation({
    mutationFn: ({ leaveId, status, reviewComments }: { leaveId: string; status: string; reviewComments?: string }) =>
      leavesAPI.reviewLeave(leaveId, { status, reviewComments }),
    onSuccess: (data) => {
      // Show success toast with custom helper
      const employeeName = leave?.employee?.name || 'Employee';
      const days = calculateDays();

      if (action === 'approve') {
        showLeaveApprovalSuccess(employeeName, days);
      } else {
        showLeaveRejectionSuccess(employeeName);
      }

      // Refresh data - this ensures UI updates for both admin and employee
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });

      // Clean up and close
      reset();
      onClose();

      console.log(`Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully:`, data);
    },
    onError: (error: any) => {
      // Show error toast with custom helper
      const errorMessage = error?.response?.data?.message || `Failed to ${action} leave request. Please try again.`;
      showErrorToast(errorMessage);

      console.error(`Failed to ${action} leave request:`, error?.response?.data?.message || error.message);
    },
  });

  const onSubmit = async (data: ReviewData) => {
    await reviewLeaveMutation.mutateAsync({
      leaveId: leave._id,
      status: action,
      reviewComments: data.reviewComments || undefined
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!leave) return null;

  const calculateDays = () => {
    if (leave.startDate && leave.endDate) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'annual': return '🏖️';
      case 'sick': return '🏥';
      case 'casual': return '📅';
      case 'maternity': return '👶';
      case 'paternity': return '👨‍👶';
      default: return '📋';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={`${action === 'approve' ? 'Approve' : 'Reject'} Leave Request`} 
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Employee Info Header */}
        <div className="flex items-center space-x-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              {leave.employee?.name || 'Employee'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {leave.employee?.position} • {leave.employee?.department}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Employee ID: {leave.employee?.employeeId}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            action === 'approve' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {action === 'approve' ? (
              <CheckCircleIcon className="w-4 h-4 inline mr-1" />
            ) : (
              <XCircleIcon className="w-4 h-4 inline mr-1" />
            )}
            {action === 'approve' ? 'Approving' : 'Rejecting'}
          </div>
        </div>

        {/* Leave Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leave Type */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)' }}>
            <div className="flex items-center mb-2">
              <CalendarDaysIcon className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Leave Type
              </span>
            </div>
            <div className="text-lg font-medium flex items-center" style={{ color: 'var(--text-primary)' }}>
              <span className="mr-2">{getLeaveTypeIcon(leave.leaveType)}</span>
              <span className="capitalize">{leave.leaveType} Leave</span>
            </div>
          </div>

          {/* Duration */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)' }}>
            <div className="flex items-center mb-2">
              <ClockIcon className="w-5 h-5 mr-2 text-green-500" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Duration
              </span>
            </div>
            <div className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              {calculateDays()} {calculateDays() === 1 ? 'Day' : 'Days'}
            </div>
          </div>

          {/* Date Range */}
          <div className="md:col-span-2 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)' }}>
            <div className="flex items-center mb-2">
              <CalendarDaysIcon className="w-5 h-5 mr-2 text-purple-500" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Date Range
              </span>
            </div>
            <div className="text-lg" style={{ color: 'var(--text-primary)' }}>
              <span className="font-medium">
                {new Date(leave.startDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <span className="mx-3 text-gray-400">→</span>
              <span className="font-medium">
                {new Date(leave.endDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-400" />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Employee's Reason
              </span>
            </div>
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--surface-hover)' }}
            >
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {leave.reason || 'No reason provided'}
              </p>
            </div>
          </div>

          {/* Emergency Contact */}
          {(leave.emergencyContact || leave.emergencyPhone) && (
            <div className="md:col-span-2">
              <div className="flex items-center mb-2">
                <UserIcon className="w-5 h-5 mr-2 text-orange-500" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Emergency Contact
                </span>
              </div>
              <div className="p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4" style={{ backgroundColor: 'var(--surface-hover)' }}>
                {leave.emergencyContact && (
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Contact Person
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {leave.emergencyContact}
                    </div>
                  </div>
                )}
                {leave.emergencyPhone && (
                  <div>
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Phone Number
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {leave.emergencyPhone}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Review Comments */}
        <div>
          <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-400" />
            Review Comments {action === 'reject' ? '(Required)' : '(Optional)'}
          </label>
          <textarea
            {...register('reviewComments', action === 'reject' ? { required: 'Please provide a reason for rejection' } : {})}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: errors.reviewComments ? '#ef4444' : 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
            placeholder={
              action === 'approve' 
                ? 'Optional comments about the approval...' 
                : 'Please explain why this leave request is being rejected...'
            }
          />
          {errors.reviewComments && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              {errors.reviewComments.message}
            </p>
          )}
        </div>

        {/* Warning for Extended Leave Approval */}
        {action === 'approve' && calculateDays() > 10 && (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Extended Leave Approval
              </p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              You're approving an extended leave request ({calculateDays()} days). Please ensure adequate coverage arrangements are in place.
            </p>
          </div>
        )}

        {/* Warning for Rejection */}
        {action === 'reject' && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Leave Rejection Notice
              </p>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              The employee will be notified of the rejection and your comments. Please provide clear reasoning to help them understand the decision.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 text-sm font-medium rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--surface-hover)', 
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)'
            }}
            disabled={reviewLeaveMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={reviewLeaveMutation.isPending}
            className={`px-8 py-3 text-sm font-medium text-white rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center ${
              action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            {reviewLeaveMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              <>
                {action === 'approve' ? (
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                ) : (
                  <XCircleIcon className="w-4 h-4 mr-2" />
                )}
                {action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LeaveReviewModal;