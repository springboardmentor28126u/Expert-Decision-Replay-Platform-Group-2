import client from "./client";

export const approvalsApi = {
  list: async (decisionId: number) => {
    const response = await client.get(`/api/approvals/${decisionId}`);
    return response.data;
  },
  my: async () => {
  const response = await client.get("/api/approvals/my");
  return response.data;
},

  assign: async (
    decisionId: number,
    reviewerId: number,
    comments = ""
  ) => {
    const response = await client.post("/api/approvals/", {
      decision_id: decisionId,
      reviewer_id: reviewerId,
      comments,
    });

    return response.data;
  },

  approve: async (id: number) => {
    const response = await client.patch(`/api/approvals/${id}/approve`);
    return response.data;
  },

  reject: async (id: number, comments = "") => {
  const response = await client.patch(`/api/approvals/${id}/reject`, {
    status: "Rejected",
    comments,
  });

  return response.data;
},
};