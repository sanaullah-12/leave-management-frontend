import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import OrganizationProfile from "../components/profile/OrganizationProfile";
import ProfileSettings from "../components/profile/ProfileSettings";

type Tab = "organization" | "profile";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<Tab>(isAdmin ? "organization" : "profile");

  const header =
    isAdmin && tab === "organization"
      ? {
          title: "Organization Profile",
          sub: "Update your company's core information and working schedule.",
        }
      : {
          title: "Profile Settings",
          sub: "Update your photo and personal details here.",
        };

  const tabs: { id: Tab; label: string }[] = [
    { id: "organization", label: "Organization" },
    { id: "profile", label: "My Profile" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {header.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {header.sub}
        </p>
      </div>

      {isAdmin && (
        <div className="inline-flex gap-1 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-100 dark:bg-gray-800/80 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="profileTab"
                  className="absolute inset-0 rounded-lg bg-white dark:bg-gray-700 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {isAdmin && tab === "organization" ? (
          <OrganizationProfile />
        ) : (
          <ProfileSettings />
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
