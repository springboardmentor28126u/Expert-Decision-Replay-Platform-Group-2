import React, { useState, useEffect } from "react";

export default function NotificationsPage({ token, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Notifications from API
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch("/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();

      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.notifications)) {
        list = data.notifications;
      } else if (data && Array.isArray(data.items)) {
        list = data.items;
      }

      setNotifications(list);

      // Notify parent/shell about updated unread count
      const unread = list.filter((n) => !n.is_read).length;
      if (onUnreadCountChange) onUnreadCountChange(unread);
    } catch (err) {
      console.error("Notifications fetch error:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );

      // Update badge count
      setNotifications((updatedList) => {
        const unread = updatedList.filter((n) => !n.is_read).length;
        if (onUnreadCountChange) onUnreadCountChange(unread);
        return updatedList;
      });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", color: "#9CA3AF" }}>
        Loading notifications...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#FFFFFF", fontSize: "1.5rem", fontWeight: "600", margin: 0 }}>
          Notifications
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {!Array.isArray(notifications) || notifications.length === 0 ? (
          <div
            style={{
              padding: "24px",
              backgroundColor: "#161F28",
              borderRadius: "12px",
              color: "#9CA3AF",
              textAlign: "center",
              border: "1px solid #1F2937",
            }}
          >
            No notifications found.
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.is_read;

            return (
              <div
                key={item.id}
                onClick={() => isUnread && handleMarkAsRead(item.id)}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: isUnread ? "pointer" : "default",
                  transition: "all 0.2s ease-in-out",
                  // COLOR INDICATORS FOR UNREAD VS READ
                  backgroundColor: isUnread ? "#1E2E2E" : "#161F28", // Highlighted Dark Teal vs Standard Dark
                  border: isUnread ? "1px solid rgba(66, 211, 146, 0.4)" : "1px solid #1F2937",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Status Indicator Dot */}
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: isUnread ? "#42D392" : "#4B5563", // Green for New, Gray for Read
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        color: isUnread ? "#FFFFFF" : "#9CA3AF",
                        fontWeight: isUnread ? "600" : "400",
                      }}
                    >
                      {item.message || item.content || "Notification details"}
                    </p>
                    {item.created_at && (
                      <span style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "4px", display: "block" }}>
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge Label */}
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    backgroundColor: isUnread ? "rgba(66, 211, 146, 0.15)" : "#1F2937",
                    color: isUnread ? "#42D392" : "#6B7280",
                    border: isUnread ? "1px solid rgba(66, 211, 146, 0.3)" : "none",
                  }}
                >
                  {isUnread ? "NEW" : "READ"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}