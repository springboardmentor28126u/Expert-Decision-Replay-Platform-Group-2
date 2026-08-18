import axios from "axios";

const client = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log("TOKEN =", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("AUTH HEADER ADDED");
    } else {
      console.log("NO TOKEN");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("401 Unauthorized - clearing token and notifying AuthContext");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default client;