// A single executive-dashboard KPI tile. Reuses the existing .stat-card
// class (same look as the current status stat cards) so the new KPI row
// reads as one family with the rest of the shell rather than a bolted-on
// widget kit.
function KpiCard({ label, value, icon, accent, loading, onClick }) {
  const clickable = typeof onClick === "function";

  return (
    <div
      className="stat-card"
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      style={{ cursor: clickable ? "pointer" : "default" }}
    >
      <p className="stat-card-label">
        {icon && <span aria-hidden="true" style={{ marginRight: 6 }}>{icon}</span>}
        {label}
      </p>
      {loading ? (
        <div className="kpi-skeleton" />
      ) : (
        <p className="stat-card-value" style={accent ? { color: accent } : undefined}>
          {value}
        </p>
      )}
    </div>
  );
}

export default KpiCard;
