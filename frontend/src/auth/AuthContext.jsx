import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import * as authApi from "../api/auth.js";
import * as usersApi from "../api/users.js";
import { clearTokens, hasSession } from "../api/client.js";

const AuthContext = createContext(undefined);

// idle: not yet resolved on this page load
// loading: an auth action (login) is in flight
// authenticated: a user is present and tokens are in memory
// unauthenticated: no valid session
const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated"
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError] = useState(null);

  // Tokens live only in memory (see api/client.js), so there is nothing
  // to rehydrate from storage on load. This effect simply resolves the
  // initial "idle" state to "unauthenticated" once on mount.
  useEffect(() => {
    setStatus(hasSession() ? STATUS.AUTHENTICATED : STATUS.UNAUTHENTICATED);
  }, []);

  // The API client dispatches this event when a 401 could not be
  // resolved by refreshing (refresh token missing, expired, or revoked).
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      setStatus(STATUS.UNAUTHENTICATED);
    }

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setStatus(STATUS.LOADING);
    setError(null);
    try {
      await authApi.login(credentials);
      const currentUser = await usersApi.getCurrentUser();
      setUser(currentUser);
      setStatus(STATUS.AUTHENTICATED);
      return currentUser;
    } catch (loginError) {
      clearTokens();
      setUser(null);
      setStatus(STATUS.UNAUTHENTICATED);
      setError(loginError);
      throw loginError;
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    try {
      return await authApi.register(payload);
    } catch (registerError) {
      setError(registerError);
      throw registerError;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus(STATUS.UNAUTHENTICATED);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const currentUser = await usersApi.getCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      isAuthenticated: status === STATUS.AUTHENTICATED,
      isLoading: status === STATUS.IDLE || status === STATUS.LOADING,
      login,
      register,
      logout,
      refreshCurrentUser,
      setUser
    }),
    [user, status, error, login, register, logout, refreshCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
