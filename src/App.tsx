import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  configureAttendanceCache,
  hydrateAttendanceCache,
  startAttendanceCachePersistence,
} from "./lib/attendanceCache";
import { MotionConfig } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { MorphZone } from "./components/ui/CardMorph";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LocaleProvider } from "./i18n/LocaleProvider";
import RealtimeProvider from "./providers/RealtimeProvider";
// import { NotificationProvider } from './components/NotificationSystem'; // Removed for Socket.IO implementation
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import FirstLaunchGate from "./components/onboarding/FirstLaunchGate";
import LogoLoader from "./components/LogoLoader";
import PWAManager from "./components/pwa/PWAManager";
import PWAProvider from "./providers/PWAProvider";
import { useViewportInsets } from "./hooks/useViewportInsets";
import { useMediaQuery } from "./hooks/useMediaQuery";

/* ------------------------------------------------------------------ */
/*  Route-level code splitting                                         */
/*                                                                     */
/*  Every route below is lazily imported so a visitor downloads only    */
/*  the screen they actually opened. Previously all ~20 pages (plus     */
/*  Recharts, the Document Studio editor and the attendance module)     */
/*  were bundled into a single eager chunk that every user paid for on  */
/*  first paint, regardless of role or destination.                     */
/*                                                                     */
/*  LoginPage is the one deliberate exception: it is the guaranteed     */
/*  first paint for anyone without a session, so keeping it eager       */
/*  avoids an extra round-trip on the most common cold entry.           */
/* ------------------------------------------------------------------ */

// Public
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
// The first-launch introduction. Lazy like the landing page - a returning user
// never loads it, and it is the one screen guaranteed not to be needed twice.
const OnboardingPage = React.lazy(() => import("./pages/OnboardingPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));
const AcceptInvitePage = React.lazy(() => import("./pages/AcceptInvitePage"));
const VerifyInvitationPage = React.lazy(
  () => import("./pages/VerifyInvitationPage")
);

// Core app
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const LeavesPage = React.lazy(() => import("./pages/LeavesPage"));
const ApplyLeavePage = React.lazy(() => import("./pages/ApplyLeavePage"));
const LeaveCalendarPage = React.lazy(() => import("./pages/LeaveCalendarPage"));
const AttendancePage = React.lazy(() => import("./pages/AttendancePage"));
const LateTimePage = React.lazy(() => import("./pages/LateTimePage"));
const TimeChangesPage = React.lazy(() => import("./pages/TimeChangesPage"));
const EmployeesPage = React.lazy(() => import("./pages/EmployeesPage"));
const EmployeeDetailPageReal = React.lazy(
  () => import("./pages/EmployeeDetailPageReal")
);
const MyLeaveActivityPage = React.lazy(
  () => import("./pages/MyLeaveActivityPage")
);
const MyTeamPage = React.lazy(() => import("./pages/MyTeamPage"));
const DepartmentsPage = React.lazy(() => import("./pages/DepartmentsPage"));
const LeavePolicyPage = React.lazy(() => import("./pages/LeavePolicyPage"));
const ReportsPage = React.lazy(() => import("./pages/ReportsPage"));
const NotificationsPage = React.lazy(() => import("./pages/NotificationsPage"));
const AnnouncementsPage = React.lazy(() => import("./pages/AnnouncementsPage"));
const EmployeeVoicePage = React.lazy(() => import("./pages/EmployeeVoicePage"));
const WorkFromHomePage = React.lazy(() => import("./pages/WorkFromHomePage"));
const DocumentStudioPage = React.lazy(
  () => import("./pages/DocumentStudioPage")
);
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const ThemePage = React.lazy(() => import("./pages/ThemePage"));

// Payroll is admin-only and pulls in charts + PDF tooling, so the whole module
// is code-split. Employees never download a byte of it.
const PayrollLayout = React.lazy(() => import("./pages/payroll/PayrollLayout"));
const PayrollDashboardPage = React.lazy(
  () => import("./pages/payroll/PayrollDashboardPage")
);
const SalaryManagementPage = React.lazy(
  () => import("./pages/payroll/SalaryManagementPage")
);
const PayrollProcessingPage = React.lazy(
  () => import("./pages/payroll/PayrollProcessingPage")
);
const PayslipsPage = React.lazy(() => import("./pages/payroll/PayslipsPage"));
const PayrollHistoryPage = React.lazy(
  () => import("./pages/payroll/PayrollHistoryPage")
);
const PayrollSettingsPage = React.lazy(
  () => import("./pages/payroll/PayrollSettingsPage")
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds for more frequent updates
      refetchInterval: false, // Disabled auto refetch to prevent connection issues
      refetchIntervalInBackground: false, // Disabled background refetching
    },
  },
});

// Attendance answers are kept far longer than the 30s default: a roster load
// is one request per employee, and the default would discard it the moment
// somebody looked at another page. See lib/attendanceCache.ts.
configureAttendanceCache(queryClient);

// Put the last session's attendance back before the first render, and keep
// mirroring it, so a reload does not start from an empty table either.
hydrateAttendanceCache(queryClient);
startAttendanceCachePersistence(queryClient);

