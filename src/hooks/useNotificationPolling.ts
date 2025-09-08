import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "../services/api";
import { useNotifications } from "../components/NotificationSystem";

interface Notification {
  _id: string;
  type: 'leave_request' | 'leave_approved' | 'leave_rejected';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: {
    name: string;
    employeeId: string;
  };
  leaveId?: {
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
  };
}

interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    unreadCount: number;
    total: number;
  };
}

export const useNotificationPolling = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  // Poll for unread notifications every 10 seconds
  const { data, isLoading, error } = useQuery<NotificationResponse>({
    queryKey: ['notifications', 'polling'],
    queryFn: async () => {
      const response = await notificationsAPI.getNotifications(1, 50, true);
      return response.data;
    },
    refetchInterval: 10 * 1000, // Poll every 10 seconds
    refetchIntervalInBackground: true, // Continue polling in background
    refetchOnWindowFocus: true, // Refetch when user comes back to tab
    staleTime: 5 * 1000, // Consider data stale after 5 seconds
  });

  // Get all notifications for the bell dropdown
  const { 
    data: allNotificationsData, 
    isLoading: allNotificationsLoading,
    refetch: refetchAllNotifications 
  } = useQuery<NotificationResponse>({
    queryKey: ['notifications', 'all'],
    queryFn: async () => {
      const response = await notificationsAPI.getNotifications(1, 20, false);
      return response.data;
    },
    refetchInterval: 30 * 1000, // Refresh all notifications every 30 seconds
    refetchIntervalInBackground: true,
  });

  // Process new notifications and show them in the UI
  React.useEffect(() => {
    if (data?.notifications && data.notifications.length > 0) {
      const previousNotifications = queryClient.getQueryData(['notifications', 'polling']);
      
      // If this is the first load or we have new notifications
      if (previousNotifications && Array.isArray((previousNotifications as any)?.notifications)) {
        const prevNotificationIds = (previousNotifications as NotificationResponse).notifications.map((n: Notification) => n._id);
        const newNotifications = data.notifications.filter((n: Notification) => !prevNotificationIds.includes(n._id));
        
        // Show new notifications in the toast system
        newNotifications.forEach((notification: Notification) => {
          const notificationType = notification.type === 'leave_approved' ? 'success' 
                                 : notification.type === 'leave_rejected' ? 'warning'
                                 : 'info';

          addNotification({
            type: notificationType,
            title: notification.title,
            message: notification.message,
            duration: 8000, // Show for 8 seconds
          });
        });
      }
    }
  }, [data?.notifications, queryClient, addNotification]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Optimistically update the cache
      queryClient.setQueryData(['notifications', 'polling'], (oldData: NotificationResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
          ),
          pagination: {
            ...oldData.pagination,
            unreadCount: Math.max(0, oldData.pagination.unreadCount - 1)
          }
        };
      });

      queryClient.setQueryData(['notifications', 'all'], (oldData: NotificationResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
          ),
          pagination: {
            ...oldData.pagination,
            unreadCount: Math.max(0, oldData.pagination.unreadCount - 1)
          }
        };
      });

    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Update both caches
      queryClient.setQueryData(['notifications', 'polling'], (oldData: NotificationResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map(n => ({ ...n, read: true })),
          pagination: {
            ...oldData.pagination,
            unreadCount: 0
          }
        };
      });

      queryClient.setQueryData(['notifications', 'all'], (oldData: NotificationResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map(n => ({ ...n, read: true })),
          pagination: {
            ...oldData.pagination,
            unreadCount: 0
          }
        };
      });

    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return {
    unreadNotifications: data?.notifications || [],
    unreadCount: data?.pagination?.unreadCount || 0,
    allNotifications: allNotificationsData?.notifications || [],
    isLoading: isLoading || allNotificationsLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetchAllNotifications
  };
};