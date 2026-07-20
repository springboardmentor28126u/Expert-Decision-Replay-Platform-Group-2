import client from './client';
import {
  Decision,
  DecisionCreate,
  DecisionUpdate,
  DecisionListResponse,
  DecisionStatus,
  VersionHistory,
} from '../types';

export const decisionsApi = {
  create: async (data: DecisionCreate): Promise<Decision> => {
    const response = await client.post<Decision>('/api/decisions/', data);
    return response.data;
  },

  list: async (params: {
    status?: DecisionStatus;
    category?: string;
    search?: string;
    my_decisions?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<DecisionListResponse> => {
    const response = await client.get<DecisionListResponse>('/api/decisions/', { params });
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await client.get<string[]>('/api/decisions/categories');
    return response.data;
  },

  get: async (id: number): Promise<Decision> => {
    const response = await client.get<Decision>(`/api/decisions/${id}`);
    return response.data;
  },

  update: async (id: number, data: DecisionUpdate): Promise<Decision> => {
    const response = await client.put<Decision>(`/api/decisions/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: DecisionStatus): Promise<Decision> => {
    const response = await client.patch<Decision>(`/api/decisions/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/api/decisions/${id}`);
  },

  getHistory: async (id: number): Promise<VersionHistory[]> => {
    const response = await client.get<VersionHistory[]>(`/api/decisions/${id}/history`);
    return response.data;
  },
};
