import axios from 'axios';

/**
 * Axios instance configured for the Expert Decision Replay Platform API.
 * This can be configured with environment variables in production.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token if exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle common global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clean local storage and optionally redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // For now, log the logout event. Router/auth context will handle redirects.
      console.warn('Unauthorized access detected. Session expired.');
    }
    return Promise.reject(error);
  }
);

export default api;
