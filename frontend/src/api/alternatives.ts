import client from './client';
import { Alternative, AlternativeCreate, AlternativeUpdate } from '../types';

export const alternativesApi = {
  create: async (decisionId: number, data: AlternativeCreate): Promise<Alternative> => {
    const response = await client.post<Alternative>(
      `/api/decisions/${decisionId}/alternatives/`,
      data
    );
    return response.data;
  },

  list: async (decisionId: number): Promise<Alternative[]> => {
    const response = await client.get<Alternative[]>(
      `/api/decisions/${decisionId}/alternatives/`
    );
    return response.data;
  },

  update: async (
    decisionId: number,
    altId: number,
    data: AlternativeUpdate
  ): Promise<Alternative> => {
    const response = await client.put<Alternative>(
      `/api/decisions/${decisionId}/alternatives/${altId}`,
      data
    );
    return response.data;
  },

  delete: async (decisionId: number, altId: number): Promise<void> => {
    await client.delete(`/api/decisions/${decisionId}/alternatives/${altId}`);
  },
};
