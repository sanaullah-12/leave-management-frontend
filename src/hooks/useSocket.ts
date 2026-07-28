import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { connectSocket, disconnectSocket, getSocket } from "../socket/socket";
import { SOCKET_EVENTS } from "../socket/events";
import { useAppDispatch } from "../store/hooks";
import { setConnected, setPresence, markEvent } from "../store/realtimeSlice";
import { NOTIF_KEY } from "./useNotifications";
import { VOICES_KEY, VOICE_STATS_KEY } from "./useEmployeeVoice";

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
 *  • event-driven invalidation only — no polling
 *  • full cleanup prevents duplicate listeners and memory leaks
 */
export function useSocket() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const boundRef = useRef(false);

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

    // ── Connection lifecycle ──────────────────────────────────────────────
    const onConnect = () => dispatch(setConnected(true));
    const onDisconnect = () => dispatch(setConnected(false));
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(SOCKET_EVENTS.CONNECTED, onConnect);
    if (socket.connected) dispatch(setConnected(true));

    // ── Presence ──────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, (p: { online?: string[] }) =>
      dispatch(setPresence(p?.online ?? []))
    );

    // ── Notifications (bell / center / toast) ─────────────────────────────
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, (n: { title?: string }) => {
      invalidate([NOTIF_KEY as unknown as unknown[]]);
      if (n?.title) {
        toast(n.title, { icon: "🔔", duration: 4000 });
      }
    });

    // ── Leave lifecycle ───────────────────────────────────────────────────
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

    // ── Employee Voice ────────────────────────────────────────────────────
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

    // ── Announcements / attendance / generic stats ────────────────────────
    socket.on(SOCKET_EVENTS.ANNOUNCEMENT_NEW, () =>
      invalidate([["announcements"], NOTIF_KEY as unknown as unknown[]])
    );
    socket.on(SOCKET_EVENTS.ATTENDANCE_UPDATE, () =>
      invalidate([["attendance"], ["dashboard-stats"]])
    );
    socket.on(SOCKET_EVENTS.STATS_UPDATE, () =>
      invalidate([["dashboard-stats"], ["recent-leaves"], ["leave-balance"]])
    );

    // ── Cleanup: remove only our listeners (keep the socket for reuse) ─────
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
