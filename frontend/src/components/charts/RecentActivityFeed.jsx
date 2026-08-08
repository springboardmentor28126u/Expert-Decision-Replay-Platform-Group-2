import ChartCard from "./ChartCard";
import { STATUS_COLORS } from "./chartTheme";

const APPROVAL_STATUS_COLOR = {
  pending: "#c98500",
  approved: "#199e70",
  rejected: "#e66767",
  escalated: "#3987e5",
};

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
    icon: "📋",
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
    icon: "✅",
    accent: APPROVAL_STATUS_COLOR[a.status] || "var(--text-secondary)",
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
    icon: "💬",
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

  return (
    <ChartCard
      title="Recent Activity"
      subtitle="Latest decisions, approvals, and discussion"
      loading={loading}
      isEmpty={isEmpty}
      emptyMessage="No activity yet."
      height="auto"
    >
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {feed.map((item) => (
          <li
            key={item.key}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "10px 4px",
              borderLeft: `2px solid ${item.accent}`,
              paddingLeft: 12,
            }}
          >
            <span style={{ fontSize: 15, lineHeight: "20px" }} aria-hidden="true">{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5, overflowWrap: "anywhere" }}>
                {item.text}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{timeAgo(item.timestamp)}</p>
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export default RecentActivityFeed;
