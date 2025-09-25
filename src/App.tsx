import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
// import { NotificationProvider } from './components/NotificationSystem'; // Removed for Socket.IO implementation
import './styles/themes.css';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import LeavesPage from './pages/LeavesPage';
import AttendancePage from './pages/AttendancePage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPageReal from './pages/EmployeeDetailPageReal';
import MyLeaveActivityPage from './pages/MyLeaveActivityPage';
import ProfilePage from './pages/ProfilePage';
import VerifyInvitationPage from './pages/VerifyInvitationPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import ReportsPage from './pages/ReportsPage';
import ThemePage from './pages/ThemePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds for more frequent updates
      refetchInterval: 60 * 1000, // Auto refetch every minute
      refetchIntervalInBackground: true, // Continue refetching in background
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
          <AuthProvider>
            <Router>
              <div className="App">
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    className: '',
                    style: {
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '12px',
                      padding: '16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#ffffff',
                      },
                      style: {
                        borderLeft: '4px solid #10b981',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                      },
                      style: {
                        borderLeft: '4px solid #ef4444',
                      },
                    },
                  }}
                />
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                  <Route path="/invite/:token" element={<AcceptInvitePage />} />
                  <Route path="/verify-invitation/:token" element={<VerifyInvitationPage />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="leaves" element={<LeavesPage />} />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="employees/:id" element={<EmployeeDetailPageReal />} />
                    <Route path="my-leave-activity" element={<MyLeaveActivityPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="theme" element={<ThemePage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </Router>
          </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;