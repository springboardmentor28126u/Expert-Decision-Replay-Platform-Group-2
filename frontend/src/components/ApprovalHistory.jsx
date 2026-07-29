import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const STATUS_STYLE = {
  pending: { bg: "var(--warning-soft)", color: "var(--warning)" },
  approved: { bg: "var(--success-soft)", color: "var(--success)" },
  rejected: { bg: "var(--danger-soft)", color: "var(--danger)" },
  escalated: { bg: "var(--neutral-soft)", color: "var(--text-secondary)" },
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
      const res = await axios.get(
        `http://127.0.0.1:8000/api/v1/approvals/decision/${decisionId}`,
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
        const res = await axios.get(
          "http://127.0.0.1:8000/api/v1/users/?page=1&page_size=100",
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
      await axios.post(
        `http://127.0.0.1:8000/api/v1/approvals/decision/${decisionId}`,
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
      await axios.patch(
        `http://127.0.0.1:8000/api/v1/approvals/${approval.id}`,
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
      await axios.patch(
        `http://127.0.0.1:8000/api/v1/approvals/${approval.id}/reset`,
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
        <form
          onSubmit={handleAssign}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
            Assign a reviewer
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={assignReviewerId}
              onChange={(e) => setAssignReviewerId(e.target.value)}
              style={{
                flex: "1 1 220px", padding: "8px 10px", background: "var(--bg)",
                border: "1px solid var(--border)", borderRadius: "6px",
                color: "var(--text-primary)", fontSize: "13px",
              }}
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
              style={{
                width: "80px", padding: "8px 10px", background: "var(--bg)",
                border: "1px solid var(--border)", borderRadius: "6px",
                color: "var(--text-primary)", fontSize: "13px",
              }}
            />
            <button
              type="submit"
              disabled={assigning}
              className="form-btn primary"
              style={{ padding: "8px 16px", fontSize: "13px", height: "auto" }}
            >
              {assigning ? "Assigning..." : "Assign"}
            </button>
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
            const style = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
            const canReview = a.status === "pending" && (profile.id === a.reviewer.id || isAdministrator);
            const draft = draftFor(a.id);

            return (
              <div
                key={a.id}
                style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "8px", padding: "14px 16px",
                  borderLeft: `3px solid ${style.color}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Level {a.level} — {a.reviewer.full_name}
                  </span>
                  <span
                    style={{
                      background: style.bg, color: style.color, padding: "3px 10px",
                      borderRadius: "20px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                    }}
                  >
                    {a.status}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px" }}>
                  {a.reviewer.email}
                </p>
                {a.comments && (
                  <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: "0 0 6px" }}>{a.comments}</p>
                )}
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  Assigned {new Date(a.created_at).toLocaleString()}
                  {a.decided_at && ` · Decided ${new Date(a.decided_at).toLocaleString()}`}
                </p>

                {canReview && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                    <textarea
                      placeholder="Add a comment (optional)"
                      value={draft.comments}
                      onChange={(e) => updateDraft(a.id, { comments: e.target.value })}
                      rows={2}
                      style={{
                        width: "100%", padding: "8px 10px", background: "var(--bg)",
                        border: "1px solid var(--border)", borderRadius: "6px",
                        color: "var(--text-primary)", fontSize: "13px", marginBottom: "8px", resize: "vertical",
                      }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        disabled={actingId === a.id}
                        onClick={() => handleReview(a, "approved")}
                        style={{ background: "var(--success)", color: "#0A1410", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Approve
                      </button>
                      <button
                        disabled={actingId === a.id}
                        onClick={() => handleReview(a, "rejected")}
                        style={{ background: "none", color: "var(--danger)", border: "1px solid var(--danger)", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Reject
                      </button>
                      <button
                        disabled={actingId === a.id}
                        onClick={() => handleReview(a, "escalated")}
                        style={{ background: "none", color: "var(--text-secondary)", border: "1px solid var(--border)", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Escalate
                      </button>
                    </div>
                  </div>
                )}

                {canAssignOrReset && a.status !== "pending" && (
                  <button
                    disabled={actingId === a.id}
                    onClick={() => handleReset(a)}
                    style={{
                      marginTop: "10px", background: "none", color: "var(--text-secondary)",
                      border: "1px solid var(--border)", padding: "5px 12px", borderRadius: "6px",
                      fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Reset to pending
                  </button>
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
