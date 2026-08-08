import { Bell, MailOpen, Inbox } from "lucide-react";
import KpiCard from "./KpiCard";

// Derived entirely from the `notifications` array the Dashboard already
// fetches for the bell icon/badge — no extra request for this card.
function NotificationsSummary({ notifications, loading }) {
  const total = notifications?.length ?? 0;
  const unread = notifications?.filter((n) => !n.is_read).length ?? 0;
  const read = total - unread;

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <p className="chart-card-title">Notifications Summary</p>
        <p className="chart-card-subtitle">Unread vs. read, across all notifications</p>
      </div>
      <div className="mini-stat-grid">
        <KpiCard label="Unread" value={unread} icon={Bell} accent="var(--warning)" loading={loading} />
        <KpiCard label="Read" value={read} icon={MailOpen} loading={loading} />
        <KpiCard label="Total" value={total} icon={Inbox} loading={loading} />
      </div>
    </div>
  );
}

export default NotificationsSummary;
