import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { hasSeenOnboarding } from "../../utils/onboarding";

/**
 * Sends a browser that has never run Nexora into the introduction before it
 * reaches a sign-in form.
 *
 * It guards the public routes rather than the authenticated ones because an
 * unauthenticated visitor to any private route is already bounced out to the
 * landing or login screen, so these two are where every path meets.
 *
 * Deliberately its own module, and deliberately not lazy. The gate runs on
 * every public route, so bundling it with the carousel would load the whole
 * introduction for people who have already seen it, and putting it behind a
 * lazy boundary would flash a loader ahead of every sign-in screen.
 */
export const FirstLaunchGate: React.FC = () => {
  if (!hasSeenOnboarding()) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
};

export default FirstLaunchGate;
