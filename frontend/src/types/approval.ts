export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'superseded';
export type ApprovalAction = 'approve' | 'reject' | 'request_changes';

export interface ApprovalRow {
  id: string;
  decision_id: string;
  approver_id: string;
  approver_name: string | null;
  level: number;
  status: ApprovalStatus;
  comments: string | null;
  acted_at: string | null;
  signature_hash: string | null;
  attested_at: string | null;
  attestation_text: string | null;
  created_at: string;
}

export interface ApprovalActionPayload {
  action: 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  attested?: boolean;
}

export interface PendingApprovalsResponse {
  items: ApprovalRow[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
