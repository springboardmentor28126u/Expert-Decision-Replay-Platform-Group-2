import { useState } from "react";
import { Tag, User, Clock, Paperclip } from "lucide-react";
import apiClient, { authHeaders } from "../api/client";
import { useConfirm } from "./ui/ConfirmContext";
import { useToast } from "./ui/ToastContext";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

const STATUS_TONE = {
  approved: "success",
  rejected: "danger",
  under_review: "warning",
};

function DecisionCard({ decision, role, token, onSelectDecision, onStatusChanged, onDeleted }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const confirm = useConfirm();
  const showToast = useToast();

  const canUpdateStatus = role === "manager" || role === "administrator";
  const isAdmin = role === "administrator";
  // "approved"/"rejected" are intentionally excluded — those transitions
  // belong to the Approval workflow (see ApprovalHistory), not this
  // free-form status selector.
  const allStatuses = ["draft", "under_review", "archived"];

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    setUpdating(true);
    setError("");
    try {
      await apiClient.patch(
        `/api/v1/decisions/${decision.id}/status`,
        { status: nextStatus },
        authHeaders(token)
      );
      onStatusChanged(decision.id, nextStatus);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm("Delete this decision permanently?", {
      title: "Delete decision",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/api/v1/decisions/${decision.id}`, authHeaders(token));
      onDeleted(decision.id);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to delete decision.", { tone: "error" });
    }
  };

  return (
    <div className="decision-card">
      <div className="decision-card-top">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="decision-card-title-row">
            <button
              type="button"
              className="decision-card-title"
              onClick={() => onSelectDecision(decision)}
            >
              {decision.title}
            </button>
            {decision.attachment_url && (
              <Paperclip size={13} strokeWidth={2} className="decision-card-attachment-icon" aria-label="Has attachment" />
            )}
          </div>
          <p className="decision-card-summary">
            {decision.problem_statement.length > 120
              ? decision.problem_statement.slice(0, 120) + "..."
              : decision.problem_statement}
          </p>
        </div>
        <Badge tone={STATUS_TONE[decision.status] || "neutral"}>
          {decision.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="decision-card-footer">
        <div className="decision-card-meta">
          <span className="decision-card-meta-item">
            <Tag size={12} strokeWidth={2} aria-hidden="true" />
            {decision.category || "Uncategorized"}
          </span>
          <span className="decision-card-meta-item">
            <User size={12} strokeWidth={2} aria-hidden="true" />
            {decision.created_by?.full_name || "Unknown"}
          </span>
          <span className="decision-card-meta-item">
            <Clock size={12} strokeWidth={2} aria-hidden="true" />
            {new Date(decision.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {(canUpdateStatus || isAdmin) && (
          <div className="decision-card-actions">
            {canUpdateStatus && (
              <select
                className="status-select decision-card-status-select"
                value={decision.status}
                disabled={updating}
                onChange={handleStatusChange}
                aria-label="Update decision status"
              >
                {allStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            )}
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px" }}>{error}</p>
      )}
    </div>
  );
}

export default DecisionCard;
