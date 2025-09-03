import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { authAPI, usersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PasswordInput from '../components/PasswordInput';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface ProfileForm {
  name: string;
  phone: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordForm>();

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => usersAPI.updateEmployee(user!.id, data),
    onSuccess: (response) => {
      updateUser(response.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      passwordForm.reset();
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    const { confirmPassword, ...passwordData } = data;
    await changePasswordMutation.mutateAsync(passwordData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Change Password
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCircleIcon className="h-12 w-12 text-gray-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <p className="text-sm text-gray-500">
                    {user?.role === 'admin' ? 'Administrator' : 'Employee'} • {user?.company}
                  </p>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      {...profileForm.register('name', { required: 'Name is required' })}
                      className="mt-1 input-field"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      {...profileForm.register('phone')}
                      className="mt-1 input-field"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1 input-field bg-gray-50 cursor-not-allowed"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Email cannot be changed. Contact your administrator if needed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={user?.employeeId || ''}
                      disabled
                      className="mt-1 input-field bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <input
                      type="text"
                      value={user?.department || ''}
                      disabled
                      className="mt-1 input-field bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position
                    </label>
                    <input
                      type="text"
                      value={user?.position || ''}
                      disabled
                      className="mt-1 input-field bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary"
                  >
                    {updateProfileMutation.isPending ? <LoadingSpinner size="sm" /> : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-600">
                  Ensure your account is using a strong password to stay secure.
                </p>
              </div>

              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div>
                  <PasswordInput
                    {...passwordForm.register('currentPassword', {
                      required: 'Current password is required',
                    })}
                    label="Current Password"
                    error={passwordForm.formState.errors.currentPassword?.message}
                  />
                </div>

                <div>
                  <PasswordInput
                    {...passwordForm.register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    label="New Password"
                    error={passwordForm.formState.errors.newPassword?.message}
                  />
                </div>

                <div>
                  <PasswordInput
                    {...passwordForm.register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === passwordForm.watch('newPassword') || 'Passwords do not match',
                    })}
                    label="Confirm New Password"
                    error={passwordForm.formState.errors.confirmPassword?.message}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="btn-primary"
                  >
                    {changePasswordMutation.isPending ? <LoadingSpinner size="sm" /> : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;