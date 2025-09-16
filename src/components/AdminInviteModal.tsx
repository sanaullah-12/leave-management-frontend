import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
// import { useNotifications } from '../components/NotificationSystem'; // Removed for Socket.IO implementation
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
  // const { addNotification } = useNotifications(); // Removed for Socket.IO implementation

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
      
      // addNotification({
      //   type: 'success',
      //   title: 'Admin Invited',
      //   message: `Admin invitation sent to ${variables.email} successfully.`,
      // });
      console.log('Admin invitation sent successfully to', variables.email);
    },
    onError: (error: any) => {
      // addNotification({
      //   type: 'error',
      //   title: 'Admin Invitation Failed',
      //   message: error?.response?.data?.message || 'Failed to send admin invitation. Please try again.',
      // });
      console.error('Admin invitation failed:', error?.response?.data?.message || error.message);
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
        <div className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
            <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              New Administrator
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Grant admin privileges to manage employees
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="flex items-center text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
              Full Name
            </label>
            <input
              type="text"
              {...register('name', { required: 'Full name is required' })}
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
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
            <label className="flex items-center text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
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
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
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
              <label className="flex items-center text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                Department (Optional)
              </label>
              <input
                type="text"
                {...register('department')}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                placeholder="Administration"
              />
            </div>

            {/* Position */}
            <div>
              <label className="flex items-center text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                <BriefcaseIcon className="w-4 h-4 mr-2 text-gray-400" />
                Position (Optional)
              </label>
              <input
                type="text"
                {...register('position')}
                className="w-full px-4 py-3 rounded-lg border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                placeholder="Administrator"
              />
            </div>
          </div>

          {/* Admin Privileges Notice */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Administrator Privileges
              </p>
            </div>
            <ul className="text-sm mt-2 space-y-1 list-disc list-inside text-blue-700 dark:text-blue-300">
              <li>Manage all employees in the organization</li>
              <li>Approve or reject leave requests</li>
              <li>View company-wide reports and analytics</li>
              <li>Configure leave policies and settings</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 text-sm font-medium rounded-lg transition-colors bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            disabled={inviteAdminMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={inviteAdminMutation.isPending}
            className="btn-primary px-8 py-3 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
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