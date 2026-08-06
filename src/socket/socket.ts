import { io, Socket } from "socket.io-client";

/**
 * socket.ts
 * ---------
 * A single, lazily-created Socket.IO client for the whole app (never more than
 * one instance). Authenticates with the JWT and reconnects automatically with
 * backoff. UI code should not import this directly - use `useSocket()`.
 */

// Server root = API base without the trailing "/api".
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:5000/api";
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

/** Return the current socket (or null if not connected yet). */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Connect (or reuse) the singleton socket, authenticated with `token`.
 * Safe to call repeatedly - subsequent calls reuse the existing instance.
 */
export function connectSocket(token: string): Socket {
  if (socket) {
    // Refresh auth in case the token changed, then ensure it's connected.
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  return socket;
}

/** Fully tear down the socket (on logout). Prevents leaks + stale listeners. */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
