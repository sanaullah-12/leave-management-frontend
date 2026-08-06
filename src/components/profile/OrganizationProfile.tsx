import React, { useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { showSuccessToast, showErrorToast } from "../../utils/toastHelpers";
import Select from "../ui/Select";
import {
  BuildingOffice2Icon,
  GlobeAltIcon,
  PhotoIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

interface OrgData {
  name: string;
  website: string;
  industry: string;
  teamSize: string;
  country: string;
  timezone: string;
  workingDays: number[]; // 0=Sun ... 6=Sat
  logo: string | null;
}

const INDUSTRIES = [
  "Technology & Software",
  "Finance & Banking",
  "Healthcare",
  "Education",
  "Retail & E-commerce",
  "Manufacturing",
  "Consulting",
  "Other",
];
const TEAM_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "500+ employees",
];
const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Pakistan",
  "India",
  "Canada",
  "Germany",
  "Australia",
  "United Arab Emirates",
];
const TIMEZONES = [
  "(GMT-08:00) Pacific Time",
  "(GMT-05:00) Eastern Time",
  "(GMT+00:00) UTC",
  "(GMT+01:00) Central European Time",
  "(GMT+05:00) Pakistan Standard Time",
  "(GMT+05:30) India Standard Time",
];
const INDUSTRY_OPTIONS = INDUSTRIES.map((i) => ({ value: i, label: i }));
const TEAM_SIZE_OPTIONS = TEAM_SIZES.map((t) => ({ value: t, label: t }));
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c, label: c }));
const TIMEZONE_OPTIONS = TIMEZONES.map((t) => ({ value: t, label: t }));
// Mon-first order for the day chips
const DAYS = [
  { i: 1, label: "M" },
  { i: 2, label: "T" },
  { i: 3, label: "W" },
  { i: 4, label: "T" },
  { i: 5, label: "F" },
  { i: 6, label: "S" },
  { i: 0, label: "S" },
];

const inputClass =
  "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const labelClass =
  "mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400";
const cardClass =
  "surface-card";

const OrganizationProfile: React.FC = () => {
  const { user } = useAuth();
  const storeKey = `nexora:org:${user?.company || "default"}`;
  const logoRef = useRef<HTMLInputElement>(null);

  const [org, setOrg] = useState<OrgData>(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return {
      name: user?.company || "",
      website: "",
      industry: INDUSTRIES[0],
      teamSize: TEAM_SIZES[2],
      country: COUNTRIES[0],
      timezone: TIMEZONES[0],
      workingDays: [1, 2, 3, 4, 5],
      logo: null,
    };
  });

  const set = <K extends keyof OrgData>(key: K, value: OrgData[K]) =>
    setOrg((o) => ({ ...o, [key]: value }));

  const toggleDay = (i: number) =>
    setOrg((o) => ({
      ...o,
      workingDays: o.workingDays.includes(i)
        ? o.workingDays.filter((d) => d !== i)
        : [...o.workingDays, i],
    }));

  const completion = useMemo(() => {
    const fields = [org.name, org.website, org.industry, org.teamSize, org.country, org.timezone];
    const filled = fields.filter((f) => f && f.trim()).length + (org.logo ? 1 : 0);
    return Math.round((filled / (fields.length + 1)) * 100);
  }, [org]);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showErrorToast("Please choose an image");
    if (file.size > 2 * 1024 * 1024) return showErrorToast("Max size is 2MB");
    const reader = new FileReader();
    reader.onload = () => set("logo", reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(storeKey, JSON.stringify(org));
      showSuccessToast("Organization profile saved");
    } catch {
      showErrorToast("Could not save settings");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: forms */}
      <div className="space-y-6 lg:col-span-2">
        {/* General Information */}
        <div className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              General Information
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Company Name</label>
              <input
                value={org.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input
                value={org.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Industry</label>
              <Select
                value={org.industry}
                onChange={(v) => set("industry", v)}
                options={INDUSTRY_OPTIONS}
                className="w-full"
              />
            </div>
            <div>
              <label className={labelClass}>Team Size</label>
              <Select
                value={org.teamSize}
                onChange={(v) => set("teamSize", v)}
                options={TEAM_SIZE_OPTIONS}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Regional & Operations */}
        <div className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <GlobeAltIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Regional & Operations
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Country</label>
              <Select
                value={org.country}
                onChange={(v) => set("country", v)}
                options={COUNTRY_OPTIONS}
                className="w-full"
              />
            </div>
            <div>
              <label className={labelClass}>Timezone</label>
              <Select
                value={org.timezone}
                onChange={(v) => set("timezone", v)}
                options={TIMEZONE_OPTIONS}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className={labelClass}>Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, idx) => {
                const active = org.workingDays.includes(d.i);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(d.i)}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                      active
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                        : "bg-gray-100 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs italic text-gray-400 dark:text-gray-500">
              Selected days are the default working days for all leave calculations.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700"
          >
            Save changes
          </button>
        </div>
      </div>

      {/* Right: logo + status */}
      <div className="space-y-6">
        <div className={`${cardClass} p-6`}>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Company Logo
          </h3>
          <div className="mt-5 flex flex-col items-center">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              {org.logo ? (
                <img src={org.logo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <PhotoIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <button
              onClick={() => logoRef.current?.click()}
              className="mt-5 w-full rounded-lg border border-gray-200 dark:border-gray-700 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Upload New Logo
            </button>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogo}
            />
            <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
              Accepted formats: SVG, PNG, JPG. Max size 2MB.
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-blue-600 dark:text-blue-400">
              <CheckBadgeIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Status: Active
              </p>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/70">
                Verified Enterprise
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-500/20">
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-300/70">
            Profile completion: {completion}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfile;
