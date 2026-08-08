import { FileText, ClipboardCheck, MessageSquare } from "lucide-react";
import { STATUS_COLORS, APPROVAL_COLORS } from "./chartTheme";

function timeAgo(isoString) {
  const then = new Date(isoString).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Merges three independently-fetched activity slices (decisions/approvals/
// comments) into a single chronological feed — this happens client-side
// from the one /dashboard/summary payload rather than three separate
// endpoint calls, so there's exactly one round trip for the whole feed.
function buildFeed(recentActivity) {
  if (!recentActivity) return [];

  const decisions = (recentActivity.decisions || []).map((d) => ({
    key: `decision-${d.id}`,
    timestamp: d.created_at,
    icon: FileText,
    accent: STATUS_COLORS[d.status] || "var(--text-secondary)",
    text: (
      <>
        <strong>{d.created_by_name}</strong> created decision <strong>{d.title}</strong>
      </>
    ),
  }));

  const approvals = (recentActivity.approvals || []).map((a) => ({
    key: `approval-${a.id}`,
    timestamp: a.updated_at,
    icon: ClipboardCheck,
    accent: APPROVAL_COLORS[a.status] || "var(--text-secondary)",
    text: (
      <>
        <strong>{a.reviewer_name}</strong> {a.status === "pending" ? "was assigned to review" : a.status} decision{" "}
        <strong>{a.decision_title}</strong> (level {a.level})
      </>
    ),
  }));

  const comments = (recentActivity.comments || []).map((c) => ({
    key: `comment-${c.id}`,
    timestamp: c.created_at,
    icon: MessageSquare,
    accent: "var(--accent)",
    text: (
      <>
        <strong>{c.author_name}</strong> commented on <strong>{c.decision_title}</strong>
        {c.excerpt && <span style={{ color: "var(--text-muted)" }}> — “{c.excerpt}”</span>}
      </>
    ),
  }));

  return [...decisions, ...approvals, ...comments]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8);
}

function RecentActivityFeed({ recentActivity, loading }) {
  const feed = buildFeed(recentActivity);
  const isEmpty = !loading && feed.length === 0;

  if (loading) {
    return (
      <div className="activity-feed">
        {[70, 55, 62].map((w, i) => (
          <div key={i} className="activity-row">
            <div className="activity-icon-chip chart-skeleton-bar" style={{ height: 28, width: 28, borderRadius: "var(--radius-sm)" }} />
            <div style={{ flex: 1 }}>
              <div className="chart-skeleton-bar" style={{ height: 12, width: `${w}%`, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="activity-feed-empty">
        <span aria-hidden="true">📭</span>
        <p>No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {feed.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="activity-row">
            <span className="activity-icon-chip" style={{ color: item.accent, background: `color-mix(in srgb, ${item.accent} 14%, transparent)` }}>
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="activity-row-body">
              <p className="activity-row-text">{item.text}</p>
              <p className="activity-row-time">{timeAgo(item.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RecentActivityFeed;
