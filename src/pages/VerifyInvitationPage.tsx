import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PasswordInput from '../components/PasswordInput';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface VerifyInvitationForm {
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

const VerifyInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
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
  } = useForm<VerifyInvitationForm>();

  const password = watch('password');

  useEffect(() => {
    const fetchInvitationDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/invitation/${token}`);
        setInvitation(response.data.user);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Invalid invitation link');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitationDetails();
    }
  }, [token]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/login" 
            className="btn-primary inline-block"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Verified!</h2>
          <p className="text-gray-600 mb-6">
            Your account has been successfully verified. You will be redirected to the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: VerifyInvitationForm) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-invitation/${token}`, {
        password: data.password
      });

      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setSuccess(true);
      
      // Redirect after a brief delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to verify invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900">Complete Your Registration</h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join the team!
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Invitation Details */}
          {invitation && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Invitation Details</h3>
              <dl className="text-sm text-blue-800 space-y-1">
                <div className="flex justify-between">
                  <dt className="font-medium">Name:</dt>
                  <dd>{invitation.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Email:</dt>
                  <dd>{invitation.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Role:</dt>
                  <dd className="capitalize">{invitation.role}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Company:</dt>
                  <dd>{invitation.company}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Invited by:</dt>
                  <dd>{invitation.invitedBy}</dd>
                </div>
              </dl>
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
                label="Create Password"
                placeholder="Enter your password"
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
                label="Confirm Password"
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Complete Registration'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <a href="/login" className="text-sm text-primary-600 hover:text-primary-500">
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyInvitationPage;