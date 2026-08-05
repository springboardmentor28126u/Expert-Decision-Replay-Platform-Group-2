import React, { useEffect, useState } from "react";
import { decisionsApi } from "../api/decisions";
import { Decision } from "../types";

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
      console.error(err);
    }
  };

  const filtered = decisions.filter(
    (d) =>
      (d.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.status ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        padding: "30px",
        color: "white",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>Decision Report</h1>

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
                <td style={td}>{d.title ?? "-"}</td>
                <td style={td}>{d.category ?? "-"}</td>
                <td style={td}>{d.status ?? "-"}</td>
                <td style={td}>
                  {d.created_at
                    ? new Date(d.created_at).toLocaleDateString()
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