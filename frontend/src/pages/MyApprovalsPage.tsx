import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { approvalsApi } from "../api/approvals";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";

interface Approval {
  id: number;
  decision_id: number;
  status: string;
  comments?: string;
  created_at: string;
  approved_at?: string;
  decision_title?: string;
  reviewer_name?: string;
}

const MyApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadMyApprovals();
  }, []);

  const loadMyApprovals = async () => {
    setLoading(true);
    try {
      const data = await approvalsApi.my();
      setApprovals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "all"
    ? approvals
    : approvals.filter((a) => a.status === filter);

  const counts = {
    all: approvals.length,
    Pending: approvals.filter((a) => a.status === "Pending").length,
    Approved: approvals.filter((a) => a.status === "Approved").length,
    Rejected: approvals.filter((a) => a.status === "Rejected").length,
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "status-under-review";
      case "Approved":
        return "status-approved";
      case "Rejected":
        return "status-rejected";
      default:
        return "status-draft";
    }
  };

  return (
    <div className="section-spacing">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-text">
            My Approvals
          </h1>
          <p className="text-sm text-text-secondary">
            Decisions assigned to you for review. Take action on pending items.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-px select-none border-b border-border/80">
        {(["all", "Pending", "Approved", "Rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 transition-all whitespace-nowrap ${
              filter === tab
                ? "border-primary text-primary-light bg-primary/5"
                : "border-transparent text-text-secondary hover:text-text hover:bg-surface-hover/30"
            }`}
          >
            {tab === "all" ? "All" : tab}
            <span className="ml-1.5 text-xs opacity-60">
              ({counts[tab]})
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filtered.map((item) => (
            <Card
              key={item.id}
              hoverable
              onClick={() => navigate(`/dashboard/decisions/${item.decision_id}`)}
              className="border border-border/80 bg-surface-elevated/20 cursor-pointer"
            >
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusStyle(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[10px] text-text-muted font-medium">
                    #{item.decision_id}
                  </span>
                </div>

                {/* Decision Title */}
                <h3 className="text-base font-bold text-text leading-snug line-clamp-2">
                  {item.decision_title || `Decision #${item.decision_id}`}
                </h3>

                {/* Comments if rejected */}
                {item.status === "Rejected" && item.comments && (
                  <p className="text-xs text-error/80 bg-error/5 border border-error/10 rounded-lg px-3 py-2 line-clamp-2">
                    {item.comments}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/40">
                  <span>
                    Assigned {new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {item.approved_at && (
                    <span>
                      {item.status === "Approved" ? "Approved" : "Responded"}{" "}
                      {new Date(item.approved_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Action */}
                {item.status === "Pending" && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/decisions/${item.decision_id}`);
                    }}
                  >
                    Review Decision
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-text-secondary">
          {filter === "all"
            ? "No decisions have been assigned to you for review yet."
            : `No ${filter.toLowerCase()} approvals found.`}
        </div>
      )}
    </div>
  );
};

export default MyApprovalsPage;