import client from './client';
import { User, UserUpdate, UserAdminUpdate, PasswordUpdate, UserRole } from '../types';

export const usersApi = {
  getMe: async (): Promise<User> => {
    const response = await client.get<User>('/api/users/me');
    return response.data;
  },

  updateMe: async (data: UserUpdate): Promise<User> => {
    const response = await client.put<User>('/api/users/me', data);
    return response.data;
  },

  updatePassword: async (data: PasswordUpdate): Promise<void> => {
    await client.put('/api/users/me/password', data);
  },

  listUsers: async (skip = 0, limit = 100): Promise<User[]> => {
    const response = await client.get<User[]>('/api/users/', {
      params: { skip, limit },
    });
    return response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await client.get<User>(`/api/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, data: UserAdminUpdate): Promise<User> => {
    const response = await client.put<User>(`/api/users/${id}`, data);
    return response.data;
  },

  updateRole: async (id: number, role: UserRole): Promise<User> => {
    const response = await client.patch<User>(`/api/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await client.delete(`/api/users/${id}`);
  },
};
