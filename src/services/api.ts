import axios from "axios";

// Inline type definitions to avoid import issues
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCompanyData {
  companyName: string;
  companyEmail: string;
  adminName: string;
  adminEmail: string;
  password: string;
  phone?: string;
}

interface LeaveRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface InviteEmployeeData {
  name: string;
  email: string;
  department: string;
  position: string;
  joinDate: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout for most requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Create separate instance for invite operations with shorter timeout (since email is now async)
const inviteApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout - faster since email is async
  headers: {
    "Content-Type": "application/json",
  },
});

// Create separate instance for attendance operations with longer timeout (ZKTeco operations can be slow)
const attendanceApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minute timeout for ZKTeco biometric machine operations (increased due to large datasets)
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token (for both api instances)
const requestInterceptor = (config: any) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const requestErrorInterceptor = (error: any) => {
  return Promise.reject(error);
};

// Response interceptor to handle auth errors (for both api instances)
const responseInterceptor = (response: any) => response;
const responseErrorInterceptor = (error: any) => {
  if (error.response?.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
  return Promise.reject(error);
};

// Apply interceptors to all API instances
api.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
api.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

inviteApi.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
inviteApi.interceptors.response.use(
  responseInterceptor,
  responseErrorInterceptor
);

attendanceApi.interceptors.request.use(
  requestInterceptor,
  requestErrorInterceptor
);
attendanceApi.interceptors.response.use(
  responseInterceptor,
  responseErrorInterceptor
);

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials) =>
    api.post("/auth/login", credentials),

  registerCompany: (data: RegisterCompanyData) =>
    api.post("/auth/register-company", data),

  getProfile: () => api.get("/auth/profile"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data),

  inviteEmployee: (data: InviteEmployeeData) =>
    inviteApi.post("/auth/invite-employee", data), // Use inviteApi with 15s timeout (email is now async)

  // Email queue status endpoints
  getEmailQueueStatus: () => api.get("/auth/email-queue/status"),

  getEmailJobStatus: (jobId: string) =>
    api.get(`/auth/email-queue/job/${jobId}`),
};

// Users API
export const usersAPI = {
  getEmployees: (page = 1, limit = 50) =>
    api.get(`/users?page=${page}&limit=${limit}`),

  getAdmins: (page = 1, limit = 10) =>
    api.get(`/users/admins/list?page=${page}&limit=${limit}`),

  getEmployee: (id: string) => api.get(`/users/${id}`),

  updateEmployee: (id: string, data: Partial<any>) =>
    api.put(`/users/${id}`, data),

  deactivateEmployee: (id: string) => api.put(`/users/${id}/deactivate`),

  activateEmployee: (id: string) => api.put(`/users/${id}/activate`),

  deleteEmployee: (id: string) => api.delete(`/users/${id}`),
};

