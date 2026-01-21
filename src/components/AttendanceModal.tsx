import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  XMarkIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { attendanceAPI } from "../services/api";

interface Employee {
  machineId: string;
  name: string;
  employeeId: string;
  cardNumber?: string | null;
  department: string;
  enrolledAt: Date;
  isActive: boolean;
  idMapping?: {
    uid: string | number;
    userId?: string | number;
    cardno?: string | number | null;
    source: string;
  };
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onFetchRecords: (employee: Employee, forceRefresh?: boolean) => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  employee,
  onFetchRecords,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Attendance data state
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch attendance data when modal opens or dates change
  useEffect(() => {
    if (isOpen && employee) {
      fetchAttendanceData();
    }
  }, [isOpen, employee, startDate, endDate]);

  const fetchAttendanceData = async () => {
    if (!employee) return;

    setIsLoading(true);
    setError("");

    try {
      // CHANGED: Use database API instead of machine API
      const response = await attendanceAPI.getEmployeeAttendanceFromDB(
        employee.employeeId,
        startDate,
        endDate
      );

      if (response.data.success) {
        setAttendanceData(response.data);
      } else {
        setError("Failed to fetch attendance data");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch attendance data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!employee || !attendanceData) return;

    setIsGeneratingPDF(true);
    try {
      // Add PDF export functionality here
      // For now, just show success message
      alert("PDF export feature will be implemented soon!");
    } catch (err) {
      setError("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!employee) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Enhanced backdrop with app theme */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            {/* FIXED: Use app's primary color variables for theming */}
            <Dialog.Panel className="w-full max-w-6xl h-[90vh] max-h-[900px] transform overflow-hidden rounded-3xl bg-white dark:bg-gray-900 text-left align-middle shadow-2xl transition-all border-4 border-primary-500 dark:border-primary-400 flex flex-col">
              {/* Beautiful gradient border wrapper using app theme */}
              <div className="relative bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 dark:from-primary-400 dark:via-primary-500 dark:to-primary-600 p-1 rounded-3xl h-full flex flex-col">
                <div className="bg-white dark:bg-gray-900 rounded-[20px] h-full flex flex-col overflow-hidden">
                  {/* Header with app theme colors */}
                  <div className="flex-shrink-0 relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 dark:from-primary-900/20 dark:via-primary-800/30 dark:to-primary-900/20 border-b border-primary-200 dark:border-primary-700">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

                    <div className="relative flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        {/* Employee avatar with app theme gradient */}
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <span className="text-white font-bold text-xl">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <Dialog.Title
                            as="h3"
                            className="text-2xl font-bold text-black/50 dark:text-white     dark:from-primary-400 dark:to-primary-300 truncate"
                          >
                            {employee.name}'s Attendance
                          </Dialog.Title>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                            Employee ID: {employee.employeeId} • Department:{" "}
                            {employee.department}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="flex-shrink-0 group rounded-full bg-white/80 dark:bg-gray-800/80 p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 shadow-lg backdrop-blur-sm"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon
                          className="h-6 w-6 transition-transform group-hover:scale-110"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                      {/* Employee Information Card with app theme */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-inner">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                          Employee Information
                        </h4>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                Name:
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-primary-200 dark:border-primary-600">
                                {employee.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                Employee ID:
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-primary-200 dark:border-primary-600">
                                {employee.employeeId}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                Machine ID:
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-primary-200 dark:border-primary-600">
                                {employee.machineId}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                Department:
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-primary-200 dark:border-primary-600">
                                {employee.department}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date Range Controls with app theme */}
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-dashed border-primary-200 dark:border-primary-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                          <CalendarIcon className="w-5 h-5 mr-3 text-primary-500" />
                          Select Date Range
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-primary-400 dark:hover:border-primary-500"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={fetchAttendanceData}
                              disabled={isLoading}
                              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-primary-700 hover:border-primary-800 dark:bg-primary-500 dark:hover:bg-primary-600 dark:border-primary-600 dark:hover:border-primary-700"
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <ArrowPathIcon
                                  className={`w-5 h-5 transition-transform ${
                                    isLoading
                                      ? "animate-spin"
                                      : "group-hover:rotate-180"
                                  }`}
                                />
                                <span>
                                  {isLoading ? "Fetching..." : "Fetch Data"}
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Error Message with app theme */}
                      {error && (
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-l-4 border-red-500 rounded-xl p-4 shadow-md">
                          <div className="flex items-center space-x-3">
                            <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                              {error}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Loading State with app theme */}
                      {isLoading && (
                        <div className="text-center py-12">
                          <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                            <div className="w-12 h-12 border-4 border-primary-300 border-t-primary-700 rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"></div>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 mt-6 font-medium">
                            Loading attendance data...
                          </p>
                        </div>
                      )}

                      {/* Summary Cards with app theme */}
                      {attendanceData && !isLoading && (
                        <div className="space-y-8">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {/* Present Days Card */}
                            <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 card-hover-interactive">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                              <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                                    Present Days
                                  </p>
                                  <CheckCircleIcon className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
                                  {attendanceData.summary?.presentDays || 0}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  {attendanceData.summary?.attendanceRate?.toFixed(
                                    1
                                  ) || "0.0"}
                                  % attendance
                                </p>
                              </div>
                            </div>

                            {/* Absent Days Card */}
                            <div className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-red-200 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 card-hover-interactive">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                              <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                    Absent Days
                                  </p>
                                  <XCircleIcon className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-3xl font-bold text-red-900 dark:text-red-100 mb-1">
                                  {attendanceData.summary?.absentDays || 0}
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                  Days missed
                                </p>
                              </div>
                            </div>

                            {/* Late Days Card */}
                            <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-700 hover:border-yellow-300 dark:hover:border-yellow-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 card-hover-interactive">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                              <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                                    Late Days
                                  </p>
                                  <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100 mb-1">
                                  {attendanceData.summary?.lateDays || 0}
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                  Punctuality metric
                                </p>
                              </div>
                            </div>

                            {/* Attendance Rate Card with app theme */}
                            <div className="group relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-6 border-2 border-primary-200 dark:border-primary-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 card-hover-interactive">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full transform translate-x-8 -translate-y-8"></div>
                              <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-sm font-semibold text-primary-800 dark:text-primary-300">
                                    Attendance Rate
                                  </p>
                                  <ClockIcon className="w-8 h-8 text-primary-500 group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-3xl font-bold text-primary-900 dark:text-primary-100 mb-1">
                                  {attendanceData.summary?.attendanceRate?.toFixed(
                                    1
                                  ) || "0.0"}
                                  %
                                </p>
                                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                                  Overall performance
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Attendance Records Table with simple theme colors */}
                          <div className="  dark:bg-gray-800 rounded-2xl border-2 border-primary-200 dark:border-primary-700 overflow-hidden shadow-lg">
                            <div className=" dark:bg-grey px-6 py-4 border-b border-primary-200 dark:border-primary-600">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                                <div className="w-2 h-2   rounded-full   "></div>
                                Attendance Records (
                                {attendanceData.totalRecords || 0} entries)
                              </h4>
                            </div>
                            <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-300 dark:scrollbar-thumb-primary-600 scrollbar-track-primary-100 dark:scrollbar-track-primary-800">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="  dark:dark:bg-purple-900/20  sticky top-0   z-10">
                                  <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 dark:text-white uppercase tracking-wider">
                                      Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 dark:dark:text-white uppercase tracking-wider">
                                      Time
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 dark:dark:text-white uppercase tracking-wider">
                                      Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-primary-700 dark:dark:text-white uppercase tracking-wider">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {attendanceData.records?.map(
                                    (record: any, index: number) => (
                                      <tr
                                        key={index}
                                        className="hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors duration-200"
                                      >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {record.dateDisplay || record.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                                          {record.timeDisplay || record.time}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                          <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                                              record.type === "Check In"
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-700"
                                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-700"
                                            }`}
                                          >
                                            {record.type}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                          <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                                              record.isLate
                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700"
                                                : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-700"
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
                              {(!attendanceData.records ||
                                attendanceData.records.length === 0) && (
                                <div className="text-center py-12">
                                  <ClockIcon className="w-16 h-16 text-primary-300 dark:text-primary-600 mx-auto mb-4" />
                                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                                    No attendance records found for the selected
                                    date range.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Empty State with app theme */}
                      {!attendanceData && !isLoading && !error && (
                        <div className="text-center py-16">
                          <div className="relative">
                            <ClockIcon className="w-24 h-24 text-primary-300 dark:text-primary-600 mx-auto mb-6" />
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-full blur-xl"></div>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Ready to Load Attendance Data
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Select your desired date range above and click
                            "Fetch Data" to view detailed attendance records and
                            statistics.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer with app theme */}
                  <div className="flex-shrink-0 border-t border-primary-200 dark:border-primary-700 p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-3">
                        {attendanceData && (
                          <button
                            onClick={handleExportPDF}
                            disabled={isGeneratingPDF}
                            className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                          >
                            <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <div className="relative flex items-center space-x-2">
                              {isGeneratingPDF ? (
                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                              ) : (
                                <DocumentArrowDownIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              )}
                              <span>
                                {isGeneratingPDF
                                  ? "Generating..."
                                  : "Export PDF"}
                              </span>
                            </div>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        onClick={onClose}
                      >
                        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <span className="relative">Close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AttendanceModal;
