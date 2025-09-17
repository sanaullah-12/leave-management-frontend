import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI, leavesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import EmployeeLeaveActivity from '../components/EmployeeLeaveActivity';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon,
  PhoneIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
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

interface LeaveAllocation {
  casual: number;
  sick: number;
  annual: number;
}

const EmployeeDetailPageReal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeChart, setActiveChart] = useState<'pie' | 'line' | 'bar'>('pie');
  const [isEditingAllocation, setIsEditingAllocation] = useState(false);
  const [editAllocation, setEditAllocation] = useState<LeaveAllocation>({
    casual: 10,
    sick: 8,
    annual: 10
  });
  const [savedAllocation, setSavedAllocation] = useState<LeaveAllocation | null>(null);

  // All hooks must be at the top - before any conditional returns
  // Fetch all employees and find the specific one (since individual employee endpoint might not exist)
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersAPI.getEmployees(1, 100),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch employee's leave history
  const { data: leaveHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ['employee-leaves', id],
    queryFn: () => leavesAPI.getLeaves(1, 50, '', id),
    enabled: !!id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch company leave policy
  const { data: leavePolicyData } = useQuery({
    queryKey: ['leave-policy'],
    queryFn: () => leavesAPI.getLeavePolicy(),
    retry: 1,
  });

  // Update employee leave allocation mutation
  const updateAllocationMutation = useMutation({
    mutationFn: (allocations: LeaveAllocation) => 
      leavesAPI.updateEmployeeLeaveAllocation(id!, allocations),
    onSuccess: () => {
      // Update saved allocation state to reflect the new values
      setSavedAllocation(editAllocation);
      queryClient.invalidateQueries({ queryKey: ['employee-leaves', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-leave-balance', id] });
      queryClient.invalidateQueries({ queryKey: ['leave-policy'] });
      setIsEditingAllocation(false);
    },
  });

  // Get company policy or use default
  const defaultPolicy = leavePolicyData?.data || {
    casual: 10,
    sick: 8,
    annual: 10
  };

  // Memoize employee finding to prevent recalculation
  const employees = React.useMemo(() => 
    employeesData?.data?.employees || [], 
    [employeesData?.data?.employees]
  );
  
  const employee = React.useMemo(() => 
    employees.find((emp: any) => emp._id === id),
    [employees, id]
  );

  // Initialize editAllocation only once when component mounts or when we have employee data
  React.useEffect(() => {
    if (employee && employee.leaveQuota && !savedAllocation) {
      // Employee has custom allocations
      const customAllocation = {
        casual: employee.leaveQuota.casual || defaultPolicy.casual || 10,
        sick: employee.leaveQuota.sick || defaultPolicy.sick || 8,
        annual: employee.leaveQuota.annual || defaultPolicy.annual || 10
      };
      setSavedAllocation(customAllocation);
      setEditAllocation(customAllocation);
    } else if (!savedAllocation && defaultPolicy) {
      // Use default policy
      const defaultAllocation = {
        casual: defaultPolicy.casual || 10,
        sick: defaultPolicy.sick || 8,
        annual: defaultPolicy.annual || 10
      };
      setSavedAllocation(defaultAllocation);
      setEditAllocation(defaultAllocation);
    }
  }, [employee, defaultPolicy, savedAllocation]);

  // Get leave history for this employee
  const leaveHistory = React.useMemo(() => 
    leaveHistoryData?.data?.leaves || [],
    [leaveHistoryData?.data?.leaves]
  );

  // Calculate leave balance function (moved up to avoid hook order issues)
  const calculateLeaveBalance = React.useCallback(() => {
    const currentYear = new Date().getFullYear();
    const yearlyLeaves = leaveHistory.filter((leave: any) => {
      const leaveYear = new Date(leave.startDate).getFullYear();
      return leaveYear === currentYear && leave.status === 'approved';
    });

    // Use saved allocations (actual employee allocations) for calculations
    const allocations = savedAllocation || {
      casual: defaultPolicy.casual || 10,
      sick: defaultPolicy.sick || 8,
      annual: defaultPolicy.annual || 10
    };

    const balance = {
      casual: {
        total: allocations.casual,
        used: yearlyLeaves.filter((leave: any) => leave.leaveType === 'casual')
          .reduce((sum: number, leave: any) => sum + (leave.totalDays || 1), 0),
        remaining: 0
      },
      sick: {
        total: allocations.sick,
        used: yearlyLeaves.filter((leave: any) => leave.leaveType === 'sick')
          .reduce((sum: number, leave: any) => sum + (leave.totalDays || 1), 0),
        remaining: 0
      },
      annual: {
        total: allocations.annual,
        used: yearlyLeaves.filter((leave: any) => leave.leaveType === 'annual')
          .reduce((sum: number, leave: any) => sum + (leave.totalDays || 1), 0),
        remaining: 0
      }
    };

    // Calculate remaining leaves
    balance.casual.remaining = Math.max(0, balance.casual.total - balance.casual.used);
    balance.sick.remaining = Math.max(0, balance.sick.total - balance.sick.used);
    balance.annual.remaining = Math.max(0, balance.annual.total - balance.annual.used);

    return balance;
  }, [leaveHistory, editAllocation, defaultPolicy]);

  const leaveBalance = React.useMemo(() => calculateLeaveBalance(), [calculateLeaveBalance]);

  // Loading state
  if (employeesLoading || historyLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (employeesError || !employee) {
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Employee Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              The requested employee could not be found
            </p>
          </div>
        </div>
        
        <div className="card-elevated p-8 text-center">
          <UserIcon className="mx-auto h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Employee Not Found
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            This employee may have been removed or the ID is incorrect.
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

  // Calculate leave statistics
  const totalAllocated = Object.values(leaveBalance).reduce((sum: number, balance: any) => sum + balance.total, 0);
  const totalUsed = Object.values(leaveBalance).reduce((sum: number, balance: any) => sum + balance.used, 0);
  const totalRemaining = totalAllocated - totalUsed;

  // Prepare chart data
  const pieData = [
    { name: 'Used', value: totalUsed, color: '#ef4444' },
    { name: 'Remaining', value: totalRemaining, color: '#22c55e' }
  ];

  // Generate monthly leave data from actual history
  const generateMonthlyData = () => {
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => {
      const monthLeaves = leaveHistory.filter((leave: any) => {
        const leaveDate = new Date(leave.startDate);
        return leaveDate.getFullYear() === currentYear && 
               leaveDate.getMonth() === index && 
               leave.status === 'approved';
      });
      
      const totalDays = monthLeaves.reduce((sum: number, leave: any) => sum + (leave.totalDays || 1), 0);
      
      return { month, leaves: totalDays };
    });
  };

  const monthlyData = generateMonthlyData();

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
          <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
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

  const handleSaveAllocation = () => {
    updateAllocationMutation.mutate(editAllocation);
  };

  const handleCancelEdit = () => {
    // Reset to saved allocation values
    setEditAllocation(savedAllocation || {
      casual: defaultPolicy.casual || 10,
      sick: defaultPolicy.sick || 8,
      annual: defaultPolicy.annual || 10
    });
    setIsEditingAllocation(false);
  };

  const handleStartEdit = () => {
    // Start editing with current saved allocation values
    setEditAllocation(savedAllocation || {
      casual: defaultPolicy.casual || 10,
      sick: defaultPolicy.sick || 8,
      annual: defaultPolicy.annual || 10
    });
    setIsEditingAllocation(true);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/employees')}
            className="btn-ghost p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Employee Details
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Comprehensive overview and analytics
            </p>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Company Policy: {defaultPolicy.casual}C • {defaultPolicy.sick}S • {defaultPolicy.annual}A
              </span>
            </div>
            {!isEditingAllocation && (
              <button
                onClick={handleStartEdit}
                className="btn-secondary inline-flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Allocation
              </button>
            )}
          </div>
        )}
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
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                  {employee.name}
                </h2>
                <p className="text-lg mb-4 text-gray-600 dark:text-gray-300">
                  {employee.position}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">{employee.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {typeof employee.department === 'object' && (employee.department as any)?.name 
                        ? (employee.department as any).name 
                        : employee.department}
                    </span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center space-x-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">ID: {employee.employeeId}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stats-card text-center hover-lift">
                  <div className="p-4">
                    <div className="flex items-center justify-center mb-2">
                      <CalendarDaysIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">
                      {totalAllocated}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Total Allocated
                    </p>
                  </div>
                </div>

                <div className="stats-card text-center hover-lift">
                  <div className="p-4">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircleIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">
                      {totalUsed}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Leaves Taken
                    </p>
                  </div>
                </div>

                <div className="stats-card text-center hover-lift">
                  <div className="p-4">
                    <div className="flex items-center justify-center mb-2">
                      <ClockIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">
                      {totalRemaining}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Remaining
                    </p>
                  </div>
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Leave Analytics
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Visual breakdown of leave usage patterns for {new Date().getFullYear()}
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
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
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
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="type" 
                        tick={{ fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Leave Balance
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Current allocation status
                  </p>
                </div>
                {user?.role === 'admin' && isEditingAllocation && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveAllocation}
                      disabled={updateAllocationMutation.isPending}
                      className="btn-success px-3 py-1 text-xs"
                    >
                      {updateAllocationMutation.isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <CheckIcon className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn-secondary px-3 py-1 text-xs"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="card-body space-y-4">
              {Object.entries(leaveBalance).map(([type, data]: [string, any]) => (
                <div key={type} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium capitalize text-gray-900 dark:text-gray-100">
                      {type} Leave
                    </h4>
                    <div className="flex items-center space-x-2">
                      {user?.role === 'admin' && isEditingAllocation ? (
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={editAllocation[type as keyof LeaveAllocation]}
                          onChange={(e) => setEditAllocation(prev => ({
                            ...prev,
                            [type]: parseInt(e.target.value) || 0
                          }))}
                          className="input-field w-16 text-center text-sm"
                        />
                      ) : (
                        <span className="badge badge-primary">
                          {data.remaining}/{data.total}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Allocated</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {isEditingAllocation && user?.role === 'admin' 
                          ? editAllocation[type as keyof LeaveAllocation] 
                          : data.total}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Used</span>
                      <span className="text-red-600">{data.used}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Remaining</span>
                      <span className="text-green-600">
                        {isEditingAllocation && user?.role === 'admin' 
                          ? Math.max(0, editAllocation[type as keyof LeaveAllocation] - data.used)
                          : data.remaining}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${data.total > 0 ? Math.min(100, (data.used / data.total) * 100) : 0}%`
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Leave History
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
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
                        {leave.totalDays || 1} days
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">STATUS</div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(leave.status)}`}>
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
                        {formatDate(leave.createdAt || leave.startDate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDaysIcon
                className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
              />
              <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
                No Leave History
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                This employee hasn't submitted any leave requests yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Employee Leave Activity Section */}
      <EmployeeLeaveActivity 
        employeeId={employee._id} 
        isCurrentUser={user?.id === employee._id}
      />
    </div>
  );
};

export default EmployeeDetailPageReal;