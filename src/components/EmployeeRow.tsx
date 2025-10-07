import React from 'react';
import {
  EyeIcon
} from '@heroicons/react/24/outline';

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

interface EmployeeRowProps {
  employee: Employee;
  onClick: (employee: Employee) => void;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ 
  employee, 
  onClick
}) => {
  const handleClick = () => {
    onClick(employee);
  };

  // Generate avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate avatar color - all avatars use same theme color
  const getAvatarColor = () => {
    // All avatars use the same theme color for consistency
    return 'avatar-primary';
  };

  return (
    <div
      onClick={handleClick}
      className="group relative w-full p-4 border border-gray-200 dark:border-gray-700 border-opacity-50 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 hover:rounded-lg rounded-lg mb-2"
    >
      <div className="flex items-center justify-between">
        {/* Left section - Employee info */}
        <div className="flex items-center space-x-4">
          {/* Simple Avatar */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm
            ${getAvatarColor()}
          `}>
            {getInitials(employee.name)}
          </div>

          {/* Employee Name and ID */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {employee.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: {employee.employeeId}
            </p>
          </div>
        </div>

        {/* Right section - Status and Action */}
        <div className="flex items-center space-x-4">
          {/* Status Badge */}
          <div className={`
            ${employee.isActive 
              ? 'badge-success' 
              : 'badge-error'
            }
          `}>
            {employee.isActive ? 'Active' : 'Inactive'}
          </div>

          {/* Details Button */}
          <button className="btn-secondary flex items-center space-x-2 text-sm">
            <EyeIcon className="w-4 h-4" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRow;