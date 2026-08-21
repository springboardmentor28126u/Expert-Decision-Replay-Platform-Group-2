import api from './api';

export interface RoutingRule {
  id: string;
  company_id: string;
  category: string;
  condition_field: string;
  operator: string;
  condition_value: string;
  inserted_role: string;
  insert_position: string;
  insert_before_level: number | null;
  priority: number;
  active: boolean;
  created_at: string;
}

export interface CreateRoutingRulePayload {
  category: string;
  condition_field: string;
  operator: string;
  condition_value: string;
  inserted_role: string;
  insert_position?: string;
  insert_before_level?: number | null;
  priority?: number;
  active?: boolean;
}

export interface UpdateRoutingRulePayload {
  category?: string;
  condition_field?: string;
  operator?: string;
  condition_value?: string;
  inserted_role?: string;
  insert_position?: string;
  insert_before_level?: number | null;
  priority?: number;
  active?: boolean;
}

export interface RoutingPreviewResult {
  matching_rules: {
    rule_id: string;
    condition_field: string;
    operator: string;
    condition_value: string;
    inserted_role: string;
    insert_position: string;
  }[];
  additional_approvals_needed: number;
}

export const routingRuleService = {
  list: async (companyId: string, category?: string): Promise<RoutingRule[]> => {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    const response = await api.get(`/companies/${companyId}/approval-routing-rules`, { params });
    return response.data;
  },

  create: async (companyId: string, payload: CreateRoutingRulePayload): Promise<RoutingRule> => {
    const response = await api.post(`/companies/${companyId}/approval-routing-rules`, payload);
    return response.data;
  },

  update: async (companyId: string, ruleId: string, payload: UpdateRoutingRulePayload): Promise<RoutingRule> => {
    const response = await api.put(`/companies/${companyId}/approval-routing-rules/${ruleId}`, payload);
    return response.data;
  },

  delete: async (companyId: string, ruleId: string): Promise<void> => {
    await api.delete(`/companies/${companyId}/approval-routing-rules/${ruleId}`);
  },

  preview: async (
    companyId: string,
    category: string,
    financialImpact?: number | null,
    riskScore?: number | null,
    impactLevel?: string | null,
  ): Promise<RoutingPreviewResult> => {
    const payload: Record<string, unknown> = { category };
    if (financialImpact != null) payload.financial_impact = financialImpact;
    if (riskScore != null) payload.risk_score = riskScore;
    if (impactLevel) payload.impact_level = impactLevel;
    const response = await api.post(`/companies/${companyId}/approval-routing-rules/preview`, payload);
    return response.data;
  },
};
