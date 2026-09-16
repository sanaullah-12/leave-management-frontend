import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import OnboardingCarousel from "../components/onboarding/OnboardingCarousel";
import { hasSeenOnboarding, markOnboarded } from "../utils/onboarding";

/**
 * First launch -> introduction -> login -> dashboard.
 *
 * Finishing and skipping do the same thing, deliberately. Somebody who skips
 * has made a decision about this screen, and showing it to them again on the
 * next launch would be arguing with it.
 */
const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const finish = React.useCallback(() => {
    markOnboarded();
    navigate("/login", { replace: true });
  }, [navigate]);

  // Reaching this URL directly after it has already been seen is not an error,
  // it is just nothing to show. Straight on to the login screen.
  if (hasSeenOnboarding()) return <Navigate to="/login" replace />;

  return <OnboardingCarousel onFinish={finish} />;
};

export default OnboardingPage;
