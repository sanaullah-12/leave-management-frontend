import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LocaleProvider } from "./i18n/LocaleProvider";
import RealtimeProvider from "./providers/RealtimeProvider";
// import { NotificationProvider } from './components/NotificationSystem'; // Removed for Socket.IO implementation
import "./styles/themes.css";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import LogoLoader from "./components/LogoLoader";
import PWAManager from "./components/pwa/PWAManager";

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

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* LocaleProvider sits above everything that renders text so a language
          switch re-renders the whole tree once, and owns <html lang|dir>. */}
      <LocaleProvider>
      <ThemeProvider>
        <AuthProvider>
          <RealtimeProvider>
          <MotionConfig reducedMotion="user">
            <Router>
            <div className="App">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: "",
                  // Default styles will be overridden by individual toast functions
                  style: {},
                  success: {
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#ffffff",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#ffffff",
                    },
                  },
                  loading: {
                    iconTheme: {
                      primary: "#6b7280",
                      secondary: "#ffffff",
                    },
                  },
                }}
              />
              {/* One boundary for the public routes. The authenticated routes
                  have their own boundary inside <Layout>, so the sidebar and
                  header stay painted while a page chunk downloads. */}
              <React.Suspense fallback={<LogoLoader fullScreen />}>
              <Routes>
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
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
            </Router>

            {/* Install and update surfaces. Deliberately outside <Router>:
                they are app-wide and must not remount on navigation. This is
                also the only place the service worker is registered. */}
            <PWAManager />
          </MotionConfig>
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
};

export default App;
