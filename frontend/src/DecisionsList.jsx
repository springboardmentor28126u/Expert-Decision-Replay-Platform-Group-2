import { useState, useEffect } from "react";
import axios from "axios";
import DecisionCard from "./DecisionCard";

function DecisionsList({ token, refreshKey, role, onSelectDecision }) {
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

  const handleStatusChanged = (decisionId, nextStatus) => {
    setDecisions((prev) =>
      prev.map((d) => (d.id === decisionId ? { ...d, status: nextStatus } : d))
    );
  };

  const handleDeleted = (decisionId) => {
    setDecisions((prev) => prev.filter((d) => d.id !== decisionId));
  };

  if (loading) {
    return <p style={{ color: "var(--text-muted)" }}>Loading decisions...</p>;
  }

  if (decisions.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>No decisions created yet.</p>;
  }

  return (
    <div>
      {decisions.map((d) => (
        <DecisionCard
          key={d.id}
          decision={d}
          role={role}
          token={token}
          onSelectDecision={onSelectDecision}
          onStatusChanged={handleStatusChanged}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}

export default DecisionsList;