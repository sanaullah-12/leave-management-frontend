import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PasswordInput from '../components/PasswordInput';
import { 
  KeyIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

interface TokenValidation {
  valid: boolean;
  user?: {
    name: string;
    email: string;
  };
}

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { isDark } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [tokenValidation, setTokenValidation] = useState<TokenValidation | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const password = watch('password');

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`);
        setTokenValidation(response.data);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Invalid or expired reset token');
        setTokenValidation({ valid: false });
      } finally {
        setIsLoadingToken(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsSubmitting(true);
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`, {
        password: data.password
      });
      setSuccess(true);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValidation?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Invalid Reset Link</h2>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg border border-gray-200 dark:border-gray-700 sm:rounded-lg sm:px-10 text-center">
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex">
                  <ClockIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p><strong>Reset links expire after 15 minutes</strong></p>
                    <p className="mt-1">For security reasons, password reset links have a short expiration time.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Link
                  to="/forgot-password"
                  className="btn-primary"
                >
                  Request New Reset Link
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Password Reset Complete</h2>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg border border-gray-200 dark:border-gray-700 sm:rounded-lg sm:px-10 text-center">
            <Link
              to="/login"
              className="btn-primary w-full"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <KeyIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Reset Your Password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create a new password for your account
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg border border-gray-200 dark:border-gray-700 sm:rounded-lg sm:px-10">
          {/* User Info */}
          {tokenValidation?.user && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Resetting password for:</h3>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">{tokenValidation.user.name}</p>
                <p>{tokenValidation.user.email}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <PasswordInput
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                label="New Password"
                placeholder="Enter your new password"
                error={errors.password?.message}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              />
            </div>

            <div>
              <PasswordInput
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                label="Confirm New Password"
                placeholder="Confirm your new password"
                error={errors.confirmPassword?.message}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md p-3">
              <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">Password Requirements:</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center">
                  <span className={`mr-2 ${password && password.length >= 6 ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {password && password.length >= 6 ? '✓' : '○'}
                  </span>
                  At least 6 characters long
                </li>
              </ul>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Reset Password'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Remember your password? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;