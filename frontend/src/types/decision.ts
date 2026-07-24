// Decision-related TypeScript types

export interface DecisionCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export type DecisionStatus = 'draft' | 'under_review' | 'approved' | 'rejected' | 'archived';
export type ImpactLevel = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface CreatorSummary {
  id: string;
  full_name: string;
  email: string;
}

export interface Alternative {
  id: string;
  decision_id: string;
  title: string;
  description: string | null;
  pros: string[];
  cons: string[];
  estimated_cost: number | null;
  feasibility_score: number | null;
  risk_level: RiskLevel;
  is_recommended: boolean;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  title: string;
  problem_statement: string;
  category_id: string;
  category: DecisionCategory | null;
  status: DecisionStatus;
  impact_level: ImpactLevel;
  created_by: string;
  creator: CreatorSummary | null;
  current_version: number;
  target_date: string | null;
  stakeholder_ids: string[] | null;
  implementation_status: string;
  outcome: string | null;
  outcome_notes: string | null;
  company_id: string;
  group_id: string;
  alternatives: Alternative[];
  alternative_count: number;
  created_at: string;
  updated_at: string;
}

export interface DecisionListItem {
  id: string;
  title: string;
  status: DecisionStatus;
  impact_level: ImpactLevel;
  category: DecisionCategory | null;
  creator: CreatorSummary | null;
  alternative_count: number;
  current_version: number;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionVersion {
  id: string;
  decision_id: string;
  version_number: number;
  snapshot_json: any;
  change_summary: string | null;
  created_by: string;
  creator_name: string | null;
  created_at: string;
}

export interface PaginatedDecisions {
  items: DecisionListItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ---- Create/Update payloads ----

export interface DecisionCreatePayload {
  title: string;
  problem_statement: string;
  category_id: string;
  impact_level: ImpactLevel;
  group_id: string;
  target_date?: string | null;
  stakeholder_ids?: string[];
}

export interface DecisionUpdatePayload {
  title?: string;
  problem_statement?: string;
  category_id?: string;
  group_id?: string;
  impact_level?: ImpactLevel;
  target_date?: string | null;
  stakeholder_ids?: string[];
}

export interface AlternativeCreatePayload {
  title: string;
  description?: string;
  pros: string[];
  cons: string[];
  estimated_cost?: number | null;
  feasibility_score?: number | null;
  risk_level: RiskLevel;
  is_recommended: boolean;
}

export interface AlternativeUpdatePayload {
  title?: string;
  description?: string;
  pros?: string[];
  cons?: string[];
  estimated_cost?: number | null;
  feasibility_score?: number | null;
  risk_level?: RiskLevel;
  is_recommended?: boolean;
}
