import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";

interface RegisterCompanyData {
  companyName: string;
  companyEmail: string;
  adminName: string;
  adminEmail: string;
  password: string;
  phone?: string;
}

import LoadingSpinner from "../components/LoadingSpinner";
import PasswordInput from "../components/PasswordInput";

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

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Register your company
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg border border-gray-200 dark:border-gray-700 sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6">
              {/* Company Name */}
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Company Name
                </label>
                <input
                  {...register("companyName", {
                    required: "Company name is required",
                  })}
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  placeholder="Enter company name"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              {/* Company Email */}
              <div>
                <label
                  htmlFor="companyEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Company Email
                </label>
                <input
                  {...register("companyEmail", {
                    required: "Company email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  type="email"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  placeholder="company@example.com"
                />
                {errors.companyEmail && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.companyEmail.message}
                  </p>
                )}
              </div>

              {/* Admin Name */}
              <div>
                <label
                  htmlFor="adminName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Admin Name
                </label>
                <input
                  {...register("adminName", {
                    required: "Admin name is required",
                  })}
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  placeholder="Enter admin name"
                />
                {errors.adminName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.adminName.message}
                  </p>
                )}
              </div>

              {/* Admin Email */}
              <div>
                <label
                  htmlFor="adminEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Admin Email
                </label>
                <input
                  {...register("adminEmail", {
                    required: "Admin email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  type="email"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  placeholder="admin@company.com"
                />
                {errors.adminEmail && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.adminEmail.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone (Optional)
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Password */}
              <div>
                <PasswordInput
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  label="Password"
                  placeholder="Enter password"
                  error={errors.password?.message}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <PasswordInput
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                  label="Confirm Password"
                  placeholder="Confirm password"
                  error={errors.confirmPassword?.message}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  "Register Company"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
