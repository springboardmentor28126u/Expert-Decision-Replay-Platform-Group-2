import axios from "axios";

// Create Axios instance
const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Automatically attach JWT token to every request
API.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

export default API;