import { useState, useEffect } from "react";
import apiClient, { authHeaders } from "../api/client";
import DecisionCard from "./DecisionCard";
import Button from "./ui/Button";

function DecisionsList({ token, refreshKey, role, onSelectDecision, pageSize = 10, statusFilter = "all", searchQuery = "" }) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const res = await apiClient.get("/api/v1/decisions", authHeaders(token));
        setDecisions(res.data.items);
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
  }, [statusFilter, searchQuery]);

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

  // Filter decisions based on status and search query
  const filteredDecisions = decisions.filter((d) => {
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      d.title.toLowerCase().includes(q) ||
      (d.category && d.category.toLowerCase().includes(q)) ||
      d.problem_statement.toLowerCase().includes(q);
      
    return matchesStatus && matchesSearch;
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
      <div>
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
        <div className="pagination-controls">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </Button>
          <span className="pagination-status">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}

export default DecisionsList;