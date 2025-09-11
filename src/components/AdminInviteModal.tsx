import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNotifications } from '../components/NotificationSystem';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { UserIcon, EnvelopeIcon, BuildingOfficeIcon, BriefcaseIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

type InviteAdminData = {
  name: string;
  email: string;
  department?: string;
  position?: string;
};

interface AdminInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminInviteModal: React.FC<AdminInviteModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteAdminData>({
    defaultValues: {
      department: 'Administration',
      position: 'Administrator'
    }
  });

  const inviteAdminMutation = useMutation({
    mutationFn: (data: InviteAdminData) =>
      axios.post(`${import.meta.env.VITE_API_URL}/auth/invite-admin`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      reset();
      onClose();
      
      addNotification({
        type: 'success',
        title: 'Admin Invited',
        message: `Admin invitation sent to ${variables.email} successfully.`,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Admin Invitation Failed',
        message: error?.response?.data?.message || 'Failed to send admin invitation. Please try again.',
      });
    },
  });

  const onSubmit = async (data: InviteAdminData) => {
    await inviteAdminMutation.mutateAsync(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Administrator" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Admin Profile Header */}
        <div className="flex items-center space-x-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-hover)' }}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center">
            <ShieldCheckIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              New Administrator
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Grant admin privileges to manage employees
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
              Full Name
            </label>
            <input
              type="text"
              {...register('name', { required: 'Full name is required' })}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: errors.name ? '#ef4444' : 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              placeholder="Enter administrator name"
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
              Email Address
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: errors.email ? '#ef4444' : 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              placeholder="admin@company.com"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department */}
            <div>
              <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                Department (Optional)
              </label>
              <input
                type="text"
                {...register('department')}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Administration"
              />
            </div>

            {/* Position */}
            <div>
              <label className="flex items-center text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                <BriefcaseIcon className="w-4 h-4 mr-2 text-gray-400" />
                Position (Optional)
              </label>
              <input
                type="text"
                {...register('position')}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                style={{ 
                  backgroundColor: 'var(--surface)', 
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                placeholder="Administrator"
              />
            </div>
          </div>

          {/* Admin Privileges Notice */}
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Administrator Privileges
              </p>
            </div>
            <ul className="text-sm text-purple-700 dark:text-purple-300 mt-2 space-y-1 list-disc list-inside">
              <li>Manage all employees in the organization</li>
              <li>Approve or reject leave requests</li>
              <li>View company-wide reports and analytics</li>
              <li>Configure leave policies and settings</li>
            </ul>
          </div>
        </div>

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
            disabled={inviteAdminMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={inviteAdminMutation.isPending}
            className="px-8 py-3 text-sm font-medium text-white rounded-lg transition-colors bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {inviteAdminMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Sending...</span>
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                Send Admin Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminInviteModal;