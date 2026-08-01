import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

/**
 * Single source of truth for a user's notifications.
 * Polls the backend and exposes helpers to mark items read.
 * Shared by the sidebar badge, the header bell, and the full Notifications page
 * so they never fall out of sync with each other.
 */
export default function useNotifications(token) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // poll every 20s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      try {
        await axios.patch(
          `${API_BASE}/notifications/${id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
        fetchNotifications(); // resync on failure
      }
    },
    [token, fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await axios.patch(
        `${API_BASE}/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      fetchNotifications(); // resync on failure
    }
  }, [token, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}