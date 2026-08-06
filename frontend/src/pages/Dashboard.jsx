import Layout from "../components/Layout";
import RecentNotifications from "../components/RecentNotifications";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

import {
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaPlusCircle,
  FaFolderOpen,
  FaUser,
  FaFilePdf,
  FaFileExcel,
  FaArrowRight,
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    full_name: "",
    role: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const [recentDecisions, setRecentDecisions] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [statsRes, decisionRes, userRes] =
        await Promise.all([
          api.get("/decisions/stats/dashboard", { headers }),
          api.get("/decisions/", { headers }),
          api.get("/me", { headers }),
        ]);

      setStats(statsRes.data);
      setRecentDecisions(decisionRes.data.slice(0, 5));
      setUser(userRes.data);

    } catch (err) {
      console.log(err);
    }
  };

const downloadPDF = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await api.get("/reports/pdf", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));

    const link = document.createElement("a");
    link.href = url;
    link.download = "Decision_Report.pdf";

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.log(err);
    alert("Failed to download PDF");
  }
};

const downloadExcel = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await api.get("/reports/excel", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));

    const link = document.createElement("a");
    link.href = url;
    link.download = "Decision_Report.xlsx";

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.log(err);
    alert("Failed to download Excel");
  }
};

  const cardStyle = {
    borderRadius: "18px",
    border: "none",
    boxShadow: "0 8px 25px rgba(0,0,0,.08)",
    transition: ".3s",
    cursor: "pointer",
  };

  const StatCard = (
    title,
    value,
    color,
    bg,
    icon
  ) => (
    <div className="col-lg-3 col-md-6 mb-4">

      <div
        className="card h-100"
        style={cardStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform =
            "translateY(-6px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform =
            "translateY(0px)";
        }}
      >

        <div className="card-body d-flex align-items-center">

          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 18,
              background: bg,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 28,
              color: color,
            }}
          >
            {icon}
          </div>

          <div className="ms-4">

            <h6 className="text-muted mb-2">
              {title}
            </h6>

            <h2 className="fw-bold mb-1">
              {value}
            </h2>

            <small
              style={{
                color: color,
                fontWeight: 600,
              }}
            >
              Updated Now
            </small>

          </div>

        </div>

      </div>

    </div>
  );

  // Decision Status Overview donut (pure CSS, no new packages)
  const DonutChart = () => {
    const total = stats.total || 1;
    const approvedDeg = (stats.approved / total) * 360;
    const pendingDeg = (stats.pending / total) * 360;
    const rejectedDeg = (stats.rejected / total) * 360;

    return (
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `conic-gradient(
            #16a34a 0deg ${approvedDeg}deg,
            #d97706 ${approvedDeg}deg ${approvedDeg + pendingDeg}deg,
            #dc2626 ${approvedDeg + pendingDeg}deg ${approvedDeg + pendingDeg + rejectedDeg}deg,
            #EEF4FF ${approvedDeg + pendingDeg + rejectedDeg}deg 360deg
          )`,
          margin: "0 auto",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h3 className="fw-bold mb-0" style={{ color: "#2563eb" }}>
            {stats.total}
          </h3>
          <small className="text-muted">Total</small>
        </div>
      </div>
    );
  };

    return (
    <Layout>
      <div className="container-fluid py-4">

        {/* Hero Section */}

        <div
          className="card border-0 mb-4"
          style={{
            borderRadius: "22px",
            background:
              "linear-gradient(135deg,#2563eb,#4f46e5,#7c3aed)",
            color: "white",
            boxShadow: "0 10px 30px rgba(37,99,235,.25)",
          }}
        >
          <div className="card-body p-4">

            <div className="row align-items-center">

              <div className="col-lg-8">

                <h2 className="fw-bold mb-2">
                  Welcome back,
                  {" "}
                  {user.full_name || "User"} 👋
                </h2>

                <p
                  className="mb-4"
                  style={{
  fontSize: "15px",
  opacity: 0.9,
  maxWidth: "520px",
  marginBottom: "15px",
}}
                >
                  Manage decisions, approvals, discussions,
                  reports and documents from one centralized
                  platform.
                </p>

                <button
                  className="btn btn-light btn-lg"
                  onClick={() => navigate("/create")}
                >
                  <FaPlusCircle className="me-2" />
                  Create Decision
                </button>

              </div>

              <div className="col-lg-4 text-end d-none d-lg-block">

                <FaClipboardList
                  size={90}
                  style={{
                    opacity: .15,
                  }}
                />

              </div>

            </div>

          </div>

        </div>

        {/* Statistics */}

        <div className="row">

          {StatCard(
            "Total Decisions",
            stats.total,
            "#2563eb",
            "#EEF4FF",
            <FaClipboardList />
          )}

          {StatCard(
            "Approved",
            stats.approved,
            "#16a34a",
            "#ECFDF3",
            <FaCheckCircle />
          )}

          {StatCard(
            "Pending",
            stats.pending,
            "#d97706",
            "#FFF7E6",
            <FaClock />
          )}

          {StatCard(
            "Rejected",
            stats.rejected,
            "#dc2626",
            "#FEECEC",
            <FaTimesCircle />
          )}

        </div>

        {/* Decision Status Overview + Notifications */}

        <div className="row mt-2">

          <div className="col-lg-4 mb-4">

            <div
              className="card border-0 h-100"
              style={{
                borderRadius: "18px",
                boxShadow: "0 8px 25px rgba(0,0,0,.08)",
              }}
            >

              <div className="card-body">

                <h4 className="fw-bold mb-4">
                  Decision Status Overview
                </h4>

                <DonutChart />

                <div className="d-flex justify-content-around mt-4">

                  <div className="text-center">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "#16a34a",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    ></div>
                    <small>Approved</small>
                  </div>

                  <div className="text-center">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "#d97706",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    ></div>
                    <small>Pending</small>
                  </div>

                  <div className="text-center">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "#dc2626",
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    ></div>
                    <small>Rejected</small>
                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="col-lg-8 mb-4">

            <RecentNotifications />

          </div>

        </div>

        {/* Recent Decisions (full width) */}

        <div className="row mt-2">

          <div className="col-lg-12 mb-4">

            <div
              className="card border-0"
              style={{
                borderRadius: "18px",
                boxShadow:
                  "0 8px 25px rgba(0,0,0,.08)",
              }}
            >

              <div className="card-body">

                <div className="d-flex justify-content-between align-items-center mb-4">

                  <h4 className="fw-bold mb-0">
                    Recent Decisions
                  </h4>

                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/decisions")}
                  >
                    View All
                  </button>

                </div>

                <table className="table align-middle">

                  <thead className="table-light">

                    <tr>

                      <th>Title</th>

                      <th>Category</th>

                      <th>Status</th>

                      <th></th>

                    </tr>

                  </thead>

                  <tbody>

                    {recentDecisions.length > 0 ? (

                      recentDecisions.map((decision) => (

                        <tr key={decision.id}>

                          <td className="fw-semibold">
                            {decision.title}
                          </td>

                          <td>
                            {decision.category}
                          </td>

                          <td>

                            <span
                              className={`badge ${
                                decision.status === "Approved"
                                  ? "bg-success"
                                  : decision.status === "Rejected"
                                  ? "bg-danger"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {decision.status}
                            </span>

                          </td>

                          <td>

                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                navigate(`/decision/${decision.id}`)
                              }
                            >
                              <FaArrowRight />
                            </button>

                          </td>

                        </tr>

                      ))

                    ) : (

                      <tr>

                        <td
                          colSpan="4"
                          className="text-center py-4"
                        >
                          No Decisions Found
                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>

        {/* Bottom Section */}

      <div className="row">

        {/* Quick Actions */}

        <div className="col-lg-4 mb-4">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "18px",
              boxShadow: "0 8px 25px rgba(0,0,0,.08)",
            }}
          >

            <div className="card-body">

              <h4 className="fw-bold mb-4">
                Quick Actions
              </h4>

              <div className="d-grid gap-3">

                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate("/create")}
                >
                  <FaPlusCircle className="me-2" />
                  Create Decision
                </button>

                <button
                  className="btn btn-success btn-lg"
                  onClick={() => navigate("/decisions")}
                >
                  <FaFolderOpen className="me-2" />
                  Manage Decisions
                </button>

                <button
                  className="btn btn-dark btn-lg"
                  onClick={() => navigate("/profile")}
                >
                  <FaUser className="me-2" />
                  My Profile
                </button>

              </div>

            </div>

          </div>

        </div>

        {/* Reports */}

        <div className="col-lg-4 mb-4">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "18px",
              boxShadow: "0 8px 25px rgba(0,0,0,.08)",
            }}
          >

            <div className="card-body">

              <h4 className="fw-bold mb-4">
                Reports
              </h4>

              <button
                className="btn btn-danger w-100 mb-3"
                onClick={downloadPDF}
              >
                <FaFilePdf className="me-2" />
                Download PDF Report
              </button>

              <button
                className="btn btn-success w-100"
                onClick={downloadExcel}
              >
                <FaFileExcel className="me-2" />
                Download Excel Report
              </button>

              <hr />

              <h6 className="text-muted mt-4">
                Export complete decision reports
                directly from your FastAPI backend.
              </h6>

            </div>

          </div>

        </div>

        {/* Status */}

        <div className="col-lg-4 mb-4">

          <div
            className="card border-0 h-100"
            style={{
              borderRadius: "18px",
              boxShadow: "0 8px 25px rgba(0,0,0,.08)",
            }}
          >

            <div className="card-body">

              <h4 className="fw-bold mb-4">
                Status Overview
              </h4>

              <div className="mb-3">

                <div className="d-flex justify-content-between">

                  <span>Approved</span>

                  <strong>{stats.approved}</strong>

                </div>

                <div className="progress mt-2">

                  <div
                    className="progress-bar bg-success"
                    style={{
                      width: stats.total
                        ? `${(stats.approved / stats.total) * 100}%`
                        : "0%",
                    }}
                  ></div>

                </div>

              </div>

              <div className="mb-3">

                <div className="d-flex justify-content-between">

                  <span>Pending</span>

                  <strong>{stats.pending}</strong>

                </div>

                <div className="progress mt-2">

                  <div
                    className="progress-bar bg-warning"
                    style={{
                      width: stats.total
                        ? `${(stats.pending / stats.total) * 100}%`
                        : "0%",
                    }}
                  ></div>

                </div>

              </div>

              <div>

                <div className="d-flex justify-content-between">

                  <span>Rejected</span>

                  <strong>{stats.rejected}</strong>

                </div>

                <div className="progress mt-2">

                  <div
                    className="progress-bar bg-danger"
                    style={{
                      width: stats.total
                        ? `${(stats.rejected / stats.total) * 100}%`
                        : "0%",
                    }}
                  ></div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  </Layout>

  );

}

export default Dashboard;