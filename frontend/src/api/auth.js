import apiClient, { clearTokens, getRefreshToken, setTokens } from "./client.js";

/**
 * Creates a new user account.
 * @param {{ email: string, password: string, [key: string]: unknown }} payload
 */
export async function register(payload) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

/**
 * Logs a user in and stores the returned access/refresh tokens in memory.
 * @param {{ email: string, password: string }} credentials
 */
export async function login(credentials) {
  const form = new URLSearchParams();

  form.append("username", credentials.email);
  form.append("password", credentials.password);

  const { data } = await apiClient.post(
    "/auth/login",
    form,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  setTokens(data);

  return data;
}

/**
 * Exchanges the current refresh token for a new token pair.
 * Primarily used internally by the response interceptor in client.js,
 * but exposed here in case a caller needs to refresh explicitly.
 */
export async function refresh() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    throw new Error("No refresh token available.");
  }
  const { data } = await apiClient.post("/auth/refresh", { refresh_token });
  setTokens(data);
  return data;
}

/**
 * Logs the user out. Best-effort: the server-side session is revoked if
 * the request succeeds, but local tokens are cleared either way.
 */
export async function logout() {
  const refresh_token = getRefreshToken();
  try {
    if (refresh_token) {
      await apiClient.post("/auth/logout", { refresh_token });
    }
  } finally {
    clearTokens();
  }
}
