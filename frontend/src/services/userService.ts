import api from './api';
import { User, PaginatedUsers } from '../types/user';

export const userService = {
  getUsers: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedUsers> => {
    const skip = params?.page && params?.limit ? (params.page - 1) * params.limit : 0;
    const limit = params?.limit || 10;
    
    const queryParams = new URLSearchParams();
    queryParams.append('skip', skip.toString());
    queryParams.append('limit', limit.toString());
    
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    
    const response = await api.get(`/users?${queryParams.toString()}`);
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (id: string, data: any): Promise<User> => {
    const response = await api.put(`/users/${id}/profile`, data);
    return response.data;
  },

  createUser: async (data: { full_name: string; email: string; password: string; role?: string }): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  assignRole: async (userId: string, role: string): Promise<User> => {
    const response = await api.patch(`/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
