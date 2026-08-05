import React, { useEffect, useState } from "react";
import { reportsApi } from "../api/reports";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const TeamReportPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await reportsApi.teams();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filtered);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Team Report");
    XLSX.writeFile(workbook, "TeamReport.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Team Report", 14, 15);

    autoTable(doc, {
      head: [["ID", "Username", "Email", "Role"]],
      body: filtered.map((u) => [
        u.id,
        u.username,
        u.email,
        u.role,
      ]),
    });

    doc.save("TeamReport.pdf");
  };

  return (
    <div style={{ padding: 30, color: "white" }}>
      <h1>Team Report</h1>

      <input
        type="text"
        placeholder="Search user..."
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
            <th style={th}>Username</th>
            <th style={th}>Email</th>
            <th style={th}>Role</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((user) => (
            <tr key={user.id}>
              <td style={td}>{user.id}</td>
              <td style={td}>{user.username}</td>
              <td style={td}>{user.email}</td>
              <td style={td}>{user.role}</td>
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

export default TeamReportPage;