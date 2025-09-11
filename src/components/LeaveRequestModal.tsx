import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesAPI } from '../services/api';
import { useNotifications } from '../components/NotificationSystem';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  PaperClipIcon, 
  UserIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

type LeaveRequestData = {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  emergencyContact?: string;
  emergencyPhone?: string;
};

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [attachments, setAttachments] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LeaveRequestData>();

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const submitLeaveRequestMutation = useMutation({
    mutationFn: leavesAPI.submitLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      reset();
      setAttachments([]);
      onClose();
      
      addNotification({
        type: 'success',
        title: 'Leave Request Submitted',
        message: 'Your leave request has been submitted successfully and is pending approval.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error?.response?.data?.message || 'Failed to submit leave request. Please try again.',
      });
    },
  });

  const onSubmit = async (data: LeaveRequestData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    
    attachments.forEach((file) => {
      formData.append('attachments', file);
    });

    await submitLeaveRequestMutation.mutateAsync(formData as any);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    reset();
    setAttachments([]);
    onClose();
  };


  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Leave" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Employee Profile Header */}
        <div className="flex items-center space-x-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              {user?.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {user?.position} • {user?.department}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Employee ID: {user?.employeeId}
            </p>
          </div>
          {calculateDays() > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary-600)' }}>
                {calculateDays()}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {calculateDays() === 1 ? 'Day' : 'Days'}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leave Type */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-400" />
              Leave Type
            </label>
            <select
              {...register('leaveType', { required: 'Leave type is required' })}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: errors.leaveType ? '#ef4444' : 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Select leave type</option>
              <option value="annual">🏖️ Annual Leave</option>
              <option value="sick">🏥 Sick Leave</option>
              <option value="casual">📅 Casual Leave</option>
              <option value="maternity">👶 Maternity Leave</option>
              <option value="paternity">👨‍👶 Paternity Leave</option>
            </select>
            {errors.leaveType && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.leaveType.message}
              </p>
            )}
          </div>

          {/* Duration Badge */}
          <div className="flex items-end">
            {calculateDays() > 0 && (
              <div className="flex-1 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)' }}>
                <div className="text-center">
                  <ClockIcon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Duration
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--color-primary-600)' }}>
                    {calculateDays()} {calculateDays() === 1 ? 'Day' : 'Days'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-400" />
              Start Date
            </label>
            <input
              type="date"
              {...register('startDate', { required: 'Start date is required' })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: errors.startDate ? '#ef4444' : 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            {errors.startDate && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.startDate.message}
              </p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-400" />
              End Date
            </label>
            <input
              type="date"
              {...register('endDate', { required: 'End date is required' })}
              min={startDate || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: errors.endDate ? '#ef4444' : 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            {errors.endDate && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.endDate.message}
              </p>
            )}
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
              Emergency Contact
            </label>
            <input
              type="text"
              {...register('emergencyContact')}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              placeholder="Contact person name"
            />
          </div>

          {/* Emergency Phone */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
              Emergency Phone
            </label>
            <input
              type="tel"
              {...register('emergencyPhone')}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Reason */}
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-400" />
              Reason for Leave
            </label>
            <textarea
              {...register('reason', { required: 'Reason is required' })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: errors.reason ? '#ef4444' : 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              placeholder="Please provide a brief explanation for your leave request..."
            />
            {errors.reason && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* File Attachments */}
          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <PaperClipIcon className="w-4 h-4 mr-2 text-gray-400" />
              Attachments (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            
            {/* Display Attachments */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--surface-hover)' }}
                  >
                    <div className="flex items-center">
                      <PaperClipIcon className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {file.name}
                      </span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Warning for Extended Leave */}
        {calculateDays() > 5 && (
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Extended Leave Notice
              </p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              This is an extended leave request ({calculateDays()} days). Please ensure your responsibilities are properly delegated and approved by your manager.
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
            disabled={submitLeaveRequestMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLeaveRequestMutation.isPending || calculateDays() === 0}
            className="px-8 py-3 text-sm font-medium text-white rounded-lg transition-colors bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {submitLeaveRequestMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Submitting...</span>
              </>
            ) : (
              <>
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LeaveRequestModal;