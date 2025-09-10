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

  // Poll for unread notifications every 60 seconds (reduced from 10 seconds)
  const { data, isLoading, error } = useQuery<NotificationResponse>({
    queryKey: ['notifications', 'polling'],
    queryFn: async () => {
      const response = await notificationsAPI.getNotifications(1, 50, true);
      return response.data;
    },
    refetchInterval: 60 * 1000, // Poll every 60 seconds (reduced frequency)
    refetchIntervalInBackground: false, // Don't poll in background to save resources
    refetchOnWindowFocus: true, // Only refetch when user comes back to tab
    staleTime: 30 * 1000, // Consider data stale after 30 seconds (increased from 5)
  });

  // Get all notifications for the bell dropdown (only fetch on demand)
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
    refetchInterval: false, // Disable automatic polling - only fetch on demand
    refetchIntervalInBackground: false, // Don't poll in background
    refetchOnWindowFocus: false, // Don't auto-refetch on window focus
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
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