export interface DecisionCommentAuthor {
  id: string;
  full_name: string;
}

export interface DecisionComment {
  id: string;
  decision_id: string;
  author_id: string;
  author: DecisionCommentAuthor;
  content: string;
  parent_comment_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  like_count: number;
  liked_by_me: boolean;
  reply_count: number;
  reply_previews: DecisionComment[];
}

export interface DecisionCommentCreatePayload {
  content: string;
  parent_comment_id?: string | null;
}

export interface DecisionCommentUpdatePayload {
  content: string;
}

export interface DecisionCommentLikeToggle {
  liked: boolean;
  like_count: number;
}

export interface DecisionCommentMentionResult {
  id: string;
  full_name: string;
}

export interface DecisionCommentListResponse {
  items: DecisionComment[];
  total: number;
}
