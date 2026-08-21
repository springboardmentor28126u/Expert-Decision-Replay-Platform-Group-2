import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === 'true';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

let accessToken: string | null = null;
let companyId: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const setCompanyId = (id: string | null) => {
  companyId = id;
};

export const getCompanyId = (): string | null => companyId;

let defaultGroupId: string | null = null;

export const setDefaultGroupId = (id: string | null) => {
  defaultGroupId = id;
};

export const getDefaultGroupId = (): string | null => defaultGroupId;

// --- Auth failure callback (set by AuthContext) ---
let onAuthFailure: (() => void) | null = null;

export const setOnAuthFailure = (callback: (() => void) | null) => {
  onAuthFailure = callback;
};

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    if (SKIP_AUTH) {
      return config;
    }
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    if (companyId) {
      config.headers['X-Company-ID'] = companyId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (SKIP_AUTH) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // If the error status is 401 and there is no originalRequest._retry flag,
    // it means the token has expired and we need to refresh it
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        const { access_token } = response.data;
        setAccessToken(access_token);

        // Change Authorization header
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        // return originalRequest object with Axios.
        return api(originalRequest);
      } catch {
        // If refresh fails, clear auth state via React callback
        setAccessToken(null);
        if (onAuthFailure) {
          onAuthFailure();
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
