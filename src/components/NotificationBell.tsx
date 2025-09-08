import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotificationPolling } from '../hooks/useNotificationPolling';

const NotificationBell: React.FC = () => {
  const { allNotifications, unreadCount, markAsRead, markAllAsRead } = useNotificationPolling();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark all as read when opening the dropdown
      setTimeout(() => markAllAsRead(), 500);
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_request':
        return '📝';
      case 'leave_approved':
        return '✅';
      case 'leave_rejected':
        return '❌';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={toggleDropdown}
        className="notification-bell relative p-2 text-gray-600 dark:text-gray-300 transition-colors"
      >
        <BellIcon className={`h-6 w-6 ${unreadCount > 0 ? 'notification-bell-blink' : ''}`} />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 notification-badge text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold notification-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        
        {/* Blinking Dot */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="dropdown-menu absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg shadow-lg border z-50"
             style={{ 
               backgroundColor: 'var(--surface)',
               borderColor: 'var(--border-primary)'
             }}>
          
          {/* Header */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Notifications
              </h3>
              {allNotifications.length > 0 && (
                <button
                  onClick={() => {
                    markAllAsRead();
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {allNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="py-2">
                {allNotifications.slice(0, 10).map((notification: any) => (
                  <div
                    key={notification._id}
                    className={`notification-item px-4 py-3 border-b transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    style={{ borderColor: 'var(--border-primary)' }}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification._id);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full ml-2"></span>
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          {getTimeAgo(new Date(notification.createdAt))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 10 && (
            <div className="px-4 py-3 border-t text-center" style={{ borderColor: 'var(--border-primary)' }}>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Showing latest 10 notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;