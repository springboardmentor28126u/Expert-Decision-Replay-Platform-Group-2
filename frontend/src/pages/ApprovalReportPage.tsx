import React, { useEffect, useState } from "react";
import { reportsApi } from "../api/reports";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Approval {
  id: number;
  decision_id: number;
  reviewer_id: number;
  status: string;
  comments?: string;
  created_at: string;
  approved_at?: string | null;
}

const ApprovalReportPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);
const loadData = async () => {
  try {
    const data = await reportsApi.approvals();
    console.log("Approval Report:", data);
    setApprovals(data);
  } catch (err) {
    console.error(err);
  }
};

  const filtered = approvals.filter(
    (a) =>
      a.status.toLowerCase().includes(search.toLowerCase()) ||
      a.decision_id.toString().includes(search) ||
      a.reviewer_id.toString().includes(search)
  );

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((a) => ({
        ID: a.id,
        Decision: a.decision_id,
        Reviewer: a.reviewer_id,
        Status: a.status,
        Assigned: new Date(a.created_at).toLocaleDateString(),
        Approved: a.approved_at
          ? new Date(a.approved_at).toLocaleDateString()
          : "-",
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Approval Report");
    XLSX.writeFile(workbook, "ApprovalReport.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Approval Report", 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["ID", "Decision", "Reviewer", "Status", "Assigned", "Approved"]],
      body: filtered.map((a) => [
        a.id,
        a.decision_id,
        a.reviewer_id,
        a.status,
        new Date(a.created_at).toLocaleDateString(),
        a.approved_at
          ? new Date(a.approved_at).toLocaleDateString()
          : "-",
      ]),
    });

    doc.save("ApprovalReport.pdf");
  };

  return (
    <div style={{ padding: "30px", color: "white" }}>
      <h1 style={{ marginBottom: "20px" }}>Approval Report</h1>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "300px",
          padding: "10px",
          marginBottom: "20px",
          borderRadius: "6px",
        }}
      />

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={exportExcel}
          style={{
            background: "#16a34a",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            marginRight: "10px",
            cursor: "pointer",
          }}
        >
          Export Excel
        </button>

        <button
          onClick={exportPDF}
          style={{
            background: "#dc2626",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Export PDF
        </button>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Decision</th>
            <th style={th}>Reviewer</th>
            <th style={th}>Status</th>
            <th style={th}>Assigned</th>
            <th style={th}>Approved</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((a) => (
            <tr key={a.id}>
              <td style={td}>{a.id}</td>
              <td style={td}>{a.decision_id}</td>
              <td style={td}>{a.reviewer_id}</td>
              <td style={td}>{a.status}</td>
              <td style={td}>
                {new Date(a.created_at).toLocaleDateString()}
              </td>
              <td style={td}>
                {a.approved_at
                  ? new Date(a.approved_at).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "20px",
                  textAlign: "center",
                  border: "1px solid white",
                }}
              >
                No approvals found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const th: React.CSSProperties = {
  border: "1px solid white",
  padding: "12px",
  background: "#374151",
};

const td: React.CSSProperties = {
  border: "1px solid white",
  padding: "10px",
  textAlign: "center",
};

export default ApprovalReportPage;