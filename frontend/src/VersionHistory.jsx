import { useState, useEffect } from "react";
import axios from "axios";

function VersionHistory({ token, decisionId }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
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
    };
    fetchVersions();
  }, [token, decisionId]);

  if (loading) return <p className="dash-card-note">Loading version history...</p>;

  if (versions.length === 0) {
    return <p className="dash-card-note">No previous versions — this decision hasn't been edited yet.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {versions.map((v) => (
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
          <span
            className="dash-role-badge"
            style={{ display: "inline-block", marginTop: "8px" }}
          >
            {v.status.replace("_", " ")}
          </span>
        </div>
      ))}
    </div>
  );
}

export default VersionHistory;