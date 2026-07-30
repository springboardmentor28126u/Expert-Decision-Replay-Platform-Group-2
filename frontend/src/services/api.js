import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Automatically attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =========================
// Authentication
// =========================

export const registerUser = (data) =>
  API.post("/auth/register", data);

export const loginUser = (data) =>
  API.post("/auth/login", data);

// =========================
// Decision Management
// =========================

export const getDecisions = () =>
  API.get("/decisions/");

export const getDecision = (id) =>
  API.get(`/decisions/${id}`);

export const createDecision = (data) =>
  API.post("/decisions/", data);

export const updateDecision = (id, data) =>
  API.put(`/decisions/${id}`, data);

export const deleteDecision = (id) =>
  API.delete(`/decisions/${id}`);

// =========================
// Alternatives
// =========================

export const getAlternatives = (decisionId) =>
  API.get(`/alternatives/${decisionId}`);

export const createAlternative = (data) =>
  API.post("/alternatives/", data);

export const updateAlternative = (id, data) =>
  API.put(`/alternatives/${id}`, data);

export const deleteAlternative = (id) =>
  API.delete(`/alternatives/${id}`);

export const uploadFile = (decisionId, formData) =>
  API.post(`/files/upload/${decisionId}`, formData);

export const getFiles = (decisionId) =>
  API.get(`/files/${decisionId}`);

export const deleteFile = (id) =>
  API.delete(`/files/${id}`);

// =========================
// Export API
// =========================

export default API;