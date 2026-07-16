import { useState, useEffect } from "react";
import axios from "axios";

function DecisionsList({ token, refreshKey }) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p className="dash-card-note">Loading decisions...</p>;
  }

  if (decisions.length === 0) {
    return <p className="dash-card-note">No decisions created yet.</p>;
  }

  return (
    <table className="dash-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Status</th>
          <th>Created</th>
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DecisionsList;