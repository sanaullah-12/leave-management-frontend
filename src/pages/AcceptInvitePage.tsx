import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import AuthLayout from "../components/AuthLayout";
import InlineLoader from "../components/InlineLoader";
import {
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  EnvelopeIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  UserPlusIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

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

const inputClass =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-blue-500/10";

const initialsOf = (name?: string) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const AcceptInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptInviteForm>();

  const password = watch("password");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
      return;
    }

    const fetchInvitationDetails = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/invitation/${token}`
        );
        setInvitation(response.data.user);
      } catch (err: any) {
        console.error("Invitation fetch error:", err);
        setError(
          err.response?.data?.message || "Invalid or expired invitation link"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitationDetails();
    } else {
      setError("No invitation token provided");
      setLoading(false);
    }
  }, [token, isAuthenticated, navigate]);

  const onSubmit = async (data: AcceptInviteForm) => {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/verify-invitation/${token}`,
        { password: data.password }
      );
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/"; // full reload to refresh auth context
      }, 2500);
    } catch (err: any) {
      console.error("Invitation acceptance error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to accept invitation. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ----------------------------- Loading ----------------------------- */
  if (loading) {
    return (
      <AuthLayout activeTab="signup">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 rounded-full border-[3px] border-blue-500/25 border-t-blue-600"
          />
          <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
            Loading your invitation…
          </p>
        </div>
      </AuthLayout>
    );
  }

  /* --------------------------- Invalid link -------------------------- */
  if (error && !invitation) {
    return (
      <AuthLayout activeTab="signup">
        <motion.div {...fade()} className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
            <XCircleIcon className="h-9 w-9 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Invitation not found
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>
          <div className="mt-7 space-y-3">
            <button
              onClick={() => navigate("/login")}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              Go to sign in
            </button>
            <button
              onClick={() => navigate("/register")}
              className="flex w-full items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Register a new company
            </button>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  /* ------------------------------ Success ---------------------------- */
  if (success) {
    return (
      <AuthLayout activeTab="signup">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10"
          >
            <motion.span
              className="absolute inset-0 rounded-full ring-2 ring-emerald-400/40"
              animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
            <CheckCircleIcon className="h-11 w-11 text-emerald-500" />
          </motion.div>
          <motion.h1
            {...fade(0.1)}
            className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            Welcome to the team! 🎉
          </motion.h1>
          <motion.p
            {...fade(0.2)}
            className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400"
          >
            Your account is ready. Taking you to your dashboard…
          </motion.p>
          <motion.div {...fade(0.3)} className="mt-6">
            <InlineLoader label="Signing you in" />
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  /* ------------------------------- Form ------------------------------ */
  return (
    <AuthLayout activeTab="signup">
      <motion.div {...fade()}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 ring-1 ring-inset ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
          <SparklesIcon className="h-3.5 w-3.5" />
          You're invited
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Accept your invitation
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {invitation?.company
            ? <>Set a password to join <span className="font-semibold text-gray-700 dark:text-gray-200">{invitation.company}</span>.</>
            : "Create your password to join the team."}
        </p>
      </motion.div>

      {/* Invitation summary */}
      {invitation && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 280, damping: 26 }}
          className="mt-6 overflow-hidden rounded-2xl border border-blue-200/50 dark:border-blue-500/20 bg-gradient-to-br from-blue-50/70 via-gray-50/40 to-transparent dark:from-blue-500/[0.07] dark:via-gray-900/30 dark:to-transparent p-5"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-base font-bold text-white shadow-md shadow-blue-600/25">
              {initialsOf(invitation.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900 dark:text-white">
                {invitation.name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-200 dark:ring-gray-700">
                  <BriefcaseIcon className="h-3 w-3" />
                  {invitation.position}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-200 dark:ring-gray-700">
                  <BuildingOffice2Icon className="h-3 w-3" />
                  {invitation.department}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-gray-200/70 dark:border-gray-700/70 pt-4 text-sm">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-gray-700 dark:text-gray-200">
                {invitation.email}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <UserPlusIcon className="h-4 w-4 flex-shrink-0" />
              <span>
                Invited by{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {invitation.invitedBy}
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      <motion.form
        {...fade(0.2)}
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4"
      >
        <PasswordInput
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message:
                "Use at least one uppercase, one lowercase letter and a number",
            },
          })}
          label="Create password"
          placeholder="Enter a secure password"
          autoComplete="new-password"
          error={errors.password?.message}
          className={inputClass}
        />

        <PasswordInput
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) =>
              value === password || "Passwords do not match",
          })}
          label="Confirm password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          className={inputClass}
        />

        {/* Live requirements checklist */}
        <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Password strength
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {[
              { label: "6+ characters", ok: (password?.length ?? 0) >= 6 },
              { label: "Uppercase letter", ok: /[A-Z]/.test(password || "") },
              { label: "Lowercase letter", ok: /[a-z]/.test(password || "") },
              { label: "A number", ok: /\d/.test(password || "") },
            ].map((r) => (
              <div
                key={r.label}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  r.ok
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <CheckCircleIcon
                  className={`h-4 w-4 flex-shrink-0 transition-transform ${
                    r.ok ? "scale-100" : "scale-90 opacity-50"
                  }`}
                />
                {r.label}
              </div>
            ))}
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.99 }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-70"
        >
          {isSubmitting ? (
            <InlineLoader label="Creating your account…" />
          ) : (
            <>
              <UserPlusIcon className="h-4 w-4" />
              Accept & create account
            </>
          )}
        </motion.button>
      </motion.form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default AcceptInvitePage;
