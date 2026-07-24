import api from './api';

export const auditLogService = {
  getRecentActivity: async () => {
    const response = await api.get('/approvals/audit-log');
    const items = response.data;
    return { items, total: items.length, page: 1, size: items.length, pages: 1 };
  },
  getAuditLogForDecision: async (decisionId) => {
    const response = await api.get(`/decisions/${decisionId}/audit-log`);
    return response.data;
  },
};