const App: React.FC = () => {
  // Publishes the software keyboard height as --keyboard-inset for every
  // bottom-anchored surface in the app. Mounted once, above the router.
  useViewportInsets();
  const isPhone = useMediaQuery("(max-width: 639px)");

  return (
    <QueryClientProvider client={queryClient}>
      {/* LocaleProvider sits above everything that renders text so a language
          switch re-renders the whole tree once, and owns <html lang|dir>. */}
      <LocaleProvider>
      <ThemeProvider>
        <AuthProvider>
          <RealtimeProvider>
          <MotionConfig reducedMotion="user">
            {/* Wraps the router as well as the surfaces below, so the header's
                "Get app" button reads the same install state without a second
                usePWA() call registering a second service worker. */}
            <PWAProvider>
            <Router>
            {/* Inside the router so a morph can drive the URL, but outside
                <Routes> so it never unmounts on navigation - remounting would
                drop the layout projection mid-flight. */}
            <MorphZone>
            <div className="App">
              {/* Toasts sit under the mobile app bar rather than over it.
                  `top-right` put them against the right edge at y=0, which on
                  an installed iPhone is behind the status bar and on any phone
                  is on top of the notification bell they are often reporting
                  on. `containerStyle` reserves the safe area plus the bar; the
                  offset collapses to a normal top margin on desktop, where
                  --app-bar-h is not in play (the desktop header is 64px, and
                  the toast is deliberately allowed to overlap it there as it
                  always has). `containerClassName` centres them on a phone,
                  where a 90vw toast has nowhere to be but centred - desktop
                  keeps the top-right corner it has always used. */}
              <Toaster
                position={isPhone ? "top-center" : "top-right"}
                containerStyle={{
                  top: "calc(var(--safe-top) + var(--app-bar-h) + 0.5rem)",
                }}
                toastOptions={{
                  duration: 4000,
                  className: "max-w-[calc(100vw-1.5rem)]",
                  // Default styles will be overridden by individual toast functions
                  style: {},
                  // The status tokens, so a toast icon is the same green as
                  // every other success mark in the product and shifts with
                  // light/dark like the rest of them.
                  success: {
                    iconTheme: {
                      primary: "var(--success)",
                      secondary: "var(--surface-overlay)",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "var(--danger)",
                      secondary: "var(--surface-overlay)",
                    },
                  },
                  loading: {
                    iconTheme: {
                      primary: "var(--text-muted)",
                      secondary: "var(--surface-overlay)",
                    },
                  },
                }}
              />
              {/* One boundary for the public routes. The authenticated routes
                  have their own boundary inside <Layout>, so the sidebar and
                  header stay painted while a page chunk downloads. */}
              <React.Suspense fallback={<LogoLoader fullScreen />}>
              <Routes>
                <Route path="/onboarding" element={<OnboardingPage />} />
                {/* First launch is sent through the introduction before it
                    ever reaches a sign-in form. Both public entry points are
                    behind the gate, since an unauthenticated visitor to any
                    private route lands on one of them. */}
                <Route element={<FirstLaunchGate />}>
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                </Route>
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route
                  path="/reset-password/:token"
                  element={<ResetPasswordPage />}
                />
                <Route path="/invite/:token" element={<AcceptInvitePage />} />
                <Route
                  path="/verify-invitation/:token"
                  element={<VerifyInvitationPage />}
                />
                <Route path="/" element={<Layout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="leaves" element={<LeavesPage />} />
                  <Route path="apply-leave" element={<ApplyLeavePage />} />
                  <Route path="leave-calendar" element={<LeaveCalendarPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route
                    path="attendance/late-time"
                    element={<LateTimePage />}
                  />
                  <Route
                    path="attendance/time-changes"
                    element={<TimeChangesPage />}
                  />
                  <Route path="employees" element={<EmployeesPage />} />
                  <Route
                    path="employees/:id"
                    element={<EmployeeDetailPageReal />}
                  />
                  <Route
                    path="my-leave-activity"
                    element={<MyLeaveActivityPage />}
                  />
                  <Route path="team" element={<MyTeamPage />} />
                  <Route path="departments" element={<DepartmentsPage />} />
                  <Route path="leave-policies" element={<LeavePolicyPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="announcements" element={<AnnouncementsPage />} />
                  <Route path="employee-voice" element={<EmployeeVoicePage />} />
                  <Route path="work-from-home" element={<WorkFromHomePage />} />
                  <Route path="document-studio" element={<DocumentStudioPage />} />
                  <Route path="payroll" element={<PayrollLayout />}>
                    <Route index element={<PayrollDashboardPage />} />
                    <Route path="salaries" element={<SalaryManagementPage />} />
                    <Route path="run" element={<PayrollProcessingPage />} />
                    <Route path="payslips" element={<PayslipsPage />} />
                    <Route path="history" element={<PayrollHistoryPage />} />
                    <Route path="settings" element={<PayrollSettingsPage />} />
                  </Route>
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="theme" element={<ThemePage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </React.Suspense>
            </div>
            </MorphZone>
            </Router>

            {/* Install and update surfaces. Deliberately outside <Router>:
                they are app-wide and must not remount on navigation. This is
                also the only place the service worker is registered. */}
            <PWAManager />
            </PWAProvider>
          </MotionConfig>
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
};

export default App;
