import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { authAPI, usersAPI } from "../../services/api";
import Avatar from "../Avatar";
import InlineLoader from "../InlineLoader";
import Select from "../ui/Select";
import {
  IdentificationIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import {
  showSuccessToast,
  showErrorToast,
} from "../../utils/toastHelpers";

interface ProfileForm {
  name: string;
  phone: string;
  position: string;
  bio: string;
}
interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
interface Prefs {
  bio: string;
  timezone: string;
  language: string;
  emailNotif: boolean;
  calendarSync: boolean;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:text-gray-400";
const labelClass =
  "mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400";
const cardClass =
  "surface-card";

const TIMEZONES = [
  "(GMT-08:00) Pacific Time",
  "(GMT-05:00) Eastern Standard Time",
  "(GMT+00:00) UTC",
  "(GMT+01:00) Central European Time",
  "(GMT+05:00) Pakistan Standard Time",
  "(GMT+05:30) India Standard Time",
];
const LANGUAGES = [
  "English (United States)",
  "English (United Kingdom)",
  "Urdu",
  "Français",
  "Deutsch",
];
const TIMEZONE_OPTIONS = TIMEZONES.map((t) => ({ value: t, label: t }));
const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l, label: l }));

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({
  on,
  onChange,
}) => (
  <button
    type="button"
    onClick={() => onChange(!on)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
      on ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
    }`}
    role="switch"
    aria-checked={on}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        on ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const loadPrefs = (userId?: string): Prefs => {
  try {
    const raw = localStorage.getItem(`leaveflow:prefs:${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    bio: "",
    timezone: TIMEZONES[1],
    language: LANGUAGES[0],
    emailNotif: true,
    calendarSync: false,
  };
};

