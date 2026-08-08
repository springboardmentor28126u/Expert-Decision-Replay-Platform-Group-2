import axios from "axios";

// Falls back to the same 127.0.0.1:8000 origin every component used to
// hardcode. Set VITE_API_BASE_URL to point the built app at a different
// backend without touching any component.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Every existing call site builds its own `{ headers: { Authorization } }`
// object inline — this just gives them one place to get it from instead of
// retyping the shape each time. Endpoint paths/verbs are unchanged.
export function authHeaders(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export default apiClient;
