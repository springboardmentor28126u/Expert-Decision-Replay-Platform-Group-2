import api from './api';
import type { ApprovalRow, ApprovalAction, PendingApprovalsResponse } from '../types/approval';

export const approvalService = {
  getPendingApprovals: async (): Promise<PendingApprovalsResponse> => {
    const response = await api.get<ApprovalRow[]>('/approvals', { params: { status: 'under_review' } });
    const items = response.data;
    return { items, total: items.length, page: 1, size: items.length, pages: 1 };
  },
  getPendingCount: async (): Promise<{ total: number }> => {
    const response = await api.get<ApprovalRow[]>('/approvals', { params: { status: 'under_review' } });
    return { total: response.data.length };
  },
  getApprovalsForDecision: async (decisionId: string): Promise<ApprovalRow[]> => {
    const response = await api.get<ApprovalRow[]>(`/decisions/${decisionId}/approvals`);
    return response.data;
  },
  approve: async (decisionId: string, approvalId: string, comments = ''): Promise<ApprovalRow> => {
    const response = await api.post<ApprovalRow>(`/decisions/${decisionId}/approvals/${approvalId}`, {
      action: 'approved',
      comments,
    });
    return response.data;
  },
  reject: async (decisionId: string, approvalId: string, comments = ''): Promise<ApprovalRow> => {
    const response = await api.post<ApprovalRow>(`/decisions/${decisionId}/approvals/${approvalId}`, {
      action: 'rejected',
      comments,
    });
    return response.data;
  },
  requestChanges: async (decisionId: string, approvalId: string, comments = ''): Promise<ApprovalRow> => {
    const response = await api.post<ApprovalRow>(`/decisions/${decisionId}/approvals/${approvalId}`, {
      action: 'changes_requested',
      comments,
    });
    return response.data;
  },
};
