import KpiCard from "./KpiCard";

// Derived entirely from the `notifications` array the Dashboard already
// fetches for the bell icon/badge — no extra request for this card.
function NotificationsSummary({ notifications, loading }) {
  const total = notifications?.length ?? 0;
  const unread = notifications?.filter((n) => !n.is_read).length ?? 0;
  const read = total - unread;

  return (
    <div className="panel" style={{ marginBottom: 0 }}>
      <p className="panel-title">Notifications Summary</p>
      <div className="stat-grid" style={{ marginBottom: 0 }}>
        <KpiCard label="Unread" value={unread} icon="🔔" accent="var(--warning)" loading={loading} />
        <KpiCard label="Read" value={read} icon="📖" loading={loading} />
        <KpiCard label="Total" value={total} icon="📥" loading={loading} />
      </div>
    </div>
  );
}

export default NotificationsSummary;
