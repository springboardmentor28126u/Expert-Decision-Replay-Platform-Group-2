import client from "./client";

export interface AISummaryResponse {
  decision_id: number;
  summary: string;
}

export const aiApi = {
  generateDecisionSummary: async (
    decisionId: number
  ): Promise<AISummaryResponse> => {
    const response = await client.post<AISummaryResponse>(
      `/api/ai/decision/${decisionId}/summary`
    );

    return response.data;
  },
};