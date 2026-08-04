import React, { useMemo, useState } from "react";
import { CARD, CARD_HOVER } from "../lib/surfaces";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usersAPI } from "../services/api";
import LogoLoader from "../components/LogoLoader";
import Avatar from "../components/Avatar";
import Dropdown from "../components/ui/Dropdown";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  FunnelIcon,
  BarsArrowDownIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  SunIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";


// Deterministic department badge colours (semantic accent set).
const DEPT_COLORS = [
  "bg-emerald-50 text-emerald-600 ring-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  "bg-blue-50 text-blue-600 ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
  "bg-violet-50 text-violet-600 ring-violet-200/60 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20",
  "bg-amber-50 text-amber-600 ring-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  "bg-rose-50 text-rose-600 ring-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
  "bg-teal-50 text-teal-600 ring-teal-200/60 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20",
];
const deptColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % DEPT_COLORS.length;
  return DEPT_COLORS[h];
};

const deptName = (m: any): string =>
  typeof m.department === "object" && m.department?.name
    ? m.department.name
    : m.department || "General";

const formatJoin = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";

const formatTenure = (d?: string): string => {
  if (!d) return "—";
  const yrs = (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (yrs < 1) return `${Math.max(1, Math.round(yrs * 12))} Mo`;
  return `${yrs.toFixed(1)} Years`;
};

type SortKey = "name" | "tenure" | "recent";
const SORT_LABELS: Record<SortKey, string> = {
  name: "Name (A–Z)",
  tenure: "Tenure (longest)",
  recent: "Recently joined",
};

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

const Chip: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
    <span className="text-gray-400 dark:text-gray-500">{icon}</span>
    {children}
  </span>
);

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center gap-1 text-center">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
      {label}
    </span>
    <span className="flex items-center gap-1.5 text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
      <span className="text-blue-500/70 dark:text-blue-400/70">{icon}</span>
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

  const { data, isLoading } = useQuery({
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
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/25">
              <UserGroupIcon className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              My Team
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600 ring-1 ring-inset ring-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                Total Employees: {allMembers.length}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Manage your organization's employees, track leave allocations, and
            oversee departmental distribution from a centralized hub.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees, roles…"
                className="w-full rounded-xl bg-[var(--card-surface)] py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 ring-1 ring-inset ring-gray-200/70 outline-none transition-shadow focus:ring-2 focus:ring-blue-500/50 dark:text-gray-100 dark:placeholder-gray-500 dark:ring-white/10"
              />
            </div>

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

      {!isAdmin ? (
        <EmptyState
          title="Team directory is managed by admins"
          subtitle="Your administrator can view and manage the full team roster."
        />
      ) : isLoading ? (
        <LogoLoader label="Loading your team…" minHClass="min-h-[420px]" />
      ) : members.length === 0 ? (
        <EmptyState
          title="No team members found"
          subtitle={
            search || dept !== "All Departments"
              ? "Try a different search or filter."
              : "Invite employees to get started."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {members.map((m: any) => {
            const dName = deptName(m);
            const active = m.status === "active";
            const quota = m.leaveQuota || {};
            const annual = quota.annual ?? 10;
            const casual = quota.casual ?? 10;
            const sick = quota.sick ?? 8;
            return (
              <button
                key={m._id}
                onClick={() => navigate(`/employees/${m._id}`)}
                className={`group ${CARD} ${CARD_HOVER} flex flex-col p-5 text-left`}
              >
                {/* Top: avatar + dept/status */}
                <div className="flex items-start justify-between gap-3">
                  <Avatar
                    src={m.profilePicture}
                    name={m.name}
                    size="lg"
                    className="rounded-2xl ring-2 ring-white shadow-sm dark:ring-white/10"
                  />
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${deptColor(
                        dName
                      )}`}
                    >
                      {dName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        active
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {active ? "Active" : m.status === "pending" ? "Pending" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Name + position */}
                <div className="mt-4">
                  <h3 className="truncate text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {m.name}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                    {m.position || "—"}
                  </p>
                </div>

                {/* Meta chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip icon={<IdentificationIcon className="h-3.5 w-3.5" />}>
                    {m.employeeId || "—"}
                  </Chip>
                  <Chip icon={<CalendarDaysIcon className="h-3.5 w-3.5" />}>
                    {formatJoin(m.joinDate)}
                  </Chip>
                  <Chip icon={<ArrowTrendingUpIcon className="h-3.5 w-3.5" />}>
                    {formatTenure(m.joinDate)}
                  </Chip>
                </div>

                {/* Leave allocation stats */}
                <div className="mt-auto grid grid-cols-3 gap-2 divide-x divide-gray-100 border-t border-gray-100 pt-4 dark:divide-white/5 dark:border-white/5">
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
              </button>
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
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
      <UserGroupIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
    </div>
    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{title}</p>
    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{subtitle}</p>
  </div>
);

export default MyTeamPage;
