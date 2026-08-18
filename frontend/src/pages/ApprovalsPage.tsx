import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { approvalsApi } from "../api/approvals";
import { usersApi } from "../api/users";
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { User } from "../types";

interface Approval {
  id: number;
  decision_id: number;
  reviewer_id: number;
  reviewer_name?: string | null;
  assigned_by_id?: number | null;
  assigned_by_name?: string | null;
  status: string;
  comments?: string | null;
  created_at: string;
  approved_at?: string | null;
}

interface AISummaryResponse {
  summary: string;
}

const ApprovalsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const decisionId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  // =========================================================
  // STATE
  // =========================================================

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [reviewers, setReviewers] = useState<User[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<string>("");

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [assigning, setAssigning] = useState<boolean>(false);

  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState<string>("");
  const [rejecting, setRejecting] = useState<boolean>(false);

  // AI SUMMARY
  const [aiSummary, setAiSummary] = useState<string>("");
  const [generatingSummary, setGeneratingSummary] =
    useState<boolean>(false);

  // =========================================================
  // CURRENT ROLE
  // =========================================================

  const currentRole = String(
    currentUser?.role || user?.role || ""
  )
    .trim()
    .toLowerCase();

  const isAdmin = currentRole === "administrator";
  const isManager = currentRole === "manager" || isAdmin;

  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const loadedUser = await usersApi.getMe();

      console.log("Current user:", loadedUser);

      setCurrentUser(loadedUser);
    } catch (error) {
      console.error("Failed to load current user:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  // =========================================================
  // LOAD APPROVALS
  // =========================================================

  useEffect(() => {
    if (decisionId) {
      loadApprovals();
    }
  }, [decisionId]);

  const loadApprovals = async () => {
    if (!decisionId) {
      setApprovals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await approvalsApi.list(decisionId);

      console.log("Approvals received:", data);

      setApprovals(data);
    } catch (error) {
      console.error("Failed to load approvals:", error);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD REVIEWERS
  // =========================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const role = String(currentUser.role || "")
      .trim()
      .toLowerCase();

    if (role === "administrator" || role === "manager") {
      loadReviewers();
    }
  }, [currentUser]);

  const loadReviewers = async () => {
    try {
      const data = await usersApi.getReviewers();

      console.log("Reviewers received:", data);

      setReviewers(data);
    } catch (error) {
      console.error("Failed to load reviewers:", error);
      setReviewers([]);
    }
  };

  // =========================================================
  // ASSIGN REVIEWER
  // =========================================================

  const assignReviewer = async () => {
    if (!selectedReviewer) {
      alert("Please select a reviewer.");
      return;
    }

    if (!decisionId) {
      alert("Invalid decision.");
      return;
    }

    try {
      setAssigning(true);

      await approvalsApi.assign(
        decisionId,
        Number(selectedReviewer),
        "Assigned for review"
      );

      alert("Reviewer assigned successfully.");

      setSelectedReviewer("");

      await loadApprovals();
    } catch (error: any) {
      console.error("Assignment failed:", error);

      alert(
        error?.response?.data?.detail ||
          "Failed to assign reviewer."
      );
    } finally {
      setAssigning(false);
    }
  };

  // =========================================================
  // APPROVE
  // =========================================================

  const approve = async (approvalId: number) => {
    try {
      await approvalsApi.approve(approvalId);

      await loadApprovals();
    } catch (error: any) {
      console.error("Approval failed:", error);

      alert(
        error?.response?.data?.detail ||
          "Approval failed."
      );
    }
  };

  // =========================================================
  // REJECT
  // =========================================================

  const openRejectModal = (approvalId: number) => {
    setRejectTarget(approvalId);
    setRejectComment("");
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    if (rejecting) {
      return;
    }

    setRejectModalOpen(false);
    setRejectTarget(null);
    setRejectComment("");
  };

  const confirmReject = async () => {
    if (rejectTarget === null) {
      return;
    }

    try {
      setRejecting(true);

      await approvalsApi.reject(
        rejectTarget,
        rejectComment.trim()
      );

      setRejectModalOpen(false);
      setRejectTarget(null);
      setRejectComment("");

      await loadApprovals();
    } catch (error: any) {
      console.error("Rejection failed:", error);

      alert(
        error?.response?.data?.detail ||
          error?.message ||
          "Rejection failed."
      );
    } finally {
      setRejecting(false);
    }
  };

  // =========================================================
  // GET REVIEWER NAME
  // =========================================================

  const getReviewerName = (reviewerId: number): string => {
    const approval = approvals.find(
      (item) => item.reviewer_id === reviewerId
    );

    if (
      approval?.reviewer_name &&
      approval.reviewer_name.trim()
    ) {
      return approval.reviewer_name;
    }

    const reviewer = reviewers.find(
      (reviewer) => reviewer.id === reviewerId
    );

    if (reviewer) {
      return reviewer.username;
    }

    return `Reviewer #${reviewerId}`;
  };

  // =========================================================
  // GET ASSIGNED BY NAME
  // =========================================================

  const getAssignedByName = (approval: Approval): string => {
    if (
      approval.assigned_by_name &&
      approval.assigned_by_name.trim()
    ) {
      return approval.assigned_by_name;
    }

    if (
      approval.assigned_by_id &&
      currentUser &&
      currentUser.id === approval.assigned_by_id
    ) {
      return currentUser.username;
    }

    return "Unknown";
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusStyle = (status: string): string => {
    switch (String(status).toLowerCase()) {
      case "approved":
        return "bg-success/10 text-success border border-success/20";

      case "rejected":
        return "bg-error/10 text-error border border-error/20";

      case "pending":
        return "bg-warning/10 text-warning border border-warning/20";

      default:
        return "bg-surface-elevated text-text-secondary border border-border";
    }
  };

  // =========================================================
  // STATUS COUNTS
  // =========================================================

  const pendingCount = approvals.filter(
    (item) => String(item.status).toLowerCase() === "pending"
  ).length;

  const approvedCount = approvals.filter(
    (item) => String(item.status).toLowerCase() === "approved"
  ).length;

  const rejectedCount = approvals.filter(
    (item) => String(item.status).toLowerCase() === "rejected"
  ).length;

  // =========================================================
  // GENERATE AI SUMMARY
  // =========================================================

  const generateAISummary = async () => {
    if (!decisionId) {
      alert("Invalid decision.");
      return;
    }

    try {
      setGeneratingSummary(true);
      setAiSummary("");

      const response = await fetch(
        `/api/approvals/${decisionId}/ai-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        let message = "Failed to generate AI summary.";

        try {
          const errorData = await response.json();
          message = errorData?.detail || message;
        } catch {
          // Ignore JSON parsing errors
        }

        throw new Error(message);
      }

      const data: AISummaryResponse = await response.json();

      setAiSummary(data.summary);
    } catch (error: any) {
      console.error(
        "AI summary generation failed:",
        error
      );

      alert(
        error?.message ||
          "Failed to generate AI summary."
      );
    } finally {
      setGeneratingSummary(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingUser) {
    return (
      <div
        style={{
          padding: "20px",
          color: "white",
        }}
      >
        Loading...
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="section-spacing">
      {/* Header + Back */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div className="space-y-1">
          <button
            onClick={() =>
              navigate(
                `/dashboard/decisions/${decisionId}`
              )
            }
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Back to Decision
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-text">
            Approval Workflow
          </h1>

          <p className="text-sm text-text-secondary">
            Manage reviewer assignments and track approval
            status for this decision.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 bg-surface-elevated/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Pending
              </p>
              <p className="text-2xl font-bold text-text mt-1">
                {pendingCount}
              </p>
            </div>

            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-warning"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="border border-border/80 bg-surface-elevated/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Approved
              </p>
              <p className="text-2xl font-bold text-text mt-1">
                {approvedCount}
              </p>
            </div>

            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-success"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="border border-border/80 bg-surface-elevated/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Rejected
              </p>
              <p className="text-2xl font-bold text-text mt-1">
                {rejectedCount}
              </p>
            </div>

            <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 text-error"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
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
                onChange={(e) =>
                  setSelectedReviewer(e.target.value)
                }
                className="input-field"
              >
                <option value="">
                  Choose a reviewer...
                </option>

                {reviewers.map((reviewer) => (
                  <option
                    key={reviewer.id}
                    value={reviewer.id}
                  >
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

      {/* AI Summary */}
      <Card className="border border-border/80 bg-surface-elevated/20">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-text">
                AI Approval Summary
              </h3>

              <p className="text-sm text-text-secondary mt-1">
                Generate a summary of the current approval
                workflow.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={generateAISummary}
              loading={generatingSummary}
            >
              Generate Summary
            </Button>
          </div>

          {aiSummary && (
            <div className="rounded-lg border border-border/60 bg-surface-elevated/30 p-4">
              <p className="text-sm text-text whitespace-pre-wrap">
                {aiSummary}
              </p>
            </div>
          )}
        </div>
      </Card>

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
            {approvals.map((item) => {
              const reviewerName = getReviewerName(
                item.reviewer_id
              );

              return (
                <Card
                  key={item.id}
                  className="border border-border/80 bg-surface-elevated/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Reviewer Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary-light uppercase border border-primary/20 select-none shrink-0">
                        {reviewerName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-text">
                          {reviewerName}
                        </p>

                        <p className="text-xs text-text-muted">
                          Assigned{" "}
                          {new Date(
                            item.created_at
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}

                          {item.approved_at && (
                            <span>
                              {" "}
                              • Responded{" "}
                              {new Date(
                                item.approved_at
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          )}
                        </p>

                        {item.assigned_by_id && (
                          <p className="text-xs text-text-muted">
                            Assigned by{" "}
                            {getAssignedByName(item)}
                          </p>
                        )}

                        {item.comments && (
                          <p className="text-xs text-text-secondary mt-1">
                            Comment: {item.comments}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusStyle(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>

                      {String(item.status).toLowerCase() ===
                        "pending" && (
                        <>
                          <button
                            onClick={() =>
                              approve(item.id)
                            }
                            className="rounded-md bg-success px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              openRejectModal(item.id)
                            }
                            className="rounded-md bg-error px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border border-border/80 bg-surface-elevated/20">
            <div className="text-center py-10">
              <p className="text-sm text-text-secondary">
                No approvals found
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-text">
                Reject Approval
              </h2>

              <p className="text-sm text-text-secondary mt-1">
                Please provide a reason for rejecting this
                approval.
              </p>
            </div>

            <textarea
              value={rejectComment}
              onChange={(e) =>
                setRejectComment(e.target.value)
              }
              placeholder="Enter rejection reason..."
              rows={4}
              className="input-field w-full resize-none"
              disabled={rejecting}
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={rejecting}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmReject}
                disabled={rejecting}
                className="rounded-md bg-error px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {rejecting
                  ? "Rejecting..."
                  : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;