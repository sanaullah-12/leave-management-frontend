import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import { markKnownUser } from '../utils/knownUser';

// Inline type definitions
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  employeeId: string;
  department: string;
  position: string;
  company: string;
  joinDate?: string;
  phone?: string;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

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

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  registerCompany: (data: RegisterCompanyData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Validate the stored session against the backend on app start.
  // Trusting localStorage blindly makes the app *look* logged in with a stale/expired
  // token, then kicks the user out on their first API call. Verifying up-front means we
  // either start fully authenticated (with fresh user data) or land cleanly on /login.
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    // Optimistically read any cached user so we can keep the session on a transient
    // (non-401) backend hiccup rather than logging the user out unnecessarily.
    let cachedUser: User | null = null;
    try {
      const raw = localStorage.getItem('user');
      cachedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cachedUser = null;
    }

    authAPI
      .getProfile()
      .then((response) => {
        const freshUser: User = response.data?.user || cachedUser;
        if (freshUser) {
          localStorage.setItem('user', JSON.stringify(freshUser));
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: freshUser, token } });
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        }
      })
      .catch((error) => {
        if (error?.response?.status === 401) {
          // Token is genuinely invalid/expired → clean logout to the login screen.
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        } else if (cachedUser) {
          // Backend unreachable (network/CORS/5xx) but we have a cached session —
          // keep the user signed in instead of punishing a server blip.
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: cachedUser, token } });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      markKnownUser();

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const registerCompany = async (data: RegisterCompanyData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await authAPI.registerCompany(data);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      markKnownUser();

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    registerCompany,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};