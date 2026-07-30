import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { useEffect, useState } from "react";
import API from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    recent: [],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
  try {
    // Dashboard statistics
    const statsResponse = await API.get("/dashboard/stats");
    setStats(statsResponse.data);

    // Logged-in user profile
    const profileResponse = await API.get("/profile/");
    setUser(profileResponse.data);

  } catch (error) {
    console.log("Dashboard Error:", error);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };


  return (
    <div className="dashboard">

      {/* Sidebar */}

      <div className="sidebar">

        <h1>EDRP</h1>

        <ul>

          <li>🏠 Dashboard</li>

          <li onClick={() => navigate("/decisions")}>
            📁 Decisions
          </li>

          <li onClick={() => navigate("/repository")}>
    📚 Repository
</li>
<li onClick={() => navigate("/discussions")}>
    💬 Discussions
</li>
<li onClick={() => navigate("/version-history")}>
    🕘 Version History
</li>
<li onClick={() => navigate("/reports")}>
    📊 Reports
</li>

          <li onClick={() => navigate("/profile")}>
    👤 Profile
</li>

          <li onClick={handleLogout}>
            🚪 Logout
          </li>

        </ul>

      </div>

      {/* Main Content */}

      <div className="main-content">

        {/* Top Bar */}

        <div className="topbar">

          <h2>Expert Decision Replay Platform</h2>
            <button
        className="login-btn"
        onClick={() => navigate("/login")}
    >
        Login
    </button>

        </div>

        {/* Dashboard Cards */}

        <div className="cards">

          <div className="card blue">
            <h3>Total Decisions</h3>
            <h1>{stats.total}</h1>
          </div>

          <div className="card orange">
            <h3>Pending Reviews</h3>
            <h1>{stats.pending}</h1>
          </div>

          <div className="card green">
            <h3>Approved</h3>
            <h1>{stats.approved}</h1>
          </div>

          <div className="card red">
            <h3>Rejected</h3>
            <h1>{stats.rejected}</h1>
          </div>

        </div>

        {/* Recent Decisions */}

        <div className="table-section">

          <div className="table-header">

            <h2>Recent Decisions</h2>

            {/* <button
              className="decision-btn"
              onClick={() => navigate("/decisions")}
            >
              Decision Management
            </button> */}

          </div>

          <table>

            <thead>

              <tr>

                <th>Decision</th>
                <th>CreatedBy</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {stats.recent.length === 0 ? (

                <tr>

                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No Decisions Found
                  </td>

                </tr>

              ) : (

                stats.recent.map((decision) => (

                  <tr key={decision.id}>

                    <td>{decision.title}</td>

                    <td>{decision.created_by}</td>

                    <td
                      className={
                        decision.status
                          ? decision.status.toLowerCase()
                          : ""
                      }
                    >
                      {decision.status}
                    </td>

                    <td>
                      {new Date(
                        decision.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td>

                      <button
                        className="view-btn"
                        onClick={() =>
                          navigate(`/decision/${decision.id}`)
                        }
                      >
                        View
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;