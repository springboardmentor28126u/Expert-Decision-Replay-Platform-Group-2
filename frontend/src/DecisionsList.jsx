import { useState, useEffect } from "react";
import axios from "axios";
import AlternativesPanel from "./AlternativesPanel";

function DecisionsList({ token, refreshKey, role }) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [updateError, setUpdateError] = useState("");

  const [selectedDecisionId, setSelectedDecisionId] = useState(null);
  const [panelRefreshKey, setPanelRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/decisions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDecisions(res.data);
      } catch (err) {
        console.log("Failed to load decisions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDecisions();
  }, [token, refreshKey]);

  const statusColor = (status) => {
    if (status === "approved") return "#4FD1B5";
    if (status === "rejected") return "#FF6B6B";
    if (status === "under_review") return "#F2A623";
    return "#9AA5B5";
  };

  const canUpdateStatus = role === "manager" || role === "admin";

  const allStatuses = ["draft", "under_review", "approved", "rejected", "archived"];

  const handleStatusChange = async (decisionId, nextStatus) => {
    if (!canUpdateStatus) return;
    setUpdateError("");
    setUpdatingId(decisionId);
    try {
      await axios.put(
        `http://127.0.0.1:8000/decisions/${decisionId}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDecisions((prev) =>
        prev.map((d) => (d.id === decisionId ? { ...d, status: nextStatus } : d))
      );
      if (typeof refreshKey !== "undefined") {
        // Trigger re-fetch in parent-driven flows
        // (we keep it optional to avoid tight coupling)
      }
    } catch (err) {
      setUpdateError(
        err?.response?.data?.detail ||
          "Failed to update status. Check your permissions."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <p className="dash-card-note">Loading decisions...</p>;
  }

  if (decisions.length === 0) {
    return <p className="dash-card-note">No decisions created yet.</p>;
  }

  return (
    <>
      {updateError && (
        <div
          className="dash-card-note"
          style={{ color: "#FF6B6B", marginBottom: 12 }}
        >
          {updateError}
        </div>
      )}

      <table className="dash-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Created</th>
            <th>Status Actions</th>
            <th>Alternatives</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map((d) => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td>{d.category || "—"}</td>
              <td>
                <span
                  className="dash-role-badge"
                  style={{
                    background: `${statusColor(d.status)}20`,
                    color: statusColor(d.status),
                  }}
                >
                  {d.status.replace("_", " ")}
                </span>
              </td>
              <td>{new Date(d.created_at).toLocaleDateString()}</td>
              <td>
                {canUpdateStatus ? (
                  <div className="dash-status-actions">
                    <select
                      className="dash-select"
                      value={d.status}
                      disabled={updatingId === d.id}
                      onChange={(e) => handleStatusChange(d.id, e.target.value)}
                    >
                      {allStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="dash-card-note">—</span>
                )}
              </td>
              <td>
                <button
                  className="dash-logout"
                  style={{ padding: "6px 10px" }}
                  onClick={() => setSelectedDecisionId((cur) => (cur === d.id ? null : d.id))}
                >
                  {selectedDecisionId === d.id ? "Hide" : "Manage"} Alternatives
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedDecisionId && (
        <div className="dash-section dash-alternatives-section" key={panelRefreshKey}>
          <h3 className="dash-section-title" style={{ marginBottom: 12 }}>
            Alternatives for selected decision
          </h3>
          <AlternativesPanel
            token={token}
            decisionId={selectedDecisionId}
            onUpdated={() => setPanelRefreshKey((k) => k + 1)}
          />
        </div>
      )}
    </>
  );
}

export default DecisionsList;