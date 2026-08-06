import { useState } from "react";
import axios from "axios";

function DecisionCard({ decision, role, token, onSelectDecision, onStatusChanged, onDeleted }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const canUpdateStatus = role === "manager" || role === "admin";
  const isAdmin = role === "admin";
  const allStatuses = ["draft", "under_review", "archived"];

  const statusStyle = (status) => {
    if (status === "approved") return { bg: "var(--success-soft)", color: "var(--success)" };
    if (status === "rejected") return { bg: "var(--danger-soft)", color: "var(--danger)" };
    if (status === "under_review") return { bg: "var(--warning-soft)", color: "var(--warning)" };
    return { bg: "var(--neutral-soft)", color: "var(--text-secondary)" };
  };

  const style = statusStyle(decision.status);

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    setUpdating(true);
    setError("");
    try {
      await axios.put(
        `http://127.0.0.1:8000/decisions/${decision.id}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onStatusChanged(decision.id, nextStatus);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this decision permanently?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/decisions/${decision.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDeleted(decision.id);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to delete decision.");
    }
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "200px",
        boxSizing: "border-box",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      className="decision-card-item"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <span
            onClick={() => onSelectDecision(decision)}
            style={{
              color: "var(--accent)",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              lineHeight: "1.3",
            }}
          >
            {decision.title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                background: style.bg,
                color: style.color,
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
              }}
            >
              {decision.status.replace("_", " ")}
            </span>
            {decision.attachment_url && (
              <span
                title="Has attachment"
                style={{ fontSize: "12px" }}
              >
                📎
              </span>
            )}
          </div>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0, lineHeight: "1.4" }}>
          {decision.problem_statement.length > 90
            ? decision.problem_statement.slice(0, 90) + "..."
            : decision.problem_statement}
        </p>
      </div>

      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: "600", color: "var(--text-secondary)" }}>{decision.category || "Uncategorized"}</span>
            <span>By {decision.creator_name ? decision.creator_name.split(" ")[0] : "Unknown"}</span>
          </div>
          <span>{new Date(decision.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "center" }}>
          {canUpdateStatus && (
            <select
              value={decision.status}
              disabled={updating}
              onChange={handleStatusChange}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "6px",
                fontSize: "11px",
                padding: "4px 6px",
                cursor: "pointer",
              }}
            >
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          )}
          {isAdmin && (
            <button
              onClick={handleDelete}
              style={{
                background: "none",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                borderRadius: "6px",
                fontSize: "11px",
                padding: "4px 8px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "11px", marginTop: "6px", margin: 0 }}>{error}</p>
      )}
    </div>
  );
}

export default DecisionCard;