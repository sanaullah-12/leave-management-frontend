import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './components/NotificationSystem';
import './styles/themes.css';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import LeavesPage from './pages/LeavesPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPageReal from './pages/EmployeeDetailPageReal';
import MyLeaveActivityPage from './pages/MyLeaveActivityPage';
import ProfilePage from './pages/ProfilePage';
import VerifyInvitationPage from './pages/VerifyInvitationPage';
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
        <NotificationProvider>
          <AuthProvider>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                  <Route path="/verify-invitation/:token" element={<VerifyInvitationPage />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="leaves" element={<LeavesPage />} />
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
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;