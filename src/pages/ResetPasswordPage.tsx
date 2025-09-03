import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
        const response = await axios.get(`http://localhost:5000/api/auth/reset-password/${token}`);
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
      await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValidation?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900">Invalid Reset Link</h2>
            <p className="mt-4 text-sm text-gray-600">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <ClockIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                  <div className="text-sm text-yellow-800">
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
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-gray-900">Password Reset Complete</h2>
            <p className="mt-4 text-sm text-gray-600">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <KeyIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900">Reset Your Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a new password for your account
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* User Info */}
          {tokenValidation?.user && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Resetting password for:</h3>
              <div className="text-sm text-blue-800">
                <p className="font-medium">{tokenValidation.user.name}</p>
                <p>{tokenValidation.user.email}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
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
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <h4 className="text-xs font-medium text-gray-900 mb-2">Password Requirements:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className={`mr-2 ${password && password.length >= 6 ? 'text-green-500' : 'text-gray-400'}`}>
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
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Reset Password'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary-600 hover:text-primary-500"
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