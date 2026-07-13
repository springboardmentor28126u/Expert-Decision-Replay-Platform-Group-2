import apiClient from "./client.js";

/**
 * Fetches the currently authenticated user's profile.
 */
export async function getCurrentUser() {
  const { data } = await apiClient.get("/users/me");
  return data;
}

/**
 * Partially updates the currently authenticated user's profile.
 * @param {Record<string, unknown>} payload
 */
export async function updateCurrentUser(payload) {
  const { data } = await apiClient.patch("/users/me", payload);
  return data;
}

/**
 * Changes the currently authenticated user's password.
 * @param {{ current_password: string, new_password: string }} payload
 */
export async function changePassword(payload) {
  const { data } = await apiClient.post("/users/me/password", payload);
  return data;
}