const ProfileSettings: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(user?.id));
  const [showPw, setShowPw] = useState(false);

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      position: user?.position || "",
      bio: prefs.bio,
    },
  });
  const passwordForm = useForm<PasswordForm>();

  const savePrefs = (next: Prefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(`leaveflow:prefs:${user?.id}`, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("profilePicture", file);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/users/profile-picture`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: fd,
        }
      );
      if (!res.ok) throw new Error((await res.json()).message || "Upload failed");
      return res.json();
    },
    onSuccess: (res) => {
      updateUser(res.user ? res.user : { ...user!, profilePicture: res.profilePicture });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      showSuccessToast("Photo updated");
      setUploading(false);
    },
    onError: (e: any) => {
      showErrorToast(e.message || "Failed to upload photo");
      setUploading(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; phone: string; position?: string }) =>
      usersAPI.updateEmployee(user!.id, data),
    onSuccess: (res) => {
      updateUser(res.data.user);
      showSuccessToast("Profile updated");
    },
    onError: (e: any) =>
      showErrorToast(e.response?.data?.message || "Failed to update profile"),
  });

  const passwordMutation = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => {
      showSuccessToast("Password changed");
      passwordForm.reset();
    },
    onError: (e: any) =>
      showErrorToast(e.response?.data?.message || "Failed to change password"),
  });

  const onSaveProfile = (data: ProfileForm) => {
    savePrefs({ ...prefs, bio: data.bio });
    updateMutation.mutate({
      name: data.name,
      phone: data.phone,
      ...(isAdmin ? { position: data.position } : {}),
    });
  };

  const onChangePassword = (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      showErrorToast("Passwords do not match");
      return;
    }
    passwordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showErrorToast("Please choose an image");
    if (file.size > 5 * 1024 * 1024) return showErrorToast("Max size is 5MB");
    setUploading(true);
    uploadMutation.mutate(file);
  };

  const handleDeactivate = () => {
    if (
      window.confirm(
        "Deactivate your account? You'll be signed out. Full deactivation must be completed by an administrator."
      )
    ) {
      logout();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left column */}
      <div className="space-y-6">
        <div className={`${cardClass} p-6 text-center`}>
          <div className="relative mx-auto w-fit">
            <Avatar src={user?.profilePicture} name={user?.name} size="3xl" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-2 ring-white dark:ring-gray-800 transition-transform hover:scale-105"
              title="Change photo"
            >
              {uploading ? (
                <InlineLoader />
              ) : (
                <PencilIcon className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {user?.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user?.position || (isAdmin ? "Administrator" : "Employee")}
          </p>

          <div className="my-5 h-px bg-gray-100 dark:bg-gray-700/60" />

          <div className="space-y-2.5 text-left text-sm">
            <p className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
              <EnvelopeIcon className="h-4 w-4 text-blue-500" />
              <span className="truncate">{user?.email}</span>
            </p>
            <p className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
              <PhoneIcon className="h-4 w-4 text-blue-500" />
              {user?.phone || "—"}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className={`${cardClass} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Status
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Active {isAdmin ? "Admin" : "Employee"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              <CheckBadgeIcon className="h-3.5 w-3.5" />
              verified
            </span>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-6 lg:col-span-2">
        {/* Personal Information */}
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <IdentificationIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Full Name</label>
              <input {...profileForm.register("name", { required: true })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input
                {...profileForm.register("position")}
                disabled={!isAdmin}
                className={inputClass}
                placeholder="—"
              />
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input value={user?.email || ""} disabled className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input {...profileForm.register("phone")} className={inputClass} placeholder="—" />
            </div>
          </div>

          <div className="mt-4">
            <label className={labelClass}>Bio</label>
            <textarea
              {...profileForm.register("bio")}
              rows={3}
              className={inputClass}
              placeholder="Tell your team a little about yourself…"
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-70"
            >
              {updateMutation.isPending ? <InlineLoader label="Saving…" /> : "Save changes"}
            </button>
          </div>
        </form>

        {/* Local Preferences */}
        <div className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Local Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Timezone</label>
              <Select
                value={prefs.timezone}
                onChange={(v) => savePrefs({ ...prefs, timezone: v })}
                options={TIMEZONE_OPTIONS}
                className="w-full"
              />
            </div>
            <div>
              <label className={labelClass}>Language</label>
              <Select
                value={prefs.language}
                onChange={(v) => savePrefs({ ...prefs, language: v })}
                options={LANGUAGE_OPTIONS}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <BellAlertIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Email Notifications
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive daily summaries of leave requests
                  </p>
                </div>
              </div>
              <Toggle on={prefs.emailNotif} onChange={(v) => savePrefs({ ...prefs, emailNotif: v })} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Calendar Integration
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sync approved leaves with Outlook / Google
                  </p>
                </div>
              </div>
              <Toggle on={prefs.calendarSync} onChange={(v) => savePrefs({ ...prefs, calendarSync: v })} />
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <KeyIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Change Password
            </h3>
          </div>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <input
                type={showPw ? "text" : "password"}
                {...passwordForm.register("currentPassword", { required: true })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type={showPw ? "text" : "password"}
                  {...passwordForm.register("newPassword", { required: true, minLength: 6 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm Password</label>
                <input
                  type={showPw ? "text" : "password"}
                  {...passwordForm.register("confirmPassword", { required: true })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={showPw}
                  onChange={(e) => setShowPw(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Show passwords
              </label>
              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-70"
              >
                {passwordMutation.isPending ? <InlineLoader label="Updating…" /> : "Update password"}
              </button>
            </div>
          </form>
        </div>

        {/* Deactivate */}
        <div className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Deactivate Account
                </p>
                <p className="text-xs text-red-500/80 dark:text-red-400/70">
                  This will sign you out and restrict access to the dashboard.
                </p>
              </div>
            </div>
            <button
              onClick={handleDeactivate}
              className="flex-shrink-0 rounded-lg border border-red-300 dark:border-red-500/40 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-500/10"
            >
              Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
