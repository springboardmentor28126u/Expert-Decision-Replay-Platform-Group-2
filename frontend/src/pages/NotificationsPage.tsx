import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi, NotificationItem } from "../api/notifications";

const formatFullDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsApi.getNotifications(unreadOnly, 100);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Notifications fetch error details:", err?.response?.data || err?.message || err);
      setError(
        err?.response?.data?.detail ||
          "Failed to load notifications. Please check server connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      notificationsApi.markAsRead(item.id).catch(console.error);
    }
    if (item.link_url) {
      navigate(item.link_url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Notifications Center</h1>
          <p className="text-sm text-text-secondary mt-1">
            Stay informed about your decision approval requests, discussions, and status changes.
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text hover:bg-surface-hover transition-all"
        >
          Mark all as read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            !unreadOnly
              ? "text-primary-light border-b-2 border-primary"
              : "text-text-secondary hover:text-text"
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            unreadOnly
              ? "text-primary-light border-b-2 border-primary"
              : "text-text-secondary hover:text-text"
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-text-secondary text-sm">
          Loading notifications...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={loadNotifications}
            className="rounded bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30 transition-all shrink-0"
          >
            Retry
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-text-secondary">
          <svg className="mx-auto h-12 w-12 opacity-30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-base font-semibold text-text">No notifications found</p>
          <p className="text-xs text-text-secondary mt-1">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`flex items-start justify-between gap-4 rounded-xl border p-4 transition-all cursor-pointer hover:border-primary/40 hover:shadow-lg ${
                !item.is_read
                  ? "bg-surface border-primary/30 shadow-sm"
                  : "bg-surface/50 border-border opacity-85"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {!item.is_read ? (
                    <span className="h-3 w-3 rounded-full bg-primary block" />
                  ) : (
                    <span className="h-3 w-3 rounded-full bg-border block" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">{item.title}</span>
                    <span className="rounded bg-surface-hover px-2 py-0.5 text-[10px] font-mono text-text-secondary uppercase">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.message}</p>
                  <p className="text-[11px] text-text-secondary/70">{formatFullDate(item.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!item.is_read && (
                  <button
                    onClick={(e) => handleMarkAsRead(item.id, e)}
                    className="text-xs font-medium text-text-secondary hover:text-text border border-border rounded px-2.5 py-1 hover:bg-surface-hover transition-all"
                  >
                    Mark read
                  </button>
                )}
                {item.link_url && (
                  <span className="text-xs font-medium text-primary-light hover:underline">
                    View →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
