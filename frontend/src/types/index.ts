/** TypeScript types for the Expert Decision Replay Platform */

// ===== User Types =====
export interface User {
  id: number;
  username: string;
  email: string;
  role: string | null;
}

export type UserRole = 'Employee' | 'Reviewer' | 'Manager' | 'Administrator';

export interface UserUpdate {
  username?: string;
  email?: string;
}

export interface UserAdminUpdate {
  username?: string;
  email?: string;
  role?: string;
}

export interface PasswordUpdate {
  current_password?: string;
  new_password?: string;
}

// ===== Auth Types =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  email: string;
  role: string;
}

// ===== Decision Types =====
export type DecisionStatus = 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Archived';

export interface Decision {
  id: number;
  title: string | null;
  description: string | null;
  category: string | null;
  status: DecisionStatus | null;
  created_by: number | null;
  created_at: string | null;
  updated_at: string | null;
  creator?: User | null;
}

export interface DecisionListResponse {
  items: Decision[];
  total: number;
  page: number;
  page_size: number;
}

export interface DecisionCreate {
  title: string;
  description?: string;
  category?: string;
}

export interface DecisionUpdate {
  title?: string;
  description?: string;
  category?: string;
}

// ===== Alternative Types =====
export interface Alternative {
  id: number;
  decision_id: number | null;
  name: string;
  pros: string | null;
  cons: string | null;
  cost: number | null;
  quality: number | null;
  risk: number | null;
  feasibility: number | null;
}

export interface AlternativeCreate {
  name: string;
  pros?: string;
  cons?: string;
  cost?: number;
  quality?: number;
  risk?: number;
  feasibility?: number;
}

export interface AlternativeUpdate {
  name?: string;
  pros?: string;
  cons?: string;
  cost?: number;
  quality?: number;
  risk?: number;
  feasibility?: number;
}

// ===== Discussion Types =====
export type DiscussionType = 'comment' | 'meeting_note' | 'rationale';

export interface Discussion {
  id: number;
  decision_id: number | null;
  user_id: number | null;
  parent_id: number | null;
  type: DiscussionType | null;
  comment: string;
  created_at: string | null;
  user?: User | null;
  replies: Discussion[];
}

export interface DiscussionCreate {
  comment: string;
  parent_id?: number;
  type?: DiscussionType;
}

// ===== File Types =====
export interface FileAttachment {
  id: number;
  decision_id: number;
  filename: string;
  content_type: string | null;
  size_bytes: number | null;
  uploaded_by: number | null;
  created_at: string | null;
  uploader?: User | null;
}

// ===== Version History Types =====
export interface VersionHistory {
  id: number;
  decision_id: number | null;
  old_title: string | null;
  old_description: string | null;
  changed_fields: Record<string, { old: string; new: string }> | null;
  updated_by: number | null;
  updated_at: string | null;
  updater?: User | null;
}

// ===== UI Types =====
export interface ApiError {
  detail: string;
}
