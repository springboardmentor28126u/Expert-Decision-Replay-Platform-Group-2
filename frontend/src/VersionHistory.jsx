import { useState, useEffect, useCallback } from "react";
import axios from "axios";

function VersionHistory({ token, decisionId, onRestored }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/decisions/${decisionId}/versions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVersions(res.data);
    } catch (err) {
      console.log("Failed to load version history", err);
    } finally {
      setLoading(false);
    }
  }, [token, decisionId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (v) => {
    if (!window.confirm(`Are you sure you want to restore the decision to Version ${v.version_number}?`)) {
      return;
    }
    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/decisions/${decisionId}`,
        {
          title: v.title,
          problem_statement: v.problem_statement,
          category: v.category,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Decision successfully restored to Version ${v.version_number}!`);
      // Reload versions history list locally
      fetchVersions();
      // Notify parent component to update its props/state
      if (onRestored) {
        onRestored(res.data);
      }
    } catch (err) {
      console.error("Failed to restore version", err);
      alert(err?.response?.data?.detail || "Failed to restore version.");
    }
  };

  if (loading) return <p className="dash-card-note">Loading version history...</p>;

  if (versions.length === 0) {
    return <p className="dash-card-note">No previous versions — this decision hasn't been edited yet.</p>;
  }

  // Sort versions by version_number descending (newest versions first)
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {sortedVersions.map((v) => (
        <div
          key={v.id}
          style={{
            background: "#1E2430",
            border: "1px solid #2E3646",
            borderRadius: "8px",
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "#4FD1B5", fontSize: "12px", fontWeight: 700 }}>
              Version {v.version_number}
            </span>
            <span style={{ color: "#6B7280", fontSize: "11px" }}>
              {new Date(v.created_at).toLocaleString()}
            </span>
          </div>
          <p style={{ color: "#F1F3F6", fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>
            {v.title}
          </p>
          <p style={{ color: "#9AA5B5", fontSize: "13px", margin: 0 }}>
            {v.problem_statement}
          </p>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: "1px solid #2E3646", paddingTop: "10px" }}>
            <span
              className="dash-role-badge"
              style={{ display: "inline-block", margin: 0, textTransform: "capitalize" }}
            >
              {v.status.replace("_", " ")}
            </span>
            <button
              onClick={() => handleRestore(v)}
              className="form-btn primary"
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                height: "auto",
                fontWeight: "600",
                cursor: "pointer",
                borderRadius: "6px"
              }}
            >
              Restore to this version
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default VersionHistory;