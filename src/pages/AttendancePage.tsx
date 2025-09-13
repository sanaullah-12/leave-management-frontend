import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import '../styles/design-system.css';

const AttendancePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Attendance Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track and manage employee attendance and working hours
          </p>
        </div>
      </div>

      {/* Coming Soon Container */}
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Coming Soon Animation */}
          <div className="relative">
            {/* Background Animation Circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full border-4 border-blue-200 dark:border-blue-800 opacity-20 animate-ping"></div>
              <div className="absolute w-48 h-48 rounded-full border-4 border-purple-200 dark:border-purple-800 opacity-30 animate-ping animation-delay-1000"></div>
              <div className="absolute w-32 h-32 rounded-full border-4 border-green-200 dark:border-green-800 opacity-40 animate-ping animation-delay-2000"></div>
            </div>

            {/* Central Icon */}
            <div className="relative z-10 mb-8">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <ClockIcon className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Coming Soon Text */}
            <div className="relative z-10 space-y-4">
              <h2 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent animate-pulse">
                Coming Soon
              </h2>
              
              <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <p className="text-lg">We're working hard to bring you amazing attendance features</p>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              </div>

              {/* Feature Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                {[
                  {
                    icon: CheckCircleIcon,
                    title: "Clock In/Out",
                    description: "Easy time tracking with one-click clock in and out",
                    color: "from-green-500 to-green-600",
                    delay: "animation-delay-500"
                  },
                  {
                    icon: CalendarIcon,
                    title: "Timesheet Management",
                    description: "Comprehensive timesheet view and management",
                    color: "from-blue-500 to-blue-600", 
                    delay: "animation-delay-1000"
                  },
                  {
                    icon: ChartBarIcon,
                    title: "Attendance Analytics",
                    description: "Detailed reports and analytics for attendance patterns",
                    color: "from-purple-500 to-purple-600",
                    delay: "animation-delay-1500"
                  }
                ].map((feature, index) => (
                  <div
                    key={index}
                    className={`card hover-lift opacity-0 animate-fade-in-up ${feature.delay}`}
                  >
                    <div className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-lg`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Indicator */}
              <div className="mt-12">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Development in Progress</span>
                  </div>
                </div>
                
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-progress-bar" style={{width: '75%'}}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">75% Complete</p>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-8">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 px-6 py-3 rounded-full">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stay tuned for updates!
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce animation-delay-200"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce animation-delay-400"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Feature Teasers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
        <div className="card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Real-time Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Monitor attendance in real-time with live updates</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Smart Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Get insights with advanced attendance analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;