import React from "react";
import { useSocket } from "../hooks/useSocket";

/**
 * RealtimeProvider
 * ----------------
 * Mounts the app-wide real-time lifecycle exactly once. Must live INSIDE the
 * Redux Provider, the React Query provider and the Auth provider (it depends on
 * all three). Renders its children unchanged.
 */
const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useSocket();
  return <>{children}</>;
};

export default RealtimeProvider;
