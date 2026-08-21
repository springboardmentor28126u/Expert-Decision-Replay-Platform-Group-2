// Team-related TypeScript types

export interface Team {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
}

export interface TeamCreatePayload {
  name: string;
  description?: string;
}

export interface TeamUpdatePayload {
  name?: string;
  description?: string;
}

export interface TeamMemberAddPayload {
  user_id: string;
  role?: string;
}