// Leaves API
export const leavesAPI = {
  submitLeave: (data: LeaveRequest) => api.post("/leaves", data),

  getLeaves: (page = 1, limit = 50, status?: string, employeeId?: string) => {
    let url = `/leaves?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (employeeId) url += `&employeeId=${employeeId}`;
    return api.get(url);
  },

  getLeave: (id: string) => api.get(`/leaves/${id}`),

  reviewLeave: (
    id: string,
    data: { status: string; reviewComments?: string }
  ) => api.put(`/leaves/${id}/review`, data),

  getLeaveBalance: (employeeId?: string) => {
    const url = employeeId
      ? `/leaves/balance/${employeeId}`
      : "/leaves/balance";
    return api.get(url);
  },

  getDashboardStats: () => api.get("/leaves/stats/dashboard"),

  getEmployeeLeaves: (employeeId: string, page = 1, limit = 50) =>
    api.get(`/leaves/employee/${employeeId}?page=${page}&limit=${limit}`),

  getEmployeeLeaveBalance: (employeeId: string) =>
    api.get(`/leaves/balance/${employeeId}`),

  // Leave Policy Management
  getLeavePolicy: () => api.get("/leaves/policy"),

  updateLeavePolicy: (policy: any) => api.put("/leaves/policy", policy),

  updateEmployeeLeaveAllocation: (employeeId: string, allocations: any) =>
    api.put(`/leaves/allocation/${employeeId}`, { allocations }),
};

// Attendance API (Biometric Machine Integration)
export const attendanceAPI = {
  connectToMachine: (ip: string, port = 4370) =>
    attendanceApi.post("/attendance/connect", { ip, port }),

  getMachineStatus: (ip: string) => api.get(`/attendance/status/${ip}`),

  getAllMachines: () => api.get("/attendance/machines"),

  disconnectFromMachine: (ip: string) =>
    attendanceApi.post("/attendance/disconnect", { ip }),

  // Employee data from biometric machine (use longer timeout)
  getEmployeesFromMachine: (ip: string) =>
    attendanceApi.get(`/attendance/employees/${ip}`),

  getEmployeeAttendance: (
    ip: string,
    employeeId: string,
    startDate?: string,
    endDate?: string,
    days = 7,
    forceSync = false
  ) => {
    // NEW: Use database endpoint instead of machine endpoint
    // Note: ip parameter kept for backwards compatibility but not used
    let url = `/attendance/db/frontend/${employeeId}`;
    const params = new URLSearchParams();

    if (startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    } else {
      params.append("days", days.toString());
    }

    // Note: forceSync parameter is ignored for database queries since data is already stored
    if (forceSync) {
      console.log("⚠️ forceSync parameter ignored for database queries");
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(
      `📊 Fetching attendance from database: ${url} (ip parameter ${ip} ignored)`
    );
    return attendanceApi.get(url);
  },

  // Get attendance data from machine (for backwards compatibility)
  getEmployeeAttendanceFromMachine: (
    ip: string,
    employeeId: string,
    startDate?: string,
    endDate?: string,
    days = 7,
    forceSync = false
  ) => {
    let url = `/attendance/attendance/${ip}/${employeeId}`;
    const params = new URLSearchParams();

    if (startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    } else {
      params.append("days", days.toString());
    }

    if (forceSync) {
      params.append("forceSync", "true");
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(`🔧 Fetching attendance from machine: ${url}`);
    return attendanceApi.get(url);
  },

  // Get real-time attendance data (forces sync)
  getRealTimeAttendance: (ip: string, employeeId: string, days = 30) =>
    attendanceApi.get(`/attendance/realtime/${ip}/${employeeId}?days=${days}`),

  // Force fetch real data from machine (batch processing)
  fetchRealAttendanceData: (ip: string, startDate: string, endDate: string) =>
    attendanceApi.post(`/attendance/fetch-real/${ip}`, { startDate, endDate }),

  // On-demand attendance fetch with date range (DEFAULT: last 2 months)
  fetchAttendanceRange: (ip: string, startDate?: string, endDate?: string) =>
    attendanceApi.post(`/attendance/fetch-attendance-range/${ip}`, {
      startDate,
      endDate,
    }),

  // Late time settings
  getLateTimeSettings: () =>
    attendanceApi.get("/attendance/settings/late-time"),

  updateLateTimeSettings: (settings: {
    cutoffTime?: string;
    useCustomCutoff: boolean;
  }) => attendanceApi.put("/attendance/settings/late-time", settings),

  // Sync management endpoints
  triggerManualSync: (ip: string) =>
    attendanceApi.post("/attendance/sync/manual", { ip }),

  getSyncStatus: () => attendanceApi.get("/attendance/sync/status"),

  triggerSyncAllMachines: () => attendanceApi.post("/attendance/sync/all"),
};

// Notification API - Removed for Socket.IO implementation
// export const notificationsAPI = {
//   // Will be implemented with Socket.IO in the future
// };

export default api;
