import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { approvalsApi } from "../api/approvals";
import { usersApi } from "../api/users";
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

  // =========================================================
  // STATE
  // =========================================================

  const [approvals, setApprovals] = useState<Approval[]>([]);

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

  useEffect(() => {
    if (decisionId) {
      loadApprovals();
    }
  }, [decisionId]);

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

      console.log(
        "Reviewers received:",
        data
      );

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

    try {
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
        }}
      >
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
    </div>
  );
};

export default ApprovalsPage;