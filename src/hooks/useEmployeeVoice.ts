import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { employeeVoiceAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { NOTIF_KEY } from "./useNotifications";
import type { EmployeeVoice, VoiceStats } from "../types/employeeVoice";

export const VOICES_KEY = ["employee-voices"] as const;
export const VOICE_STATS_KEY = ["employee-voice-stats"] as const;

export interface VoiceFilters {
  status?: string;
  category?: string;
  priority?: string;
}

/** List of voices for the current viewer (own for employees, all for admins). */
export function useVoices(filters: VoiceFilters = {}) {
  const { isAuthenticated } = useAuth();
  // Real-time via Socket.IO (voice:new / voice:updated) - no polling.
  return useQuery({
    queryKey: [...VOICES_KEY, filters],
    queryFn: async () => {
      const res = await employeeVoiceAPI.getVoices({ ...filters, limit: 100 });
      return (res.data?.voices ?? []) as EmployeeVoice[];
    },
    enabled: isAuthenticated,
    refetchInterval: false,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });
}

/** Admin dashboard statistics for the Employee Voice module. */
export function useVoiceStats() {
  const { user, isAuthenticated } = useAuth();
  // Real-time via Socket.IO - no polling.
  return useQuery({
    queryKey: VOICE_STATS_KEY,
    queryFn: async () => {
      const res = await employeeVoiceAPI.getStats();
      return res.data as VoiceStats;
    },
    enabled: isAuthenticated && user?.role === "admin",
    refetchInterval: false,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });
}

/** Single voice detail (with the reply thread). */
export function useVoice(id: string | null) {
  // Real-time via Socket.IO (voice:updated) - no polling.
  return useQuery({
    queryKey: [...VOICES_KEY, "detail", id],
    queryFn: async () => {
      const res = await employeeVoiceAPI.getVoice(id as string);
      return res.data.voice as EmployeeVoice;
    },
    enabled: !!id,
    refetchInterval: false,
    staleTime: 30 * 1000,
  });
}

/** Invalidate everything that depends on voice data + notifications. */
export function useRefreshVoiceData() {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: VOICES_KEY });
    qc.invalidateQueries({ queryKey: VOICE_STATS_KEY });
    qc.invalidateQueries({ queryKey: NOTIF_KEY });
  }, [qc]);
}

export function useSubmitVoice() {
  const refresh = useRefreshVoiceData();
  return useMutation({
    mutationFn: (formData: FormData) => employeeVoiceAPI.submitVoice(formData),
    onSuccess: refresh,
  });
}

export function useVoiceReply(voiceId: string) {
  const qc = useQueryClient();
  const refresh = useRefreshVoiceData();
  return useMutation({
    mutationFn: (message: string) => employeeVoiceAPI.reply(voiceId, message),
    onSuccess: (res) => {
      const voice = res.data?.voice as EmployeeVoice | undefined;
      if (voice) {
        qc.setQueryData([...VOICES_KEY, "detail", voiceId], voice);
      }
      refresh();
    },
  });
}

export function useUpdateVoiceStatus(voiceId: string) {
  const qc = useQueryClient();
  const refresh = useRefreshVoiceData();
  return useMutation({
    mutationFn: (status: string) =>
      employeeVoiceAPI.updateStatus(voiceId, status),
    onSuccess: (res) => {
      const voice = res.data?.voice as EmployeeVoice | undefined;
      if (voice) {
        qc.setQueryData([...VOICES_KEY, "detail", voiceId], voice);
      }
      refresh();
    },
  });
}

export function useDeleteVoice() {
  const refresh = useRefreshVoiceData();
  return useMutation({
    mutationFn: (id: string) => employeeVoiceAPI.deleteVoice(id),
    onSuccess: refresh,
  });
}
