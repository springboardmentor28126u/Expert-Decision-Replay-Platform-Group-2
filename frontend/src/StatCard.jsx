/**
 * StatCard - Reusable dashboard statistic card.
 *
 * Props:
 *   title   (string)  Label displayed underneath the value.
 *   value   (number)  Large numeric value to display.
 *   icon    (node)    Optional icon element (e.g. emoji / SVG).
 *   color   (string)  Accent color for the icon & value. Defaults to #4FD1B5.
 *   loading (bool)    When true, renders a shimmer skeleton instead of content.
 *
 * Styling is self-contained to match the existing dark theme
 * (#1E2430 cards, #2E3646 borders, #4FD1B5 accent, Segoe UI font).
 */
export default function StatCard({
  title = "",
  value = 0,
  icon = null,
  color = "#4FD1B5",
  loading = false,
}) {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : String(value ?? "");

  const cardStyle = {
    background: "#1E2430",
    border: `1px solid #2E3646`,
    borderRadius: "10px",
    padding: "20px",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
  };

  const iconStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background: `${color}1F`,
    color,
    fontSize: "20px",
    flexShrink: 0,
  };

  const valueStyle = {
    fontSize: "32px",
    fontWeight: "700",
    color: "#F1F3F6",
    lineHeight: 1,
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  };

  const titleStyle = {
    fontSize: "13px",
    color: "#9AA5B5",
    margin: 0,
    fontWeight: "500",
  };

  // Skeleton placeholder look-and-feel (mimics icon + value + title layout)
  const skeletonIcon = {
    ...iconStyle,
    background: "#2E3646",
    color: "transparent",
  };
  const skeletonValue = {
    ...valueStyle,
    background: "#2E3646",
    color: "transparent",
    height: "34px",
    width: "70px",
    borderRadius: "6px",
  };
  const skeletonTitle = {
    ...titleStyle,
    background: "#2E3646",
    color: "transparent",
    height: "14px",
    width: "110px",
    borderRadius: "4px",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        if (loading) return;
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.35)";
      }}
      onMouseLeave={(e) => {
        if (loading) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#2E3646";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {loading ? (
        <>
          {/* Shimmer animation injected once via a style tag */}
          <style>{`
            @keyframes statcard-shimmer {
              0% { background-position: -200px 0; }
              100% { background-position: 200px 0; }
            }
            .statcard-skeleton {
              background: linear-gradient(90deg, #2E3646 25%, #3b4557 50%, #2E3646 75%);
              background-size: 200px 100%;
              animation: statcard-shimmer 1.2s infinite linear;
            }
          `}</style>
          <div className="statcard-skeleton" style={skeletonIcon} />
          <div className="statcard-skeleton" style={skeletonValue} />
          <div className="statcard-skeleton" style={skeletonTitle} />
        </>
      ) : (
        <>
          {icon != null && <div style={iconStyle}>{icon}</div>}
          <p style={valueStyle}>{formattedValue}</p>
          <p style={titleStyle}>{title}</p>
        </>
      )}
    </div>
  );
}
