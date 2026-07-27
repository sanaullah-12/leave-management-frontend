import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "../services/api";
// import { useNotifications } from "../components/NotificationSystem"; // Removed for Socket.IO implementation
import LoadingSpinner from "../components/LoadingSpinner";
import { HeaderSkeleton, TableSkeleton } from "../components/Skeletons";
import EmployeeInviteModal from "../components/EmployeeInviteModal";
import AdminInviteModal from "../components/AdminInviteModal";
import Avatar from "../components/Avatar";
import DatePicker from "../components/ui/DatePicker";
import {
  PlusIcon,
  UserIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // const { addNotification } = useNotifications(); // Removed for Socket.IO implementation
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAdminInviteModal, setShowAdminInviteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    employee: any;
  }>({
    show: false,
    employee: null,
  });
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"employees" | "admins">(
    "employees"
  );

  // Search functionality state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const {
    data: employeesData,
    isLoading: employeesLoading,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: () => usersAPI.getEmployees(),
    enabled: user?.role === "admin",
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 0, // Disabled caching to ensure fresh data
  });

  const { data: adminsData, isLoading: adminsLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: () => usersAPI.getAdmins(),
    enabled: user?.role === "admin",
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 0, // Disabled caching to ensure fresh data
  });

  const isLoading =
    activeTab === "employees" ? employeesLoading : adminsLoading;
  const currentData = activeTab === "employees" ? employeesData : adminsData;

  // Debug logging
  console.log("activeTab:", activeTab);
  console.log("employeesData:", employeesData);
  console.log("adminsData:", adminsData);
  console.log("currentData:", currentData);

  // Try both with and without .data wrapper
  const currentUsers =
    activeTab === "employees"
      ? (currentData as any)?.data?.employees || (currentData as any)?.employees
      : (currentData as any)?.data?.admins || (currentData as any)?.admins;

  const deactivateEmployeeMutation = useMutation({
    mutationFn: usersAPI.deactivateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      // addNotification({
      //   type: "warning",
      //   title: "Employee Deactivated",
      //   message: "Employee has been deactivated successfully.",
      // });
      console.log("Employee deactivated successfully");
    },
    onError: (error: any) => {
      console.error("Failed to deactivate employee:", error);
      // addNotification({
      //   type: "error",
      //   title: "Deactivation Failed",
      //   message:
      //     error?.response?.data?.message ||
      //     "Failed to deactivate employee. Please try again.",
      // });
      console.error(
        "Failed to deactivate employee:",
        error?.response?.data?.message || error.message
      );
    },
  });

  const activateEmployeeMutation = useMutation({
    mutationFn: usersAPI.activateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      // addNotification({
      //   type: "success",
      //   title: "Employee Activated",
      //   message: "Employee has been activated successfully.",
      // });
      console.log("Employee activated successfully");
    },
    onError: (error: any) => {
      console.error("Failed to activate employee:", error);
      // addNotification({
      //   type: "error",
      //   title: "Activation Failed",
      //   message:
      //     error?.response?.data?.message ||
      //     "Failed to activate employee. Please try again.",
      // });
      console.error(
        "Failed to activate employee:",
        error?.response?.data?.message || error.message
      );
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: usersAPI.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      setDeleteConfirm({ show: false, employee: null });
      setError(""); // Clear any previous errors
      console.log("Employee deleted successfully");
    },
    onError: (error: any) => {
      console.error("Failed to delete employee:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to delete employee. Please try again.";
      setError(errorMessage);
      console.error("Failed to delete employee:", errorMessage);
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-300">
          Access denied. Admin privileges required.
        </p>
      </div>
    );
  }

  const handleToggleStatus = async (employeeId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateEmployeeMutation.mutateAsync(employeeId);
      } else {
        await activateEmployeeMutation.mutateAsync(employeeId);
      }
    } catch (error: any) {
      console.error("Failed to toggle employee status:", error);
    }
  };

  const handleDeleteEmployee = async () => {
    try {
      await deleteEmployeeMutation.mutateAsync(deleteConfirm.employee._id);
    } catch (error: any) {
      console.error("Failed to delete employee:", error);
    }
  };

  const showDeleteConfirm = (employee: any) => {
    setDeleteConfirm({ show: true, employee });
    setError(""); // Clear any previous errors when opening modal
  };

  const handleGenerateReport = (employee: any) => {
    localStorage.setItem(
      "selectedEmployeeReport",
      JSON.stringify({
        employee,
        searchCriteria: { searchTerm, dateFrom, dateTo },
        generatedAt: new Date().toISOString(),
      })
    );
    navigate("/reports");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 fade-in">
        <HeaderSkeleton />
        <TableSkeleton rows={7} cols={5} />
      </div>
    );
  }

  const users = currentUsers || [];
  const filteredUsers = users.filter((user: any) => {
    const matchesName =
      searchTerm === "" ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesName;
  });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your company team members
          </p>
          {/* Debug info */}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => refetchEmployees()}
            className="btn-secondary inline-flex items-center"
            disabled={employeesLoading}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
          {activeTab === "employees" ? (
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Invite Employee
            </button>
          ) : (
            <button
              onClick={() => setShowAdminInviteModal(true)}
              className="btn-primary inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Invite Admin
            </button>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
        <button
          onClick={() => setActiveTab("employees")}
          className={`flex-1 inline-flex items-center justify-center py-2 px-4 text-sm font-medium rounded-lg transition-all ${
            activeTab === "employees"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <UserIcon className="w-4 h-4 mr-2" />
          Employees (
          {(employeesData as any)?.data?.employees?.length ||
            (employeesData as any)?.employees?.length ||
            0}
          /{(employeesData as any)?.data?.pagination?.total || "unknown"})
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex-1 inline-flex items-center justify-center py-2 px-4 text-sm font-medium rounded-lg transition-all ${
            activeTab === "admins"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <ShieldCheckIcon className="w-4 h-4 mr-2" />
          Admins (
          {(adminsData as any)?.data?.admins?.length ||
            (adminsData as any)?.admins?.length ||
            0}
          )
        </button>
      </div>

      {/* Search & Report Section */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          <MagnifyingGlassIcon className="h-5 w-5 inline mr-2" />
          Search & Generate Reports
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Employee
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl bg-[var(--card-surface)] py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none ring-1 ring-inset ring-gray-200/70 transition-shadow focus:ring-2 focus:ring-blue-500/50 dark:text-gray-100 dark:ring-white/10"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Start Date (for reports)
            </label>
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              className="w-full"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              End Date (for reports)
            </label>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              className="w-full"
            />
          </div>

          {/* Report button */}
          <div className="flex flex-col justify-end">
            <label className="mb-2 block text-sm font-medium text-transparent select-none">
              Report
            </label>
            <button
              onClick={() => {
                const emp = filteredUsers[0];
                if (!emp) {
                  alert("No matching employee found to generate a report.");
                  return;
                }
                handleGenerateReport(emp);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <DocumentChartBarIcon className="h-4 w-4" />
              Generate Report
            </button>
          </div>
        </div>

        {(searchTerm || dateFrom || dateTo) && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Found {filteredUsers.length}{" "}
              {activeTab === "employees" ? "employee" : "admin"}
              {filteredUsers.length !== 1 ? "s" : ""}
              {searchTerm && <span> matching "{searchTerm}"</span>}
              {(dateFrom || dateTo) && (
                <span className="block mt-1">
                  📅 Report will include data{" "}
                  {dateFrom &&
                    `from ${new Date(dateFrom).toLocaleDateString()}`}{" "}
                  {dateTo && `to ${new Date(dateTo).toLocaleDateString()}`}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <EmployeeInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
      <AdminInviteModal
        isOpen={showAdminInviteModal}
        onClose={() => setShowAdminInviteModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-elevated rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Delete Employee
              </h2>
            </div>
            <div className="mb-4">
              <p className="text-sm mb-3 text-gray-600 dark:text-gray-300">
                Are you sure you want to delete{" "}
                <strong>
                  {deleteConfirm.employee?.name || "this employee"}
                </strong>
                ?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3">
                <div className="text-xs text-red-800 dark:text-red-200">
                  <strong>⚠️ Warning:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>This action cannot be undone</li>
                    <li>Employee's account and all data will be removed</li>
                    <li>All associated leave requests will also be deleted</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Error:</span>
                </div>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteConfirm({ show: false, employee: null });
                  setError(""); // Clear error when closing modal
                }}
                className="btn-secondary"
                disabled={deleteEmployeeMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployee}
                disabled={deleteEmployeeMutation.isPending}
                className="btn-danger inline-flex items-center"
              >
                {deleteEmployeeMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Deleting...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Employee
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employees Section */}
      <div className="mt-8 surface-card backdrop-blur-sm overflow-hidden">
        {filteredUsers.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <div
                className={`overflow-x-auto ${
                  filteredUsers.length > 10
                    ? "max-h-[600px] overflow-y-auto"
                    : ""
                }`}
              >
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/60">
                  <thead className="bg-gray-50/80 dark:bg-gray-800/60 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Employee
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Department
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Position
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Join Date
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {filteredUsers.map((employee: any) => (
                      <tr
                        key={employee._id}
                        className="group transition-colors duration-200 hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={employee.profilePicture}
                                name={employee.name}
                                size="md"
                                className="flex-shrink-0"
                                showErrorHint={true}
                              />
                              <div className="flex flex-col">
                                <button
                                  onClick={() =>
                                    navigate(`/employees/${employee._id}`)
                                  }
                                  className="text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
                                >
                                  {employee.name}
                                </button>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {employee.employeeId}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {employee.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {employee.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {employee.joinDate
                              ? new Date(employee.joinDate).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${
                                employee.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200/60 dark:ring-emerald-500/20"
                                  : employee.status === "pending"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200/60 dark:ring-amber-500/20"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400 ring-gray-200/60 dark:ring-gray-500/20"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  employee.status === "active"
                                    ? "bg-emerald-500"
                                    : employee.status === "pending"
                                    ? "bg-amber-500"
                                    : "bg-gray-400"
                                }`}
                              />
                              {employee.status === "active"
                                ? "Active"
                                : employee.status === "pending"
                                ? "Pending"
                                : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {activeTab === "employees" && (
                                <button
                                  onClick={() =>
                                    handleToggleStatus(
                                      employee._id,
                                      employee.isActive
                                    )
                                  }
                                  disabled={
                                    deactivateEmployeeMutation.isPending ||
                                    activateEmployeeMutation.isPending
                                  }
                                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ring-1 ring-inset transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    employee.isActive
                                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 ring-red-200/70 dark:ring-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20"
                                      : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-200/70 dark:ring-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                  }`}
                                >
                                  {employee.isActive
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>
                              )}

                              <button
                                onClick={() => handleGenerateReport(employee)}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-inset ring-blue-200/70 dark:ring-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                              >
                                <DocumentChartBarIcon className="h-4 w-4 mr-1" />
                                Report
                              </button>

                              {activeTab === "employees" && (
                                <button
                                  onClick={() => showDeleteConfirm(employee)}
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 ring-1 ring-inset ring-gray-200/70 dark:ring-gray-600/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:ring-red-200/70 dark:hover:ring-red-500/30"
                                >
                                  <TrashIcon className="h-4 w-4 mr-1" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div
              className={`lg:hidden space-y-4 p-4 sm:p-6 ${
                filteredUsers.length > 10 ? "max-h-[600px] overflow-y-auto" : ""
              }`}
            >
              {filteredUsers.map((employee: any) => (
                <div
                  key={employee._id}
                  className="rounded-xl p-6 border border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-br from-white/80 to-gray-50/40 dark:from-gray-800/40 dark:to-gray-900/20 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar
                      src={employee.profilePicture}
                      name={employee.name}
                      size="md"
                      showErrorHint={true}
                    />
                    <div>
                      <button
                        onClick={() => navigate(`/employees/${employee._id}`)}
                        className="text-left font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
                      >
                        {employee.name}
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {employee.employeeId}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Department
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {employee.department}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Position
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {employee.position}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Join Date
                      </p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {employee.joinDate
                          ? new Date(employee.joinDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Status</p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.status === "active"
                            ? "badge-success"
                            : employee.status === "pending"
                            ? "badge-warning"
                            : "badge-error"
                        }`}
                      >
                        {employee.status === "active"
                          ? "Active"
                          : employee.status === "pending"
                          ? "Pending"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    {activeTab === "employees" && (
                      <button
                        onClick={() =>
                          handleToggleStatus(employee._id, employee.isActive)
                        }
                        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ring-1 ring-inset transition-colors ${
                          employee.isActive
                            ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 ring-red-200/70 dark:ring-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20"
                            : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-200/70 dark:ring-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                        }`}
                      >
                        {employee.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                    <button
                      onClick={() => handleGenerateReport(employee)}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-inset ring-blue-200/70 dark:ring-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                    >
                      <DocumentChartBarIcon className="h-4 w-4 mr-1" />
                      Report
                    </button>
                    {activeTab === "employees" && (
                      <button
                        onClick={() => showDeleteConfirm(employee)}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 ring-1 ring-inset ring-gray-200/70 dark:ring-gray-600/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:ring-red-200/70 dark:hover:ring-red-500/30"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              No {activeTab === "employees" ? "employees" : "admins"} found
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {searchTerm
                ? `No results matching "${searchTerm}".`
                : `Invite your first ${
                    activeTab === "employees" ? "employee" : "admin"
                  } to get started.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
