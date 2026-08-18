import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { approvalsApi } from "../api/approvals";
import { usersApi } from "../api/users";
<<<<<<< HEAD
import { User } from "../types";
=======
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Modal from "../components/common/Modal";
>>>>>>> origin/nandhana

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
<<<<<<< HEAD

  const [reviewers, setReviewers] = useState<User[]>([]);

  const [selectedReviewer, setSelectedReviewer] =
    useState<string>("");

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [loadingUser, setLoadingUser] =
    useState<boolean>(true);

  const [loadingApprovals, setLoadingApprovals] =
    useState<boolean>(false);

  const [assigning, setAssigning] =
    useState<boolean>(false);

  // AI SUMMARY
  const [aiSummary, setAiSummary] =
    useState<string>("");

  const [generatingSummary, setGeneratingSummary] =
    useState<boolean>(false);

  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // =========================================================
  // LOAD APPROVALS
  // =========================================================
=======
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState("");

  const isAdmin = user?.role === "Administrator";
  const isManager = user?.role === "Manager" || isAdmin;
>>>>>>> origin/nandhana

  useEffect(() => {
    if (decisionId) {
      loadApprovals();
    }
  }, [decisionId]);

<<<<<<< HEAD
  // =========================================================
  // LOAD REVIEWERS FOR ADMIN / MANAGER
  // =========================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const role = String(currentUser.role || "")
      .trim()
      .toLowerCase();

    if (
      role === "administrator" ||
      role === "manager"
    ) {
      loadReviewers();
    }
  }, [currentUser]);

  // =========================================================
  // CURRENT USER
  // =========================================================

  const loadCurrentUser = async () => {
    try {
      const user = await usersApi.getMe();

      console.log("Current user:", user);

      setCurrentUser(user);
    } catch (error) {
      console.error(
        "Failed to load current user:",
        error
      );
    } finally {
      setLoadingUser(false);
=======
  const loadApprovals = async () => {
    setLoading(true);
    try {
      const data = await approvalsApi.list(decisionId);
      setApprovals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
>>>>>>> origin/nandhana
    }
  };

  // =========================================================
  // APPROVALS
  // =========================================================

  const loadApprovals = async () => {
    if (!decisionId) {
      return;
    }

    try {
      setLoadingApprovals(true);

      const data = await approvalsApi.list(decisionId);

      console.log("Approvals received:", data);

      setApprovals(data);
    } catch (error) {
      console.error(
        "Failed to load approvals:",
        error
      );
    } finally {
      setLoadingApprovals(false);
    }
  };

  // =========================================================
  // REVIEWERS
  // =========================================================

  const loadReviewers = async () => {
    try {
      const data = await usersApi.getReviewers();
<<<<<<< HEAD

      console.log(
        "Reviewers received:",
        data
      );

=======
>>>>>>> origin/nandhana
      setReviewers(data);
    } catch (error) {
      console.error(
        "Failed to load reviewers:",
        error
      );
    }
  };

  // =========================================================
  // ASSIGN REVIEWER
  // =========================================================

  const assignReviewer = async () => {
<<<<<<< HEAD
    if (!selectedReviewer) {
      alert("Please select a reviewer.");
      return;
    }

    if (!decisionId) {
      alert("Invalid decision.");
      return;
    }
=======
    if (!selectedReviewer) return;
>>>>>>> origin/nandhana

    setAssigning(true);
    try {
      setAssigning(true);

      await approvalsApi.assign(
        decisionId,
        Number(selectedReviewer),
<<<<<<< HEAD
        undefined
      );

      alert("Reviewer assigned successfully.");

      setSelectedReviewer("");

      await loadApprovals();
    } catch (error: any) {
      console.error(
        "Assignment failed:",
        error
      );

      alert(
        error?.response?.data?.detail ||
          "Failed to assign reviewer."
      );
=======
        "Assigned for review"
      );
      setSelectedReviewer("");
      loadApprovals();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Assignment failed");
>>>>>>> origin/nandhana
    } finally {
      setAssigning(false);
    }
  };

  // =========================================================
  // APPROVE
  // =========================================================

  const approve = async (
    approvalId: number
  ) => {
    try {
      await approvalsApi.approve(approvalId);

      await loadApprovals();
    } catch (error: any) {
      console.error(
        "Approval failed:",
        error
      );

      alert(
        error?.response?.data?.detail ||
          "Approval failed."
      );
    }
  };

<<<<<<< HEAD
  // =========================================================
  // REJECT
  // =========================================================

  const reject = async (
    approvalId: number
  ) => {
    const comments = prompt(
      "Enter rejection comments"
    );

    if (comments === null) {
      return;
    }
=======
  const openRejectModal = (approvalId: number) => {
    setRejectTarget(approvalId);
    setRejectComment("");
    setRejectModalOpen(true);
  };
>>>>>>> origin/nandhana

  const confirmReject = async () => {
    if (rejectTarget === null) return;
    try {
<<<<<<< HEAD
      await approvalsApi.reject(
        approvalId,
        comments
      );

      await loadApprovals();
    } catch (error: any) {
      console.error(
        "Rejection failed:",
        error
      );

      alert(
        error?.response?.data?.detail ||
          "Rejection failed."
      );
    }
  };

  // =========================================================
  // GET REVIEWER NAME
  // =========================================================

  const getReviewerName = (
    approval: Approval
  ): string => {
    // Best option:
    // backend returns reviewer_name
    if (
      approval.reviewer_name &&
      approval.reviewer_name.trim()
    ) {
      return approval.reviewer_name;
    }

    // Fallback:
    // find reviewer in loaded reviewer list
    const reviewer = reviewers.find(
      (user) =>
        user.id === approval.reviewer_id
    );

    if (reviewer) {
      return reviewer.username;
    }

    return `Reviewer #${approval.reviewer_id}`;
  };

  // =========================================================
  // GET ASSIGNED BY NAME
  // =========================================================

  const getAssignedByName = (
    approval: Approval
  ): string => {
    // Best option:
    // backend returns assigned_by_name
    if (
      approval.assigned_by_name &&
      approval.assigned_by_name.trim()
    ) {
      return approval.assigned_by_name;
    }

    // If the current logged-in user assigned it
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

      /*
       * Backend endpoint:
       *
       * POST /api/approvals/{decision_id}/ai-summary
       *
       * Expected response:
       *
       * {
       *   "summary": "AI generated summary..."
       * }
       */

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
        let message =
          "Failed to generate AI summary.";

        try {
          const errorData =
            await response.json();

          message =
            errorData?.detail || message;
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(message);
      }

      const data: AISummaryResponse =
        await response.json();

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
  // CURRENT ROLE
  // =========================================================

  const currentRole = String(
    currentUser?.role || ""
  )
    .trim()
    .toLowerCase();

  // =========================================================
  // ADMINISTRATOR + MANAGER ONLY
  // =========================================================

  const canAssignReviewer =
    currentRole === "administrator" ||
    currentRole === "manager";

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
    <div
      style={{
        padding: "20px",
        color: "white",
      }}
    >
      {/* =====================================================
          TITLE
          ===================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          Approvals
        </h2>

        {/* AI SUMMARY BUTTON */}

        <button
          onClick={generateAISummary}
          disabled={
            generatingSummary ||
            approvals.length === 0
          }
          style={{
            backgroundColor:
              generatingSummary ||
              approvals.length === 0
                ? "#555"
                : "#7c3aed",
            color: "white",
            border: "none",
            padding: "11px 20px",
            borderRadius: "6px",
            cursor:
              generatingSummary ||
              approvals.length === 0
                ? "not-allowed"
                : "pointer",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {generatingSummary
            ? "Generating AI Summary..."
            : "Generate AI Summary"}
        </button>
      </div>

      {/* =====================================================
          AI SUMMARY
          ===================================================== */}

      {aiSummary && (
        <div
          style={{
            backgroundColor: "#111827",
            border: "1px solid #7c3aed",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#c4b5fd",
              }}
            >
              AI Decision Summary
            </h3>

            <button
              onClick={() =>
                setAiSummary("")
              }
              style={{
                background: "transparent",
                color: "#aaa",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ×
            </button>
          </div>

          <p
            style={{
              margin: 0,
              lineHeight: "1.7",
              whiteSpace: "pre-wrap",
              color: "#e5e7eb",
            }}
          >
            {aiSummary}
          </p>
        </div>
      )}

      {/* =====================================================
          ASSIGN REVIEWER
          ADMINISTRATOR + MANAGER ONLY
          ===================================================== */}

      {canAssignReviewer && (
        <div
          style={{
            marginTop: "20px",
            marginBottom: "20px",
            display: "flex",
            gap: "15px",
            alignItems: "center",
          }}
        >
          <select
            value={selectedReviewer}
            onChange={(e) =>
              setSelectedReviewer(
                e.target.value
              )
            }
            disabled={assigning}
            style={{
              padding: "10px",
              minWidth: "320px",
              backgroundColor: "#1f2937",
              color: "white",
              border: "1px solid #555",
              borderRadius: "6px",
              fontSize: "16px",
            }}
          >
            <option value="">
              Select Reviewer
            </option>

            {reviewers.map((reviewer) => (
              <option
                key={reviewer.id}
                value={reviewer.id}
              >
                {reviewer.username}
              </option>
            ))}
          </select>

          <button
            onClick={assignReviewer}
            disabled={assigning}
            style={{
              backgroundColor: assigning
                ? "#666"
                : "green",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: assigning
                ? "not-allowed"
                : "pointer",
              fontWeight: "bold",
            }}
          >
            {assigning
              ? "Assigning..."
              : "Assign Reviewer"}
          </button>
        </div>
      )}

      {/* =====================================================
          APPROVALS TABLE
          ===================================================== */}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
=======
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
>>>>>>> origin/nandhana
        }}
        title="Reject Approval"
      >
<<<<<<< HEAD
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid white",
                padding: "10px",
              }}
            >
              Reviewer
            </th>

            <th
              style={{
                border: "1px solid white",
                padding: "10px",
              }}
            >
              Decision
            </th>

            <th
              style={{
                border: "1px solid white",
                padding: "10px",
              }}
            >
              Assigned By
            </th>

            <th
              style={{
                border: "1px solid white",
                padding: "10px",
              }}
            >
              Status
            </th>

            <th
              style={{
                border: "1px solid white",
                padding: "10px",
              }}
            >
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {loadingApprovals ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: "center",
                  padding: "20px",
                  border: "1px solid white",
                }}
              >
                Loading approvals...
              </td>
            </tr>
          ) : approvals.length > 0 ? (
            approvals.map((item) => (
              <tr key={item.id}>
                {/* REVIEWER */}

                <td
                  style={{
                    border: "1px solid white",
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  {getReviewerName(item)}
                </td>

                {/* DECISION */}

                <td
                  style={{
                    border: "1px solid white",
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  {item.decision_id}
                </td>

                {/* ASSIGNED BY */}

                <td
                  style={{
                    border: "1px solid white",
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  {getAssignedByName(item)}
                </td>

                {/* STATUS */}

                <td
                  style={{
                    border: "1px solid white",
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  {item.status}
                </td>

                {/* ACTION */}

                <td
                  style={{
                    border: "1px solid white",
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() =>
                      approve(item.id)
                    }
                    style={{
                      backgroundColor:
                        "#22c55e",
                      color: "white",
                      border: "none",
                      padding: "8px 15px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      reject(item.id)
                    }
                    style={{
                      backgroundColor:
                        "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "8px 15px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      marginLeft: "10px",
                    }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: "center",
                  padding: "20px",
                  border: "1px solid white",
                }}
              >
                No approvals found
              </td>
            </tr>
          )}
        </tbody>
      </table>
=======
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
>>>>>>> origin/nandhana
    </div>
  );
};

export default ApprovalsPage;