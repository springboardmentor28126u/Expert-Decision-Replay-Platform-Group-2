import client from "./client";

export const reportsApi = {
  summary: async () => {
    const res = await client.get("/api/reports/summary");
    return res.data;
  },

  approvals: async () => {
    const res = await client.get("/api/reports/approvals");
    return res.data;
  },

  teams: async () => {
    const res = await client.get("/api/reports/teams");
    return res.data;
  },

  audit: async () => {
    const res = await client.get("/api/reports/audit");
    return res.data;
  },
};