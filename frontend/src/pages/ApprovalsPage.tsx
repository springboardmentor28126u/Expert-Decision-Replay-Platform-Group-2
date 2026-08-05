import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { approvalsApi } from "../api/approvals";
import { usersApi } from "../api/users";

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

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");

  useEffect(() => {
    if (decisionId) {
      loadApprovals();
      loadReviewers();
    }
  }, [decisionId]);

  const loadApprovals = async () => {
    try {
      const data = await approvalsApi.list(decisionId);
      console.log("Approvals:", data);
      setApprovals(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadReviewers = async () => {
    try {
      const data = await usersApi.getReviewers();

      console.log("Reviewers:", data);

      setReviewers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const assignReviewer = async () => {
    if (!selectedReviewer) {
      alert("Select a reviewer");
      return;
    }

    try {
      await approvalsApi.assign(
        decisionId,
        Number(selectedReviewer),
        "Assigned by Administrator"
      );

      alert("Reviewer Assigned Successfully");

      setSelectedReviewer("");

      loadApprovals();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Assignment Failed");
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

  const reject = async (approvalId: number) => {
    const comments = prompt("Enter rejection comments");

    if (comments === null) return;

    try {
      await approvalsApi.reject(approvalId, comments);
      loadApprovals();
    } catch (error) {
      console.error(error);
    }
  };
  const getReviewerName = (reviewerId: number) => {
     const reviewer = reviewers.find(r => r.id === reviewerId);
     return reviewer ? reviewer.username : "Unknown";
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>Approvals</h2>

      <div
        style={{
          marginTop: 20,
          marginBottom: 20,
          display: "flex",
          gap: "15px",
          alignItems: "center",
        }}
      >
        <select
          value={selectedReviewer}
          onChange={(e) => setSelectedReviewer(e.target.value)}
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
          <option value="">Select Reviewer</option>

          {reviewers.map((reviewer: any) => (
            <option
              key={reviewer.id}
              value={reviewer.id}
              style={{
                backgroundColor: "white",
                color: "black",
              }}
            >
              {reviewer.username} ({reviewer.role})
            </option>
          ))}
        </select>

        <button
          onClick={assignReviewer}
          style={{
            backgroundColor: "green",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Assign Reviewer
        </button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
  <tr>
    <th style={{ border: "1px solid white", padding: "10px" }}>
      Reviewer
    </th>

    <th style={{ border: "1px solid white", padding: "10px" }}>
      Decision
    </th>

    <th style={{ border: "1px solid white", padding: "10px" }}>
      Assigned By
    </th>

    <th style={{ border: "1px solid white", padding: "10px" }}>
      Status
    </th>

    <th style={{ border: "1px solid white", padding: "10px" }}>
      Action
    </th>
  </tr>
</thead>
        

  
<tbody>
  {approvals.length > 0 ? (
    approvals.map((item) => (
      <tr key={item.id}>
        <td
          style={{
            border: "1px solid white",
            padding: "10px",
            textAlign: "center",
          }}
        >
          {getReviewerName(item.reviewer_id)}
        </td>

        <td
          style={{
            border: "1px solid white",
            padding: "10px",
            textAlign: "center",
          }}
        >
          {item.decision_id}
        </td>

        <td
          style={{
            border: "1px solid white",
            padding: "10px",
            textAlign: "center",
          }}
        >
          Administrator
        </td>

        <td
          style={{
            border: "1px solid white",
            padding: "10px",
            textAlign: "center",
          }}
        >
          {item.status}
        </td>

        <td
          style={{
            border: "1px solid white",
            padding: "10px",
            textAlign: "center",
          }}
        >
          <button
            onClick={() => approve(item.id)}
            style={{
              backgroundColor: "#22c55e",
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
            onClick={() => reject(item.id)}
            style={{
              backgroundColor: "#ef4444",
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