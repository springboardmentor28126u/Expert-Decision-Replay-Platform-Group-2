import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { approvalsApi } from "../api/approvals";

interface Approval {
  id: number;
  decision_id: number;
  status: string;
  created_at: string;
}

const MyApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadMyApprovals();
  }, []);

  const loadMyApprovals = async () => {
    try {
      const data = await approvalsApi.my();
      console.log("My Approvals:", data);
      setApprovals(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
  <div style={{ padding: "20px", color: "white" }}>
    <h2 style={{ marginBottom: "20px" }}>My Assigned Decisions</h2>

    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        color: "white",
      }}
    >
      <thead>
        <tr>
          <th style={{ border: "1px solid white", padding: "10px" }}>
            Decision ID
          </th>
          <th style={{ border: "1px solid white", padding: "10px" }}>
            Status
          </th>
          <th style={{ border: "1px solid white", padding: "10px" }}>
            Assigned At
          </th>
          <th style={{ border: "1px solid white", padding: "10px" }}>
            Open
          </th>
        </tr>
      </thead>

      <tbody>
        {approvals.map((item) => (
          <tr key={item.id}>
            <td style={{ border: "1px solid white", padding: "10px" }}>
              {item.decision_id}
            </td>

            <td style={{ border: "1px solid white", padding: "10px" }}>
              {item.status}
            </td>

            <td style={{ border: "1px solid white", padding: "10px" }}>
              {new Date(item.created_at).toLocaleString()}
            </td>

            <td style={{ border: "1px solid white", padding: "10px" }}>
              <button
                onClick={() =>
                  navigate(`/dashboard/decisions/${item.decision_id}/approvals`)
                }
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Open
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
};

export default MyApprovalsPage;