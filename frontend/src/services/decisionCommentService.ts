import api from './api';
import type {
  DecisionComment,
  DecisionCommentCreatePayload,
  DecisionCommentUpdatePayload,
  DecisionCommentLikeToggle,
  DecisionCommentMentionResult,
  DecisionCommentListResponse,
} from '../types/decisionComment';

export const decisionCommentService = {
  /** List top-level comments for a decision (paginated). */
  list: async (
    decisionId: string,
    skip = 0,
    limit = 20,
  ): Promise<DecisionCommentListResponse> => {
    const response = await api.get(`/decisions/${decisionId}/comments`, {
      params: { skip, limit },
    });
    return response.data;
  },

  /** Create a new comment. */
  create: async (
    decisionId: string,
    data: DecisionCommentCreatePayload,
  ): Promise<DecisionComment> => {
    const response = await api.post(`/decisions/${decisionId}/comments`, data);
    return response.data;
  },

  /** List all replies for a specific comment. */
  listReplies: async (
    decisionId: string,
    commentId: string,
    skip = 0,
    limit = 50,
  ): Promise<DecisionCommentListResponse> => {
    const response = await api.get(
      `/decisions/${decisionId}/comments/${commentId}/replies`,
      { params: { skip, limit } },
    );
    return response.data;
  },

  /** Toggle like on a comment. */
  toggleLike: async (
    decisionId: string,
    commentId: string,
  ): Promise<DecisionCommentLikeToggle> => {
    const response = await api.post(
      `/decisions/${decisionId}/comments/${commentId}/like`,
    );
    return response.data;
  },

  /** Edit a comment (author only). */
  update: async (
    decisionId: string,
    commentId: string,
    data: DecisionCommentUpdatePayload,
  ): Promise<DecisionComment> => {
    const response = await api.patch(
      `/decisions/${decisionId}/comments/${commentId}`,
      data,
    );
    return response.data;
  },

  /** Soft-delete a comment. */
  delete: async (decisionId: string, commentId: string): Promise<void> => {
    await api.delete(`/decisions/${decisionId}/comments/${commentId}`);
  },

  /** Get users who can be @mentioned (have access to the decision). */
  getMentionable: async (
    decisionId: string,
    query = '',
  ): Promise<DecisionCommentMentionResult[]> => {
    const response = await api.get(
      `/decisions/${decisionId}/comments/mentionable`,
    );
    const users: DecisionCommentMentionResult[] = response.data;
    if (!query) return users;
    return users.filter((u) =>
      u.full_name.toLowerCase().includes(query.toLowerCase()),
    );
  },
};
