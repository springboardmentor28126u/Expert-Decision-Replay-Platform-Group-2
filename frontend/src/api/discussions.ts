import client from './client';
import { Discussion, DiscussionCreate, DiscussionType } from '../types';

export const discussionsApi = {
  create: async (
    decisionId: number,
    data: DiscussionCreate
  ): Promise<Discussion> => {
    const response = await client.post<Discussion>(
      `/api/decisions/${decisionId}/discussions/`,
      data
    );
    return response.data;
  },

  list: async (
    decisionId: number,
    type?: DiscussionType
  ): Promise<Discussion[]> => {
    const response = await client.get<Discussion[]>(
      `/api/decisions/${decisionId}/discussions/`,
      { params: { type } }
    );
    return response.data;
  },

  update: async (
    decisionId: number,
    discussionId: number,
    comment: string
  ): Promise<Discussion> => {
    const response = await client.put<Discussion>(
      `/api/decisions/${decisionId}/discussions/${discussionId}`,
      { comment }
    );
    return response.data;
  },

  delete: async (decisionId: number, discussionId: number): Promise<void> => {
    await client.delete(`/api/decisions/${decisionId}/discussions/${discussionId}`);
  },
};
