import React, { useEffect, useState } from "react";
import { decisionsApi } from "../api/decisions";
import { Decision } from "../types";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DecisionReportPage: React.FC = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const data = await decisionsApi.list({
        page: 1,
        page_size: 100,
      });

      setDecisions(data.items);
    } catch (err) {
      console.error("Failed to load report:", err);
    }
  };

  const filtered = decisions.filter(
    (d) =>
      (d.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.status ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

<<<<<<< HEAD
  // =========================
  // EXPORT EXCEL
  // =========================
  const exportExcel = () => {
    if (filtered.length === 0) {
      alert("No decisions available to export.");
      return;
    }

    const excelData = filtered.map((d) => ({
      ID: d.id,
      Title: d.title ?? "-",
      Category: d.category ?? "-",
      Status: d.status ?? "-",
      "Created At": d.created_at
        ? new Date(d.created_at).toLocaleDateString()
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Decision Report"
    );

    XLSX.writeFile(workbook, "Decision_Report.xlsx");
  };

  // =========================
  // EXPORT PDF
  // =========================
  const exportPDF = () => {
    if (filtered.length === 0) {
      alert("No decisions available to export.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Decision Report", 14, 20);

    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      14,
      28
    );

    const tableData = filtered.map((d) => [
      d.id?.toString() ?? "-",
      d.title ?? "-",
      d.category ?? "-",
      d.status ?? "-",
      d.created_at
        ? new Date(d.created_at).toLocaleDateString()
        : "-",
    ]);

    autoTable(doc, {
      head: [
        ["ID", "Title", "Category", "Status", "Created At"],
      ],
      body: tableData,
      startY: 35,
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [55, 65, 81],
      },
    });

    doc.save("Decision_Report.pdf");
=======
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((d) => ({
        ID: d.id,
        Title: d.title ?? "-",
        Category: d.category ?? "-",
        Status: d.status ?? "-",
        "Created At": d.created_at
          ? new Date(d.created_at).toLocaleDateString()
          : "-",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Decision Report");
    XLSX.writeFile(workbook, "DecisionReport.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Decision Report", 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["ID", "Title", "Category", "Status", "Created At"]],
      body: filtered.map((d) => [
        d.id,
        d.title ?? "-",
        d.category ?? "-",
        d.status ?? "-",
        d.created_at
          ? new Date(d.created_at).toLocaleDateString()
          : "-",
      ]),
    });

    doc.save("DecisionReport.pdf");
>>>>>>> origin/nandhana
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>
        Decision Report
      </h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search decision..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "300px",
          padding: "10px",
          marginBottom: "20px",
          borderRadius: "6px",
        }}
      />

      {/* Export Buttons */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={exportExcel}
          style={{
            background: "#16a34a",
            color: "white",
            padding: "10px 20px",
            marginRight: "10px",
            border: "none",
            borderRadius: "6px",
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

      {/* Table */}
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
            <th style={th}>Category</th>
            <th style={th}>Status</th>
            <th style={th}>Created At</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length > 0 ? (
            filtered.map((d) => (
              <tr key={d.id}>
                <td style={td}>{d.id}</td>

                <td style={td}>
                  {d.title ?? "-"}
                </td>

                <td style={td}>
                  {d.category ?? "-"}
                </td>

                <td style={td}>
                  {d.status ?? "-"}
                </td>

                <td style={td}>
                  {d.created_at
                    ? new Date(
                        d.created_at
                      ).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={td} colSpan={5}>
                No decisions found
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
  color: "white",
};

const td: React.CSSProperties = {
  border: "1px solid white",
  padding: "10px",
  textAlign: "center",
};

export default DecisionReportPage;