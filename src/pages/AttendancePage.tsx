import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ServerIcon,
  WifiIcon,
  XCircleIcon,
  InformationCircleIcon,
  UsersIcon,
  EyeIcon,
  ClockIcon as TimeIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI } from '../services/api';
import '../styles/design-system.css';

interface MachineConnection {
  ip: string;
  port: number;
  status: 'connected' | 'failed' | 'not_attempted';
  connectedAt?: Date;
  lastPing?: Date;
  error?: string;
  lastAttempt?: Date;
}

interface Employee {
  machineId: string;
  name: string;
  employeeId: string;
  department: string;
  enrolledAt: Date;
  isActive: boolean;
}

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent';
  checkIn?: string;
  checkOut?: string;
  isLate: boolean;
  lateMinutes: number;
  workingHours: number;
  machineId: string;
  recordId: string;
}

interface AttendanceData {
  employeeId: string;
  machineIp: string;
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
    avgWorkingHours: number;
  };
  records: AttendanceRecord[];
}

interface LateTimeSettings {
  useCustomCutoff: boolean;
  cutoffTime: string;
  machineDefault?: boolean;
  description?: string;
}

const AttendancePage: React.FC = () => {
  const [selectedIP, setSelectedIP] = useState('192.168.1.201');
  const [customIP, setCustomIP] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [machineStatus, setMachineStatus] = useState<MachineConnection | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Employee-related state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFetchingEmployees, setIsFetchingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  // Settings state
  const [lateTimeSettings, setLateTimeSettings] = useState<LateTimeSettings>({
    useCustomCutoff: false,
    cutoffTime: '09:00'
  });
  const [showSettings, setShowSettings] = useState(false);

  // Date range state for attendance fetching (DEFAULT: last 2 months)
  const [startDate, setStartDate] = useState(() => {
    // Default to 2 months ago
    const date = new Date();
    date.setMonth(date.getMonth() - 2);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });

  // Predefined machine IPs based on your configuration
  const predefinedIPs = [
    '192.168.1.201', // Your biometric machine
    '192.168.1.202',
    '192.168.1.203'
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
  }, []);

  const loadMachineStatus = async (ip: string) => {
    try {
      const response = await attendanceAPI.getMachineStatus(ip);
      setMachineStatus(response.data.machine);

      // If machine is connected, automatically fetch employees
      if (response.data.machine?.status === 'connected') {
        fetchEmployees(ip);
      }
    } catch (err) {
      console.error('Failed to load machine status:', err);
    }
  };

  const loadLateTimeSettings = async () => {
    try {
      const response = await attendanceAPI.getLateTimeSettings();
      setLateTimeSettings(response.data.settings);
    } catch (err) {
      console.error('Failed to load late time settings:', err);
    }
  };

  const handleConnect = async () => {
    const ipToConnect = selectedIP === 'custom' ? customIP : selectedIP;

    if (!ipToConnect) {
      setError('Please enter an IP address');
      return;
    }

    // Validate IP format
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ipToConnect)) {
      setError('Please enter a valid IP address');
      return;
    }

    setIsConnecting(true);
    setError('');
    setSuccess('');

    try {
      const response = await attendanceAPI.connectToMachine(ipToConnect, 4370);

      if (response.data.success) {
        setSuccess(`Successfully connected to biometric machine at ${ipToConnect}:4370`);
        await loadMachineStatus(ipToConnect);
      } else {
        setError(response.data.message || 'Connection failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Connection failed';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const ipToDisconnect = selectedIP === 'custom' ? customIP : selectedIP;

    try {
      const response = await attendanceAPI.disconnectFromMachine(ipToDisconnect);

      if (response.data.success) {
        setSuccess('Successfully disconnected from biometric machine');
        setMachineStatus(null);
        setEmployees([]);
        setSelectedEmployee(null);
        setAttendanceData(null);
      } else {
        setError(response.data.message || 'Disconnect failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Disconnect failed';
      setError(errorMessage);
    }
  };

  const fetchEmployees = async (ip: string) => {
    setIsFetchingEmployees(true);
    setError('');

    try {
      const response = await attendanceAPI.getEmployeesFromMachine(ip);

      if (response.data.success) {
        setEmployees(response.data.employees);
        setSuccess(`Fetched ${response.data.count} employees from machine`);
      } else {
        setError('Failed to fetch employees from machine');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch employees';
      setError(errorMessage);
    } finally {
      setIsFetchingEmployees(false);
    }
  };

  const handleEmployeeClick = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setError('');
  };

  const fetchAttendanceRecords = async (employee: Employee, forceSync = false) => {
    setIsFetchingAttendance(true);
    setError('');

    const currentIP = selectedIP === 'custom' ? customIP : selectedIP;

    try {
      const response = await attendanceAPI.getEmployeeAttendance(
        currentIP,
        employee.machineId,
        startDate,
        endDate,
        7,
        forceSync
      );

      if (response.data.success) {
        setAttendanceData(response.data);
        if (forceSync) {
          setSuccess('Attendance data synchronized from machine successfully');
        }
      } else {
        setError('Failed to fetch attendance records');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch attendance records';
      setError(errorMessage);
    } finally {
      setIsFetchingAttendance(false);
    }
  };

  const fetchRealTimeAttendance = async (employee: Employee) => {
    setIsFetchingAttendance(true);
    setError('');

    const currentIP = selectedIP === 'custom' ? customIP : selectedIP;

    try {
      const response = await attendanceAPI.getRealTimeAttendance(
        currentIP,
        employee.machineId,
        90 // Last 3 months
      );

      if (response.data.success) {
        setAttendanceData(response.data);
        setSuccess('✅ REAL attendance data fetched from ZKTeco machine successfully');
      } else {
        setError('Failed to fetch real-time attendance records');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch real-time attendance records';
      setError(errorMessage);
    } finally {
      setIsFetchingAttendance(false);
    }
  };

  const fetchRealMachineData = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    // Validate date range
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj > endDateObj) {
      setError('Start date cannot be after end date');
      return;
    }

    const diffDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      setError('Date range cannot exceed 1 year');
      return;
    }

    setIsFetchingAttendance(true);
    setError('');

    const currentIP = selectedIP === 'custom' ? customIP : selectedIP;

    try {
      const response = await attendanceAPI.fetchAttendanceRange(
        currentIP,
        startDate,
        endDate
      );

      if (response.data.success) {
        const result = response.data.result;
        const method = result.method || 'batch_fetch';
        const batchInfo = result.batches ? ` (${result.batches.successful}/${result.batches.total} batches successful)` : '';

        setSuccess(`✅ Successfully fetched REAL attendance logs from machine: ${result.totalFetched} logs fetched, ${result.saved} saved to database${batchInfo}`);

        // Refresh the selected employee's data if one is selected
        if (selectedEmployee) {
          fetchAttendanceRecords(selectedEmployee, false);
        }
      } else {
        setError('Failed to fetch real machine data');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch real machine data';
      setError(errorMessage);
    } finally {
      setIsFetchingAttendance(false);
    }
  };

  const updateLateTimeSettings = async (newSettings: LateTimeSettings) => {
    try {
      const response = await attendanceAPI.updateLateTimeSettings(newSettings);

      if (response.data.success) {
        setLateTimeSettings(newSettings);
        setSuccess('Late time settings updated successfully');
        setShowSettings(false);
      } else {
        setError('Failed to update settings');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update settings';
      setError(errorMessage);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 dark:text-green-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
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

      {/* Biometric Machine Connection */}
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

            {machineStatus?.status === 'connected' && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Settings</span>
              </button>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                Late Time Calculation Settings
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="machine-default"
                    checked={!lateTimeSettings.useCustomCutoff}
                    onChange={() => setLateTimeSettings(prev => ({ ...prev, useCustomCutoff: false }))}
                    className="text-blue-600"
                  />
                  <label htmlFor="machine-default" className="text-sm text-blue-800 dark:text-blue-200">
                    Use machine configured time rules (Default)
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="custom-cutoff"
                    checked={lateTimeSettings.useCustomCutoff}
                    onChange={() => setLateTimeSettings(prev => ({ ...prev, useCustomCutoff: true }))}
                    className="text-blue-600"
                  />
                  <label htmlFor="custom-cutoff" className="text-sm text-blue-800 dark:text-blue-200">
                    Use custom cutoff time:
                  </label>
                  <input
                    type="time"
                    value={lateTimeSettings.cutoffTime}
                    onChange={(e) => setLateTimeSettings(prev => ({ ...prev, cutoffTime: e.target.value }))}
                    disabled={!lateTimeSettings.useCustomCutoff}
                    className="px-2 py-1 text-xs border border-blue-300 dark:border-blue-600 rounded dark:bg-blue-800 dark:text-blue-100 disabled:opacity-50"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateLateTimeSettings(lateTimeSettings)}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    Save Settings
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {predefinedIPs.map(ip => (
                  <option key={ip} value={ip}>
                    {ip} {ip === '192.168.1.201' ? '(Default Machine)' : ''}
                  </option>
                ))}
                <option value="custom">Custom IP Address</option>
              </select>
            </div>

            {selectedIP === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom IP Address
                </label>
                <input
                  type="text"
                  value={customIP}
                  onChange={(e) => setCustomIP(e.target.value)}
                  placeholder="192.168.1.xxx"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
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
                      <span className={`text-sm font-medium ${getStatusColor(machineStatus.status)}`}>
                        {machineStatus.status === 'connected' ? 'Connected' :
                         machineStatus.status === 'failed' ? 'Failed' : 'Not Attempted'}
                      </span>
                    </div>
                    {machineStatus.connectedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Connected at: {new Date(machineStatus.connectedAt).toLocaleString()}
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

            {/* Fetch Real Data Section */}
            {machineStatus?.status === 'connected' && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">
                  📅 Fetch Attendance Records On-Demand
                </h3>
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-green-300 dark:border-green-600 rounded dark:bg-green-800 dark:text-green-100"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-green-300 dark:border-green-600 rounded dark:bg-green-800 dark:text-green-100"
                    />
                  </div>
                  <button
                    onClick={fetchRealMachineData}
                    disabled={isFetchingAttendance || !startDate || !endDate}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded transition-colors flex items-center space-x-2"
                  >
                    <ServerIcon className={`w-4 h-4 ${isFetchingAttendance ? 'animate-spin' : ''}`} />
                    <span>Fetch Records</span>
                  </button>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  Fetch attendance records for the selected date range. Default: last 2 months. Large ranges (&gt;60 days) use 7-day batches automatically.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleConnect}
                disabled={isConnecting || machineStatus?.status === 'connected'}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
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

              {machineStatus?.status === 'connected' && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
                <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee List */}
      {machineStatus?.status === 'connected' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employees from Machine */}
          <div className="card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Employees ({employees.length})
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      From biometric machine
                    </p>
                  </div>
                </div>

                {employees.length > 0 && (
                  <button
                    onClick={() => fetchEmployees(selectedIP === 'custom' ? customIP : selectedIP)}
                    disabled={isFetchingEmployees}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors"
                  >
                    {isFetchingEmployees ? 'Refreshing...' : 'Refresh'}
                  </button>
                )}
              </div>

              {isFetchingEmployees ? (
                <div className="flex items-center justify-center py-8">
                  <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-300">Fetching employees...</span>
                </div>
              ) : employees.length > 0 ? (
                <div className="space-y-2">
                  {employees.map((employee) => (
                    <div
                      key={employee.machineId}
                      onClick={() => handleEmployeeClick(employee)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900 ${selectedEmployee?.machineId === employee.machineId
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-200 dark:border-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {employee.name}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${employee.isActive
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              }`}>
                              {employee.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {employee.employeeId} • {employee.department}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Machine ID: {employee.machineId}
                          </p>
                        </div>
                        <EyeIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No employees found on machine</p>
                  <button
                    onClick={() => fetchEmployees(selectedIP === 'custom' ? customIP : selectedIP)}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Try fetching again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Employee Attendance Records */}
          <div className="card">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Attendance Records
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedEmployee ? `${selectedEmployee.name}` : 'Select an employee'}
                  </p>
                </div>
              </div>

              {/* Date Range Controls */}
              {selectedEmployee && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex items-end space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date (From)
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date (To)
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchAttendanceRecords(selectedEmployee, false)}
                        disabled={isFetchingAttendance || !startDate || !endDate}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center space-x-2"
                      >
                        <ArrowPathIcon className={`w-4 h-4 ${isFetchingAttendance ? 'animate-spin' : ''}`} />
                        <span>View Records</span>
                      </button>
                      <button
                        onClick={() => fetchRealTimeAttendance(selectedEmployee)}
                        disabled={isFetchingAttendance}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center space-x-2"
                      >
                        <ServerIcon className={`w-4 h-4 ${isFetchingAttendance ? 'animate-spin' : ''}`} />
                        <span>🔧 Real Machine Data (3M)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!selectedEmployee ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <TimeIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select an employee to view attendance records</p>
                </div>
              ) : isFetchingAttendance ? (
                <div className="flex items-center justify-center py-8">
                  <ArrowPathIcon className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-300">Loading attendance...</span>
                </div>
              ) : attendanceData ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {attendanceData.summary.attendanceRate}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Attendance Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {attendanceData.summary.avgWorkingHours}h
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Avg Daily Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {attendanceData.summary.lateDays}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Late Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {attendanceData.summary.presentDays}/{attendanceData.summary.totalDays}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Present/Total</div>
                    </div>
                  </div>

                  {/* Data Source Info */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-2">
                      <InformationCircleIcon className="w-4 h-4" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        ✅ Data source: {attendanceData.source === 'real_machine_data' ? 'REAL ZKTeco Machine Data' :
                                        attendanceData.source === 'database_cache' ? 'Database Cache' : 'Real-Time Machine'}
                        {attendanceData.realTime && ' (Live Fetch)'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-4 h-4" />
                      <span>Last updated: {new Date(attendanceData.fetchedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Records */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {attendanceData.records.map((record) => (
                      <div
                        key={record.recordId}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatDate(record.date)}
                            </span>
                            {record.status === 'present' ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircleIcon className="w-4 h-4 text-red-600" />
                            )}
                            {record.isLate && (
                              <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                          {record.status === 'present' && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {formatTime(record.checkIn)} - {formatTime(record.checkOut)}
                              {record.isLate && (
                                <span className="text-orange-600 ml-2">
                                  ({record.lateMinutes}min late)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${record.status === 'present' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {record.status === 'present' ? 'Present' : 'Absent'}
                          </div>
                          {record.status === 'present' && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {record.workingHours}h
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Connection Details */}
      {machineStatus?.status !== 'connected' && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Machine Configuration
          </h3>
          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>Default IP:</strong> 192.168.1.201</p>
            <p><strong>TCP Port:</strong> 4370</p>
            <p><strong>Subnet Mask:</strong> 255.255.255.0</p>
            <p><strong>Gateway:</strong> 0.0.0.0</p>
            <p><strong>DNS:</strong> 0.0.0.0</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;