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
            <Input
              {...register("companyName", { required: "Company name is required" })}
              type="text"
              placeholder="Acme Inc."
              inputSize="lg"
              error={errors.companyName?.message}
            />
          </div>
          <div>
            <label className={labelClass}>Company email</label>
            <Input
              {...register("companyEmail", {
                required: "Company email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              type="email"
              placeholder="hello@acme.com"
              inputSize="lg"
              error={errors.companyEmail?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Admin name</label>
            <Input
              {...register("adminName", { required: "Admin name is required" })}
              type="text"
              placeholder="Jane Doe"
              inputSize="lg"
              error={errors.adminName?.message}
            />
          </div>
          <div>
            <label className={labelClass}>Admin email</label>
            <Input
              {...register("adminEmail", {
                required: "Admin email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              type="email"
              placeholder="jane@acme.com"
              inputSize="lg"
              error={errors.adminEmail?.message}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Phone (optional)</label>
          <Input
            {...register("phone", phoneValidationRules)}
            type="tel"
            placeholder={PHONE_PLACEHOLDER}
            inputSize="lg"
            error={errors.phone?.message}
            hint={PHONE_HINT}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordInput
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "At least 8 characters" },
              pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: "Use at least one letter and one number" },
            })}
            label="Password"
            placeholder="Create a password"
            inputSize="lg"
            error={errors.password?.message}
          />
          <PasswordInput
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) => value === password || "Passwords do not match",
            })}
            label="Confirm password"
            placeholder="Repeat password"
            inputSize="lg"
            error={errors.confirmPassword?.message}
          />
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.99 }}
          className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl disabled:opacity-70"
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
