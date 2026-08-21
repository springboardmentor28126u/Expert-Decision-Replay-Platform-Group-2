// Audit log API service
import api from './api';

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: any;
  new_value: any;
  performed_by: string;
  performer_name: string;
  created_at: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const auditLogService = {
  async getAuditLogs(params?: {
    skip?: number;
    limit?: number;
    entity_type?: string;
    action?: string;
    performed_by?: string;
  }): Promise<AuditLogResponse> {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params?.entity_type) searchParams.set('entity_type', params.entity_type);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.performed_by) searchParams.set('performed_by', params.performed_by);

    const { data } = await api.get(`/audit-logs?${searchParams.toString()}`);
    return data;
  },

  async getAuditLogForDecision(decisionId: string): Promise<AuditLogEntry[]> {
    const { data } = await api.get(`/decisions/${decisionId}/audit-log`);
    return data;
  },

  async getEntityTypes(): Promise<string[]> {
    const { data } = await api.get('/audit-logs/entity-types');
    return data;
  },

  async getActions(): Promise<string[]> {
    const { data } = await api.get('/audit-logs/actions');
    return data;
  },
};
