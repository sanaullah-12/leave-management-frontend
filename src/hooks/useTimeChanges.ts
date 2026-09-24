import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { timeChangeAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { NOTIF_KEY } from "./useNotifications";
import {
  EMPLOYEE_ATTENDANCE_ROOT,
  ROSTER_ATTENDANCE_ROOT,
  ROSTER_DAY_ROOT,
} from "../lib/attendanceCache";

/**
 * useTimeChanges
 * --------------
 * React Query access to time change requests. Same shape as the work from home
 * hooks: one exported key, no polling, freshness from the socket layer (a
 * "time-change" stats update, handled in useSocket).
 */

export const TIME_CHANGES_KEY = ["time-changes"] as const;

export type TimeChangeStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface TimeChangeRequest {
  id: string;
  employee: {
    id: string;
    name: string;
    employeeId?: string;
    department?: string | null;
    profilePicture?: string | null;
  } | null;
  employeeCode: string;
  /** YYYY-MM-DD, office calendar. */
  date: string;
  dateDisplay: string;
  machineCheckIn: string;
  machineCheckInDisplay: string;
  /** "HH:MM" */
  requestedTime: string;
  requestedCheckIn: string;
  requestedCheckInDisplay: string;
  reason: string;
  judgedAgainst?: { cutoffTime?: string; lateMinutes?: number } | null;
  status: TimeChangeStatus;
  reviewedBy?: { id: string; name: string } | null;
  reviewedAt?: string | null;
  reviewComments?: string;
  createdAt: string;
}

export interface TimeChangeCounts {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

/**
 * Everything a time change can move.
 *
 * A decision changes the late verdict of a day, so the attendance answers that
 * are cached by hand (not observed by a live query) are dropped rather than
 * marked stale: kept, they would show the old verdict until someone pressed
 * Fetch. The server-judged queries simply refetch.
 */
export function refreshAfterTimeChange(qc: QueryClient, verdictsChanged: boolean) {
  qc.invalidateQueries({ queryKey: TIME_CHANGES_KEY });
  qc.invalidateQueries({ queryKey: NOTIF_KEY });
  qc.invalidateQueries({ queryKey: [ROSTER_DAY_ROOT] });
  qc.invalidateQueries({ queryKey: ["late-hours"] });
  qc.invalidateQueries({ queryKey: ["late-hours-overview"] });
  qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  if (verdictsChanged) {
    qc.removeQueries({ queryKey: [EMPLOYEE_ATTENDANCE_ROOT] });
    qc.removeQueries({ queryKey: [ROSTER_ATTENDANCE_ROOT] });
  }
}

/** The signed-in person's own requests. */
export function useMyTimeChanges(enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...TIME_CHANGES_KEY, "mine"],
    queryFn: async () => {
      const res = await timeChangeAPI.mine();
      return (res.data?.requests ?? []) as TimeChangeRequest[];
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30 * 1000,
  });
}

/** The company's requests, for an admin. */
export function useTimeChangeQueue(status = "all", enabled = true) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...TIME_CHANGES_KEY, "queue", status],
    queryFn: async () => {
      const res = await timeChangeAPI.list(status);
      return {
        requests: (res.data?.requests ?? []) as TimeChangeRequest[],
        counts: (res.data?.counts ?? {
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
        }) as TimeChangeCounts,
      };
    },
    enabled: isAuthenticated && enabled,
    staleTime: 30 * 1000,
  });
}

export function useSubmitTimeChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      date: string;
      requestedTime: string;
      reason: string;
    }) => {
      const res = await timeChangeAPI.submit(data);
      return res.data?.request as TimeChangeRequest;
    },
    onSuccess: () => refreshAfterTimeChange(qc, false),
  });
}

export function useReviewTimeChange() {
  const qc = useQueryClient();
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
      const res = await timeChangeAPI.review(id, { status, reviewComments });
      return res.data?.request as TimeChangeRequest;
    },
    onSuccess: (_data, variables) =>
      refreshAfterTimeChange(qc, variables.status === "approved"),
  });
}

export function useCancelTimeChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await timeChangeAPI.cancel(id);
      return res.data?.request as TimeChangeRequest;
    },
    onSuccess: () => refreshAfterTimeChange(qc, false),
  });
}
