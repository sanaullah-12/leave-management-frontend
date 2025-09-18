import axios from 'axios';

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials) => 
    api.post('/auth/login', credentials),
  
  registerCompany: (data: RegisterCompanyData) => 
    api.post('/auth/register-company', data),
  
  getProfile: () => 
    api.get('/auth/profile'),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    api.put('/auth/change-password', data),
  
  inviteEmployee: (data: InviteEmployeeData) => 
    api.post('/auth/invite-employee', data),
};

// Users API
export const usersAPI = {
  getEmployees: (page = 1, limit = 50) =>
    api.get(`/users?page=${page}&limit=${limit}`),

  getAdmins: (page = 1, limit = 10) =>
    api.get(`/users/admins/list?page=${page}&limit=${limit}`),
  
  getEmployee: (id: string) => 
    api.get(`/users/${id}`),
  
  updateEmployee: (id: string, data: Partial<any>) => 
    api.put(`/users/${id}`, data),
  
  deactivateEmployee: (id: string) => 
    api.put(`/users/${id}/deactivate`),
  
  activateEmployee: (id: string) => 
    api.put(`/users/${id}/activate`),
  
  deleteEmployee: (id: string) => 
    api.delete(`/users/${id}`),
};

// Leaves API
export const leavesAPI = {
  submitLeave: (data: LeaveRequest) => 
    api.post('/leaves', data),
  
  getLeaves: (page = 1, limit = 50, status?: string, employeeId?: string) => {
    let url = `/leaves?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (employeeId) url += `&employeeId=${employeeId}`;
    return api.get(url);
  },
  
  getLeave: (id: string) => 
    api.get(`/leaves/${id}`),
  
  reviewLeave: (id: string, data: { status: string; reviewComments?: string }) => 
    api.put(`/leaves/${id}/review`, data),
  
  getLeaveBalance: (employeeId?: string) => {
    const url = employeeId ? `/leaves/balance/${employeeId}` : '/leaves/balance';
    return api.get(url);
  },
  
  getDashboardStats: () => 
    api.get('/leaves/stats/dashboard'),
  
  getEmployeeLeaves: (employeeId: string, page = 1, limit = 50) => 
    api.get(`/leaves/employee/${employeeId}?page=${page}&limit=${limit}`),
  
  getEmployeeLeaveBalance: (employeeId: string) => 
    api.get(`/leaves/balance/${employeeId}`),
  
  // Leave Policy Management
  getLeavePolicy: () => 
    api.get('/leaves/policy'),
  
  updateLeavePolicy: (policy: any) => 
    api.put('/leaves/policy', policy),
  
  updateEmployeeLeaveAllocation: (employeeId: string, allocations: any) => 
    api.put(`/leaves/allocation/${employeeId}`, { allocations }),
};

// Notification API - Removed for Socket.IO implementation
// export const notificationsAPI = {
//   // Will be implemented with Socket.IO in the future
// };

export default api;