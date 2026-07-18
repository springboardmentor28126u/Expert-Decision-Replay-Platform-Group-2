import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthState } from '../types/auth';
import { authService } from '../services/authService';
import { setAccessToken } from '../services/api';
import axios from 'axios';

const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';

const mockUser = {
  id: 'dev-user-001',
  full_name: 'Dev User',
  email: 'dev@local.host',
  status: 'active' as const,
  role: { id: '1', name: 'Administrator', description: null, created_at: '' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const roleHierarchy: Record<string, number> = {
  Employee: 0,
  Reviewer: 1,
  Manager: 2,
  Administrator: 3,
};

function getDashboardPath(roleName: string | undefined): string {
  const level = roleHierarchy[roleName ?? ''] ?? 0;
  if (level >= 3) return '/dashboard/admin';
  if (level >= 2) return '/dashboard/manager';
  return '/dashboard/employee';
}

interface AuthContextType extends AuthState {
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  getDashboardPath: () => string;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    const initAuth = async () => {
      if (SKIP_AUTH) {
        setState({
          isAuthenticated: true,
          user: mockUser,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        const response = await axios.post('http://localhost:8000/api/v1/auth/refresh', {}, { withCredentials: true });
        const { access_token } = response.data;
        setAccessToken(access_token);

        const user = await authService.getCurrentUser();
        setState({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setAccessToken(null);
        setState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: any) => {
    if (SKIP_AUTH) {
      setState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        error: null,
      });
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authService.login(credentials);
      setAccessToken(response.access_token);

      const user = await authService.getCurrentUser();
      setState({
        isAuthenticated: true,
        user,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      // Extract the real error message from the backend response
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || d.message || String(d)).join('; ')
          : 'Login failed. Please check your credentials.';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  };

  const register = async (userData: any) => {
    if (SKIP_AUTH) {
      setState({
        isAuthenticated: true,
        user: mockUser,
        isLoading: false,
        error: null,
      });
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Step 1: Register the user (creates user + returns tokens)
      const response = await authService.register(userData);
      setAccessToken(response.access_token);

      // Step 2: Fetch the user profile — separate try so that a
      // getCurrentUser failure does NOT mask a successful registration.
      try {
        const user = await authService.getCurrentUser();
        setState({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
        });
      } catch (meError) {
        // Registration succeeded but fetching /me failed.
        // Still mark as authenticated so the user isn't shown an error.
        console.warn('Registration succeeded but /me fetch failed:', meError);
        setState({
          isAuthenticated: true,
          user: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      // The register API call itself failed — show the real reason
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || d.message || String(d)).join('; ')
          : 'Registration failed. Please try again.';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  };

  const logout = async () => {
    if (SKIP_AUTH) {
      setState({
        ...initialState,
        isLoading: false,
      });
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setAccessToken(null);
      setState({
        ...initialState,
        isLoading: false,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, getDashboardPath: () => getDashboardPath(state.user?.role?.name) }}>
      {children}
    </AuthContext.Provider>
  );
};
