import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { notificationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type {
  AppNotification,
  NotificationsResponse,
} from "../types/employeeVoice";

export const NOTIF_KEY = ["notifications"] as const;

/** Extract the voice id a notification points at (handles populated or raw). */
export function voiceIdOf(n: AppNotification): string | null {
  if (!n.voiceId) return null;
  return typeof n.voiceId === "string" ? n.voiceId : n.voiceId._id;
}

/**
 * Live in-app notifications via background polling (no page refresh needed).
 * Shared across the bell, the notifications page and the dashboard toaster -
 * same query key ⇒ one source of truth, optimistic read updates everywhere.
 */
export function useNotifications(options?: { limit?: number; pollMs?: number }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const limit = options?.limit ?? 20;

  // Real-time via Socket.IO (see useSocket) - no polling. We keep a light
  // refetch-on-focus as a safety net for missed events after sleep/offline.
  const query = useQuery({
    queryKey: [...NOTIF_KEY, limit],
    queryFn: async () => {
      const res = await notificationsAPI.getNotifications(1, limit);
      return res.data as NotificationsResponse;
    },
    enabled: isAuthenticated,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });

  const notifications: AppNotification[] = query.data?.notifications ?? [];
  const unreadCount = query.data?.pagination?.unreadCount ?? 0;

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: NOTIF_KEY });
  }, [qc]);

  const patchAll = useCallback(
    (fn: (old: NotificationsResponse) => NotificationsResponse) => {
      qc.setQueriesData<NotificationsResponse>({ queryKey: NOTIF_KEY }, (old) =>
        old ? fn(old) : old
      );
    },
    [qc]
  );

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: NOTIF_KEY });
      const prev = qc.getQueriesData({ queryKey: NOTIF_KEY });
      patchAll((old) => {
        const list = old.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        );
        return {
          ...old,
          notifications: list,
          pagination: {
            ...old.pagination,
            unreadCount: list.filter((n) => !n.read).length,
          },
        };
      });
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key as any, data));
    },
    onSettled: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: NOTIF_KEY });
      const prev = qc.getQueriesData({ queryKey: NOTIF_KEY });
      patchAll((old) => ({
        ...old,
        notifications: old.notifications.map((n) => ({ ...n, read: true })),
        pagination: { ...old.pagination, unreadCount: 0 },
      }));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key as any, data));
    },
    onSettled: invalidate,
  });

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    refetch: query.refetch,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
  };
}
