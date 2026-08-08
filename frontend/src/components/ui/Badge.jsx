// Small pill used for statuses/roles (e.g. decision status, approval
// status, user role). `tone` picks the color pairing from the shared
// tokens; anything not listed falls back to neutral.
const TONE_CLASS = {
  accent: "ui-badge-accent",
  success: "ui-badge-success",
  warning: "ui-badge-warning",
  danger: "ui-badge-danger",
  reviewer: "ui-badge-reviewer",
  neutral: "ui-badge-neutral",
};

function Badge({ tone = "neutral", children, className = "", ...rest }) {
  const toneClass = TONE_CLASS[tone] || TONE_CLASS.neutral;
  return (
    <span className={`ui-badge ${toneClass} ${className}`} {...rest}>
      {children}
    </span>
  );
}

export default Badge;
