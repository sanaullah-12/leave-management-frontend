import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import BrandedLoader from "../components/BrandedLoader";
import AuthLayout from "../components/auth/AuthLayout";
import InlineLoader from "../components/InlineLoader";
import { showInfoToast } from "../utils/toastHelpers";
import { GoogleIcon, MicrosoftIcon } from "../components/BrandIcons";
import {
  PHONE_HINT,
  PHONE_PLACEHOLDER,
  phoneValidationRules,
} from "../utils/phone";

interface RegisterCompanyData {
  companyName: string;
  companyEmail: string;
  adminName: string;
  adminEmail: string;
  password: string;
  phone?: string;
}

const inputClass =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-blue-500/10";

const labelClass =
  "mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300";

const RegisterPage: React.FC = () => {
  const { registerCompany, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterCompanyData & { confirmPassword: string }>();

  const password = watch("password");

  if (isAuthenticated) return <Navigate to="/" replace />;
  if (isLoading) return <BrandedLoader message="Preparing your workspace..." />;

  const onSubmit = async (
    data: RegisterCompanyData & { confirmPassword: string }
  ) => {
    setIsSubmitting(true);
    setError("");
    try {
      const { confirmPassword, ...registerData } = data;
      await registerCompany(registerData);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSSO = (provider: string) =>
    showInfoToast(`${provider} sign-up isn't set up yet - use the form below.`);

  return (
    <AuthLayout activeTab="signup">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Create your workspace
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Sign in
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
          Or register with email
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Company name</label>
            <input
              {...register("companyName", { required: "Company name is required" })}
              type="text"
              placeholder="Acme Inc."
              className={inputClass}
            />
            {errors.companyName && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {errors.companyName.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Company email</label>
            <input
              {...register("companyEmail", {
                required: "Company email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              type="email"
              placeholder="hello@acme.com"
              className={inputClass}
            />
            {errors.companyEmail && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {errors.companyEmail.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Admin name</label>
            <input
              {...register("adminName", { required: "Admin name is required" })}
              type="text"
              placeholder="Jane Doe"
              className={inputClass}
            />
            {errors.adminName && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {errors.adminName.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Admin email</label>
            <input
              {...register("adminEmail", {
                required: "Admin email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              type="email"
              placeholder="jane@acme.com"
              className={inputClass}
            />
            {errors.adminEmail && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {errors.adminEmail.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Phone (optional)</label>
          <input
            {...register("phone", phoneValidationRules)}
            type="tel"
            placeholder={PHONE_PLACEHOLDER}
            className={inputClass}
          />
          {errors.phone ? (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {errors.phone.message}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {PHONE_HINT}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordInput
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
            label="Password"
            placeholder="Create a password"
            error={errors.password?.message}
            className={inputClass}
          />
          <PasswordInput
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) => value === password || "Passwords do not match",
            })}
            label="Confirm password"
            placeholder="Repeat password"
            error={errors.confirmPassword?.message}
            className={inputClass}
          />
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.99 }}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl disabled:opacity-70"
        >
          {isSubmitting ? (
            <InlineLoader label="Creating workspace..." />
          ) : (
            "Create workspace"
          )}
        </motion.button>

        <p className="pt-1 text-center text-xs text-gray-400">
          By creating an account you agree to our Terms & Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
