import React, { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  ArrowPathIcon,
  ServerIcon,
  WifiIcon,
  XCircleIcon,
  InformationCircleIcon,
  UsersIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { attendanceAPI } from "../services/api";
import AttendanceModal from "../components/AttendanceModal";
import EmployeeRow from "../components/EmployeeRow";
import "../styles/design-system.css";

interface MachineConnection {
  ip: string;
  port: number;
  status: "connected" | "failed" | "not_attempted";
  connectedAt?: Date;
  lastPing?: Date;
  error?: string;
  lastAttempt?: Date;
}

interface Employee {
  machineId: string;
  name: string;
  employeeId: string; // Now uses UserID for accurate attendance correlation
  cardNumber?: string | null; // Separate card number field
  department: string;
  enrolledAt: Date;
  isActive: boolean;
  idMapping?: {
    uid: string | number;
    userId?: string | number; // Added UserID field
    cardno?: string | number | null;
    source: string;
  };
}

interface LateTimeSettings {
  useCustomCutoff: boolean;
  cutoffTime: string;
  machineDefault?: boolean;
  description?: string;
}

const AttendancePage: React.FC = () => {
  const [selectedIP, setSelectedIP] = useState("192.168.1.201");
  const [customIP, setCustomIP] = useState("");

  // User authentication state
  const [currentUser] = useState(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [machineStatus, setMachineStatus] = useState<MachineConnection | null>(
    null
  );
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Employee-related state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFetchingEmployees, setIsFetchingEmployees] = useState(false);
  const [_selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const [_isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  // Settings state
  const [lateTimeSettings, setLateTimeSettings] = useState<LateTimeSettings>({
    useCustomCutoff: false,
    cutoffTime: "09:00",
  });

  // Employee-specific time preference (for employees only)
  const [employeeTimePreference, setEmployeeTimePreference] = useState<
    "09:15" | "09:30"
  >("09:15");

  const [showSettings, setShowSettings] = useState(false);

  // Date range state for attendance fetching (DEFAULT: last 2 months)
  const [startDate, setStartDate] = useState(() => {
    // Default to 2 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split("T")[0];
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEmployee, setModalEmployee] = useState<Employee | null>(null);
  const [_isLoadingModalData, setIsLoadingModalData] = useState(false);
  const [_modalAttendanceData, setModalAttendanceData] = useState<any>(null);

  // Employee inline attendance state
  const [showEmployeeAttendance, setShowEmployeeAttendance] = useState(false);
  const [isLoadingEmployeeData, _setIsLoadingEmployeeData] = useState(false);
  const [employeeAttendanceData, _setEmployeeAttendanceData] =
    useState<any>(null);

  // Predefined machine IPs based on your configuration
  const predefinedIPs = [
    "192.168.1.201", // Your biometric machine
    "192.168.1.202",
    "192.168.1.203",
  ];

  // Load machine status on component mount
  useEffect(() => {
    if (selectedIP) {
      loadMachineStatus(selectedIP);
    }
  }, [selectedIP]);

  // Load late time settings
  useEffect(() => {
    loadLateTimeSettings();
    if (currentUser?.role === "employee") {
      loadEmployeeTimePreference();
    }
  }, [currentUser]);

  const loadMachineStatus = async (ip: string) => {
    try {
      const response = await attendanceAPI.getMachineStatus(ip);
      setMachineStatus(response.data.machine);

      // If machine is connected, automatically fetch employees
      if (response.data.machine?.status === "connected") {
        fetchEmployees(ip);
      }
    } catch (err) {
      console.error("Failed to load machine status:", err);
    }
  };

  const loadLateTimeSettings = async () => {
    try {
      const response = await attendanceAPI.getLateTimeSettings();
      setLateTimeSettings(response.data.settings);
    } catch (err) {
      console.error("Failed to load late time settings:", err);
    }
  };

  // Load employee's time preference
  const loadEmployeeTimePreference = async () => {
    try {
      // Check if user has saved preference in localStorage first
      const savedPreference = localStorage.getItem(
        `employeeTimePreference_${currentUser?.id}`
      );
      if (
        savedPreference &&
        (savedPreference === "09:15" || savedPreference === "09:30")
      ) {
        setEmployeeTimePreference(savedPreference as "09:15" | "09:30");
      }
    } catch (err) {
      console.error("Failed to load employee time preference:", err);
    }
  };

  // Save employee's time preference
  const saveEmployeeTimePreference = async (preference: "09:15" | "09:30") => {
    try {
      setEmployeeTimePreference(preference);
      // Save to localStorage for now (can be extended to API call later)
      localStorage.setItem(
        `employeeTimePreference_${currentUser?.id}`,
        preference
      );
      setSuccess(
        `Time preference updated to ${
          preference === "09:15" ? "9:15 AM" : "9:30 AM"
        }`
      );
    } catch (err) {
      console.error("Failed to save employee time preference:", err);
      setError("Failed to save time preference");
    }
  };

  const handleConnect = async () => {
    const ipToConnect = selectedIP === "custom" ? customIP : selectedIP;

    if (!ipToConnect) {
      setError("Please enter an IP address");
      return;
    }

    // Validate IP format
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ipToConnect)) {
      setError("Please enter a valid IP address");
      return;
    }

    setIsConnecting(true);
    setError("");
    setSuccess("");

    try {
      const response = await attendanceAPI.connectToMachine(ipToConnect, 4370);

      if (response.data.success) {
        setSuccess(
          `Successfully connected to biometric machine at ${ipToConnect}:4370`
        );
        await loadMachineStatus(ipToConnect);
      } else {
        setError(response.data.message || "Connection failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Connection failed";
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const ipToDisconnect = selectedIP === "custom" ? customIP : selectedIP;

    try {
      const response = await attendanceAPI.disconnectFromMachine(
        ipToDisconnect
      );

      if (response.data.success) {
        setSuccess("Successfully disconnected from biometric machine");
        setMachineStatus(null);
        setEmployees([]);
        setSelectedEmployee(null);
      } else {
        setError(response.data.message || "Disconnect failed");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Disconnect failed";
      setError(errorMessage);
    }
  };

  const fetchEmployees = async (ip: string) => {
    setIsFetchingEmployees(true);
    setError("");

    try {
      const response = await attendanceAPI.getEmployeesFromMachine(ip);

      if (response.data.success) {
        // Sort employees by UserID (employeeId) in ascending order
        const sortedEmployees = response.data.employees.sort(
          (a: Employee, b: Employee) => {
            const userIdA = parseInt(a.employeeId) || 0;
            const userIdB = parseInt(b.employeeId) || 0;
            return userIdA - userIdB;
          }
        );

        setEmployees(sortedEmployees);
        setSuccess(
          `Fetched ${response.data.count} employees from machine (sorted by UserID)`
        );
      } else {
        setError("Failed to fetch employees from machine");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch employees";
      setError(errorMessage);
    } finally {
      setIsFetchingEmployees(false);
    }
  };

  const handleEmployeeClick = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalEmployee(employee);
    setIsModalOpen(true);
    setIsLoadingModalData(true);
    setModalAttendanceData(null);
    setError("");

    try {
      // Fetch attendance data for the selected employee
      await fetchAttendanceRecords(employee, true);
      // The modal data will be set when fetchAttendanceRecords completes
    } catch (error) {
      console.error("Failed to fetch attendance for modal:", error);
    } finally {
      setIsLoadingModalData(false);
    }
  };

  const fetchAttendanceRecords = async (
    employee: Employee,
    forceSync = false
  ) => {
    setIsFetchingAttendance(true);

    // If modal is open for this employee, also update modal loading state
    if (modalEmployee && modalEmployee.employeeId === employee.employeeId) {
      setIsLoadingModalData(true);
    }

    setError("");

    const currentIP = selectedIP === "custom" ? customIP : selectedIP;

    try {
      const response = await attendanceAPI.getEmployeeAttendance(
        currentIP,
        employee.employeeId, // FIXED: Use employeeId (UserID) instead of machineId (UID)
        startDate,
        endDate,
        7,
        forceSync
      );

      if (response.data.success) {
        // If modal is open for this employee, also update modal data
        if (modalEmployee && modalEmployee.employeeId === employee.employeeId) {
          setModalAttendanceData(response.data);
        }

        if (forceSync) {
          setSuccess("Attendance data synchronized from machine successfully");
        }
      } else {
        setError("Failed to fetch attendance records");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch attendance records";
      setError(errorMessage);
    } finally {
      setIsFetchingAttendance(false);

      // If modal is open for this employee, also update modal loading state
      if (modalEmployee && modalEmployee.employeeId === employee.employeeId) {
        setIsLoadingModalData(false);
      }
    }
  };

  const updateLateTimeSettings = async (newSettings: LateTimeSettings) => {
    try {
      const response = await attendanceAPI.updateLateTimeSettings(newSettings);

      if (response.data.success) {
        setLateTimeSettings(newSettings);
        setSuccess("Late time settings updated successfully");
        setShowSettings(false);
      } else {
        setError("Failed to update settings");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update settings";
      setError(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalEmployee(null);
    setModalAttendanceData(null);
    setIsLoadingModalData(false);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "connected":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "connected":
        return (
          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
        );
      case "failed":
        return (
          <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
        );
      default:
        return (
          <InformationCircleIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        );
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Attendance Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Connect to biometric machines and manage employee attendance
          </p>
        </div>
      </div>

      {/* Biometric Machine Connection - Admin Only */}
      {(!currentUser || currentUser.role === "admin") && (
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ServerIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Biometric Machine Connection
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Connect to your biometric attendance device
                  </p>
                </div>
              </div>

              {machineStatus?.status === "connected" && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="btn-secondary text-sm"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              )}
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <h3 className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-3">
                  Late Time Calculation Settings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="machine-default"
                      checked={!lateTimeSettings.useCustomCutoff}
                      onChange={() =>
                        setLateTimeSettings((prev) => ({
                          ...prev,
                          useCustomCutoff: false,
                        }))
                      }
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="machine-default"
                      className="text-sm text-primary-800 dark:text-primary-200"
                    >
                      Use machine configured time rules (Default)
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="custom-cutoff"
                      checked={lateTimeSettings.useCustomCutoff}
                      onChange={() =>
                        setLateTimeSettings((prev) => ({
                          ...prev,
                          useCustomCutoff: true,
                        }))
                      }
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="custom-cutoff"
                      className="text-sm text-primary-800 dark:text-primary-200"
                    >
                      Use custom cutoff time:
                    </label>
                    <input
                      type="time"
                      value={lateTimeSettings.cutoffTime}
                      onChange={(e) =>
                        setLateTimeSettings((prev) => ({
                          ...prev,
                          cutoffTime: e.target.value,
                        }))
                      }
                      disabled={!lateTimeSettings.useCustomCutoff}
                      className="px-2 py-1 text-xs border border-primary-300 dark:border-primary-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateLateTimeSettings(lateTimeSettings)}
                      className="btn-primary text-xs"
                    >
                      Save Settings
                    </button>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="btn-secondary text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* IP Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Machine IP Address
                </label>
                <select
                  value={selectedIP}
                  onChange={(e) => setSelectedIP(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {predefinedIPs.map((ip) => (
                    <option key={ip} value={ip}>
                      {ip} {ip === "192.168.1.201" ? "(Default Machine)" : ""}
                    </option>
                  ))}
                  <option value="custom">Custom IP Address</option>
                </select>
              </div>

              {selectedIP === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom IP Address
                  </label>
                  <input
                    type="text"
                    value={customIP}
                    onChange={(e) => setCustomIP(e.target.value)}
                    placeholder="192.168.1.xxx"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              )}

              {/* Connection Status */}
              {machineStatus && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(machineStatus.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {machineStatus.ip}:4370
                        </span>
                        <span
                          className={`text-sm font-medium ${getStatusColor(
                            machineStatus.status
                          )}`}
                        >
                          {machineStatus.status === "connected"
                            ? "Connected"
                            : machineStatus.status === "failed"
                            ? "Failed"
                            : "Not Attempted"}
                        </span>
                      </div>
                      {machineStatus.connectedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Connected at:{" "}
                          {new Date(machineStatus.connectedAt).toLocaleString()}
                        </p>
                      )}
                      {machineStatus.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Error: {machineStatus.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleConnect}
                  disabled={
                    isConnecting || machineStatus?.status === "connected"
                  }
                  className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <WifiIcon className="w-4 h-4" />
                      <span>Connect</span>
                    </>
                  )}
                </button>

                {machineStatus?.status === "connected" && (
                  <button onClick={handleDisconnect} className="btn-danger">
                    Disconnect
                  </button>
                )}
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {success}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Self-View Section */}
      {currentUser && currentUser.role === "employee" && (
        <div className="card">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  My Attendance
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  View your attendance records and statistics
                </p>
              </div>
            </div>

            {/* Date Range Picker for Employee */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Select Date Range
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      // Create employee object for current user
                      if (currentUser && currentUser.employeeId) {
                        const currentEmployeeData = {
                          machineId: currentUser.employeeId,
                          name: currentUser.name || "Current User",
                          employeeId: currentUser.employeeId,
                          department: currentUser.department || "N/A",
                          enrolledAt: new Date(),
                          isActive: true,
                        };
                        setModalEmployee(currentEmployeeData);
                      }
                      setIsModalOpen(true);
                    }}
                    className="btn-primary flex items-center space-x-2 w-full"
                  >
                    <ClockIcon className="w-4 h-4" />
                    <span>View My Attendance</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <div className="flex items-center space-x-3">
                <InformationCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100">
                    Welcome, {currentUser.name}!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Select your desired date range above to view your attendance
                    records, working hours, and statistics.
                  </p>
                </div>
              </div>
            </div>

            {/* Employee Time Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mt-6">
              <div className="flex items-center space-x-3 mb-4">
                <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Late Time Preference
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Choose your preferred late cutoff time for attendance
                    calculations
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="time-915"
                    name="employeeTimePreference"
                    checked={employeeTimePreference === "09:15"}
                    onChange={() => saveEmployeeTimePreference("09:15")}
                    className="text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <label
                    htmlFor="time-915"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    9:15 AM - Standard office time
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="time-930"
                    name="employeeTimePreference"
                    checked={employeeTimePreference === "09:30"}
                    onChange={() => saveEmployeeTimePreference("09:30")}
                    className="text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                  <label
                    htmlFor="time-930"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    9:30 AM - Flexible time
                  </label>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Currently selected:{" "}
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {employeeTimePreference === "09:15" ? "9:15 AM" : "9:30 AM"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Attendance Display for Employees */}
      {currentUser?.role === "employee" && showEmployeeAttendance && (
        <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    My Attendance Records
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {employeeAttendanceData?.employeeName &&
                      `Welcome, ${employeeAttendanceData.employeeName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmployeeAttendance(false)}
                className="btn-secondary text-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors duration-200"
              >
                <XCircleIcon className="w-4 h-4" />
                <span>Hide</span>
              </button>
            </div>

            {/* Loading State */}
            {isLoadingEmployeeData && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <ArrowPathIcon className="w-5 h-5 animate-spin text-primary-600" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Loading your attendance data...
                  </span>
                </div>
              </div>
            )}

            {/* Attendance Data Display */}
            {!isLoadingEmployeeData && employeeAttendanceData && (
              <div className="space-y-6">
                {/* Date Range */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      📅 Date Range:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                      {employeeAttendanceData.dateRange?.from} to{" "}
                      {employeeAttendanceData.dateRange?.to}
                    </span>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Present Days Card with Admin-style Hover */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 card-hover-interactive card-hover-excellent relative group overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          Present Days
                        </p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {employeeAttendanceData?.summary?.presentDays || 0}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {employeeAttendanceData?.summary
                            ? `${(
                                ((employeeAttendanceData.summary.presentDays ||
                                  0) /
                                  Math.max(
                                    employeeAttendanceData.summary.totalDays ||
                                      1,
                                    1
                                  )) *
                                100
                              ).toFixed(1)}% attendance`
                            : "0.0% attendance"}
                        </p>
                      </div>
                      <CheckCircleIcon className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  {/* Absent Days Card with Admin-style Hover */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700 card-hover-interactive card-hover-poor relative group overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                          Absent Days
                        </p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                          {employeeAttendanceData?.summary?.absentDays || 0}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {employeeAttendanceData?.summary
                            ? `${(
                                ((employeeAttendanceData.summary.absentDays ||
                                  0) /
                                  Math.max(
                                    employeeAttendanceData.summary.totalDays ||
                                      1,
                                    1
                                  )) *
                                100
                              ).toFixed(1)}% absence rate`
                            : "0.0% absence rate"}
                        </p>
                      </div>
                      <XCircleIcon className="w-8 h-8 text-red-500" />
                    </div>
                  </div>

                  {/* Late Minutes Card with Admin-style Hover */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700 card-hover-interactive card-hover-good relative group overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Late Minutes
                        </p>
                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                          {employeeAttendanceData?.records
                            ? employeeAttendanceData.records
                                .filter(
                                  (record: any) =>
                                    record.isLate && record.lateMinutes
                                )
                                .reduce(
                                  (total: number, record: any) =>
                                    total + (record.lateMinutes || 0),
                                  0
                                )
                            : 0}
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          {employeeAttendanceData?.records &&
                          employeeAttendanceData?.summary
                            ? (() => {
                                const totalLateMinutes =
                                  employeeAttendanceData.records
                                    .filter(
                                      (record: any) =>
                                        record.isLate && record.lateMinutes
                                    )
                                    .reduce(
                                      (total: number, record: any) =>
                                        total + (record.lateMinutes || 0),
                                      0
                                    );
                                const presentDays =
                                  employeeAttendanceData.summary.presentDays ||
                                  1;
                                return `Avg: ${(
                                  totalLateMinutes / presentDays
                                ).toFixed(1)} min/day`;
                              })()
                            : "Avg: 0.0 min/day"}
                        </p>
                      </div>
                      <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>

                  {/* Attendance Rate Card with Admin-style Hover */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700 card-hover-interactive card-hover-excellent relative group overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Attendance Rate
                        </p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {employeeAttendanceData?.summary?.attendanceRate?.toFixed(
                            1
                          ) || "0.0"}
                          %
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Overall performance
                        </p>
                      </div>
                      <CheckCircleIcon className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </div>

                {/* Attendance Records Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {employeeAttendanceData.records?.map(
                        (record: any, index: number) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer transform hover:scale-[1.02]"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {record.dateDisplay || record.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {record.timeDisplay || record.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                  record.type === "Check In"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40"
                                }`}
                              >
                                {record.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                  record.isLate
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/40"
                                    : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40"
                                }`}
                              >
                                {record.isLate
                                  ? `Late (${record.lateDisplay})`
                                  : "On Time"}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>

                  {/* No Records Message */}
                  {(!employeeAttendanceData.records ||
                    employeeAttendanceData.records.length === 0) && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No attendance records found for the selected date range.
                    </div>
                  )}
                </div>

                {/* Total Records Info */}
                {employeeAttendanceData.totalRecords && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                    Showing {employeeAttendanceData.records?.length || 0} of{" "}
                    {employeeAttendanceData.totalRecords} total records
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Employee List - Full Width */}
      {machineStatus?.status === "connected" &&
        currentUser?.role === "admin" && (
          <div className="w-full">
            {/* Employees from Machine */}
            <div className="card overflow-hidden">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-50 dark:from-primary-900/20 dark:to-primary-900/20 border-b border-primary-200 dark:border-primary-700 p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                      <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Team Members
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {employees.length} employees from biometric machine
                        </p>
                        {employees.length > 0 && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {employees.length > 0 && (
                    <button
                      onClick={() =>
                        fetchEmployees(
                          selectedIP === "custom" ? customIP : selectedIP
                        )
                      }
                      disabled={isFetchingEmployees}
                      className="btn-secondary flex items-center space-x-2 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <ArrowPathIcon
                        className={`w-4 h-4 ${
                          isFetchingEmployees ? "animate-spin" : ""
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {isFetchingEmployees ? "Refreshing..." : "Refresh List"}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {isFetchingEmployees ? (
                  <div className="flex items-center justify-center py-8">
                    <ArrowPathIcon className="w-6 h-6 animate-spin text-primary-600 dark:text-primary-400" />
                    <span className="ml-2 text-gray-600 dark:text-gray-300">
                      Fetching employees...
                    </span>
                  </div>
                ) : employees.length > 0 ? (
                  <div className="max-h-[70vh] overflow-y-auto">
                    {employees.map((employee) => (
                      <EmployeeRow
                        key={employee.machineId}
                        employee={employee}
                        onClick={handleEmployeeClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UsersIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Employees Found
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Unable to fetch employee data from the biometric machine
                    </p>
                    <button
                      onClick={() =>
                        fetchEmployees(
                          selectedIP === "custom" ? customIP : selectedIP
                        )
                      }
                      className="btn-success inline-flex items-center space-x-2"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      <span>Try Again</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Connection Details - Admin Only */}
      {machineStatus?.status !== "connected" &&
        currentUser?.role === "admin" && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-2">
              Machine Configuration
            </h3>
            <div className="text-xs text-primary-800 dark:text-primary-200 space-y-1">
              <p>
                <strong>Default IP:</strong> 192.168.1.201
              </p>
              <p>
                <strong>TCP Port:</strong> 4370
              </p>
              <p>
                <strong>Subnet Mask:</strong> 255.255.255.0
              </p>
              <p>
                <strong>Gateway:</strong> 0.0.0.0
              </p>
              <p>
                <strong>DNS:</strong> 0.0.0.0
              </p>
            </div>
          </div>
        )}

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        employee={modalEmployee}
        onFetchRecords={(employee) => fetchAttendanceRecords(employee, false)}
      />
    </div>
  );
};

export default AttendancePage;
