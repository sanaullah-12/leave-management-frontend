import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { showInfoToast } from "../utils/toastHelpers";
import { connectSocket, disconnectSocket, getSocket } from "../socket/socket";
import { SOCKET_EVENTS } from "../socket/events";
import { useAppDispatch } from "../store/hooks";
import { setConnected, setPresence, markEvent } from "../store/realtimeSlice";
import { NOTIF_KEY } from "./useNotifications";
import { VOICES_KEY, VOICE_STATS_KEY } from "./useEmployeeVoice";
import { WFH_KEY, WFH_STATS_KEY } from "./useWorkFromHome";

/**
 * useSocket
 * ---------
 * Owns the app's real-time lifecycle. On authentication it connects the
 * singleton socket, binds every server event to the appropriate reaction
 * (Redux dispatch for live state, React Query invalidation for lists/stats,
 * a toast for new notifications), and tears everything down on logout.
 *
 * Performance & correctness:
 *  • one socket instance (see socket.ts), one set of listeners (guarded ref)
 *  • event-driven invalidation only - no polling
 *  • full cleanup prevents duplicate listeners and memory leaks
 */
export function useSocket() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const boundRef = useRef(false);
  const hadConnectedRef = useRef(false);

  useEffect(() => {
    // Not signed in → make sure the socket is closed.
    if (!isAuthenticated) {
      disconnectSocket();
      dispatch(setConnected(false));
      boundRef.current = false;
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = connectSocket(token);

    // Guard against binding twice (React StrictMode double-invoke in dev).
    if (boundRef.current) return;
    boundRef.current = true;

    const invalidate = (keys: readonly unknown[][]) => {
      dispatch(markEvent());
      keys.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
    };

    // Every query kept fresh by a realtime event. Events emitted while we were
    // offline are gone for good, so a reconnect refetches the whole set rather
    // than trusting a cache that silently drifted.
    const REALTIME_KEYS: unknown[][] = [
      NOTIF_KEY as unknown as unknown[],
      VOICES_KEY as unknown as unknown[],
      VOICE_STATS_KEY as unknown as unknown[],
      WFH_KEY as unknown as unknown[],
      WFH_STATS_KEY as unknown as unknown[],
      ["recent-leaves"],
      ["leaves"],
      ["leave-balance"],
      ["announcements"],
      ["attendance"],
      ["dashboard-stats"],
    ];

    // -- Connection lifecycle ----------------------------------------------
    const onConnect = () => {
      dispatch(setConnected(true));
      if (hadConnectedRef.current) invalidate(REALTIME_KEYS);
      hadConnectedRef.current = true;
    };
    const onDisconnect = () => dispatch(setConnected(false));
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(SOCKET_EVENTS.CONNECTED, onConnect);
    if (socket.connected) dispatch(setConnected(true));

    // -- Presence ----------------------------------------------------------
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (p: { online?: string[] }) =>
      dispatch(setPresence(p?.online ?? []))
    );

    // -- Notifications (bell / center / toast) -----------------------------
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, (n: { title?: string }) => {
      invalidate([NOTIF_KEY as unknown as unknown[]]);
      if (n?.title) {
        showInfoToast(n.title, { duration: 4000 });
      }
    });

    // -- Leave lifecycle ---------------------------------------------------
    socket.on(SOCKET_EVENTS.LEAVE_NEW, () =>
      invalidate([["recent-leaves"], ["leaves"], ["dashboard-stats"]])
    );
    socket.on(SOCKET_EVENTS.LEAVE_REVIEWED, () =>
      invalidate([
        ["recent-leaves"],
        ["leaves"],
        ["leave-balance"],
        ["dashboard-stats"],
      ])
    );

    // -- Work From Home ----------------------------------------------------
    // An approved day changes what attendance reports, so the attendance and
    // dashboard caches go with the request lists.
    const invalidateWfh = () =>
      invalidate([
        WFH_KEY as unknown as unknown[],
        WFH_STATS_KEY as unknown as unknown[],
        ["attendance"],
        ["dashboard-stats"],
      ]);
    socket.on(SOCKET_EVENTS.WFH_NEW, invalidateWfh);
    socket.on(SOCKET_EVENTS.WFH_REVIEWED, invalidateWfh);

    // -- Employee Voice ----------------------------------------------------
    socket.on(SOCKET_EVENTS.VOICE_NEW, () =>
      invalidate([
        VOICES_KEY as unknown as unknown[],
        VOICE_STATS_KEY as unknown as unknown[],
        ["dashboard-stats"],
      ])
    );
    socket.on(SOCKET_EVENTS.VOICE_UPDATED, () =>
      invalidate([
        VOICES_KEY as unknown as unknown[],
        VOICE_STATS_KEY as unknown as unknown[],
      ])
    );

    // -- Announcements / attendance / generic stats ------------------------
    socket.on(SOCKET_EVENTS.ANNOUNCEMENT_NEW, () =>
      invalidate([["announcements"], NOTIF_KEY as unknown as unknown[]])
    );
    socket.on(SOCKET_EVENTS.ATTENDANCE_UPDATE, () =>
      invalidate([["attendance"], ["dashboard-stats"]])
    );
    socket.on(SOCKET_EVENTS.STATS_UPDATE, (p: { scope?: string }) => {
      const keys: unknown[][] = [
        ["dashboard-stats"],
        ["recent-leaves"],
        ["leave-balance"],
      ];
      // The Employee Voice counters live under their own keys, so a "voice"
      // scope has to name them explicitly or the stat chips stay stale.
      if (p?.scope === "voice") {
        keys.push(
          VOICES_KEY as unknown as unknown[],
          VOICE_STATS_KEY as unknown as unknown[]
        );
      }
      if (p?.scope === "wfh") {
        keys.push(
          WFH_KEY as unknown as unknown[],
          WFH_STATS_KEY as unknown as unknown[],
          ["attendance"]
        );
      }
      invalidate(keys);
    });

    // -- Cleanup: remove only our listeners (keep the socket for reuse) -----
    return () => {
      const s = getSocket();
      if (s) {
        s.off("connect", onConnect);
        s.off("disconnect", onDisconnect);
        Object.values(SOCKET_EVENTS).forEach((ev) => s.off(ev));
      }
      boundRef.current = false;
    };
  }, [isAuthenticated, qc, dispatch]);
}
