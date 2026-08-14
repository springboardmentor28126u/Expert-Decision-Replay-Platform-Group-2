import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export default api;

export const runAIReview = (decisionId, token) =>
  api.post(`/decisions/${decisionId}/ai-review`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getAIReviews = (decisionId, token) =>
  api.get(`/decisions/${decisionId}/ai-review`, {
    headers: { Authorization: `Bearer ${token}` },
  });