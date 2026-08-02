import client from './client';
import { AuditLog, AuditLogListResponse, AuditLogFilterParams } from '../types';

export const auditApi = {
  listLogs: async (params?: AuditLogFilterParams): Promise<AuditLogListResponse> => {
    const response = await client.get<AuditLogListResponse>('/api/audit-logs/', {
      params,
    });
    return response.data;
  },

  getLog: async (id: number): Promise<AuditLog> => {
    const response = await client.get<AuditLog>(`/api/audit-logs/${id}`);
    return response.data;
  },
};
