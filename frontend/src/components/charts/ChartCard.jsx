import { BarChart3 } from "lucide-react";

// Reusable panel wrapper for a single chart: title, fixed-height plot area,
// and the loading/empty states every chart on the dashboard needs. Chart
// components render their Recharts tree as `children`; ChartCard decides
// whether that, a skeleton, or an empty-state message is what's on screen.
function ChartCard({ title, subtitle, loading, isEmpty, emptyMessage = "No data yet.", height = 236, children }) {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <p className="chart-card-title">{title}</p>
        {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
      </div>
      <div style={{ height: typeof height === "number" ? height : undefined, minHeight: typeof height === "number" ? undefined : 120, minWidth: 0 }}>
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
      <BarChart3 size={22} strokeWidth={1.75} aria-hidden="true" />
      <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>{message}</p>
    </div>
  );
}

export default ChartCard;
