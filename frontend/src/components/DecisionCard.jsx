import { useState } from "react";
import axios from "axios";

function DecisionCard({ decision, role, token, onSelectDecision, onStatusChanged, onDeleted }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const canUpdateStatus = role === "manager" || role === "administrator";
  const isAdmin = role === "administrator";
  const allStatuses = ["draft", "under_review", "approved", "rejected", "archived"];

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
      await axios.patch(
        `http://127.0.0.1:8000/api/v1/decisions/${decision.id}/status`,
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
      await axios.delete(`http://127.0.0.1:8000/api/v1/decisions/${decision.id}`, {
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
        padding: "18px 20px",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            onClick={() => onSelectDecision(decision)}
            style={{
              color: "var(--accent)",
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            {decision.title}
          </span>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "6px 0 0" }}>
            {decision.problem_statement.length > 120
              ? decision.problem_statement.slice(0, 120) + "..."
              : decision.problem_statement}
          </p>
        </div>
        <span
          style={{
            background: style.bg,
            color: style.color,
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "11px",
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
              style={{ fontSize: "13px", marginLeft: "6px" }}
            >
              📎
            </span>
          )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "14px",
          paddingTop: "14px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>{decision.category || "Uncategorized"}</span>
          <span>By {decision.created_by?.full_name || "Unknown"}</span>
          <span>{new Date(decision.created_at).toLocaleString()}</span>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                fontSize: "12px",
                padding: "5px 8px",
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
                fontSize: "12px",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px" }}>{error}</p>
      )}
    </div>
  );
}

export default DecisionCard;