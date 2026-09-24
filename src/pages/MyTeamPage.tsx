import React, { useMemo, useState } from "react";
import { CARD } from "../lib/surfaces";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usersAPI } from "../services/api";
import LogoLoader from "../components/LogoLoader";
import { MorphTrigger } from "../components/ui/CardMorph";
import MobileTeamList from "../components/team/MobileTeamList";
import Avatar from "../components/Avatar";
import Dropdown from "../components/ui/Dropdown";
import SectionHeader from "../components/ui/SectionHeader";
import { sectionIllustration } from "../components/ui/illustrations";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  FunnelIcon,
  BarsArrowDownIcon,
  CalendarDaysIcon,
  SunIcon,
  HeartIcon,
  Cog6ToothIcon,
  BriefcaseIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";


import Input from "../components/ui/Input";
const deptName = (m: any): string =>
  typeof m.department === "object" && m.department?.name
    ? m.department.name
    : m.department || "General";

const formatJoin = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "-";

const formatTenure = (d?: string): string => {
  if (!d) return "-";
  const yrs = (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (yrs < 1) return `${Math.max(1, Math.round(yrs * 12))} Mo`;
  return `${yrs.toFixed(1)} Years`;
};

type SortKey = "name" | "tenure" | "recent";
const SORT_LABELS: Record<SortKey, string> = {
  name: "Name (A-Z)",
  tenure: "Tenure (longest)",
  recent: "Recently joined",
};

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

/**
 * A fact about the person: icon, hairline rule, value.
 *
 * The rule is what separates the two halves - without it the icon reads as
 * decoration attached to the number rather than as its label.
 */
const Chip: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <span className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5 ring-1 ring-inset ring-gray-200/70 dark:bg-white/[0.04] dark:ring-white/10">
    <span className="flex-none text-blue-500 dark:text-blue-300">{icon}</span>
    <span className="h-4 w-px flex-none bg-gray-200 dark:bg-white/10" />
    <span className="truncate text-xs font-semibold text-gray-700 dark:text-gray-200">
      {children}
    </span>
  </span>
);

/** One leave type in the balance panel: badge, label, days. */
const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex min-w-0 flex-col items-center gap-1.5 px-1 text-center">
    <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-500/15 text-blue-600 ring-1 ring-inset ring-blue-500/25 dark:bg-blue-400/20 dark:text-blue-200 dark:ring-blue-300/20">
      {icon}
    </span>
    <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-300/80">
      {label}
    </span>
    <span className="text-xl font-bold tabular-nums leading-none text-gray-900 dark:text-white">
      {value}
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const MyTeamPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All Departments");
  const [sortBy, setSortBy] = useState<SortKey>("name");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["employees"],
    queryFn: () => usersAPI.getEmployees(1, 100),
    enabled: isAdmin,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const allMembers: any[] = useMemo(
    () => (data as any)?.data?.employees || (data as any)?.employees || [],
    [data]
  );

  const departments = useMemo(() => {
    const set = new Set<string>();
    allMembers.forEach((m) => set.add(deptName(m)));
    return ["All Departments", ...Array.from(set).sort()];
  }, [allMembers]);

  const members = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allMembers.filter((m) => {
      const matchesSearch =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        deptName(m).toLowerCase().includes(q) ||
        m.position?.toLowerCase().includes(q) ||
        m.employeeId?.toLowerCase().includes(q);
      const matchesDept = dept === "All Departments" || deptName(m) === dept;
      return matchesSearch && matchesDept;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      const at = new Date(a.joinDate || 0).getTime();
      const bt = new Date(b.joinDate || 0).getTime();
      return sortBy === "tenure" ? at - bt : bt - at;
    });
    return list;
  }, [allMembers, search, dept, sortBy]);

  return (
    <div className="space-y-6 stagger-children">
      {/* Header */}
      <SectionHeader
        variant="team"
        eyebrow="Workforce"
        title="Employees Profile"
        description="Manage your organization's employees, track leave allocations, and oversee departmental distribution from a centralized hub."
        badge={
          isAdmin ? (
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/25">
              {allMembers.length} employees
            </span>
          ) : undefined
        }
        illustration={sectionIllustration("team")}
      />

      {/* Page controls. Separate from the banner: these act on the list
          below, not on the section's identity. */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3">
            <Input
              icon={MagnifyingGlassIcon}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              clearable
              placeholder="Search employees, roles..."
              className="w-full sm:w-72"
            />

            {/* Filter (by department) */}
            <Dropdown
              align="right"
              widthClass="max-h-72 w-56 overflow-y-auto"
              sections={[
                {
                  items: departments.map((d) => ({
                    label: d,
                    selected: dept === d,
                    onClick: () => setDept(d),
                  })),
                },
              ]}
            >
              <FunnelIcon className="h-4 w-4" />
              {dept === "All Departments" ? "Filter" : dept}
            </Dropdown>

            {/* Sort */}
            <Dropdown
              align="right"
              widthClass="w-52"
              sections={[
                {
                  items: (Object.keys(SORT_LABELS) as SortKey[]).map((k) => ({
                    label: SORT_LABELS[k],
                    selected: sortBy === k,
                    onClick: () => setSortBy(k),
                  })),
                },
              ]}
            >
              <BarsArrowDownIcon className="h-4 w-4" />
              Sort
            </Dropdown>
          </div>
        )}
      </div>

      {/* Mobile: index rows plus a detail sheet, matching Leave Requests.
          It renders its own empty state, so it sits outside the branch below
          rather than being wired into every arm of it. */}
      {isAdmin && !isLoading && (
        <MobileTeamList
          members={members}
          onRefresh={() => refetch()}
          isRefreshing={isLoading}
          onViewProfile={(id) => navigate(`/employees/${id}`)}
          deptName={deptName}
          formatJoin={formatJoin}
          formatTenure={formatTenure}
        />
      )}

      {!isAdmin ? (
        <EmptyState
          title="Team directory is managed by admins"
          subtitle="Your administrator can view and manage the full team roster."
        />
      ) : isLoading ? (
        <LogoLoader label="Loading your team..." minHClass="min-h-[420px]" />
      ) : members.length === 0 ? (
        // Desktop-only: the mobile list shows its own empty state.
        <div className="hidden lg:block">
          <EmptyState
            title="No team members found"
            subtitle={
              search || dept !== "All Departments"
                ? "Try a different search or filter."
                : "Invite employees to get started."
            }
          />
        </div>
      ) : (
        <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid lg:grid-cols-3 stagger-children">
          {members.map((m: any) => {
            const dName = deptName(m);
            const active = m.status === "active";
            const quota = m.leaveQuota || {};
            const annual = quota.annual ?? 10;
            const casual = quota.casual ?? 10;
            const sick = quota.sick ?? 8;
            return (
              // The card becomes the profile rather than handing off to it:
              // the plate grows to fill the viewport while the route swaps
              // underneath, so /employees/:id, the back button and deep links
              // all behave exactly as they did.
              <MorphTrigger
                key={m._id}
                morphId={`employee-${m._id}`}
                route={`/employees/${m._id}`}
                label={`Open ${m.name}'s profile`}
              >
                <div className="glass-card group relative flex flex-col overflow-hidden rounded-2xl p-4 text-left transition-all hover:bg-[var(--glass-fill-strong)] hover:shadow-[shadow:var(--glass-sheen),var(--glass-drop-lifted)]">
                {/* A violet bloom in the corner, echoing the balance panel
                    below so the card reads as one object. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl dark:bg-blue-500/20"
                />

                {/* Department, top right. */}
                <div className="relative flex justify-end">
                  <span className="inline-flex max-w-[70%] items-center gap-1.5 rounded-xl bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold uppercase leading-tight tracking-wide text-blue-600 ring-1 ring-inset ring-blue-200/70 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/25">
                    <Cog6ToothIcon className="h-3.5 w-3.5 flex-none" />
                    <span className="truncate">{dName}</span>
                  </span>
                </div>

                {/* Identity: ringed avatar, name over role, status. */}
                <div className="relative mt-2.5 flex items-center gap-3">
                  <span className="relative flex-none">
                    {/* The ring is the status, so the colour is the state and
                        never decoration. */}
                    <span
                      className={`grid place-items-center rounded-full border-2 p-0.5 ${
                        active
                          ? "border-emerald-400 dark:border-emerald-400"
                          : m.status === "pending"
                          ? "border-amber-400"
                          : "border-gray-300 dark:border-white/20"
                      }`}
                    >
                      <Avatar src={m.profilePicture} name={m.name} size="md" />
                    </span>
                    <span
                      className={`absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-white dark:ring-[color:var(--card-surface)] ${
                        active
                          ? "bg-emerald-400"
                          : m.status === "pending"
                          ? "bg-amber-400"
                          : "bg-gray-300 dark:bg-white/25"
                      }`}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-300">
                        {m.name}
                      </h3>
                      <span
                        className={`inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                          active
                            ? "bg-emerald-50 text-emerald-600 ring-emerald-200/70 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25"
                            : "bg-gray-100 text-gray-500 ring-gray-200/70 dark:bg-white/5 dark:text-gray-400 dark:ring-white/10"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            active ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {active
                          ? "Active"
                          : m.status === "pending"
                          ? "Pending"
                          : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                      {m.position || "-"}
                    </p>
                  </div>
                </div>

                {/* Three facts, evenly weighted. */}
                <div className="relative mt-3 grid grid-cols-3 gap-1.5">
                  <Chip icon={<UserIcon className="h-3.5 w-3.5" />}>
                    {m.employeeId || "-"}
                  </Chip>
                  <Chip icon={<CalendarDaysIcon className="h-3.5 w-3.5" />}>
                    {formatJoin(m.joinDate)}
                  </Chip>
                  <Chip icon={<BriefcaseIcon className="h-3.5 w-3.5" />}>
                    {formatTenure(m.joinDate)}
                  </Chip>
                </div>

                <hr className="relative my-3 border-gray-100 dark:border-white/10" />

                <p className="relative flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <ClockIcon className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                  Leave Balance
                </p>

                {/* The allocation, as one panel so the three read as a set. */}
                <div className="relative mt-2.5 grid grid-cols-3 divide-x divide-gray-200/70 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-100/70 p-3 ring-1 ring-inset ring-gray-200/70 dark:divide-white/10 dark:from-white/[0.04] dark:to-blue-500/25 dark:ring-white/10">
                  <Stat
                    icon={<SunIcon className="h-4 w-4" />}
                    label="Annual"
                    value={annual}
                  />
                  <Stat
                    icon={<CalendarDaysIcon className="h-4 w-4" />}
                    label="Casual"
                    value={casual}
                  />
                  <Stat
                    icon={<HeartIcon className="h-4 w-4" />}
                    label="Sick"
                    value={sick}
                  />
                </div>
                </div>
              </MorphTrigger>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div className={`${CARD} py-16 text-center`}>
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-blue-600 dark:text-blue-400">
      <UserGroupIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
    </div>
    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{title}</p>
    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{subtitle}</p>
  </div>
);

export default MyTeamPage;
