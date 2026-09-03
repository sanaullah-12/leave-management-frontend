import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workFromHomeAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { NOTIF_KEY } from "./useNotifications";

/**
 * useWorkFromHome
 * ---------------
 * React Query access to the Work From Home module, matching the shape the
 * Employee Voice and leave hooks use: one exported key per cache entry so
 * useSocket can invalidate them when a wfh:* event arrives, and no polling -
 * freshness comes from the real-time layer.
 */

export const WFH_KEY = ["work-from-home"] as const;
export const WFH_STATS_KEY = ["work-from-home-stats"] as const;

export type WfhStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface WfhEmployee {
  _id?: string;
  name?: string;
  employeeId?: string;
  department?: string;
  email?: string;
  profilePicture?: string;
}

export interface WfhRequest {
  _id: string;
  employee: WfhEmployee | string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  note?: string;
  workMode: string;
  status: WfhStatus;
  appliedDate?: string;
  reviewedBy?: { _id?: string; name?: string } | string | null;
  reviewedDate?: string;
  reviewComments?: string;
  /** Raised for days that had already passed: a correction, not a request. */
  isBackdated?: boolean;
  createdAt: string;
}

export interface WfhPolicy {
  backdatingWindowDays: number;
  /** The earliest start date a request may carry, YYYY-MM-DD. */
  earliestStartDate: string;
  today: string;
}

export interface WfhStats {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  total: number;
}

export interface WfhFilters {
  status?: string;
  employeeId?: string;
  from?: string;
  to?: string;
}

/** Requests visible to the viewer: their own, or the company queue for admins. */
export function useWfhRequests(filters: WfhFilters = {}) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...WFH_KEY, filters],
    queryFn: async () => {
      const res = await workFromHomeAPI.getRequests({ ...filters, limit: 100 });
      return (res.data?.requests ?? []) as WfhRequest[];
    },
    enabled: isAuthenticated,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });
}

/** Counts by status, scoped the same way the list is. */
export function useWfhStats() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: WFH_STATS_KEY,
    queryFn: async () => {
      const res = await workFromHomeAPI.getStats();
      return res.data as WfhStats;
    },
    enabled: isAuthenticated,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });
}

/**
 * The rules the server judges a request against.
 *
 * Fetched rather than mirrored in the client: a hard-coded backdating window
 * would drift the day the server's changes.
 */
export function useWfhPolicy() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...WFH_KEY, "policy"],
    queryFn: async () => {
      const res = await workFromHomeAPI.getPolicy();
      return res.data?.policy as WfhPolicy;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * The resolved work-mode schedule for a range.
 *
 * Returns what the server decided, not the raw requests, so a caller never
 * re-implements the WFH-vs-leave precedence rule.
 */
export function useWorkModeSchedule(
  startDate: string | null,
  endDate: string | null
) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...WFH_KEY, "schedule", startDate, endDate],
    queryFn: async () => {
      const res = await workFromHomeAPI.getSchedule(startDate!, endDate!);
      return (res.data?.schedule ?? {}) as Record<
        string,
        Record<string, string>
      >;
    },
    enabled: isAuthenticated && !!startDate && !!endDate,
    refetchInterval: false,
    staleTime: 60 * 1000,
  });
}

/** Everything that changes when a request is created or decided. */
function useWfhInvalidation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: WFH_KEY });
    qc.invalidateQueries({ queryKey: WFH_STATS_KEY });
    qc.invalidateQueries({ queryKey: NOTIF_KEY });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    qc.invalidateQueries({ queryKey: ["attendance"] });
  };
}

export function useSubmitWfhRequest() {
  const invalidate = useWfhInvalidation();
  return useMutation({
    mutationFn: async (data: {
      startDate: string;
      endDate?: string;
      reason: string;
      note?: string;
    }) => {
      const res = await workFromHomeAPI.submitRequest(data);
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useReviewWfhRequest() {
  const invalidate = useWfhInvalidation();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewComments,
    }: {
      id: string;
      status: "approved" | "rejected";
      reviewComments?: string;
    }) => {
      const res = await workFromHomeAPI.reviewRequest(id, {
        status,
        reviewComments,
      });
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useCancelWfhRequest() {
  const invalidate = useWfhInvalidation();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await workFromHomeAPI.cancelRequest(id);
      return res.data;
    },
    onSuccess: invalidate,
  });
}
