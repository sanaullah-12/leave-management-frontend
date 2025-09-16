import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationBell: React.FC = () => {
  return (
    <div className="relative">
      {/* Bell Icon - Static for future Socket.IO implementation */}
      <button
        className="relative p-2 text-gray-600 dark:text-gray-300 transition-colors cursor-not-allowed opacity-50"
        disabled
        title="Notifications (Coming Soon)"
      >
        <BellIcon className="h-6 w-6" />
      </button>
    </div>
  );
};

export default NotificationBell;