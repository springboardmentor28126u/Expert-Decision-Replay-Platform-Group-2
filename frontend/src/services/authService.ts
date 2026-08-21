import api from './api';
import { TokenResponse, MessageResponse } from '../types/auth';
import { User } from '../types/user';

export const authService = {
  login: async (credentials: any): Promise<TokenResponse> => {
    // OAuth2 expects form data for login
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    if (credentials.login_context) {
      formData.append('login_context', credentials.login_context);
    }

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (userData: any): Promise<TokenResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<MessageResponse> => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch {
      return { message: 'Already logged out or error' };
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, new_password: string): Promise<MessageResponse> => {
    const response = await api.post('/auth/reset-password', { token, new_password });
    return response.data;
  },

  changePassword: async (current_password: string, new_password: string): Promise<MessageResponse> => {
    const response = await api.post('/auth/change-password', { current_password, new_password });
    return response.data;
  },
};
