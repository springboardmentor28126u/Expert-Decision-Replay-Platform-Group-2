import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function formatToLocalTime(dateStr) {
  if (!dateStr) return "N/A";
  const hasTimezone = /Z|\+\d{2}:\d{2}$/.test(dateStr);
  const isoString = hasTimezone ? dateStr : dateStr + "Z";
  return new Date(isoString).toLocaleString();
}

function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await api.get("/audit/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLogs(response.data);
    } catch (err) {
      console.log(err);
      alert("Failed to load audit logs");
    }
  };

  return (
    <Layout>
      <div className="container-fluid">

        <div className="card border-0 shadow-lg" style={{ borderRadius: "20px" }}>
          <div className="card-header bg-dark text-white">
            <h3 className="mb-0">📋 Audit Logs</h3>
          </div>

          <div className="card-body">

            <table className="table table-hover table-bordered align-middle">

              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>

                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.user_id}</td>
                      <td>
                        <span className="badge bg-primary">
                          {log.action}
                        </span>
                      </td>
                      <td>{log.description}</td>
                      <td>
                        {formatToLocalTime(log.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No Audit Logs Found
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>
        </div>

      </div>
    </Layout>
  );
}

export default AuditLogs;
