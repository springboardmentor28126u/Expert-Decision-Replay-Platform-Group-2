// A single executive-dashboard KPI tile. Reuses the existing .stat-card
// class (same look as the current status stat cards) so the new KPI row
// reads as one family with the rest of the shell rather than a bolted-on
// widget kit.
function KpiCard({ label, value, icon: Icon, accent, loading, onClick }) {
  const clickable = typeof onClick === "function";
  const tint = accent || "var(--accent)";

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
      <div className="stat-card-top">
        {Icon && (
          <span className="stat-card-icon-chip" style={{ color: tint, background: `color-mix(in srgb, ${tint} 16%, transparent)` }} aria-hidden="true">
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
        <p className="stat-card-label">{label}</p>
      </div>
      {loading ? (
        <div className="kpi-skeleton" />
      ) : (
        <p className="stat-card-value">{value}</p>
      )}
    </div>
  );
}

export default KpiCard;
