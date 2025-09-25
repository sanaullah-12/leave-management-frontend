import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PasswordInput from '../components/PasswordInput';
import { CheckCircleIcon, XCircleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface AcceptInviteForm {
  password: string;
  confirmPassword: string;
}

interface InvitationData {
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  company: string;
  invitedBy: string;
}

const AcceptInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptInviteForm>();

  const password = watch('password');

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    const fetchInvitationDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/invitation/${token}`);
        setInvitation(response.data.user);
      } catch (error: any) {
        console.error('Invitation fetch error:', error);
        setError(error.response?.data?.message || 'Invalid or expired invitation link');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitationDetails();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Go to Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-secondary w-full"
            >
              Register New Company
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to the Team!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account has been successfully created and verified.
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mb-6">
            Redirecting to your dashboard in a moment...
          </p>
          <div className="animate-pulse">
            <LoadingSpinner size="sm" />
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: AcceptInviteForm) => {
    setIsSubmitting(true);
    setError('');

    try {
      console.log('Submitting invitation acceptance:', { token, hasPassword: !!data.password });

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-invitation/${token}`, {
        password: data.password
      });

      console.log('Invitation accepted successfully:', response.data);

      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      setSuccess(true);

      // Redirect after showing success message
      setTimeout(() => {
        window.location.href = '/'; // Force full page reload to update auth context
      }, 2500);

    } catch (error: any) {
      console.error('Invitation acceptance error:', error);
      setError(error.response?.data?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <UserPlusIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Accept Your Invitation</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your password to join the team
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl border border-gray-200 dark:border-gray-700 sm:rounded-lg sm:px-10">
          {/* Invitation Details Card */}
          {invitation && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Invitation Details
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-700">
                  <span className="font-medium text-blue-800 dark:text-blue-200">Name:</span>
                  <span className="text-blue-900 dark:text-blue-100 font-semibold">{invitation.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-700">
                  <span className="font-medium text-blue-800 dark:text-blue-200">Email:</span>
                  <span className="text-blue-900 dark:text-blue-100">{invitation.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-700">
                  <span className="font-medium text-blue-800 dark:text-blue-200">Position:</span>
                  <span className="text-blue-900 dark:text-blue-100">{invitation.position}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-700">
                  <span className="font-medium text-blue-800 dark:text-blue-200">Department:</span>
                  <span className="text-blue-900 dark:text-blue-100">{invitation.department}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-700">
                  <span className="font-medium text-blue-800 dark:text-blue-200">Company:</span>
                  <span className="text-blue-900 dark:text-blue-100 font-semibold">{invitation.company}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-blue-800 dark:text-blue-200">Invited by:</span>
                  <span className="text-blue-900 dark:text-blue-100">{invitation.invitedBy}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <XCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <PasswordInput
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                  }
                })}
                label="Create Password"
                placeholder="Enter a secure password"
                error={errors.password?.message}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <PasswordInput
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                label="Confirm Password"
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3 text-base font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-5 w-5" />
                    <span>Accept Invitation & Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Already have an account?
              </p>
              <button
                onClick={() => navigate('/login')}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign in instead
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;