import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Decode helper to parse claims (user_id, email, role) from JWT
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Safe error parser to extract user-readable message from API responses or network errors
const parseErrorMessage = (error, defaultMsg) => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      // Pydantic validation error list formatting: e.g., "email: value is not a valid email address"
      return detail
        .map((err) => {
          const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : 'field';
          return `${field}: ${err.msg}`;
        })
        .join(', ');
    }
    return JSON.stringify(detail);
  }
  
  if (error.message) {
    if (error.message === 'Network Error') {
      return 'Network connection refused. Please ensure the FastAPI backend is running at http://localhost:5000';
    }
    return error.message;
  }
  
  return defaultMsg;
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate if the stored token is expired
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        // Token expired
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;
      
      const decodedUser = decodeToken(access_token);
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(decodedUser));
      
      setToken(access_token);
      setUser(decodedUser);
      
      return { success: true, user: decodedUser };
    } catch (error) {
      const message = parseErrorMessage(error, 'Invalid email or password');
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      await api.post('/auth/register', userData);
      return { success: true };
    } catch (error) {
      const message = parseErrorMessage(error, 'Registration failed');
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role: user?.role || null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
