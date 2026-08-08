// Shared Recharts tooltip content, styled to match the app's dark panels.
// Value leads (bold, high contrast) with the series/category name secondary,
// per the dataviz skill's tooltip hierarchy — the reader already has the
// series from the axis/legend and is hovering for the number.
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
      }}
    >
      {label != null && (
        <p style={{ margin: "0 0 6px", color: "var(--text-secondary)", fontWeight: 700 }}>{label}</p>
      )}
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: i === 0 ? 0 : "4px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: entry.color || entry.payload?.fill,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{entry.value}</span>
          {entry.name && <span style={{ color: "var(--text-secondary)" }}>{entry.name}</span>}
        </p>
      ))}
    </div>
  );
}

export default ChartTooltip;
