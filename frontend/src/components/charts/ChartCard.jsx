// Reusable panel wrapper for a single chart: title, fixed-height plot area,
// and the loading/empty states every chart on the dashboard needs. Chart
// components render their Recharts tree as `children`; ChartCard decides
// whether that, a skeleton, or an empty-state message is what's on screen.
function ChartCard({ title, subtitle, loading, isEmpty, emptyMessage = "No data yet.", height = 260, children }) {
  return (
    <div className="panel" style={{ marginBottom: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        <p className="panel-title" style={{ margin: 0 }}>{title}</p>
        {subtitle && (
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>{subtitle}</p>
        )}
      </div>
      <div style={{ height: typeof height === "number" ? height : undefined, minHeight: typeof height === "number" ? undefined : 140, minWidth: 0 }}>
        {loading ? <ChartSkeleton /> : isEmpty ? <ChartEmptyState message={emptyMessage} /> : children}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  const bars = [45, 75, 60, 90, 55, 80, 65];
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "flex-end", gap: 10, padding: "0 4px 4px" }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="chart-skeleton-bar"
          style={{ flex: 1, height: `${h}%`, animationDelay: `${i * 0.07}s` }}
        />
      ))}
    </div>
  );
}

function ChartEmptyState({ message }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "var(--text-muted)",
      }}
    >
      <span style={{ fontSize: 26 }} aria-hidden="true">📊</span>
      <p style={{ fontSize: 13, margin: 0 }}>{message}</p>
    </div>
  );
}

export default ChartCard;
