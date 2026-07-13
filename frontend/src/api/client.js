import axios from "axios";

export const API_BASE_URL = "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------
// In-memory token store.
//
// Deliberately NOT persisted to localStorage, sessionStorage, or cookies:
// both the access token and refresh token live only in memory for the
// lifetime of the page. A full page reload clears them and requires the
// user to log in again. This is a project security requirement, not an
// oversight.
// ---------------------------------------------------------------------
let accessToken = null;
let refreshToken = null;

export function setTokens(tokens = {}) {
  const { access_token, refresh_token } = tokens;
  if (typeof access_token !== "undefined") {
    accessToken = access_token;
  }
  if (typeof refresh_token !== "undefined") {
    refreshToken = refresh_token;
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function hasSession() {
  return Boolean(accessToken);
}

// A plain axios instance, isolated from the interceptors below, used only
// for the refresh call itself. This guarantees a failed refresh can never
// re-enter the response interceptor's own refresh logic and recurse.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

// The shared API client used by every feature module (auth, users, and
// anything added in later milestones).
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ---------------------------------------------------------------------
// Concurrent-refresh handling.
//
// If several requests fail with 401 at the same moment, only the first
// one should trigger a network call to /auth/refresh. Every other
// failing request waits on that same in-flight refresh and then retries
// once with the new access token.
// ---------------------------------------------------------------------
let isRefreshing = false;
let refreshWaiters = [];

function waitForRefresh() {
  return new Promise((resolve, reject) => {
    refreshWaiters.push({ resolve, reject });
  });
}

function settleWaiters(error, newAccessToken) {
  refreshWaiters.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newAccessToken);
    }
  });
  refreshWaiters = [];
}

function announceSessionExpired() {
  clearTokens();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isUnauthorized = response && response.status === 401;
    const isAuthEndpoint =
      Boolean(config?.url) &&
      (config.url.includes("/auth/login") ||
        config.url.includes("/auth/register") ||
        config.url.includes("/auth/refresh"));

    if (!isUnauthorized || isAuthEndpoint || !config || config._retry) {
      return Promise.reject(error);
    }

    if (!refreshToken) {
      announceSessionExpired();
      return Promise.reject(error);
    }

    config._retry = true;

    if (isRefreshing) {
      try {
        const newAccessToken = await waitForRefresh();
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(config);
      } catch (queueError) {
        return Promise.reject(queueError);
      }
    }

    isRefreshing = true;

    try {
      const { data } = await refreshClient.post("/auth/refresh", {
        refresh_token: refreshToken
      });

      setTokens(data);
      settleWaiters(null, data.access_token);

      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(config);
    } catch (refreshError) {
      settleWaiters(refreshError, null);
      announceSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
