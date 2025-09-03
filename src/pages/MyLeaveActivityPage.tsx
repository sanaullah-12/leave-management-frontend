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
        <p style={{ color: 'var(--text-secondary)' }}>Please login to view your leave activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Leave Activity
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track your leave requests, approvals, and leave history
          </p>
        </div>
        
        <div className="hidden sm:flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {user.department} • {user.position}
            </p>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: 'var(--border-color)' }}></div>
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
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Leave Requests
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Leave Balance
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Leave History
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
          <div className="flex items-start space-x-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)' }}>
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Employee View - Read Only
              </h4>
              <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
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