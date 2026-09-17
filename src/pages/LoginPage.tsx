import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import Input from "../components/ui/Input";
import BrandedLoader from "../components/BrandedLoader";
import AuthLayout from "../components/auth/AuthLayout";
import InlineLoader from "../components/InlineLoader";
import { showInfoToast } from "../utils/toastHelpers";
import { GoogleIcon, MicrosoftIcon } from "../components/BrandIcons";
import Checkbox from "../components/ui/Checkbox";

interface LoginCredentials {
  email: string;
  password: string;
}

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
    showInfoToast(`${provider} sign-in isn't set up yet - use your email below.`);

  return (
    <AuthLayout activeTab="login">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        New to Nexora?{" "}
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
            className="inline-flex min-h-[44px] items-center justify-center gap-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-3 py-2 sm:min-h-0 sm:px-3.5 text-[13px] sm:text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
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
        <Input
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
          inputSize="lg"
          error={errors.email?.message}
        />

        <PasswordInput
          {...register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "Password must be at least 6 characters" },
          })}
          autoComplete="current-password"
          placeholder="Password"
          inputSize="lg"
          error={errors.password?.message}
        />

        {/* Both controls carry their own vertical padding so the row is two
            44px targets rather than a 16px box and a line of text. The label
            wraps the checkbox, so the padding is part of what is tappable. */}
        <div className="-mx-1 flex items-center justify-between gap-2">
          <Checkbox
            checked={remember}
            onChange={setRemember}
            label="Remember me"
            className="min-h-[44px] px-1 text-sm text-gray-600 dark:text-gray-300"
          />
          <Link
            to="/forgot-password"
            className="flex min-h-[44px] items-center px-1 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Forgot password?
          </Link>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.99 }}
          className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl disabled:opacity-70"
        >
          {isSubmitting ? <InlineLoader label="Signing in..." /> : "Sign in"}
        </motion.button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
