import { useState, useEffect } from "react";
import axios from "axios";

function ApprovalHistory({ token, decisionId, profile, onApprovalChanged, decisionStatus, decisionCreatedBy, assignedReviewerId }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Calculate stage (0 approved approvals = Stage 1)
  const approvedCount = approvals.filter((a) => a.action === "approved").length;
  const isStage1 = approvedCount === 0;

  // Stage 1 assignment guard:
  // If it's Stage 1, a Reviewer can ONLY review if they are the assigned reviewer (or if no reviewer was assigned)
  const isAssignedReviewer = !assignedReviewerId || profile.id === assignedReviewerId;
  const isAllowedAtStage1 = profile.role === "manager" || profile.role === "admin" || (profile.role === "reviewer" && isAssignedReviewer);

  // Stage 2 guard: Only Manager or Admin
  const isAllowedAtStage2 = profile.role === "manager" || profile.role === "admin";

  const canReview = isStage1 ? isAllowedAtStage1 : isAllowedAtStage2;
  const canResubmit = decisionStatus === "rejected" && (profile.id === decisionCreatedBy || profile.role === "admin");

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

  const handleResubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await axios.post(
        `http://127.0.0.1:8000/decisions/${decisionId}/resubmit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchApprovals();
      if (onApprovalChanged) onApprovalChanged();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to resubmit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading approval history...</p>;

  return (
    <div>
      {canResubmit && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "8px" }}>
            This decision was rejected. Please address the feedback below, edit the decision, then resubmit.
          </p>
          {(() => {
            const lastRejection = [...approvals].reverse().find((a) => a.action === "rejected");
            return lastRejection?.comment ? (
             <div style={{ background: "var(--danger-soft)", borderLeft: "3px solid var(--danger)", padding: "8px 12px", borderRadius: "6px", marginBottom: "10px" }}>
               <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 4px" }}>Rejection reason:</p>
               <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0 }}>{lastRejection.comment}</p>
             </div>
            ) : null;
          })()}
          <button
            onClick={handleResubmit}
            disabled={submitting}
            style={{ background: "var(--accent)", color: "#0A1410", border: "none", padding: "7px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
          >
            ↻ Resubmit for Review
          </button>
          {error && <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px" }}>{error}</p>}
        </div>
      )}
      
      {/* Show info message if a different reviewer is assigned */}
      {!canReview && profile.role === "reviewer" && isStage1 && assignedReviewerId && (
        <div style={{ background: "rgba(245, 166, 35, 0.1)", border: "1px solid var(--warning)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "var(--warning)", fontSize: "13px" }}>
          ⚠️ This decision is assigned to another Reviewer for initial approval.
        </div>
      )}
      
      {canReview && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
            Review this decision
          </p>
          <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "10px" }}>
            {approvals.filter(a => a.action === "approved").length === 0
              ? "Stage 1 of 2 — initial review (Reviewer, Manager, or Admin)"
              : "Stage 2 of 2 — final approval (Manager or Admin only)"}
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
                  {a.action} by {a.reviewer_name || "Unknown"}
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