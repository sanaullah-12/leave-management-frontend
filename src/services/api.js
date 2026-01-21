import axios from "axios";

// Base API URL - use environment variable in production
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  verifyToken: () => api.get("/auth/verify"),
  logout: () => api.post("/auth/logout"),
};

// User management API
export const usersAPI = {
  getUsers: () => api.get("/users"),
  createUser: (data) => api.post("/users", data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  deleteEmployee: (id) => api.delete(`/users/${id}`),
  deactivateEmployee: (id) => api.put(`/users/${id}/deactivate`),
  activateEmployee: (id) => api.put(`/users/${id}/activate`),
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  getUserById: (id) => api.get(`/users/${id}`),
  changePassword: (id, data) => api.put(`/users/${id}/password`, data),
  toggleUserStatus: (id) => api.put(`/users/${id}/toggle-status`),

  // Invite methods - Don't send company, let backend use admin's company
  inviteEmployee: async (data) => {
    const inviteData = {
      name: data.name,
      email: data.email,
      role: "employee",
      status: "pending",
      department: data.department,
      position: data.position,
      joinDate: data.joinDate,
      employeeId: data.employeeId || undefined,
      tags: data.tags || [],
      sendInviteEmail: true,
      // Don't send company - backend will use req.user.company
    };

    console.log("📤 Sending invite with data:", inviteData);
    return api.post("/users", inviteData);
  },

  inviteAdmin: async (data) => {
    const inviteData = {
      name: data.name,
      email: data.email,
      role: "admin",
      status: "pending",
      department: data.department,
      position: data.position,
      joinDate: data.joinDate,
      employeeId: data.employeeId || undefined,
      tags: data.tags || [],
      sendInviteEmail: true,
      // Don't send company - backend will use req.user.company
    };

    console.log("📤 Sending admin invite with data:", inviteData);
    return api.post("/users", inviteData);
  },

  resendInvite: (userId) => api.post(`/users/${userId}/resend-invite`),
};

// User API (alternative naming for backward compatibility)
export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  getUsers: () => api.get("/users"),
  createUser: (data) => api.post("/users", data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Attendance API
export const attendanceAPI = {
  // Machine connection methods
  connectToMachine: (ip, port) => api.post("/attendance/connect", { ip, port }),
  disconnectFromMachine: (ip) => api.post("/attendance/disconnect", { ip }),
  getMachineStatus: (ip) => api.get(`/attendance/status/${ip}`),
  getAllMachines: () => api.get("/attendance/machines"),

  // Employee methods
  getEmployeesFromMachine: (ip) => api.get(`/attendance/employees/${ip}`),

  // Attendance data methods
  getEmployeeAttendance: (
    ip,
    employeeId,
    startDate,
    endDate,
    days,
    forceSync
  ) => {
    return api.get(`/attendance/attendance/${ip}/${employeeId}`, {
      params: { startDate, endDate, days, forceSync },
    });
  },

  // Database attendance methods for modal
  getEmployeeAttendanceFromDB: (employeeId, startDate, endDate) => {
    return api.get(`/attendance/db/frontend/${employeeId}`, {
      params: { startDate, endDate },
    });
  },

  getEmployeeAttendanceSummary: (employeeId, startDate, endDate) => {
    return api.get(`/attendance/db/summary/${employeeId}`, {
      params: { startDate, endDate },
    });
  },

  getAttendanceStats: (startDate, endDate) => {
    return api.get("/attendance/db/stats", {
      params: { startDate, endDate },
    });
  },

  // Employee self-service
  getMyAttendance: (startDate, endDate, days) => {
    return api.get("/attendance/my-attendance", {
      params: { startDate, endDate, days },
    });
  },

  // Settings methods
  getLateTimeSettings: () => api.get("/attendance/settings/late-time"),
  updateLateTimeSettings: (settings) =>
    api.put("/attendance/settings/late-time", settings),

  // Sync methods
  triggerManualSync: (ip) => api.post("/attendance/sync/manual", { ip }),
  getSyncStatus: () => api.get("/attendance/sync/status"),
  syncAllMachines: () => api.post("/attendance/sync/all"),

  // Real-time data methods
  getRealTimeAttendance: (ip, employeeId, days) => {
    return api.get(`/attendance/realtime/${ip}/${employeeId}`, {
      params: { days },
    });
  },

  // Diagnostic methods
  runDiagnostics: (ip) => api.get(`/attendance/diagnostic/${ip}`),

  // Batch fetch methods
  fetchAttendanceRange: (ip, startDate, endDate) => {
    return api.post(`/attendance/fetch-attendance-range/${ip}`, {
      startDate,
      endDate,
    });
  },

  fetchRealData: (ip, startDate, endDate) => {
    return api.post(`/attendance/fetch-real/${ip}`, {
      startDate,
      endDate,
    });
  },
};

// Leaves API
export const leavesAPI = {
  getLeaves: (page = 1, limit = 100, status = "") => {
    const params = { page, limit };
    if (status) params.status = status;
    return api.get("/leaves", { params });
  },
  createLeave: (data) => api.post("/leaves", data),
  updateLeave: (id, data) => api.put(`/leaves/${id}`, data),
  deleteLeave: (id) => api.delete(`/leaves/${id}`),
  getMyLeaves: () => {
    console.log("🔍 Fetching employee leaves from /leaves/my-leaves");
    return api.get("/leaves/my-leaves");
  },
  submitLeave: (data) => api.post("/leaves", data),
  reviewLeave: (id, data) => api.put(`/leaves/${id}/review`, data),
  approveLeave: (id) => api.put(`/leaves/${id}/approve`),
  rejectLeave: (id, reason) => api.put(`/leaves/${id}/reject`, { reason }),
  getLeaveById: (id) => api.get(`/leaves/${id}`),
  getLeaveTypes: () => api.get("/leaves/types"),
  getLeaveBalance: () => api.get("/leaves/my-balance"),
  getMyLeaveBalance: () => api.get("/leaves/my-balance"),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentActivity: () => api.get("/dashboard/recent-activity"),
  getAttendanceOverview: () => api.get("/dashboard/attendance-overview"),
  getLeaveOverview: () => api.get("/dashboard/leave-overview"),
  getEmployeeStats: () => api.get("/dashboard/employee-stats"),
  getAttendanceChart: (period) =>
    api.get(`/dashboard/attendance-chart?period=${period}`),
  getLeaveChart: (period) => api.get(`/dashboard/leave-chart?period=${period}`),
};

// Reports API
export const reportsAPI = {
  getAttendanceReport: (params) => api.get("/reports/attendance", { params }),
  getLeaveReport: (params) => api.get("/reports/leave", { params }),
  getEmployeeReport: (params) => api.get("/reports/employee", { params }),
  exportAttendanceReport: (params) =>
    api.get("/reports/attendance/export", { params }),
  exportLeaveReport: (params) => api.get("/reports/leave/export", { params }),
  getPayrollReport: (params) => api.get("/reports/payroll", { params }),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get("/settings"),
  updateSettings: (data) => api.put("/settings", data),
  getCompanySettings: () => api.get("/settings/company"),
  updateCompanySettings: (data) => api.put("/settings/company", data),
  getEmailSettings: () => api.get("/settings/email"),
  updateEmailSettings: (data) => api.put("/settings/email", data),
  testEmailSettings: () => api.post("/settings/email/test"),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: () => api.get("/notifications"),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/mark-all-read"),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get("/notifications/unread-count"),
};

// Default export for backward compatibility
export default api;
