import React, { useEffect, useState } from "react";
import { reportsApi } from "../api/reports";
import { useNavigate } from "react-router-dom";

interface ReportData {
  total_decisions: number;
  approved: number;
  rejected: number;
  draft: number;
  under_review: number;
  archived: number;
}

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportData>({
    total_decisions: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
    under_review: 0,
    archived: 0,
  });

  useEffect(() => {
    loadReport();
  }, []);

 const loadReport = async () => {
  try {
    const data = await reportsApi.summary();

    console.log("Report Data:", data);

    if (data) {
      setReport(data);
    }
  } catch (error) {
    console.error(error);
  }
};

  const cardStyle = (background: string): React.CSSProperties => ({
    background,
    padding: "25px",
    borderRadius: "10px",
    textAlign: "center",
    color: "white",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  });

  const reportButtonStyle: React.CSSProperties = {
    padding: "25px",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: "30px" }}>Reports Dashboard</h1>

      {/* Summary Cards */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "20px",
        }}
      >
        <div style={cardStyle("#1f2937")}>
          <h3>Total Decisions</h3>
          <h1>{report?.total_decisions ?? 0}</h1>
        </div>

        <div style={cardStyle("green")}>
          <h3>Approved</h3>
          <h1>{report?.approved ?? 0}</h1>
        </div>

        <div style={cardStyle("red")}>
          <h3>Rejected</h3>
          <h1>{report?.rejected ?? 0}</h1>
        </div>

        <div style={cardStyle("#2563eb")}>
          <h3>Draft</h3>
          <h1>{report?.draft ?? 0}</h1>
        </div>

        <div style={cardStyle("orange")}>
          <h3>Under Review</h3>
          <h1>{report?.under_review ?? 0}</h1>
        </div>

        <div style={cardStyle("#6b7280")}>
          <h3>Archived</h3>
          <h1>{report?.archived ?? 0}</h1>
        </div>
      </div>

      {/* Available Reports */}

      <h2 style={{ marginTop: "50px", marginBottom: "20px" }}>
        Available Reports
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: "20px",
        }}
      >
        <button
          style={{ ...reportButtonStyle, background: "#2563eb" }}
          onClick={() => navigate("/dashboard/reports/decision")}
        >
          📄 Decision Report
        </button>

        <button
          style={{ ...reportButtonStyle, background: "#16a34a" }}
          onClick={() => navigate("/dashboard/reports/approval")}
        >
          ✅ Approval Report
        </button>

        <button
          style={{ ...reportButtonStyle, background: "#ea580c" }}
          onClick={() => navigate("/dashboard/reports/team")}
        >
          👥 Team Report
        </button>

        <button
          style={{ ...reportButtonStyle, background: "#7c3aed" }}
          onClick={() => navigate("/dashboard/reports/audit")}
        >
          📝 Audit Report
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;