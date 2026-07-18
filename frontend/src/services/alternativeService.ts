import api from './api';
import type {
  Alternative,
  AlternativeCreatePayload,
  AlternativeUpdatePayload,
} from '../types/decision';

export const alternativeService = {
  /** List all alternatives for a decision. */
  list: async (decisionId: string): Promise<Alternative[]> => {
    const response = await api.get(`/decisions/${decisionId}/alternatives`);
    return response.data;
  },

  /** Add a new alternative to a decision. */
  create: async (decisionId: string, data: AlternativeCreatePayload): Promise<Alternative> => {
    const response = await api.post(`/decisions/${decisionId}/alternatives`, data);
    return response.data;
  },

  /** Update an existing alternative. */
  update: async (
    decisionId: string,
    alternativeId: string,
    data: AlternativeUpdatePayload
  ): Promise<Alternative> => {
    const response = await api.put(
      `/decisions/${decisionId}/alternatives/${alternativeId}`,
      data
    );
    return response.data;
  },

  /** Delete an alternative. */
  delete: async (decisionId: string, alternativeId: string): Promise<void> => {
    await api.delete(`/decisions/${decisionId}/alternatives/${alternativeId}`);
  },
};
