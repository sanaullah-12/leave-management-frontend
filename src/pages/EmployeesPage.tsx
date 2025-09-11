import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "../services/api";
import { useNotifications } from "../components/NotificationSystem";
import LoadingSpinner from "../components/LoadingSpinner";
import EmployeeInviteModal from "../components/EmployeeInviteModal";
import AdminInviteModal from "../components/AdminInviteModal";
import {
  PlusIcon,
  UserIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";
import "../styles/design-system.css";

const EmployeesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAdminInviteModal, setShowAdminInviteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    employee: any;
  }>({
    show: false,
    employee: null,
  });

  // Search functionality state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => usersAPI.getEmployees(),
    enabled: user?.role === "admin",
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const deactivateEmployeeMutation = useMutation({
    mutationFn: usersAPI.deactivateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      addNotification({
        type: "warning",
        title: "Employee Deactivated",
        message: "Employee has been deactivated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Failed to deactivate employee:", error);
      addNotification({
        type: "error",
        title: "Deactivation Failed",
        message:
          error?.response?.data?.message ||
          "Failed to deactivate employee. Please try again.",
      });
    },
  });

  const activateEmployeeMutation = useMutation({
    mutationFn: usersAPI.activateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      addNotification({
        type: "success",
        title: "Employee Activated",
        message: "Employee has been activated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Failed to activate employee:", error);
      addNotification({
        type: "error",
        title: "Activation Failed",
        message:
          error?.response?.data?.message ||
          "Failed to activate employee. Please try again.",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: usersAPI.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setDeleteConfirm({ show: false, employee: null });
      addNotification({
        type: "success",
        title: "Employee Deleted",
        message: "Employee has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Failed to delete employee:", error);
      addNotification({
        type: "error",
        title: "Deletion Failed",
        message:
          error?.response?.data?.message ||
          "Failed to delete employee. Please try again.",
      });
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-8">
        <p style={{ color: "var(--text-secondary)" }}>
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
  };

  const handleSearch = () => {
    setIsSearchActive(true);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setIsSearchActive(false);
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
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const employees = employeesData?.data?.employees || [];
  const filteredEmployees = employees.filter((employee: any) => {
    const matchesName =
      searchTerm === "" ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesName;
  });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Employees
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Manage your company employees
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Invite Employee
          </button>
          <button
            onClick={() => setShowAdminInviteModal(true)}
            className="btn-secondary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Invite Admin
          </button>
        </div>
      </div>

      {/* 🔎 Search & Report Section (unchanged design) */}
      <div className="card">
        <div className="card-body">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            <MagnifyingGlassIcon className="h-5 w-5 inline mr-2" />
            Search & Generate Reports
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Search Employee
              </label>
              <input
                type="text"
                placeholder="Name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full"
              />
            </div>

            {/* Start Date */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Start Date (for reports)
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field w-full date-input"
              />
            </div>

            {/* End Date */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                End Date (for reports)
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field w-full date-input"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col justify-end space-y-2">
              <button
                onClick={handleSearch}
                className="btn-primary inline-flex items-center justify-center"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Search
              </button>
              {(searchTerm || dateFrom || dateTo) && (
                <button
                  onClick={handleClearSearch}
                  className="btn-secondary text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {isSearchActive && (
            <div
              className="mt-4 p-3 rounded-lg"
              style={{ backgroundColor: "var(--surface-hover)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Found {filteredEmployees.length} employee
                {filteredEmployees.length !== 1 ? "s" : ""}
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

      {/* Delete Confirm */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card-elevated rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
              <h2
                className="text-lg font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Delete Employee
              </h2>
            </div>
            <div className="mb-4">
              <p
                className="text-sm mb-3"
                style={{ color: "var(--text-secondary)" }}
              >
                Are you sure you want to delete{" "}
                <strong>
                  {deleteConfirm.employee?.name || "this employee"}
                </strong>
                ?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-xs text-red-800">
                  <strong>⚠️ Warning:</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>This action cannot be undone</li>
                    <li>Employee's historical data will be removed</li>
                    <li>
                      Cannot delete if employee has pending/approved leaves
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() =>
                  setDeleteConfirm({ show: false, employee: null })
                }
                className="btn-secondary"
                disabled={deleteEmployeeMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployee}
                disabled={deleteEmployeeMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
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
      <div className="mt-10 bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {filteredEmployees.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block p-8">
              <div className="overflow-hidden rounded-xl border border-gray-200/30 dark:border-gray-700/30">
                <table className="min-w-full divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 dark:from-gray-800/60 dark:to-gray-900/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Join Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 dark:bg-gray-800/20 divide-y divide-gray-200/20 dark:divide-gray-700/20">
                    {filteredEmployees.map((employee: any) => (
                      <tr
                        key={employee._id}
                        className="group hover:bg-muted/30 transition-all duration-200"
                      >
                        {/* ✅ Spacing Fix Here */}
                        <td className="pl-2 pr-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                              {employee.name
                                ? employee.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                : "U"}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-white">
                                {employee.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {employee.employeeId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {employee.department}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {employee.position}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {employee.joinDate
                            ? new Date(employee.joinDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
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
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
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
                              className={`px-3 py-1 text-xs rounded transition-colors ${
                                employee.isActive ? "btn-danger" : "btn-success"
                              }`}
                            >
                              {employee.isActive ? "Deactivate" : "Activate"}
                            </button>

                            {/* Report Button kept same */}
                            <button
                              onClick={() => handleGenerateReport(employee)}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors"
                              style={{
                                backgroundColor: "var(--color-primary-100)",
                                color: "var(--color-primary-800)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "var(--color-primary-200)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "var(--color-primary-100)";
                              }}
                            >
                              <DocumentChartBarIcon className="h-4 w-4 mr-1" />
                              Report
                            </button>

                            <button
                              onClick={() => showDeleteConfirm(employee)}
                              className="btn-danger px-3 py-1 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredEmployees.map((employee: any) => (
                <div key={employee._id} className="card-elevated p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-medium">
                      {employee.name
                        ? employee.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .substring(0, 2)
                        : "U"}
                    </div>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs text-gray-400">
                        {employee.employeeId}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Department</p>
                      <p>{employee.department}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Position</p>
                      <p>{employee.position}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Join Date</p>
                      <p>
                        {employee.joinDate
                          ? new Date(employee.joinDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Status</p>
                      <p>{employee.status}</p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() =>
                        handleToggleStatus(employee._id, employee.isActive)
                      }
                      className={`px-3 py-1 text-xs rounded ${
                        employee.isActive ? "btn-danger" : "btn-success"
                      }`}
                    >
                      {employee.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleGenerateReport(employee)}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: "var(--color-primary-100)",
                        color: "var(--color-primary-800)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-primary-200)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--color-primary-100)";
                      }}
                    >
                      <DocumentChartBarIcon className="h-4 w-4 mr-1" />
                      Report
                    </button>
                    <button
                      onClick={() => showDeleteConfirm(employee)}
                      className="btn-danger px-3 py-1 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No employees found
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesPage;
