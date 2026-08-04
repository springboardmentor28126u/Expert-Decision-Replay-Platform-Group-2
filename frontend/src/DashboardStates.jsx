/**
 * DashboardSpinner - Shared full-page loading spinner for dashboard pages.
 * Matches the original per-dashboard spinner exactly (36px ring,
 * #2E3646 track, #4FD1B5 top, 0.8s spin, "Loading dashboard..." caption).
 */
export function DashboardSpinner() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#9AA5B5" }}>
      <div className="load-dash-spinner" />
      <p style={{ fontSize: 14, margin: 0 }}>Loading dashboard...</p>
      <style>{`
        @keyframes load-dash-spin {
          to { transform: rotate(360deg); }
        }
        .load-dash-spinner {
          width: 36px;
          height: 36px;
          margin: 0 auto 12px;
          border: 3px solid #2E3646;
          border-top-color: #4FD1B5;
          border-radius: 50%;
          animation: load-dash-spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * DashboardError - Shared error panel + Retry button for dashboard pages.
 * Matches the original per-dashboard error panel exactly.
 *
 * Props:
 *   message  (string)  Error message to display.
 *   onRetry  (func)    Called when the Retry button is clicked.
 */
export function DashboardError({ message, onRetry }) {
  return (
    <div
      style={{
        background: "rgba(255, 107, 107, 0.08)",
        border: "1px solid rgba(255, 107, 107, 0.4)",
        borderRadius: "10px",
        padding: "32px 24px",
        textAlign: "center",
        color: "#FF6B6B",
      }}
    >
      <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚠️</div>
      <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          background: "#FF6B6B",
          color: "#0D1117",
          border: "none",
          padding: "8px 20px",
          borderRadius: "6px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}
