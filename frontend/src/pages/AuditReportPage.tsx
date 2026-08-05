import React, { useEffect, useState } from "react";
import { reportsApi } from "../api/reports";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Decision {
  id: number;
  title: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const AuditReportPage: React.FC = () => {
  const [records, setRecords] = useState<Decision[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    try {
      const data = await reportsApi.audit();
      setRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = records.filter(
    (r) =>
      (r.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (r.status ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filtered);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Report");
    XLSX.writeFile(workbook, "AuditReport.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Audit Report", 14, 15);

    autoTable(doc, {
      head: [["ID", "Title", "Status", "Created", "Updated"]],
      body: filtered.map((r) => [
        r.id,
        r.title ?? "-",
        r.status ?? "-",
        r.created_at
          ? new Date(r.created_at).toLocaleDateString()
          : "-",
        r.updated_at
          ? new Date(r.updated_at).toLocaleDateString()
          : "-",
      ]),
    });

    doc.save("AuditReport.pdf");
  };

  return (
    <div style={{ padding: 30, color: "white" }}>
      <h1>Audit Report</h1>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: 300,
          padding: 10,
          marginTop: 20,
          marginBottom: 20,
          borderRadius: 6,
        }}
      />

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={exportExcel}
          style={{
            background: "#16a34a",
            color: "white",
            padding: "10px 20px",
            border: "none",
            marginRight: 10,
            borderRadius: 6,
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
            borderRadius: 6,
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
            <th style={th}>Title</th>
            <th style={th}>Status</th>
            <th style={th}>Created</th>
            <th style={th}>Updated</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td style={td}>{r.id}</td>
              <td style={td}>{r.title ?? "-"}</td>
              <td style={td}>{r.status ?? "-"}</td>
              <td style={td}>
                {r.created_at
                  ? new Date(r.created_at).toLocaleDateString()
                  : "-"}
              </td>
              <td style={td}>
                {r.updated_at
                  ? new Date(r.updated_at).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const th: React.CSSProperties = {
  border: "1px solid white",
  padding: 12,
  background: "#374151",
};

const td: React.CSSProperties = {
  border: "1px solid white",
  padding: 10,
  textAlign: "center",
};

export default AuditReportPage;