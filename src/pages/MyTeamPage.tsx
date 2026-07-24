import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usersAPI } from "../services/api";
import { CardGridSkeleton } from "../components/Skeletons";
import Avatar from "../components/Avatar";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

const MyTeamPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => usersAPI.getEmployees(),
    enabled: isAdmin,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const members: any[] = useMemo(() => {
    const list =
      (data as any)?.data?.employees || (data as any)?.employees || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m: any) =>
        m.name?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        m.position?.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            My Team
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? `${members.length} ${members.length === 1 ? "member" : "members"} in your organization`
              : "Your team directory"}
          </p>
        </div>

        {isAdmin && (
          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team…"
              className="input-field !pl-9"
            />
          </div>
        )}
      </div>

      {!isAdmin ? (
        <EmptyState
          title="Team directory is managed by admins"
          subtitle="Your administrator can view and manage the full team roster."
        />
      ) : isLoading ? (
        <CardGridSkeleton count={6} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No team members found"
          subtitle={search ? "Try a different search." : "Invite employees to get started."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {members.map((m: any) => (
            <button
              key={m._id}
              onClick={() => navigate(`/employees/${m._id}`)}
              className="group flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 p-4 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <Avatar src={m.profilePicture} name={m.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {m.name}
                </p>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                  {m.position || "—"}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                    {m.department || "No department"}
                  </span>
                  {m.status && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        m.status === "active"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-gray-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          m.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {m.status}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div className="rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 py-16 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700/60">
      <UserGroupIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
    </div>
    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{title}</p>
    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{subtitle}</p>
  </div>
);

export default MyTeamPage;
