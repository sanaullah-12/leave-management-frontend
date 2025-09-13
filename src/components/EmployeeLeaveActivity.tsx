import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leavesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Avatar from './Avatar';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  EyeIcon,
  ChartBarIcon,
  FunnelIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import '../styles/design-system.css';

interface EmployeeLeaveActivityProps {
  employeeId: string;
  isCurrentUser?: boolean;
  dateFilter?: {
    dateFrom?: string;
    dateTo?: string;
  };
}

const EmployeeLeaveActivity: React.FC<EmployeeLeaveActivityProps> = ({ 
  employeeId, 
  isCurrentUser = false,
  dateFilter
}) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Fetch employee's leave requests - no automatic polling to prevent rate limiting
  const { data: leaveRequestsData, isLoading } = useQuery({
    queryKey: ['employee-leave-requests', employeeId, selectedStatus, selectedYear],
    queryFn: () => leavesAPI.getLeaves(1, 100, selectedStatus, employeeId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false, // Disabled to prevent rate limiting
    refetchIntervalInBackground: false,
  });

  // Fetch employee's leave balance - pass employeeId for specific employee
  const { data: leaveBalanceData } = useQuery({
    queryKey: ['employee-leave-balance', employeeId, Date.now()],
    queryFn: () => leavesAPI.getLeaveBalance(isCurrentUser ? undefined : employeeId),
    enabled: true, // Always try to fetch balance data
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
    retry: 1, // Only retry once on failure
    refetchInterval: false, // Disabled to prevent rate limiting
    refetchIntervalInBackground: false,
  });

  // Fetch company leave policy to get real quotas
  const { data: leavePolicyData } = useQuery({
    queryKey: ['leave-policy'],
    queryFn: () => leavesAPI.getLeavePolicy(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  const leaveRequests = leaveRequestsData?.data?.leaves || [];
  
  // Use real balance data if available, otherwise create structure from company policy and leave requests
  let leaveBalance = leaveBalanceData?.data?.balance || {};
  
  // Get company leave policy (only 3 main types - excluding maternity/paternity)
  const companyPolicy = leavePolicyData?.data?.policy || {
    annualLeave: 10,    // 10 annual leave days
    sickLeave: 8,       // 8 sick leave days  
    casualLeave: 10,    // 10 casual leave days
  };
  
  // Filter out unwanted leave types (maternity, paternity)
  const allowedLeaveTypes = ['annual', 'sick', 'casual'];
  
  // If no balance data available, create structure from real company policy and leave requests
  if (Object.keys(leaveBalance).length === 0) {
    // Calculate actual usage from leave requests for this employee (exclude maternity/paternity)
    const approvedLeaves = leaveRequests.filter((leave: any) => 
      leave.status === 'approved' && 
      allowedLeaveTypes.includes(leave.leaveType.toLowerCase())
    );
    const leaveTypeUsage: any = {};
    
    // Count used days by leave type
    approvedLeaves.forEach((leave: any) => {
      const type = leave.leaveType.toLowerCase();
      if (allowedLeaveTypes.includes(type)) {
        const days = leave.totalDays || 1;
        leaveTypeUsage[type] = (leaveTypeUsage[type] || 0) + days;
      }
    });
    
    // Map company policy to leave balance structure (only 3 main types)
    const policyMapping: any = {
      annual: companyPolicy.annualLeave,
      sick: companyPolicy.sickLeave,
      casual: companyPolicy.casualLeave,
    };
    
    leaveBalance = {};
    Object.entries(policyMapping).forEach(([type, total]) => {
      const used = leaveTypeUsage[type] || 0;
      leaveBalance[type] = {
        total: total as number,
        used,
        remaining: Math.max(0, (total as number) - used)
      };
    });
  } else {
    // Filter existing balance data to only include allowed leave types
    const filteredBalance: any = {};
    Object.entries(leaveBalance).forEach(([type, data]) => {
      if (allowedLeaveTypes.includes(type.toLowerCase())) {
        filteredBalance[type] = data;
      }
    });
    leaveBalance = filteredBalance;
  }

  // Filter by date range (for reports) or year (for normal view) and exclude unwanted leave types
  const filteredRequests = leaveRequests.filter((leave: any) => {
    // First filter out unwanted leave types (maternity, paternity)
    const isAllowedLeaveType = allowedLeaveTypes.includes(leave.leaveType.toLowerCase());
    if (!isAllowedLeaveType) return false;
    
    // If date filter is provided (for reports), use custom date range
    if (dateFilter && (dateFilter.dateFrom || dateFilter.dateTo)) {
      const leaveStartDate = new Date(leave.startDate);
      const dateFromFilter = dateFilter.dateFrom ? new Date(dateFilter.dateFrom) : null;
      const dateToFilter = dateFilter.dateTo ? new Date(dateFilter.dateTo) : null;
      
      if (dateFromFilter && dateToFilter) {
        return leaveStartDate >= dateFromFilter && leaveStartDate <= dateToFilter;
      } else if (dateFromFilter) {
        return leaveStartDate >= dateFromFilter;
      } else if (dateToFilter) {
        return leaveStartDate <= dateToFilter;
      }
    }
    
    // Default behavior: filter by year
    const leaveYear = new Date(leave.startDate).getFullYear();
    return leaveYear === selectedYear;
  });

  // Calculate comprehensive statistics
  const stats = React.useMemo(() => {
    const approved = filteredRequests.filter((leave: any) => leave.status === 'approved');
    const pending = filteredRequests.filter((leave: any) => leave.status === 'pending');
    const rejected = filteredRequests.filter((leave: any) => leave.status === 'rejected');
    
    const totalDaysUsed = approved.reduce((sum: number, leave: any) => sum + (leave.totalDays || 1), 0);

    return {
      total: filteredRequests.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      totalDaysUsed
    };
  }, [filteredRequests]);

  // Calculate totals for display
  const totals = React.useMemo(() => {
    if (!leaveBalance || Object.keys(leaveBalance).length === 0) {
      return { totalAllocated: 0, totalUsed: 0, totalRemaining: 0 };
    }

    const totalAllocated = Object.values(leaveBalance).reduce((sum: number, balance: any) => sum + balance.total, 0);
    const totalUsed = Object.values(leaveBalance).reduce((sum: number, balance: any) => sum + balance.used, 0);
    const totalRemaining = totalAllocated - totalUsed;

    return { totalAllocated, totalUsed, totalRemaining };
  }, [leaveBalance]);

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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDurationString = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays === 1) {
      return `${formatDate(startDate)} (1 day)`;
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)} (${diffDays} days)`;
  };

  // Generate year options (current year and previous 2 years)
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    yearOptions.push(currentYear - i);
  }


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee Profile Header - Only for current user */}
      {isCurrentUser && user && (
        <div className="card-elevated">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Profile Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <Avatar
                  src={user.profilePicture}
                  name={user.name}
                  size="3xl"
                  className="hover-lift"
                />
                <div className="text-center sm:text-left">
                  <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                    {user.name}
                  </h2>
                  <p className="text-lg mb-4 text-gray-600 dark:text-gray-300">
                    {user.position}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {typeof user.department === 'object' && (user.department as any)?.name 
                          ? (user.department as any).name 
                          : user.department}
                      </span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-300">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">ID: {user.employeeId}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className={`badge ${(user as any).isActive ? 'badge-success' : 'badge-warning'}`}>
                      {(user as any).isActive ? '✅ Active' : '⏸️ Inactive'}
                    </span>
                    <span className="badge badge-primary">
                      👤 Employee
                    </span>
                    {user.joinDate && (
                      <span className="badge badge-gray">
                        📅 Joined {formatDate(user.joinDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              {Object.keys(leaveBalance).length > 0 && (
                <div className="flex-1 w-full lg:w-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stats-card text-center hover-lift">
                      <div className="p-4">
                        <div className="flex items-center justify-center mb-2">
                          <CalendarDaysIcon className="h-6 w-6 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">
                          {totals.totalAllocated}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Total Allocated
                        </p>
                      </div>
                    </div>

                    <div className="stats-card text-center hover-lift">
                      <div className="p-4">
                        <div className="flex items-center justify-center mb-2">
                          <CheckCircleIcon className="h-6 w-6 text-red-500" />
                        </div>
                        <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">
                          {totals.totalUsed}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Leaves Taken
                        </p>
                      </div>
                    </div>

                    <div className="stats-card text-center hover-lift">
                      <div className="p-4">
                        <div className="flex items-center justify-center mb-2">
                          <ClockIcon className="h-6 w-6 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">
                          {totals.totalRemaining}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Remaining
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave Balance Cards */}
      {Object.keys(leaveBalance).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              💼 Leave Balance {dateFilter && (dateFilter.dateFrom || dateFilter.dateTo) ? '(Filtered Period)' : ''}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Current allocation status
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(leaveBalance).map(([type, data]: [string, any]) => (
                <div key={type} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium capitalize text-gray-900 dark:text-gray-100">
                      {type} Leave
                    </h5>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {data.remaining}/{data.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        type === 'annual' ? 'bg-blue-500' :
                        type === 'sick' ? 'bg-red-500' :
                        type === 'casual' ? 'bg-green-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${(data.used / data.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-gray-400 dark:text-gray-500">
                    <span>Used: {data.used}</span>
                    <span>Available: {data.remaining}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stats-card text-center">
          <div className="p-4">
            <div className="flex items-center justify-center mb-2">
              <DocumentTextIcon className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mb-1" className="text-gray-900 dark:text-gray-100">
              {stats.total}
            </p>
            <p className="text-xs" className="text-gray-600 dark:text-gray-300">
              Total Requests
            </p>
          </div>
        </div>

        <div className="stats-card text-center">
          <div className="p-4">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-2xl font-bold mb-1" className="text-gray-900 dark:text-gray-100">
              {stats.approved}
            </p>
            <p className="text-xs" className="text-gray-600 dark:text-gray-300">
              Approved
            </p>
          </div>
        </div>

        <div className="stats-card text-center">
          <div className="p-4">
            <div className="flex items-center justify-center mb-2">
              <ClockIcon className="h-6 w-6 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold mb-1" className="text-gray-900 dark:text-gray-100">
              {stats.pending}
            </p>
            <p className="text-xs" className="text-gray-600 dark:text-gray-300">
              Pending
            </p>
          </div>
        </div>

        <div className="stats-card text-center">
          <div className="p-4">
            <div className="flex items-center justify-center mb-2">
              <XCircleIcon className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-2xl font-bold mb-1" className="text-gray-900 dark:text-gray-100">
              {stats.rejected}
            </p>
            <p className="text-xs" className="text-gray-600 dark:text-gray-300">
              Rejected
            </p>
          </div>
        </div>

        <div className="stats-card text-center">
          <div className="p-4">
            <div className="flex items-center justify-center mb-2">
              <ChartBarIcon className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-2xl font-bold mb-1" className="text-gray-900 dark:text-gray-100">
              {stats.totalDaysUsed}
            </p>
            <p className="text-xs" className="text-gray-600 dark:text-gray-300">
              Days Used
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedStatus === '' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedStatus === 'pending' ? 'badge-warning' : 'btn-secondary'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setSelectedStatus('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedStatus === 'approved' ? 'badge-success' : 'btn-secondary'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setSelectedStatus('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedStatus === 'rejected' ? 'badge-error' : 'btn-secondary'
            }`}
          >
            Rejected
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field text-sm"
              style={{ minWidth: '100px' }}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leave Requests Timeline */}
      <div className="card-elevated">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                📋 Leave Requests {dateFilter && (dateFilter.dateFrom || dateFilter.dateTo) 
                  ? `(${dateFilter.dateFrom ? new Date(dateFilter.dateFrom).toLocaleDateString() : 'All time'} - ${dateFilter.dateTo ? new Date(dateFilter.dateTo).toLocaleDateString() : 'All time'})`
                  : selectedYear}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {filteredRequests.length} requests found {dateFilter && (dateFilter.dateFrom || dateFilter.dateTo) ? 'in date range' : 'for this year'}
              </p>
            </div>
            {isCurrentUser && (
              <div className="badge badge-primary text-xs">
                👤 Employee View - Read Only
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((leave: any) => (
                <div 
                  key={leave._id} 
                  className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 border-opacity-50 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-all"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(leave.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h5 className="font-medium capitalize text-gray-900 dark:text-gray-100">
                          {leave.leaveType} Leave
                        </h5>
                        <span className={`text-xs ${getStatusBadge(leave.status)}`}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
                        <CalendarDaysIcon className="h-3 w-3" />
                        <span>Applied {formatDate(leave.createdAt || leave.startDate)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Duration
                        </p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {getDurationString(leave.startDate, leave.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Total Days
                        </p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {leave.totalDays || 1} days
                        </p>
                      </div>
                    </div>

                    {leave.reason && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                          Reason
                        </p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {leave.reason}
                        </p>
                      </div>
                    )}

                    {leave.reviewComments && (
                      <div className="p-3 rounded-md" className="bg-gray-50 dark:bg-gray-900">
                        <p className="text-sm font-medium mb-1" className="text-gray-600 dark:text-gray-300">
                          {leave.status === 'approved' ? '✅ Approval Comments' : 
                           leave.status === 'rejected' ? '❌ Rejection Comments' : '💬 Review Comments'}
                        </p>
                        <p className="text-sm" className="text-gray-900 dark:text-gray-100">
                          {leave.reviewComments}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    <button className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all">
                      <EyeIcon className="h-4 w-4" className="text-gray-400 dark:text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDaysIcon 
                className="w-16 h-16 mx-auto mb-4" 
                className="text-gray-400 dark:text-gray-500" 
              />
              <p className="text-lg font-medium mb-2" className="text-gray-900 dark:text-gray-100">
                No Leave Requests Found
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                {selectedStatus 
                  ? `No ${selectedStatus} leave requests found for ${selectedYear}.`
                  : `No leave requests found for ${selectedYear}.`
                }
              </p>
              {isCurrentUser && (
                <p className="text-sm mt-2" className="text-gray-400 dark:text-gray-500">
                  Submit your first leave request to see it here.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLeaveActivity;