import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { approvalsApi } from "../api/approvals";
import { usersApi } from "../api/users";
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";

interface Approval {
  id: number;
  decision_id: number;
  reviewer_id: number;
  status: string;
  comments?: string;
  created_at: string;
  approved_at?: string;
}

const ApprovalsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const decisionId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const isAdmin = user?.role === "Administrator";
  const isManager = user?.role === "Manager" || isAdmin;

  useEffect(() => {
    if (decisionId) {
      loadApprovals();
      loadReviewers();
    }
  }, [decisionId]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const data = await approvalsApi.list(decisionId);
      setApprovals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewers = async () => {
    try {
      const data = await usersApi.getReviewers();
      setReviewers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const assignReviewer = async () => {
    if (!selectedReviewer) return;

    setAssigning(true);
    try {
      await approvalsApi.assign(
        decisionId,
        Number(selectedReviewer),
        "Assigned for review"
      );
      setSelectedReviewer("");
      loadApprovals();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const approve = async (approvalId: number) => {
    try {
      await approvalsApi.approve(approvalId);
      loadApprovals();
    } catch (error) {
      console.error(error);
    }
  };

  const openRejectModal = (approvalId: number) => {
    setRejectTarget(approvalId);
    setRejectComment("");
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (rejectTarget === null) return;
    try {
      await approvalsApi.reject(rejectTarget, rejectComment);
      setRejectModalOpen(false);
      setRejectTarget(null);
      setRejectComment("");
      loadApprovals();
    } catch (error) {
      console.error(error);
    }
  };

  const getReviewerName = (reviewerId: number) => {
    const reviewer = reviewers.find((r) => r.id === reviewerId);
    return reviewer ? reviewer.username : "Unknown";
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

  const pendingCount = approvals.filter((a) => a.status === "Pending").length;
  const approvedCount = approvals.filter((a) => a.status === "Approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "Rejected").length;

  return (
    <div className="section-spacing">
      {/* Header + Back */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div className="space-y-1">
          <button
            onClick={() => navigate(`/dashboard/decisions/${decisionId}`)}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text font-semibold transition-colors text-sm mb-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Decision
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-text">
            Approval Workflow
          </h1>
          <p className="text-sm text-text-secondary">
            Manage reviewer assignments and track approval status for this decision.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 bg-surface-elevated/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-text mt-1">{pendingCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-warning">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border border-border/80 bg-surface-elevated/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Approved</p>
              <p className="text-2xl font-bold text-text mt-1">{approvedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-success">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
        </Card>
        <Card className="border border-border/80 bg-surface-elevated/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Rejected</p>
              <p className="text-2xl font-bold text-text mt-1">{rejectedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-error">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Assign Reviewer */}
      {isManager && (
        <Card className="border border-border/80 bg-surface-elevated/20">
          <h3 className="text-base font-bold text-text mb-4 border-b border-border/40 pb-2">
            Assign Reviewer
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
                Select Reviewer
              </label>
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="input-field"
              >
                <option value="">Choose a reviewer...</option>
                {reviewers.map((reviewer: any) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.username} ({reviewer.role})
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              onClick={assignReviewer}
              loading={assigning}
              disabled={!selectedReviewer}
              className="w-full sm:w-auto shrink-0"
            >
              Assign Reviewer
            </Button>
          </div>
        </Card>
      )}

      {/* Approvals List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-text">
          Reviewers ({approvals.length})
        </h3>

        {loading ? (
          <div className="flex h-[20vh] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : approvals.length > 0 ? (
          <div className="space-y-3">
            {approvals.map((item) => (
              <Card
                key={item.id}
                className="border border-border/80 bg-surface-elevated/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Reviewer Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary-light uppercase border border-primary/20 select-none shrink-0">
                      {getReviewerName(item.reviewer_id).charAt(0)}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-text">
                        {getReviewerName(item.reviewer_id)}
                      </p>
                      <p className="text-xs text-text-muted">
                        Assigned {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {item.approved_at && (
                          <span>
                            {" "}• Responded {new Date(item.approved_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>

                    {item.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => approve(item.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openRejectModal(item.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection Comments */}
                {item.status === "Rejected" && item.comments && (
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <p className="text-xs text-error/80 bg-error/5 border border-error/10 rounded-lg px-3 py-2">
                      <span className="font-semibold">Rejection reason:</span> {item.comments}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-text-secondary">
            No reviewers have been assigned yet. Use the form above to assign one.
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectTarget(null);
          setRejectComment("");
        }}
        title="Reject Approval"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Please provide a reason for rejecting this approval request.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider select-none">
              Rejection Comments
            </label>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
              placeholder="Enter your reason for rejection..."
              className="input-field resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectTarget(null);
                setRejectComment("");
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApprovalsPage;