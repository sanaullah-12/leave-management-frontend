import React, { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "../services/api";
import LogoLoader from "../components/LogoLoader";
import Avatar from "../components/Avatar";
import { BuildingOffice2Icon } from "@heroicons/react/24/outline";
import "../styles/design-system.css";

interface Dept {
  name: string;
  members: any[];
}

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => usersAPI.getEmployees(),
    enabled: isAdmin,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const departments: Dept[] = useMemo(() => {
    const list =
      (data as any)?.data?.employees || (data as any)?.employees || [];
    const map = new Map<string, any[]>();
    for (const emp of list) {
      const dept = emp.department?.trim() || "Unassigned";
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(emp);
    }
    return Array.from(map.entries())
      .map(([name, members]) => ({ name, members }))
      .sort((a, b) => b.members.length - a.members.length);
  }, [data]);

  const totalMembers = departments.reduce((n, d) => n + d.members.length, 0);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Departments
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isAdmin
            ? `${departments.length} ${
                departments.length === 1 ? "department" : "departments"
              } · ${totalMembers} ${totalMembers === 1 ? "person" : "people"}`
            : "Organization departments"}
        </p>
      </div>

      {!isAdmin ? (
        <EmptyState subtitle="Your administrator can view and manage departments." />
      ) : isLoading ? (
        <LogoLoader label="Loading departments…" minHClass="min-h-[420px]" />
      ) : departments.length === 0 ? (
        <EmptyState subtitle="Invite employees and assign departments to get started." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {departments.map((dept) => (
            <div
              key={dept.name}
              className="surface-card surface-card-interactive p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <BuildingOffice2Icon className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {dept.members.length}
                </span>
              </div>

              <p className="mt-4 font-semibold text-gray-900 dark:text-gray-100">
                {dept.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {dept.members.length === 1 ? "member" : "members"}
              </p>

              {/* Stacked avatars */}
              <div className="mt-4 flex items-center">
                <div className="flex -space-x-2">
                  {dept.members.slice(0, 5).map((m: any) => (
                    <Avatar
                      key={m._id}
                      src={m.profilePicture}
                      name={m.name}
                      size="sm"
                      className="ring-2 ring-white dark:ring-gray-800"
                    />
                  ))}
                </div>
                {dept.members.length > 5 && (
                  <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    +{dept.members.length - 5}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ subtitle: string }> = ({ subtitle }) => (
  <div className="surface-card py-16 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700/60">
      <BuildingOffice2Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
    </div>
    <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
      No departments to show
    </p>
    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{subtitle}</p>
  </div>
);

export default DepartmentsPage;
