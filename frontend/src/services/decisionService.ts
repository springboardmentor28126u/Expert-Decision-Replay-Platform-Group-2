import api from './api';
import type {
  Decision,
  DecisionListItem,
  DecisionCreatePayload,
  DecisionUpdatePayload,
  DecisionVersion,
  PaginatedDecisions,
} from '../types/decision';

export interface DecisionListParams {
  skip?: number;
  limit?: number;
  status?: string;
  category_id?: string;
  search?: string;
  my_only?: boolean;
}

export const decisionService = {
  /** Create a new decision in DRAFT status. */
  create: async (data: DecisionCreatePayload): Promise<Decision> => {
    const response = await api.post('/decisions', data);
    return response.data;
  },

  /** List decisions with filtering and pagination. */
  list: async (params: DecisionListParams = {}): Promise<PaginatedDecisions> => {
    const response = await api.get('/decisions', { params });
    return response.data;
  },

  /** Get a single decision by ID. */
  get: async (id: string): Promise<Decision> => {
    const response = await api.get(`/decisions/${id}`);
    return response.data;
  },

  /** Update a draft decision. */
  update: async (id: string, data: DecisionUpdatePayload): Promise<Decision> => {
    const response = await api.put(`/decisions/${id}`, data);
    return response.data;
  },

  /** Submit a draft decision for review. */
  submit: async (id: string): Promise<Decision> => {
    const response = await api.patch(`/decisions/${id}/submit`);
    return response.data;
  },

  /** Soft-delete (archive) a decision. */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/decisions/${id}`);
  },

  /** Get decision stats for the dashboard. */
  getStats: async (): Promise<{ total: number; by_status: Record<string, number> }> => {
    const response = await api.get('/decisions/stats');
    return response.data;
  },

  /** List version history for a decision. */
  getVersions: async (decisionId: string): Promise<DecisionVersion[]> => {
    const response = await api.get(`/decisions/${decisionId}/versions`);
    return response.data;
  },

  /** Get a specific version snapshot. */
  getVersion: async (decisionId: string, versionNumber: number): Promise<DecisionVersion> => {
    const response = await api.get(`/decisions/${decisionId}/versions/${versionNumber}`);
    return response.data;
  },
};
