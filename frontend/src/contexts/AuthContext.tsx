import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthState } from '../types/auth';
import { authService } from '../services/authService';
import api, { setAccessToken, setOnAuthFailure, setCompanyId, setDefaultGroupId } from '../services/api';
import { companyService, CompanyWithRole } from '../services/companyService';
import { groupService, Group } from '../services/groupService';

const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';

const mockUser = {
  id: 'dev-user-001',
  full_name: 'Dev User',
  email: 'dev@local.host',
  status: 'active' as const,
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const roleHierarchy: Record<string, number> = {
  employee: 0,
  reviewer: 1,
  manager: 2,
  admin: 3,
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
  companies: CompanyWithRole[];
  groups: Group[];
  currentCompanyId: string | null;
  currentGroupId: string | null;
  switchCompany: (companyId: string) => Promise<void>;
  switchGroup: (groupId: string) => void;
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
  const [companies, setCompanies] = useState<CompanyWithRole[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  useEffect(() => {
    // Register auth failure callback so the API interceptor
    // can clear React state instead of hard-redirecting
    setOnAuthFailure(() => {
      setAccessToken(null);
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    });

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
        const response = await api.post('/auth/refresh');
        const { access_token } = response.data;
        setAccessToken(access_token);

        const user = await authService.getCurrentUser();
        await fetchAndSetCompany();
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

    return () => {
      setOnAuthFailure(null);
    };
  }, []);

  const fetchAndSetCompany = async () => {
    try {
      const companiesList = await companyService.getMyCompany();
      setCompanies(companiesList);
      if (companiesList.length > 0) {
        const firstCompany = companiesList[0];
        setCurrentCompanyId(firstCompany.id);
        setCompanyId(firstCompany.id);
        const groupsList = await groupService.list(firstCompany.id);
        setGroups(groupsList);
        if (groupsList.length > 0) {
          setCurrentGroupId(groupsList[0].id);
          setDefaultGroupId(groupsList[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch company info:', err);
    }
  };

  const switchCompany = useCallback(async (companyId: string) => {
    setCurrentCompanyId(companyId);
    setCompanyId(companyId);
    try {
      const groupsList = await groupService.list(companyId);
      setGroups(groupsList);
      if (groupsList.length > 0) {
        setCurrentGroupId(groupsList[0].id);
        setDefaultGroupId(groupsList[0].id);
      } else {
        setCurrentGroupId(null);
        setDefaultGroupId(null);
      }
    } catch (err) {
      console.warn('Failed to fetch groups for company:', err);
      setGroups([]);
      setCurrentGroupId(null);
      setDefaultGroupId(null);
    }
  }, []);

  const switchGroup = useCallback((groupId: string) => {
    setCurrentGroupId(groupId);
    setDefaultGroupId(groupId);
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
        await fetchAndSetCompany();
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
        await fetchAndSetCompany();
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

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      getDashboardPath: () => getDashboardPath(state.user?.role),
      companies,
      groups,
      currentCompanyId,
      currentGroupId,
      switchCompany,
      switchGroup,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
