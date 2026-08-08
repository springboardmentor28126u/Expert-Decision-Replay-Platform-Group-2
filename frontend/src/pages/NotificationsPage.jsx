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
      <div className="panel-toolbar">
        <p className="panel-title" style={{ margin: 0 }}>
          All Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
        </p>

        <div className="notif-toolbar-actions">
          <div className="notif-filter-group" role="group" aria-label="Filter notifications">
            {["all", "unread"].map((f) => (
              <button
                key={f}
                className={`notif-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >
                {f}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button className="notif-mark-all-btn" onClick={onMarkAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {visibleNotifications.length === 0 ? (
        <p className="notif-empty">
          {filter === "unread" ? "You're all caught up — no unread notifications." : "No notifications yet."}
        </p>
      ) : (
        <div className="notif-list">
          {visibleNotifications.map((item) => {
            const style = getTypeStyle(item.type);
            return (
              <button
                key={item.id}
                type="button"
                className={`notif-item ${item.is_read ? "" : "unread"}`}
                onClick={() => handleClick(item)}
                style={{ "--item-color": style.color, "--item-soft": style.soft }}
                aria-label={`${item.is_read ? "" : "Unread: "}${item.title}. ${item.message} ${formatTimestamp(item.created_at)}`}
              >
                <span className="notif-item-icon" aria-hidden="true">{style.icon}</span>
                <span className="notif-item-body">
                  <span className="notif-item-top">
                    <span className={`notif-item-title ${item.is_read ? "" : "unread"}`}>
                      {item.title}
                    </span>
                    <span className="notif-item-time">{formatTimestamp(item.created_at)}</span>
                  </span>
                  <span className="notif-item-message">{item.message}</span>
                </span>
                {!item.is_read && (
                  <span className="notif-item-dot" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
