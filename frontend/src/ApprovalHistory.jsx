import { useState, useEffect } from "react";
import axios from "axios";

function ApprovalHistory({ token, decisionId, profile, onApprovalChanged }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canReview = profile.role === "manager" || profile.role === "admin";

  const fetchApprovals = async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/decisions/${decisionId}/approvals`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApprovals(res.data);
    } catch (err) {
      console.log("Failed to load approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [decisionId, token]);

  const handleAction = async (action) => {
    setError("");
    setSubmitting(true);
    try {
      await axios.post(
        `http://127.0.0.1:8000/decisions/${decisionId}/${action}`,
        { comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment("");
      fetchApprovals();
      if (onApprovalChanged) onApprovalChanged();
    } catch (err) {
      setError(err?.response?.data?.detail || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading approval history...</p>;

  return (
    <div>
      {canReview && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            Review this decision
          </p>
          <textarea
            placeholder="Add a comment (required for rejection)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            style={{
              width: "100%", padding: "8px 10px", background: "var(--bg)",
              border: "1px solid var(--border)", borderRadius: "6px",
              color: "var(--text-primary)", fontSize: "13px", marginBottom: "10px", resize: "vertical",
            }}
          />
          {error && <p style={{ color: "var(--danger)", fontSize: "12px", marginBottom: "8px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => handleAction("approve")}
              disabled={submitting}
              style={{ background: "var(--success)", color: "#0A1410", border: "none", padding: "7px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={submitting}
              style={{ background: "none", color: "var(--danger)", border: "1px solid var(--danger)", padding: "7px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              ✕ Reject
            </button>
          </div>
        </div>
      )}

      {approvals.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No approval actions yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {approvals.map((a) => (
            <div
              key={a.id}
              style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "12px 14px",
                borderLeft: `3px solid ${a.action === "approved" ? "var(--success)" : "var(--danger)"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: a.action === "approved" ? "var(--success)" : "var(--danger)", textTransform: "uppercase" }}>
                  {a.action}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
              {a.comment && <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0 }}>{a.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApprovalHistory;