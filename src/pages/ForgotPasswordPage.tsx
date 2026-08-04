import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { authAPI } from "../services/api";
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import AuthLayout from "../components/AuthLayout";
import InlineLoader from "../components/InlineLoader";

interface ForgotPasswordForm {
  email: string;
}

const inputClass =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-blue-500/10";

const ForgotPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    setError("");
    try {
      await authAPI.forgotPassword(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthLayout activeTab="login">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10"
          >
            <CheckCircleIcon className="h-9 w-9 text-emerald-500" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Check your email
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            If an account exists with that email, we've sent a password reset
            link. Click it to create a new password.
          </p>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
          <ClockIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            The reset link expires in <strong>15 minutes</strong>. Don't see it?
            Check your spam folder.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => {
              setSuccess(false);
              setError("");
            }}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl"
          >
            Try a different email
          </button>
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout activeTab="login">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
        <EnvelopeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Forgot password?
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email address",
              },
            })}
            type="email"
            autoComplete="email"
            placeholder="Work email"
            className={inputClass}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.99 }}
          className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-70"
        >
          {isSubmitting ? (
            <InlineLoader label="Sending link..." />
          ) : (
            "Send reset link"
          )}
        </motion.button>
      </form>

      <Link
        to="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to login
      </Link>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
