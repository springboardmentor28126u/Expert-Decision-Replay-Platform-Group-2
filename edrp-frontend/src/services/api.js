import axios from "axios";

// Backend Base URL
const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Automatically add JWT Token in every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;