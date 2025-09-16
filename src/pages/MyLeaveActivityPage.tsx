import React from 'react';
import { useAuth } from '../context/AuthContext';
import EmployeeLeaveActivity from '../components/EmployeeLeaveActivity';
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import '../styles/design-system.css';

const MyLeaveActivityPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-300">Please login to view your leave activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            My Leave Activity
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your leave requests, approvals, and leave history
          </p>
        </div>
        
        <div className="hidden sm:flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {user.department} • {user.position}
            </p>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
          <span className="badge badge-primary">Employee</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover-lift">
          <div className="card-body text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Leave Requests
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              View and track all your leave requests and their current status
            </p>
          </div>
        </div>

        <div className="card hover-lift">
          <div className="card-body text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                <ChartBarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Leave Balance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Monitor your remaining leave days and usage statistics
            </p>
          </div>
        </div>

        <div className="card hover-lift">
          <div className="card-body text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
                <CalendarDaysIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Leave History
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Review your complete leave history and patterns
            </p>
          </div>
        </div>
      </div>

      {/* Employee Leave Activity Component */}
      <EmployeeLeaveActivity 
        employeeId={user?.id} 
        isCurrentUser={true}
      />

      {/* Read-Only Notice */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                Employee View - Read Only
              </h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>• You can view all your leave requests and their current status</p>
                <p>• Track your leave balance and usage throughout the year</p>
                <p>• Review approval/rejection comments from your manager</p>
                <p>• To submit new leave requests, go to the "Leave Requests" page</p>
                <p>• For any concerns about your leave status, contact your administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLeaveActivityPage;