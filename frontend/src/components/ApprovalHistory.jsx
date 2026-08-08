import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  escalated: "neutral",
};

const STATUS_BORDER_VAR = {
  pending: "var(--warning)",
  approved: "var(--success)",
  rejected: "var(--danger)",
  escalated: "var(--text-secondary)",
};

function ApprovalHistory({ token, decisionId, profile }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewers, setReviewers] = useState([]);
  const [assignReviewerId, setAssignReviewerId] = useState("");
  const [assignLevel, setAssignLevel] = useState(1);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  const [decisionDrafts, setDecisionDrafts] = useState({}); // approvalId -> { status, comments }
  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const role = profile.role?.name;
  const isAdministrator = role === "administrator";
  const canAssignOrReset = role === "manager" || role === "administrator";

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await apiClient.get(
        `/api/v1/approvals/decision/${decisionId}`,
        authHeaders
      );
      setApprovals(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load approval history.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId, token]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  useEffect(() => {
    if (!canAssignOrReset) return;
    const fetchReviewers = async () => {
      try {
        const res = await apiClient.get(
          "/api/v1/users/?page=1&page_size=100",
          authHeaders
        );
        setReviewers(res.data.items || []);
      } catch (err) {
        console.log("Failed to load user list for reviewer assignment", err);
      }
    };
    fetchReviewers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAssignOrReset, token]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignReviewerId) {
      setAssignError("Select a reviewer.");
      return;
    }
    setAssigning(true);
    setAssignError("");
    try {
      await apiClient.post(
        `/api/v1/approvals/decision/${decisionId}`,
        { reviewer_id: assignReviewerId, level: Number(assignLevel) },
        authHeaders
      );
      setAssignReviewerId("");
      setAssignLevel(1);
      fetchApprovals();
    } catch (err) {
      setAssignError(err?.response?.data?.detail || "Failed to assign reviewer.");
    } finally {
      setAssigning(false);
    }
  };

  const draftFor = (approvalId) => decisionDrafts[approvalId] || { comments: "" };

  const updateDraft = (approvalId, patch) => {
    setDecisionDrafts((prev) => ({
      ...prev,
      [approvalId]: { ...draftFor(approvalId), ...patch },
    }));
  };

  const handleReview = async (approval, status) => {
    const comments = draftFor(approval.id).comments || null;
    setActingId(approval.id);
    setActionError("");
    try {
      await apiClient.patch(
        `/api/v1/approvals/${approval.id}`,
        { status, comments },
        authHeaders
      );
      fetchApprovals();
    } catch (err) {
      setActionError(err?.response?.data?.detail || "Failed to record review decision.");
    } finally {
      setActingId(null);
    }
  };

  const handleReset = async (approval) => {
    setActingId(approval.id);
    setActionError("");
    try {
      await apiClient.patch(
        `/api/v1/approvals/${approval.id}/reset`,
        {},
        authHeaders
      );
      fetchApprovals();
    } catch (err) {
      setActionError(err?.response?.data?.detail || "Failed to reset approval.");
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <p className="dash-card-note">Loading approval history...</p>;

  return (
    <div>
      {error && <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

      {canAssignOrReset && (
        <form onSubmit={handleAssign} className="approval-assign-form">
          <p className="approval-assign-title">Assign a reviewer</p>
          <div className="approval-assign-row">
            <select
              value={assignReviewerId}
              onChange={(e) => setAssignReviewerId(e.target.value)}
              aria-label="Select reviewer"
            >
              <option value="">Select reviewer...</option>
              {reviewers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role?.name})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={10}
              value={assignLevel}
              onChange={(e) => setAssignLevel(e.target.value)}
              title="Review level"
              aria-label="Review level"
            />
            <Button type="submit" variant="primary" size="sm" disabled={assigning}>
              {assigning ? "Assigning..." : "Assign"}
            </Button>
          </div>
          {assignError && <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "8px" }}>{assignError}</p>}
        </form>
      )}

      {actionError && <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "12px" }}>{actionError}</p>}

      {approvals.length === 0 ? (
        <p className="dash-card-note">No reviewers have been assigned to this decision yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {approvals.map((a) => {
            const canReview = a.status === "pending" && (profile.id === a.reviewer.id || isAdministrator);
            const draft = draftFor(a.id);

            return (
              <div
                key={a.id}
                className="approval-card"
                style={{ borderLeft: `3px solid ${STATUS_BORDER_VAR[a.status] || STATUS_BORDER_VAR.pending}` }}
              >
                <div className="approval-card-header">
                  <span className="approval-card-level">
                    Level {a.level} — {a.reviewer.full_name}
                  </span>
                  <Badge tone={STATUS_TONE[a.status] || "warning"} style={{ textTransform: "uppercase" }}>
                    {a.status}
                  </Badge>
                </div>
                <p className="approval-card-email">{a.reviewer.email}</p>
                {a.comments && <p className="approval-card-comment">{a.comments}</p>}
                <p className="approval-card-timestamps">
                  Assigned {new Date(a.created_at).toLocaleString()}
                  {a.decided_at && ` · Decided ${new Date(a.decided_at).toLocaleString()}`}
                </p>

                {canReview && (
                  <div className="approval-review-section">
                    <textarea
                      placeholder="Add a comment (optional)"
                      value={draft.comments}
                      onChange={(e) => updateDraft(a.id, { comments: e.target.value })}
                      rows={2}
                      className="form-textarea"
                      aria-label="Review comment"
                    />
                    <div className="approval-review-actions">
                      <Button
                        variant="success"
                        size="sm"
                        disabled={actingId === a.id}
                        onClick={() => handleReview(a, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={actingId === a.id}
                        onClick={() => handleReview(a, "rejected")}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={actingId === a.id}
                        onClick={() => handleReview(a, "escalated")}
                      >
                        Escalate
                      </Button>
                    </div>
                  </div>
                )}

                {canAssignOrReset && a.status !== "pending" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={actingId === a.id}
                    onClick={() => handleReset(a)}
                    style={{ marginTop: "10px" }}
                  >
                    Reset to pending
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ApprovalHistory;
