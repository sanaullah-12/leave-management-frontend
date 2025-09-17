import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersAPI, leavesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import '../styles/design-system.css';

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeChart, setActiveChart] = useState<'pie' | 'line' | 'bar'>('pie');

  // Fetch employee details
  const { data: employeeData, isLoading: employeeLoading, error: employeeError } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => usersAPI.getEmployee(id!),
    enabled: !!id,
    retry: 1,
  });

  // Fetch employee leave history
  const { data: leaveHistoryData } = useQuery({
    queryKey: ['employee-leaves', id],
    queryFn: () => leavesAPI.getEmployeeLeaves(id!),
    enabled: !!id,
    retry: 1,
  });

  // Fetch employee leave balance
  const { data: leaveBalanceData } = useQuery({
    queryKey: ['employee-balance', id],
    queryFn: () => leavesAPI.getEmployeeLeaveBalance(id!),
    enabled: !!id,
    retry: 1,
  });

  if (employeeLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle employee not found or API errors
  if (employeeError || !employeeData?.data?.employee) {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate('/employees')}
            className="btn-ghost p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Employee Not Found
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              The requested employee could not be found
            </p>
          </div>
        </div>
        
        <div className="card-elevated p-8 text-center">
          <UserIcon className="mx-auto h-16 w-16 mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Employee Not Found
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            This employee may have been removed or the ID is incorrect.
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
            Error: {employeeError?.message || 'Employee data could not be loaded'}
          </p>
          <button
            onClick={() => navigate('/employees')}
            className="btn-primary"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  const employee = employeeData?.data?.employee;
  const leaveHistory = leaveHistoryData?.data?.leaves || [];
  const leaveBalance = leaveBalanceData?.data?.balance || {
    annual: { total: 10, used: 5, remaining: 5 },
    casual: { total: 10, used: 2, remaining: 8 },
    sick: { total: 8, used: 1, remaining: 7 }
  };

  // Calculate leave statistics
  const totalAllocated = Object.values(leaveBalance).reduce((sum: number, balance: any) => sum + balance.total, 0);
  const totalUsed = Object.values(leaveBalance).reduce((sum: number, balance: any) => sum + balance.used, 0);
  const totalRemaining = totalAllocated - totalUsed;

  // Calculate status counts
  const statusCounts = leaveHistory.reduce((acc: any, leave: any) => {
    acc[leave.status] = (acc[leave.status] || 0) + 1;
    return acc;
  }, {});

  const approvedCount = statusCounts.approved || 0;
  const pendingCount = statusCounts.pending || 0;
  const rejectedCount = statusCounts.rejected || 0;

  // Prepare chart data
  const pieData = [
    { name: 'Used', value: totalUsed, color: '#ef4444' },
    { name: 'Remaining', value: totalRemaining, color: '#22c55e' }
  ];

  // Generate monthly leave data (mock data for demonstration)
  const monthlyData = [
    { month: 'Jan', leaves: 2 },
    { month: 'Feb', leaves: 1 },
    { month: 'Mar', leaves: 3 },
    { month: 'Apr', leaves: 0 },
    { month: 'May', leaves: 2 },
    { month: 'Jun', leaves: 1 },
    { month: 'Jul', leaves: 0 },
    { month: 'Aug', leaves: 1 },
    { month: 'Sep', leaves: 0 },
    { month: 'Oct', leaves: 0 },
    { month: 'Nov', leaves: 0 },
    { month: 'Dec', leaves: 0 }
  ];

  // Leave type breakdown
  const leaveTypeData = Object.entries(leaveBalance).map(([type, data]: [string, any]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    total: data.total,
    used: data.used,
    remaining: data.remaining
  }));

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-error';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="card-elevated p-3 shadow-lg">
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/employees')}
          className="btn-ghost p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Employee Details
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Comprehensive overview and analytics
          </p>
        </div>
      </div>

      {/* Employee Profile Header */}
      <div className="card-elevated">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Profile Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar
                src={employee.profilePicture}
                name={employee.name}
                size="3xl"
                className="hover-lift"
              />
              <div className="text-center sm:text-left">
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {employee.name}
                </h2>
                <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {employee.position}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{employee.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {typeof employee.department === 'object' && employee.department?.name 
                        ? employee.department.name 
                        : employee.department}
                    </span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>ID: {employee.employeeId}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`badge ${employee.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {employee.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  <span className="badge badge-primary">
                    {employee.role === 'admin' ? 'Administrator' : 'Employee'}
                  </span>
                  {employee.joinDate && (
                    <span className="badge badge-gray">
                      Joined {formatDate(employee.joinDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 border border-green-200 dark:border-green-700/50">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-2xl">✅</span>
                  </div>
                  <p className="text-2xl font-bold mb-1 text-green-700 dark:text-green-300">
                    {approvedCount}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Approved
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 border border-amber-200 dark:border-amber-700/50">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <p className="text-2xl font-bold mb-1 text-amber-700 dark:text-amber-300">
                    {pendingCount}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Pending
                  </p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 border border-red-200 dark:border-red-700/50">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-2xl">❌</span>
                  </div>
                  <p className="text-2xl font-bold mb-1 text-red-700 dark:text-red-300">
                    {rejectedCount}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Rejected
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 border border-blue-200 dark:border-blue-700/50">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-2xl font-bold mb-1 text-blue-700 dark:text-blue-300">
                    {totalUsed}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Days Used
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Chart Controls */}
          <div className="card">
            <div className="card-header">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                    Leave Analytics
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Visual breakdown of leave usage patterns
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveChart('pie')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeChart === 'pie' ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    Distribution
                  </button>
                  <button
                    onClick={() => setActiveChart('line')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeChart === 'line' ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    Trend
                  </button>
                  <button
                    onClick={() => setActiveChart('bar')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeChart === 'bar' ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    Types
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="h-80">
                {activeChart === 'pie' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }: any) => `${name}: ${value} (${((percent || 0) * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {activeChart === 'line' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: 'var(--text-secondary)' }}
                        axisLine={{ stroke: 'var(--border-color)' }}
                      />
                      <YAxis 
                        tick={{ fill: 'var(--text-secondary)' }}
                        axisLine={{ stroke: 'var(--border-color)' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="leaves" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeChart === 'bar' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaveTypeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis 
                        dataKey="type" 
                        tick={{ fill: 'var(--text-secondary)' }}
                        axisLine={{ stroke: 'var(--border-color)' }}
                      />
                      <YAxis 
                        tick={{ fill: 'var(--text-secondary)' }}
                        axisLine={{ stroke: 'var(--border-color)' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="used" fill="#ef4444" name="Used" />
                      <Bar dataKey="remaining" fill="#22c55e" name="Remaining" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Leave Balance Breakdown */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                Leave Balance
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Current allocation status
              </p>
            </div>
            <div className="card-body space-y-4">
              {Object.entries(leaveBalance).map(([type, data]: [string, any]) => (
                <div key={type} className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                      {type} Leave
                    </h4>
                    <span className="badge badge-primary">
                      {data.remaining}/{data.total}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Allocated</span>
                      <span style={{ color: 'var(--text-primary)' }}>{data.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Used</span>
                      <span className="text-red-600">{data.used}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Remaining</span>
                      <span className="text-green-600">{data.remaining}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${data.total > 0 ? (data.used / data.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leave History */}
      <div className="card-elevated">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-purple-700 dark:text-purple-300">
                Leave History
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Complete record of leave requests and approvals
              </p>
            </div>
            <span className="badge badge-primary">
              {leaveHistory.length} requests
            </span>
          </div>
        </div>

        <div className="card-body">
          {leaveHistory.length > 0 ? (
            <div className="space-y-3">
              {leaveHistory.map((leave: any) => (
                <div key={leave._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 table-row-hover transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-6 gap-6 items-center">
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">LEAVE TYPE</div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {leave.leaveType}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">DURATION</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(leave.startDate)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        to {formatDate(leave.endDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">DAYS</div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {leave.totalDays} days
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">STATUS</div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(leave.status)} ${
                        leave.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300' : ''
                      }`}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">REASON</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs" title={leave.reason}>
                        {leave.reason}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">APPLIED</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(leave.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDaysIcon 
                className="w-16 h-16 mx-auto mb-4" 
                style={{ color: 'var(--text-tertiary)' }} 
              />
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No Leave History
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                This employee hasn't submitted any leave requests yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;