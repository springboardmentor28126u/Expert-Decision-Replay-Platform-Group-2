import api from './api';

export interface ApprovalChainLevel {
  level: number;
  role: string;
}

export interface ApprovalChainConfig {
  id: string;
  company_id: string;
  group_id: string | null;
  category: string;
  levels: ApprovalChainLevel[];
  sla_hours: number | null;
  created_at: string;
  group_name?: string | null;
}

export interface CreateApprovalChainPayload {
  category: string;
  group_id?: string | null;
  levels: ApprovalChainLevel[];
  sla_hours?: number;
}

export interface UpdateApprovalChainPayload {
  category?: string;
  group_id?: string | null;
  levels?: ApprovalChainLevel[];
  sla_hours?: number;
}

export interface ApprovalChainCheckResult {
  has_chain: boolean;
  chain: ApprovalChainConfig | null;
  admin_name: string | null;
  admin_email: string | null;
  approver_ok?: boolean | null;
  missing_role?: string | null;
}

export const approvalChainService = {
  list: async (companyId: string): Promise<ApprovalChainConfig[]> => {
    const response = await api.get(`/companies/${companyId}/approval-chains`);
    return response.data;
  },

  create: async (companyId: string, payload: CreateApprovalChainPayload): Promise<ApprovalChainConfig> => {
    const response = await api.post(`/companies/${companyId}/approval-chains`, payload);
    return response.data;
  },

  update: async (companyId: string, chainId: string, payload: UpdateApprovalChainPayload): Promise<ApprovalChainConfig> => {
    const response = await api.put(`/companies/${companyId}/approval-chains/${chainId}`, payload);
    return response.data;
  },

  delete: async (companyId: string, chainId: string): Promise<void> => {
    await api.delete(`/companies/${companyId}/approval-chains/${chainId}`);
  },

  check: async (companyId: string, category: string, groupId?: string | null): Promise<ApprovalChainCheckResult> => {
    const params: Record<string, string> = { category };
    if (groupId) {
      params.group_id = groupId;
    }
    const response = await api.get(`/companies/${companyId}/approval-chains/check`, { params });
    return response.data;
  },
};
