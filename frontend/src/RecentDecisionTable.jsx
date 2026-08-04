/**
 * RecentDecisionTable - Reusable recent decisions table.
 *
 * Props:
 *   decisions        (array)  List of decision objects: { id, title, status, created_at, ... }
 *   loading          (bool)   When true, renders shimmer skeleton rows instead of content.
 *   onSelectDecision (func)   Optional callback(decision) fired when a title is clicked.
 *                             When provided, titles render as clickable links.
 *
 * Styling is self-contained to match the existing dark theme table design
 * (.dash-table: #1E2430 card, #2E3646 borders, 12px uppercase headers,
 *  13px body text, row hover rgba(255,255,255,0.02), rounded 10px).
 */
export default function RecentDecisionTable({
  decisions = [],
  loading = false,
  onSelectDecision = null,
}) {
  const STATUS_COLORS = {
    approved: "#4FD1B5",      // green
    under_review: "#F2A623",  // orange
    draft: "#60A5FA",         // blue
    rejected: "#FF6B6B",      // red
    archived: "#9AA5B5",      // gray
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#1E2430",
    borderRadius: "10px",
    overflow: "hidden",
    fontSize: "13px",
    color: "#F1F3F6",
  };

  const thStyle = {
    textAlign: "left",
    fontSize: "12px",
    color: "#9AA5B5",
    padding: "12px 16px",
    borderBottom: "1px solid #2E3646",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    fontWeight: "600",
  };

  const tdStyle = {
    padding: "12px 16px",
    borderBottom: "1px solid #2E3646",
    fontSize: "13px",
  };

  const rowHoverStyle = {
    background: "rgba(255, 255, 255, 0.02)",
  };

  const linkStyle = {
    color: "#4FD1B5",
    cursor: "pointer",
    fontWeight: "600",
    textDecoration: "none",
    fontSize: "13px",
  };

  const badgeStyle = (status) => {
    const color = STATUS_COLORS[status] || "#9AA5B5";
    return {
      display: "inline-block",
      background: `${color}1F`,
      color,
      padding: "3px 10px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "600",
      textTransform: "capitalize",
    };
  };

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Skeleton block for loading state
  const skeletonBlock = {
    background: "#2E3646",
    borderRadius: "4px",
    height: "14px",
    width: "70%",
    display: "inline-block",
  };

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        borderRadius: "10px",
        border: "1px solid #2E3646",
        background: "#1E2430",
      }}
    >
      <table style={{ ...tableStyle, border: "none" }}>
        <thead>
          <tr>
            <th style={thStyle}>Title</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Created Date</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                <td style={tdStyle}>
                  <span className="recent-table-skeleton" style={skeletonBlock} />
                </td>
                <td style={tdStyle}>
                  <span
                    className="recent-table-skeleton"
                    style={{ ...skeletonBlock, width: "50%", borderRadius: "12px" }}
                  />
                </td>
                <td style={tdStyle}>
                  <span
                    className="recent-table-skeleton"
                    style={{ ...skeletonBlock, width: "45%" }}
                  />
                </td>
              </tr>
            ))
          ) : decisions.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                style={{
                  ...tdStyle,
                  textAlign: "center",
                  color: "#9AA5B5",
                  padding: "32px 16px",
                  fontSize: "13px",
                  borderBottom: "none",
                }}
              >
                No recent decisions found.
              </td>
            </tr>
          ) : (
            decisions.map((decision, index) => {
              const isLastRow = index === decisions.length - 1;
              const cellStyle = isLastRow ? { ...tdStyle, borderBottom: "none" } : tdStyle;
              return (
                <tr
                  key={decision.id ?? decision.title ?? `decision-${index}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = rowHoverStyle.background;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td style={cellStyle}>
                    {onSelectDecision ? (
                      <a
                        href="#"
                        style={linkStyle}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectDecision(decision);
                        }}
                      >
                        {decision.title || "Untitled Decision"}
                      </a>
                    ) : (
                      decision.title || "Untitled Decision"
                    )}
                  </td>
                  <td style={cellStyle}>
                    <span style={badgeStyle(decision.status)}>
                      {(decision.status || "unknown").replace("_", " ")}
                    </span>
                  </td>
                  <td style={cellStyle}>{formatDate(decision.created_at)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Shimmer animation for skeleton rows */}
      {loading && (
        <style>{`
          @keyframes recent-table-shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: 200px 0; }
          }
          .recent-table-skeleton {
            background: linear-gradient(90deg, #2E3646 25%, #3b4557 50%, #2E3646 75%) !important;
            background-size: 200px 100% !important;
            animation: recent-table-shimmer 1.2s infinite linear;
          }
        `}</style>
      )}
    </div>
  );
}
