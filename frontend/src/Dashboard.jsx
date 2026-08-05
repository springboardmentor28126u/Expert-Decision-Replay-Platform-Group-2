import { useState, useEffect } from "react";
import axios from "axios";
import AppShell from "./AppShell";
import CreateDecision from "./CreateDecision";
import DecisionsList from "./DecisionsList";
import DecisionDetails from "./DecisionDetails";
import ChangePassword from "./ChangePassword";
import NotificationsPage from "./NotificationsPage";
import useNotifications from "./useNotifications";
import "./dashboard.css";

// --- Custom SVG Chart Components ---
function DonutChart({ data, title }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      {total === 0 ? (
        <div className="chart-empty">No data available</div>
      ) : (
        <div className="chart-container">
          <div style={{ width: "140px", height: "140px", flexShrink: 0, position: "relative" }}>
            <svg viewBox="-1.2 -1.2 2.4 2.4" className="donut-svg" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
              {data.map((item, idx) => {
                if (item.value === 0) return null;
                const startPercent = cumulativePercent;
                const endPercent = cumulativePercent + (item.value / total);
                cumulativePercent = endPercent;

                // Handle single slice of 100%
                if (item.value === total) {
                  return (
                    <circle key={idx} cx="0" cy="0" r="1" fill={item.color} className="chart-slice">
                      <title>{`${item.label}: ${item.value} (100%)`}</title>
                    </circle>
                  );
                }

                const [startX, startY] = getCoordinatesForPercent(startPercent);
                const [endX, endY] = getCoordinatesForPercent(endPercent);
                const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

                const pathData = [
                  `M ${startX} ${startY}`,
                  `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  `L 0 0`,
                ].join(" ");

                return (
                  <path
                    key={idx}
                    d={pathData}
                    fill={item.color}
                    className="chart-slice"
                    style={{ transition: "all 0.3s ease" }}
                  >
                    <title>{`${item.label}: ${item.value} (${((item.value / total) * 100).toFixed(1)}%)`}</title>
                  </path>
                );
              })}
              <circle cx="0" cy="0" r="0.65" fill="#171A21" />
            </svg>
          </div>
          <div className="chart-legend">
            {data.map((item, idx) => (
              <div key={idx} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: item.color }}></span>
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BarChart({ data, title }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      {data.length === 0 || data.every(d => d.value === 0) ? (
        <div className="chart-empty">No data available</div>
      ) : (
        <div className="bar-chart-container">
          {data.map((item, idx) => {
            const percentage = (item.value / maxValue) * 100;
            return (
              <div key={idx} className="bar-row">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="bar-label">{item.label}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>{item.value}</span>
                </div>
                <div className="bar-wrapper">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color || "var(--accent)",
                      transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LineChart({ data, title }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const width = 500;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute points
  const points = data.map((d, i) => {
    const x = paddingLeft + (i * chartWidth) / Math.max(data.length - 1, 1);
    const y = paddingTop + chartHeight - (d.value * chartHeight) / maxValue;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      {data.length === 0 || data.every(d => d.value === 0) ? (
        <div className="chart-empty">No activity recorded recently</div>
      ) : (
        <div className="chart-container" style={{ display: "block" }}>
          <svg viewBox={`0 0 ${width} ${height}`} className="line-chart-svg" style={{ width: "100%", height: "auto" }}>
            {/* Grid lines */}
            <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--border)" strokeDasharray="4 4" />
            <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="var(--border)" strokeDasharray="4 4" />
            <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="var(--border)" />

            {/* Area under the line */}
            {data.length > 1 && (
              <polygon
                points={`${paddingLeft},${paddingTop + chartHeight} ${points} ${width - paddingRight},${paddingTop + chartHeight}`}
                fill="url(#line-grad)"
                opacity="0.15"
              />
            )}

            {/* Line path */}
            {data.length > 1 ? (
              <polyline
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                points={points}
              />
            ) : (
              <circle cx={paddingLeft + chartWidth / 2} cy={paddingTop + chartHeight - (data[0].value * chartHeight) / maxValue} r="5" fill="var(--accent)" />
            )}

            {/* Points and labels */}
            {data.map((d, i) => {
              const x = paddingLeft + (i * chartWidth) / Math.max(data.length - 1, 1);
              const y = paddingTop + chartHeight - (d.value * chartHeight) / maxValue;
              return (
                <g key={i} className="chart-point-group">
                  <circle cx={x} cy={y} r="5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" className="chart-point" />
                  <text x={x} y={y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="bold">
                    {d.value}
                  </text>
                  <text x={x} y={paddingTop + chartHeight + 18} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
                    {d.label}
                  </text>
                </g>
              );
            })}

            {/* Gradients */}
            <defs>
              <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
}

function Dashboard({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [decisionSearchQuery, setDecisionSearchQuery] = useState("");

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications(token);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.log("Failed to load profile", err);
        onLogout();
      }
    };
    fetchProfile();
  }, [token, onLogout]);

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/decisions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDecisions(res.data);
      } catch (err) {
        console.log("Failed to load decisions for stats", err);
      }
    };
    fetchDecisions();
  }, [token, refreshKey]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!profile || profile.role !== "admin") return;
      try {
        const res = await axios.get("http://127.0.0.1:8000/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.log("Not authorized or failed to load users", err);
      }
    };
    fetchUsers();
  }, [profile, token]);

  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!profile || (profile.role !== "admin" && profile.role !== "manager")) return;
      try {
        const res = await axios.get("http://127.0.0.1:8000/audit-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuditLogs(res.data);
      } catch (err) {
        console.log("Failed to load audit logs for stats", err);
      }
    };
    fetchAuditLogs();
  }, [profile, token, refreshKey]);

  if (!profile) {
    return <div style={{ padding: 40 }}>Loading dashboard...</div>;
  }

  // Calculate role-based metrics and charts data
  const isEmployee = profile.role === "employee";
  const isReviewer = profile.role === "reviewer";
  const isManager = profile.role === "manager";
  const isAdmin = profile.role === "admin";

  const statusCounts = ["draft", "under_review", "approved", "rejected", "archived"].reduce(
    (acc, status) => {
      acc[status] = decisions.filter((d) => d.status === status).length;
      return acc;
    },
    {}
  );

  const myDecisions = decisions.filter((d) => d.created_by === profile.id);
  const myDecisionsCount = myDecisions.length;

  const myStatusCounts = ["draft", "under_review", "approved", "rejected", "archived"].reduce(
    (acc, status) => {
      acc[status] = myDecisions.filter((d) => d.status === status).length;
      return acc;
    },
    {}
  );

  // Status breakdown data
  const targetStatusCounts = isEmployee ? myStatusCounts : statusCounts;
  const statusChartData = [
    { label: "Draft", value: targetStatusCounts.draft || 0, color: "var(--text-muted)" },
    { label: "Under Review", value: targetStatusCounts.under_review || 0, color: "var(--warning)" },
    { label: "Approved", value: targetStatusCounts.approved || 0, color: "var(--success)" },
    { label: "Rejected", value: targetStatusCounts.rejected || 0, color: "var(--danger)" },
    { label: "Archived", value: targetStatusCounts.archived || 0, color: "#6366F1" },
  ];

  // Category breakdown data
  const categoryCounts = {};
  const targetDecisions = isEmployee ? myDecisions : decisions;
  targetDecisions.forEach((d) => {
    const cat = d.category || "Uncategorized";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categoryChartData = Object.entries(categoryCounts)
    .map(([label, value]) => ({
      label,
      value,
      color: "var(--accent)"
    }))
    .sort((a, b) => b.value - a.value);

  // User Roles breakdown data (Admin only)
  const roleCounts = {};
  (users || []).forEach((u) => {
    const r = u.role || "employee";
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  });
  const roleChartData = Object.entries(roleCounts).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color:
      label === "admin"
        ? "var(--danger)"
        : label === "manager"
        ? "var(--warning)"
        : label === "reviewer"
        ? "var(--accent)"
        : "var(--success)"
  }));

  // Audit activities breakdown data (Admin & Manager only)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split("T")[0]);
  }
  const dailyCounts = {};
  last7Days.forEach((day) => {
    dailyCounts[day] = 0;
  });
  auditLogs.forEach((log) => {
    if (log.created_at) {
      const dateStr = log.created_at.split("T")[0];
      if (dailyCounts[dateStr] !== undefined) {
        dailyCounts[dateStr]++;
      }
    }
  });
  const auditChartData = Object.entries(dailyCounts).map(([date, count]) => {
    const parts = date.split("-");
    let label = date;
    if (parts.length === 3) {
      const utcDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      label = utcDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    }
    return { label, value: count };
  });

  const handleNavigate = (view) => {
    setSelectedDecision(null);
    if (view === "decisions") {
      setStatusFilter("all");
    }
    setActiveView(view);
  };

  const handleSelectDecision = (decision) => {
    setSelectedDecision(decision);
    setActiveView("decision-details");
  };

  const handleNavigateToDecisionId = (decisionId) => {
    const decision = decisions.find((d) => d.id === decisionId);
    if (decision) {
      handleSelectDecision(decision);
    } else {
      setStatusFilter("all");
      setActiveView("decisions");
    }
  };

  const handleStatCardClick = (status) => {
    setStatusFilter(status);
    setActiveView("decisions");
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`http://127.0.0.1:8000/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Failed to update role", err);
      alert(err.response?.data?.detail || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn("Backend delete user endpoint not found or failed, deleting locally", err);
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <AppShell
      profile={profile}
      activeView={activeView}
      onNavigate={handleNavigate}
      onLogout={onLogout}
      unreadCount={unreadCount}
    >
      {activeView === "dashboard" && (
        <>
          {/* Role-Based Summary Cards */}
          <div className="dashboard-stat-row">
            {isAdmin && (
              <>
                <div className="stat-metric-card">
                  <p className="stat-metric-title">Total Users</p>
                  <p className="stat-metric-num">{users ? users.length : 0}</p>
                  <p className="stat-metric-desc">Registered platform users</p>
                </div>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleNavigate("decisions")}>
                  <p className="stat-metric-title">Total Decisions</p>
                  <p className="stat-metric-num">{decisions.length}</p>
                  <p className="stat-metric-desc">Decisions across all teams</p>
                </div>
                <div className="stat-metric-card">
                  <p className="stat-metric-title">Active Reviewers</p>
                  <p className="stat-metric-num">{users ? users.filter(u => u.role === "reviewer" && u.is_active).length : 0}</p>
                  <p className="stat-metric-desc">Reviewers currently active</p>
                </div>
                <div className="stat-metric-card">
                  <p className="stat-metric-title">Audit Events</p>
                  <p className="stat-metric-num">{auditLogs.length}</p>
                  <p className="stat-metric-desc">Logged system events</p>
                </div>
              </>
            )}

            {isManager && (
              <>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleNavigate("decisions")}>
                  <p className="stat-metric-title">Total Decisions</p>
                  <p className="stat-metric-num">{decisions.length}</p>
                  <p className="stat-metric-desc">Global platform decisions</p>
                </div>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleStatCardClick("under_review")}>
                  <p className="stat-metric-title">Under Review</p>
                  <p className="stat-metric-num">{statusCounts.under_review || 0}</p>
                  <p className="stat-metric-desc">Pending review decisions</p>
                </div>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleStatCardClick("approved")}>
                  <p className="stat-metric-title">Approved Decisions</p>
                  <p className="stat-metric-num">{statusCounts.approved || 0}</p>
                  <p className="stat-metric-desc">Successfully approved</p>
                </div>
                <div className="stat-metric-card">
                  <p className="stat-metric-title">Audit Logs</p>
                  <p className="stat-metric-num">{auditLogs.length}</p>
                  <p className="stat-metric-desc">Events you can monitor</p>
                </div>
              </>
            )}

            {isReviewer && (
              <>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleNavigate("decisions")}>
                  <p className="stat-metric-title">Total Decisions</p>
                  <p className="stat-metric-num">{decisions.length}</p>
                  <p className="stat-metric-desc">Global platform decisions</p>
                </div>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleStatCardClick("under_review")}>
                  <p className="stat-metric-title">Under Review</p>
                  <p className="stat-metric-num">{statusCounts.under_review || 0}</p>
                  <p className="stat-metric-desc">Awaiting your approval</p>
                </div>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleStatCardClick("approved")}>
                  <p className="stat-metric-title">Approved Decisions</p>
                  <p className="stat-metric-num">{statusCounts.approved || 0}</p>
                  <p className="stat-metric-desc">Approved decisions</p>
                </div>
                <div className="stat-metric-card">
                  <p className="stat-metric-title">My Created Decisions</p>
                  <p className="stat-metric-num">{myDecisionsCount}</p>
                  <p className="stat-metric-desc">Created by you</p>
                </div>
              </>
            )}

            {isEmployee && (
              <>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleNavigate("decisions")}>
                  <p className="stat-metric-title">My Decisions</p>
                  <p className="stat-metric-num">{myDecisionsCount}</p>
                  <p className="stat-metric-desc">Decisions authored by you</p>
                </div>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleStatCardClick("draft")}>
                  <p className="stat-metric-title">My Drafts</p>
                  <p className="stat-metric-num">{myStatusCounts.draft || 0}</p>
                  <p className="stat-metric-desc">Work in progress</p>
                </div>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleStatCardClick("under_review")}>
                  <p className="stat-metric-title">Under Review</p>
                  <p className="stat-metric-num">{myStatusCounts.under_review || 0}</p>
                  <p className="stat-metric-desc">Sent for approval</p>
                </div>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleStatCardClick("approved")}>
                  <p className="stat-metric-title">Approved Decisions</p>
                  <p className="stat-metric-num">{myStatusCounts.approved || 0}</p>
                  <p className="stat-metric-desc">Approved and finalized</p>
                </div>
              </>
            )}
          </div>

          {/* Role-Based Graphs Section */}
          <div className="analytics-grid">
            {/* All roles have status chart (though employees only see their own decisions) */}
            <DonutChart
              data={statusChartData}
              title={isEmployee ? "My Decisions Status Breakdown" : "System Decisions Status Breakdown"}
            />

            {/* All roles have category chart (though employees only see their own decisions) */}
            <BarChart
              data={categoryChartData}
              title={isEmployee ? "My Decisions by Category" : "System Decisions by Category"}
            />

            {/* ONLY Admins and Managers see Audit Activity Logs */}
            {(isAdmin || isManager) && (
              <LineChart
                data={auditChartData}
                title="System Activity Trend (Last 7 Days)"
              />
            )}

            {/* ONLY Admins see User Role Distribution */}
            {isAdmin && (
              <DonutChart
                data={roleChartData}
                title="User Role Distribution"
              />
            )}
          </div>

          <div className="panel">
            <p className="panel-title">Welcome back, {profile.full_name.split(" ")[0]}</p>
            <CreateDecision token={token} onCreated={() => setRefreshKey((k) => k + 1)} />
          </div>

          <div className="panel">
            <p className="panel-title">Recent Decisions</p>
            <DecisionsList
              token={token}
              refreshKey={refreshKey}
              role={profile.role}
              onSelectDecision={handleSelectDecision}
              pageSize={3}
              statusFilter="all"
            />
          </div>
        </>
      )}

      {activeView === "decisions" && (
        <div className="panel">
          <p className="panel-title">All Decisions</p>
          <CreateDecision token={token} onCreated={() => setRefreshKey((k) => k + 1)} />
          
          <div className="filter-container" style={{ margin: "20px 0 16px 0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
            <div style={{ flex: "1 1 auto", display: "flex", alignItems: "center", gap: "10px" }}>
              <label htmlFor="decision-search" style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>
                Search:
              </label>
              <input
                id="decision-search"
                type="text"
                placeholder="🔍 Search decisions by title or category..."
                value={decisionSearchQuery}
                onChange={(e) => setDecisionSearchQuery(e.target.value)}
                style={{
                  padding: "8px 12px",
                  background: "#12161D",
                  border: "1px solid #2E3646",
                  borderRadius: "6px",
                  color: "#F1F3F6",
                  fontSize: "14px",
                  width: "100%",
                  maxWidth: "350px",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label htmlFor="status-filter" style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "600" }}>
                Filter by Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-select"
                style={{
                  padding: "8px 12px",
                  background: "#12161D",
                  border: "1px solid #2E3646",
                  borderRadius: "6px",
                  color: "#F1F3F6",
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="all">All Decisions</option>
                <option value="draft">Draft</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <DecisionsList
            token={token}
            refreshKey={refreshKey}
            role={profile.role}
            onSelectDecision={handleSelectDecision}
            pageSize={10}
            statusFilter={statusFilter}
            searchQuery={decisionSearchQuery}
          />
        </div>
      )}

      {activeView === "decision-details" && selectedDecision && (
        <DecisionDetails
          decision={selectedDecision}
          token={token}
          profile={profile}
          onStatusUpdated={(updated) => setSelectedDecision(updated)}
          onBack={() => setActiveView("decisions")}
        />
      )}

      {activeView === "users" && profile.role === "admin" && (() => {
        const filteredUsers = (users || []).filter((u) => {
          const q = userSearchQuery.toLowerCase();
          return (
            u.full_name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
          );
        });
        const usersPerPage = 10;
        const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
        const userStartIndex = (currentUserPage - 1) * usersPerPage;
        const paginatedUsers = filteredUsers.slice(userStartIndex, userStartIndex + usersPerPage);

        return (
          <div className="panel">
            <p className="panel-title">User Management</p>
            {users ? (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search users by name, email, or role..."
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setCurrentUserPage(1);
                    }}
                    style={{
                      padding: "10px 16px",
                      background: "#12161D",
                      border: "1px solid #2E3646",
                      borderRadius: "8px",
                      color: "#F1F3F6",
                      fontSize: "14px",
                      width: "100%",
                      maxWidth: "400px",
                      outline: "none"
                    }}
                  />
                </div>

                <table className="dash-table user-table">
                  <thead>
                    <tr>
                      <th style={{ width: "25%" }}>Name</th>
                      <th style={{ width: "30%" }}>Email</th>
                      <th style={{ width: "20%" }}>Role</th>
                      <th style={{ width: "12%" }}>Status</th>
                      <th style={{ width: "13%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((u) => (
                        <tr key={u.id} className="dash-table-row">
                          <td style={{ fontWeight: "600" }}>{u.full_name}</td>
                          <td>{u.email}</td>
                          <td>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={u.id === profile.id}
                              style={{
                                padding: "6px 10px",
                                background: "#12161D",
                                border: "1px solid #2E3646",
                                borderRadius: "6px",
                                color: "#F1F3F6",
                                fontSize: "13px",
                                cursor: u.id === profile.id ? "not-allowed" : "pointer",
                                outline: "none"
                              }}
                            >
                              <option value="employee">Employee</option>
                              <option value="reviewer">Reviewer</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "700",
                                background: u.is_active ? "rgba(45, 212, 167, 0.12)" : "rgba(240, 85, 90, 0.12)",
                                color: u.is_active ? "var(--success)" : "var(--danger)"
                              }}
                            >
                              {u.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === profile.id}
                              style={{
                                padding: "6px 12px",
                                background: u.id === profile.id ? "transparent" : "rgba(240, 85, 90, 0.08)",
                                border: u.id === profile.id ? "1px solid var(--border)" : "1px solid var(--danger)",
                                color: u.id === profile.id ? "var(--text-muted)" : "var(--danger)",
                                borderRadius: "6px",
                                fontSize: "12px",
                                cursor: u.id === profile.id ? "not-allowed" : "pointer",
                                transition: "all 0.2s"
                              }}
                              onMouseOver={(e) => {
                                if (u.id !== profile.id) {
                                  e.currentTarget.style.background = "var(--danger)";
                                  e.currentTarget.style.color = "#0D1117";
                                }
                              }}
                              onMouseOut={(e) => {
                                if (u.id !== profile.id) {
                                  e.currentTarget.style.background = "rgba(240, 85, 90, 0.08)";
                                  e.currentTarget.style.color = "var(--danger)";
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px" }}>
                          No users matched your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {totalUserPages > 1 && (
                  <div
                    className="pagination-controls"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "12px",
                      marginTop: "24px",
                      paddingTop: "16px",
                      borderTop: "1px solid var(--border)"
                    }}
                  >
                    <button
                      onClick={() => setCurrentUserPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentUserPage === 1}
                      style={{
                        padding: "8px 16px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: currentUserPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
                        borderRadius: "6px",
                        cursor: currentUserPage === 1 ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        transition: "all 0.2s"
                      }}
                    >
                      ← Previous
                    </button>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>
                      Page {currentUserPage} of {totalUserPages}
                    </span>
                    <button
                      onClick={() => setCurrentUserPage((prev) => Math.min(prev + 1, totalUserPages))}
                      disabled={currentUserPage === totalUserPages}
                      style={{
                        padding: "8px 16px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: currentUserPage === totalUserPages ? "var(--text-muted)" : "var(--text-primary)",
                        borderRadius: "6px",
                        cursor: currentUserPage === totalUserPages ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        transition: "all 0.2s"
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p>Loading users...</p>
            )}
          </div>
        );
      })()}

      {activeView === "notifications" && (
        <NotificationsPage
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onNavigateToDecision={handleNavigateToDecisionId}
        />
      )}

      {activeView === "account" && (
        <div className="panel">
          <p className="panel-title">Account Settings</p>
          <ChangePassword token={token} />
        </div>
      )}
    </AppShell>
  );
}

export default Dashboard;