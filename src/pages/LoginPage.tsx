import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import BrandedLoader from "../components/BrandedLoader";
import AuthLayout from "../components/AuthLayout";
import InlineLoader from "../components/InlineLoader";
import { showInfoToast } from "../utils/toastHelpers";
import { GoogleIcon, MicrosoftIcon } from "../components/BrandIcons";

interface LoginCredentials {
  email: string;
  password: string;
}

const inputClass =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-blue-500/10";

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  if (isAuthenticated) return <Navigate to="/" replace />;
  if (isLoading) return <BrandedLoader message="Preparing your workspace..." />;

  const onSubmit = async (data: LoginCredentials) => {
    setIsSubmitting(true);
    setError("");
    try {
      await login(data);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSSO = (provider: string) =>
    showInfoToast(`${provider} sign-in isn't set up yet — use your email below.`);

  return (
    <AuthLayout activeTab="login">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        New to LeaveFlow?{" "}
        <Link
          to="/register"
          className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Create an account
        </Link>
      </p>

      {/* Social */}
      <div className="mt-7 grid grid-cols-2 gap-3">
        {[
          { name: "Google", Icon: GoogleIcon },
          { name: "Microsoft", Icon: MicrosoftIcon },
        ].map(({ name, Icon }) => (
          <motion.button
            key={name}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSSO(name)}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Icon className="h-5 w-5" />
            {name}
          </motion.button>
        ))}
      </div>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Or continue with email
        </span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
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

        <PasswordInput
          {...register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "Password must be at least 6 characters" },
          })}
          autoComplete="current-password"
          placeholder="Password"
          error={errors.password?.message}
          className={inputClass}
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Forgot password?
          </Link>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.99 }}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl disabled:opacity-70"
        >
          {isSubmitting ? <InlineLoader label="Signing in..." /> : "Sign in"}
        </motion.button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
