import { useState } from "react";

// Visual config per notification type — keyed to the real backend
// NotificationType enum's serialized *value* (app/models/enums.py uses
// `str, enum.Enum`, so Pydantic serializes the lowercase value, e.g.
// "approval_request", not the uppercase member name). Falls back to a
// generic bell for anything unrecognized.
const TYPE_STYLES = {
  approval_request: { color: "var(--accent)", soft: "var(--accent-soft)", icon: "📝" },
  approval_decision: { color: "var(--success)", soft: "var(--success-soft)", icon: "✅" },
  decision_status_change: { color: "var(--accent)", soft: "var(--accent-soft)", icon: "📄" },
  escalation: { color: "var(--danger)", soft: "var(--danger-soft)", icon: "⚠️" },
  comment_mention: { color: "var(--warning)", soft: "var(--warning-soft)", icon: "💬" },
  system: { color: "var(--text-secondary)", soft: "var(--neutral-soft)", icon: "🔔" },
};

function getTypeStyle(type) {
  return TYPE_STYLES[type] || TYPE_STYLES.system;
}

function formatTimestamp(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Pure presentational component. All data/state comes from Dashboard,
// which owns notification state the same way it owns summary/users/
// decisions state — so this page and the sidebar badge always agree on
// what's read/unread.
export default function NotificationsPage({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToDecision,
}) {
  const [filter, setFilter] = useState("all"); // all | unread

  const handleClick = (item) => {
    if (!item.is_read) onMarkAsRead(item.id);
    if (onNavigateToDecision) onNavigateToDecision(item);
  };

  const visibleNotifications =
    filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <p className="panel-title" style={{ margin: 0 }}>
          All Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "3px",
            }}
          >
            {["all", "unread"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: filter === f ? "var(--accent-soft)" : "transparent",
                  color: filter === f ? "var(--accent)" : "var(--text-secondary)",
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              style={{
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "1px solid var(--accent)",
                background: "transparent",
                color: "var(--accent)",
                cursor: "pointer",
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {visibleNotifications.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", padding: "20px 0", textAlign: "center" }}>
          {filter === "unread" ? "You're all caught up — no unread notifications." : "No notifications yet."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {visibleNotifications.map((item) => {
            const style = getTypeStyle(item.type);
            return (
              <div
                key={item.id}
                onClick={() => handleClick(item)}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  border: `1px solid ${item.is_read ? "var(--border)" : style.color}`,
                  background: item.is_read ? "var(--surface)" : style.soft,
                  borderLeft: `4px solid ${item.is_read ? "var(--border)" : style.color}`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: "20px", lineHeight: 1 }}>{style.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <span
                      style={{
                        fontWeight: item.is_read ? 500 : 700,
                        fontSize: "14px",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.title}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {formatTimestamp(item.created_at)}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {item.message}
                  </p>
                </div>
                {!item.is_read && (
                  <span
                    title="Unread"
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: style.color,
                      marginTop: "6px",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
