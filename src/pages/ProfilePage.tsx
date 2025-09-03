import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, usersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import { 
  UserIcon, 
  KeyIcon, 
  CameraIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import '../styles/design-system.css';

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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordForm>();

  // Profile picture upload mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/profile-picture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload profile picture');
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      // Use the complete user object from response, fallback to updating just profilePicture
      const updatedUser = response.user ? response.user : { ...user!, profilePicture: response.profilePicture };
      updateUser(updatedUser);
      
      // Force component rerender by invalidating any cached user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
      setTimeout(() => setMessage(null), 5000);
      setUploadingImage(false);
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to upload profile picture' 
      });
      setTimeout(() => setMessage(null), 5000);
      setUploadingImage(false);
    },
  });

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        setTimeout(() => setMessage(null), 5000);
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        setTimeout(() => setMessage(null), 5000);
        return;
      }

      setUploadingImage(true);
      await uploadProfilePictureMutation.mutateAsync(file);
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    const { confirmPassword, ...passwordData } = data;
    await changePasswordMutation.mutateAsync(passwordData);
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="page-container py-8 fade-in">
      {/* Page Header */}
      <div className="page-header -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Profile Settings</h1>
            <p className="page-subtitle">Manage your account settings and preferences</p>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-3">
              <span className="badge badge-primary">{user?.role === 'admin' ? 'Administrator' : 'Employee'}</span>
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{typeof user?.company === 'object' && (user?.company as any)?.name ? (user.company as any).name : user?.company}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 rounded-xl p-4 flex items-center space-x-3 slide-in ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
            : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
          ) : (
            <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
          )}
          <span className={message.type === 'success' ? 'text-green-700 dark:text-green-200' : 'text-red-700 dark:text-red-200'}>
            {message.text}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="card-elevated">
        {/* Tab Navigation */}
        <div style={{ borderBottom: '1px solid var(--border-color)' }}>
          <nav className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              style={{
                color: activeTab === 'profile' ? 'var(--color-primary-600)' : 'var(--text-secondary)'
              }}
            >
              <UserIcon className="w-4 h-4" />
              <span>Profile Information</span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              style={{
                color: activeTab === 'password' ? 'var(--color-primary-600)' : 'var(--text-secondary)'
              }}
            >
              <KeyIcon className="w-4 h-4" />
              <span>Security</span>
            </button>
          </nav>
        </div>

        <div className="card-body">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              {/* Profile Header with Avatar */}
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl border border-primary-200 dark:border-primary-800"
                   style={{ backgroundColor: 'var(--surface-hover)' }}>
                <div className="relative">
                  <Avatar
                    src={user?.profilePicture}
                    name={user?.name}
                    size="2xl"
                    isClickable={!uploadingImage}
                    showUploadIcon={!uploadingImage}
                    onClick={handleAvatarClick}
                    className="hover-lift"
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
                
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                  <div className="flex items-center justify-center sm:justify-start space-x-4 mt-2">
                    <span className="badge badge-primary">{user?.role === 'admin' ? 'Administrator' : 'Employee'}</span>
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>ID: {user?.employeeId}</span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{typeof user?.department === 'object' && (user?.department as any)?.name ? (user.department as any).name : user?.department} • {user?.position}</p>
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploadingImage}
                    className="btn-ghost mt-3 text-sm"
                  >
                    <CameraIcon className="w-4 h-4 mr-1" />
                    {uploadingImage ? 'Uploading...' : 'Change Photo'}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Profile Form */}
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Editable Fields */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...profileForm.register('name', { required: 'Name is required' })}
                      className="input-field"
                      placeholder="Enter your full name"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      {...profileForm.register('phone')}
                      className="input-field"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Read-only Fields */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input-field bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Contact administrator to change email address
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={user?.employeeId || ''}
                      disabled
                      className="input-field bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      value={typeof user?.department === 'object' && (user?.department as any)?.name ? (user.department as any).name : user?.department || ''}
                      disabled
                      className="input-field bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Position
                    </label>
                    <input
                      type="text"
                      value={user?.position || ''}
                      disabled
                      className="input-field bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Saving...</span>
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-6">
              <div className="p-6 bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <ExclamationCircleIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Password Security</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Choose a strong password with at least 8 characters, including numbers and special characters.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      {...passwordForm.register('currentPassword', {
                        required: 'Current password is required',
                      })}
                      className="input-field pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      {...passwordForm.register('newPassword', {
                        required: 'New password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                      })}
                      className="input-field pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      {...passwordForm.register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === passwordForm.watch('newPassword') || 'Passwords do not match',
                      })}
                      className="input-field pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="btn-primary"
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Updating...</span>
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;