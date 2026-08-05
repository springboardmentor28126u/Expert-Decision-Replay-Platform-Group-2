import { useState, useEffect } from "react";
import axios from "axios";
import DecisionCard from "./DecisionCard";

function DecisionsList({ token, refreshKey, role, onSelectDecision, pageSize = 10, statusFilter = "all", searchQuery = "", ownerFilter = "all", currentUserId }) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, ownerFilter]);

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

  // Filter decisions based on status, owner, and search query
  const filteredDecisions = decisions.filter((d) => {
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesOwner = ownerFilter === "all" || (ownerFilter === "mine" && d.created_by === currentUserId);
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      d.title.toLowerCase().includes(q) ||
      (d.category && d.category.toLowerCase().includes(q)) ||
      d.problem_statement.toLowerCase().includes(q);
      
    return matchesStatus && matchesOwner && matchesSearch;
  });

  // Sort decisions by created_at descending (most recent first)
  const sortedDecisions = [...filteredDecisions].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (sortedDecisions.length === 0) {
    return <p style={{ color: "var(--text-muted)", margin: "16px 0" }}>No decisions found.</p>;
  }

  // Pagination math
  const totalPages = Math.ceil(sortedDecisions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDecisions = sortedDecisions.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <div className="decisions-grid">
        {paginatedDecisions.map((d) => (
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

      {totalPages > 1 && (
        <div
          className="pagination-controls"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border)"
          }}
        >
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: currentPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
              borderRadius: "6px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s"
            }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: currentPage === totalPages ? "var(--text-muted)" : "var(--text-primary)",
              borderRadius: "6px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s"
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default DecisionsList;