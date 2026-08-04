import { useState, useEffect, useCallback } from "react";

/**
 * useDashboardData - Shared data fetching + loading/error state for dashboards.
 *
 * @param {Function} fetchFn   Async function receiving the token and returning
 *                             the dashboard payload (already unwrapped).
 * @param {string}   token     JWT for authenticated API calls.
 * @param {string}   errorLabel  Short label used only for the console.error prefix.
 *
 * Returns:
 *   { data, loading, error, fetchDashboard }
 *     - data          response object or null
 *     - loading       true while a request is in flight
 *     - error         error message string or ""
 *     - fetchDashboard  () => Promise<void>; safe to call again (retry / refresh)
 */
export default function useDashboardData(fetchFn, token, errorLabel = "dashboard") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchFn(token);
      setData(res);
    } catch (err) {
      console.error(`Failed to load ${errorLabel} dashboard:`, err);
      setError("Failed to load dashboard. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchFn, token, errorLabel]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, fetchDashboard };
}
