import { useState, useEffect } from "react";
import axios from "axios";
import DecisionCard from "./DecisionCard";

function DecisionsList({ token, refreshKey, role, userId, onSelectDecision, pageSize = 10, statusFilter = "all", searchQuery = "", ownerFilter = "all", currentUserId }) {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchDecisions = async () => {

      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage,
          limit: pageSize,
        });

        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        if (userId) {
          params.append("user_id", userId);
        }

        if (statusFilter && statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        if (ownerFilter && ownerFilter !== "all") {
          params.append("owner", ownerFilter);
        }
    
        const res = await axios.get(`http://127.0.0.1:8000/decisions?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDecisions(res.data.items);
        setTotalPages(res.data.total_pages);
      } catch (err) {
        console.log("Failed to load decisions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDecisions();
  }, [token, refreshKey, userId, currentPage, pageSize, searchQuery, statusFilter, ownerFilter]);

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
  const filteredDecisions = decisions;

  // Sort decisions by created_at descending (most recent first)
  const sortedDecisions = [...filteredDecisions].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (sortedDecisions.length === 0) {
    return <p style={{ color: "var(--text-muted)", margin: "16px 0" }}>No decisions found.</p>;
  }

  // Pagination math
  const paginatedDecisions = sortedDecisions;

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
        <div className="pagination-controls">
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.max(prev - 1, 1))
            }
            disabled={currentPage === 1}
          >
            ← Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, totalPages)
              )
            }
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
         </div>
       )}
    </div>
  );
}

export default DecisionsList;