import { useState, useEffect } from "react";
import { Pencil, Trash2, ChevronDown, ChevronUp, Users, Plus, X } from "lucide-react";
import axios from "axios";
import AppShell from "./AppShell";
import CreateDecision from "./CreateDecision";
import DecisionsList from "./DecisionsList";
import DecisionDetails from "./DecisionDetails";
import ChangePassword from "./ChangePassword";
import ReportsPage from "./ReportsPage";
import MyTeam from "./MyTeam";
import useNotifications from "./useNotifications";
import NotificationsPage from "./NotificationsPage";
import {
  getEmployeeDashboard,
  getReviewerDashboard,
  getManagerDashboard,
  getAdminDashboard,
} from "./api/dashboardService";
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
            <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--border)" strokeDasharray="4 4" />
            <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="var(--border)" strokeDasharray="4 4" />
            <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="var(--border)" />

            {data.length > 1 && (
              <polygon
                points={`${paddingLeft},${paddingTop + chartHeight} ${points} ${width - paddingRight},${paddingTop + chartHeight}`}
                fill="url(#line-grad)"
                opacity="0.15"
              />
            )}

            {data.length > 1 ? (
              <polyline fill="none" stroke="var(--accent)" strokeWidth="3" points={points} />
            ) : (
              <circle cx={paddingLeft + chartWidth / 2} cy={paddingTop + chartHeight - (data[0].value * chartHeight) / maxValue} r="5" fill="var(--accent)" />
            )}

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

// --- Notification bell shown in the top bar ---
function NotificationBell({ notifications, unreadCount, markAsRead, markAllAsRead, onNotificationClick, onViewAll }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          width: "36px",
          height: "36px",
          cursor: "pointer",
          fontSize: "16px",
          position: "relative",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "var(--danger)",
              color: "#fff",
              borderRadius: "999px",
              minWidth: "16px",
              height: "16px",
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "44px",
              right: 0,
              width: "300px",
              maxHeight: "360px",
              overflowY: "auto",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              zIndex: 20,
              padding: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "11px", cursor: "pointer" }}
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, padding: "8px 0" }}>No notifications yet.</p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {notifications.slice(0, 15).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) markAsRead(n.id);
                        setOpen(false);
                        if (onNotificationClick) onNotificationClick(n);
                      }}
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        opacity: n.is_read ? 0.6 : 1,
                      }}
                    >
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>{n.title}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>{n.message}</p>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "8px", textAlign: "center" }}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      if (onViewAll) onViewAll();
                    }}
                    style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "11.5px", fontWeight: "600", cursor: "pointer", width: "100%" }}
                  >
                    View all notifications
                  </button>
                </div>
              </>
            )}
          </div>
        </>
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [auditReport, setAuditReport] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Teams State
  const [userMgmtTab, setUserMgmtTab] = useState("users"); // "users" | "teams"
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState({}); // teamId -> boolean
  const [teamDetails, setTeamDetails] = useState({}); // teamId -> TeamDetailResponse
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [selectedTeamToEdit, setSelectedTeamToEdit] = useState(null);
  const [createTeamName, setCreateTeamName] = useState("");
  const [createTeamDesc, setCreateTeamDesc] = useState("");
  const [createTeamManagerId, setCreateTeamManagerId] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDesc, setEditTeamDesc] = useState("");
  const [editTeamManagerId, setEditTeamManagerId] = useState("");
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState({}); // teamId -> userId

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(token);

  useEffect(() => {
    const fetchTeamsData = async () => {
      if (!profile || profile.role !== "admin") return;
      try {
        setLoadingTeams(true);
        const res = await axios.get("http://127.0.0.1:8000/teams", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(res.data);
      } catch (err) {
        console.error("Failed to load teams", err);
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeamsData();
  }, [profile, token, refreshKey]);

  const toggleTeamExpand = async (teamId) => {
    const isExpanded = !expandedTeams[teamId];
    setExpandedTeams((prev) => ({ ...prev, [teamId]: isExpanded }));
    
    if (isExpanded) {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamDetails((prev) => ({ ...prev, [teamId]: res.data }));
      } catch (err) {
        console.error("Failed to fetch team details", err);
      }
    }
  };

  const handleAddMember = async (teamId) => {
    const userId = selectedMemberToAdd[teamId];
    if (!userId) return;
    try {
      await axios.post(
        `http://127.0.0.1:8000/teams/${teamId}/members`,
        { user_id: parseInt(userId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Re-fetch team details to update member list
      const res = await axios.get(`http://127.0.0.1:8000/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamDetails((prev) => ({ ...prev, [teamId]: res.data }));
      
      // Update team list count
      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, member_count: res.data.member_count } : t))
      );
      
      // Re-fetch users list to keep team assignments up-to-date
      const usersRes = await axios.get("http://127.0.0.1:8000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(usersRes.data);

      // Clear selection
      setSelectedMemberToAdd((prev) => ({ ...prev, [teamId]: "" }));
    } catch (err) {
      console.error("Failed to add member", err);
      alert(err.response?.data?.detail || "Failed to add member");
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    try {
      await axios.delete(
        `http://127.0.0.1:8000/teams/${teamId}/members/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Re-fetch team details to update member list
      const res = await axios.get(`http://127.0.0.1:8000/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamDetails((prev) => ({ ...prev, [teamId]: res.data }));
      
      // Update team list count
      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, member_count: res.data.member_count } : t))
      );
      
      // Re-fetch users list to keep team assignments up-to-date
      const usersRes = await axios.get("http://127.0.0.1:8000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to remove member", err);
      alert(err.response?.data?.detail || "Failed to remove member");
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createTeamName.trim()) return;
    try {
      await axios.post(
        "http://127.0.0.1:8000/teams",
        {
          name: createTeamName,
          description: createTeamDesc,
          manager_id: createTeamManagerId ? parseInt(createTeamManagerId) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreateTeamName("");
      setCreateTeamDesc("");
      setCreateTeamManagerId("");
      setShowCreateTeamModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to create team", err);
      alert(err.response?.data?.detail || "Failed to create team");
    }
  };

  const handleEditTeam = async (e) => {
    e.preventDefault();
    if (!selectedTeamToEdit || !editTeamName.trim()) return;
    try {
      await axios.patch(
        `http://127.0.0.1:8000/teams/${selectedTeamToEdit.id}`,
        {
          name: editTeamName,
          description: editTeamDesc,
          manager_id: editTeamManagerId ? parseInt(editTeamManagerId) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditTeamName("");
      setEditTeamDesc("");
      setEditTeamManagerId("");
      setSelectedTeamToEdit(null);
      setShowEditTeamModal(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to edit team", err);
      alert(err.response?.data?.detail || "Failed to edit team");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to delete team", err);
      alert(err.response?.data?.detail || "Failed to delete team");
    }
  };

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
    const fetchDashboardStats = async () => {
      if (!profile) return;
      setStatsLoading(true);
      try {
        let data;
        if (profile.role === "admin") {
          data = await getAdminDashboard(token);
        } else if (profile.role === "manager") {
          data = await getManagerDashboard(token);
        } else if (profile.role === "reviewer") {
          data = await getReviewerDashboard(token);
        } else if (profile.role === "employee") {
          data = await getEmployeeDashboard(token);
        }
        setDashboardStats(data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchDashboardStats();
  }, [profile, token, refreshKey]);

  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/decisions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDecisions(res.data.items);
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

  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!profile || (profile.role !== "admin" && profile.role !== "manager")) return;
      try {
        const res = await axios.get("http://127.0.0.1:8000/reports/audit", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuditReport(res.data);
        console.log("Audit Report:", res.data);
      } catch (err) {
        console.log("Failed to load audit logs for stats", err);
      }
    };
    fetchAuditLogs();
  }, [profile, token, refreshKey]);

  if (!profile) {
    return <div style={{ padding: 40 }}>Loading dashboard...</div>;
  }

  const isEmployee = profile.role === "employee";
  const isReviewer = profile.role === "reviewer";
  const isManager = profile.role === "manager";
  const isAdmin = profile.role === "admin";

  const statusCounts = {
    draft: dashboardStats?.draft_decisions || 0,
    under_review: dashboardStats?.under_review_decisions || 0,
    approved: dashboardStats?.approved_decisions || 0,
    rejected: dashboardStats?.rejected_decisions || 0,
    archived: dashboardStats?.archived_decisions || 0,
  };

  const myDecisionsCount = profile.role === "employee" 
    ? (dashboardStats?.my_decisions || 0)
    : (profile.role === "reviewer" 
        ? (dashboardStats?.my_decisions || 0)
        : 0);

  const myStatusCounts = {
    draft: dashboardStats?.draft_decisions || 0,
    under_review: dashboardStats?.under_review_decisions || 0,
    approved: dashboardStats?.approved_decisions || 0,
    rejected: dashboardStats?.rejected_decisions || 0,
    archived: dashboardStats?.archived_decisions || 0,
  };

  const targetStatusCounts = isEmployee ? myStatusCounts : statusCounts;
  const statusChartData = [
    { label: "Draft", value: targetStatusCounts.draft || 0, color: "var(--text-muted)" },
    { label: "Under Review", value: targetStatusCounts.under_review || 0, color: "var(--warning)" },
    { label: "Approved", value: targetStatusCounts.approved || 0, color: "var(--success)" },
    { label: "Rejected", value: targetStatusCounts.rejected || 0, color: "var(--danger)" },
    { label: "Archived", value: targetStatusCounts.archived || 0, color: "#6366F1" },
  ];

  const categoryChartData = Object.entries(dashboardStats?.category_counts || {})
    .map(([label, value]) => ({ label, value, color: "var(--accent)" }))
    .sort((a, b) => b.value - a.value);

  const roleCounts = {};
  (users || []).forEach((u) => {
    const r = u.role || "employee";
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  });
  const roleChartData = Object.entries(roleCounts).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color:
      label === "admin" ? "var(--danger)" :
      label === "manager" ? "var(--warning)" :
      label === "reviewer" ? "var(--accent)" : "var(--success)"
  }));

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split("T")[0]);
  }
 const auditChartData =
  auditReport?.timeline?.map(item => ({
    label: new Date(item.period).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: item.count,
  })) || [];
  console.log(auditChartData);

  const handleNavigate = (view) => {
    setSelectedDecision(null);
    if (view === "decisions") setStatusFilter("all");
    setActiveView(view);
  };

  const handleSelectDecision = (decision) => {
    setSelectedDecision(decision);
    setActiveView("decision-details");
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
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
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
      selectedDecisionId={selectedDecision?.id}
      topbarExtra={
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          onViewAll={() => handleNavigate("notifications")}
          onNotificationClick={(n) => {
            if (n.link) {
              const match = n.link.match(/\/decisions\/(\d+)/);
              if (match) {
                const decisionId = Number(match[1]);
                const decision = decisions.find(d => d.id === decisionId);
                if (decision) {
                  handleSelectDecision(decision);
                } else {
                  axios.get(`http://127.0.0.1:8000/decisions/${decisionId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  }).then(res => {
                    handleSelectDecision(res.data);
                  }).catch(err => {
                    console.error("Failed to fetch decision for navigation:", err);
                    handleNavigate("decisions");
                  });
                }
              }
            }
          }}
        />
      }
    >

      {activeView === "dashboard" && (
        <>
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
                  <p className="stat-metric-num">{dashboardStats?.total_decisions || 0}</p>
                  <p className="stat-metric-desc">Decisions across all teams</p>
                </div>
                <div className="stat-metric-card">
                  <p className="stat-metric-title">Active Reviewers</p>
                  <p className="stat-metric-num">{users ? users.filter(u => u.role === "reviewer" && u.is_active).length : 0}</p>
                  <p className="stat-metric-desc">Reviewers currently active</p>
                </div>
                <div className="stat-metric-card">
                  <p className="stat-metric-title">Audit Events</p>
                  <p className="stat-metric-num">{auditReport?.total_events || 0}</p>
                  <p className="stat-metric-desc">Logged system events</p>
                </div>
              </>
            )}

            {isManager && (
              <>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleNavigate("decisions")}>
                  <p className="stat-metric-title">Total Decisions</p>
                  <p className="stat-metric-num">{dashboardStats?.total_decisions || 0}</p>
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
                  <p className="stat-metric-num">{auditReport?.total_events || 0}</p>
                  <p className="stat-metric-desc">Events you can monitor</p>
                </div>
              </>
            )}

            {isReviewer && (
              <>
                <div className="stat-metric-card" style={{ cursor: "pointer" }} onClick={() => handleNavigate("decisions")}>
                  <p className="stat-metric-title">Total Decisions</p>
                  <p className="stat-metric-num">{dashboardStats?.total_decisions || 0}</p>
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

          <div className="analytics-grid">
            <DonutChart
              data={statusChartData}
              title={isEmployee ? "My Decisions Status Breakdown" : "System Decisions Status Breakdown"}
            />
            <BarChart
              data={categoryChartData}
              title={isEmployee ? "My Decisions by Category" : "System Decisions by Category"}
            />
            {(isAdmin || isManager) && (
              <LineChart data={auditChartData} title="System Activity Trend (Last 7 Days)" />
            )}
            {isAdmin && (
              <DonutChart data={roleChartData} title="User Role Distribution" />
            )}
          </div>
        </>
      )}

      {activeView === "decisions" && (
        <div className="panel">
          {/* Decisions toolbar */}
<div className="decisions-toolbar">
  <div className="decisions-toolbar-header">
    <div>
      <p className="panel-title decisions-toolbar-title">
        All Decisions
      </p>
      <p className="decisions-toolbar-subtitle">
        Browse, search, and manage your organization's decisions
      </p>
    </div>

    <button
      className="decisions-create-btn"
      onClick={() => setShowCreateModal(true)}
    >
      <span className="decisions-create-icon">+</span>
      Create Decision
    </button>
  </div>

  <div className="decisions-filters">
    <div className="decision-search-group">
      <label htmlFor="decision-search">
        Search decisions
      </label>

      <div className="decision-search-wrapper">
        <span className="decision-search-icon">⌕</span>

        <input
          id="decision-search"
          type="text"
          placeholder="Search by title or category..."
          value={decisionSearchQuery}
          onChange={(e) => setDecisionSearchQuery(e.target.value)}
        />
      </div>
    </div>

    <div className="decision-filter-group">
      <label htmlFor="owner-filter">
        Created By
      </label>

      <select
        id="owner-filter"
        value={ownerFilter}
        onChange={(e) => setOwnerFilter(e.target.value)}
      >
        <option value="all">All Decisions</option>
        <option value="mine">My Decisions</option>
      </select>
    </div>

    <div className="decision-filter-group">
      <label htmlFor="status-filter">
        Status
      </label>

      <select
        id="status-filter"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="status-select"
      >
        <option value="all">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="under_review">Under Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="archived">Archived</option>
      </select>
    </div>
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
            ownerFilter={ownerFilter}
            currentUserId={profile.id}
          />
        </div>
      )}

      {activeView === "reports" && <ReportsPage token={token} />}
      {activeView === "notifications" && (
        <NotificationsPage
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onNavigateToDecision={(decisionId) => {
            const decision = decisions.find(d => d.id === decisionId);
            if (decision) {
              handleSelectDecision(decision);
            } else {
              axios.get(`http://127.0.0.1:8000/decisions/${decisionId}`, {
                headers: { Authorization: `Bearer ${token}` }
              }).then(res => {
                handleSelectDecision(res.data);
              }).catch(err => {
                console.error("Failed to fetch decision for navigation:", err);
                handleNavigate("decisions");
              });
            }
          }}
        />
      )}
      {activeView === "my-team" && (
         <MyTeam token={token} profile={profile} />
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

            <div className="user-mgmt-tabs" style={{ display: "flex", background: "#0f1115", padding: "4px", borderRadius: "8px", width: "fit-content", marginBottom: "24px" }}>
              <button 
                className={`user-mgmt-tab-btn ${userMgmtTab === "users" ? "active" : ""}`}
                onClick={() => setUserMgmtTab("users")}
                style={{
                  background: userMgmtTab === "users" ? "rgba(79, 209, 181, 0.12)" : "transparent",
                  border: userMgmtTab === "users" ? "1px solid rgba(79, 209, 181, 0.2)" : "none",
                  color: userMgmtTab === "users" ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: "14px", fontWeight: "600", padding: "8px 16px", cursor: "pointer", borderRadius: "6px", transition: "all 0.2s ease",
                  outline: "none"
                }}
              >
                Users
              </button>
              <button 
                className={`user-mgmt-tab-btn ${userMgmtTab === "teams" ? "active" : ""}`}
                onClick={() => setUserMgmtTab("teams")}
                style={{
                  background: userMgmtTab === "teams" ? "rgba(79, 209, 181, 0.12)" : "transparent",
                  border: userMgmtTab === "teams" ? "1px solid rgba(79, 209, 181, 0.2)" : "none",
                  color: userMgmtTab === "teams" ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: "14px", fontWeight: "600", padding: "8px 16px", cursor: "pointer", borderRadius: "6px", transition: "all 0.2s ease",
                  outline: "none"
                }}
              >
                Teams
              </button>
            </div>

            {userMgmtTab === "users" ? (
              users ? (
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
                        padding: "10px 16px", background: "#12161D", border: "1px solid #2E3646",
                        borderRadius: "8px", color: "#F1F3F6", fontSize: "14px", width: "100%",
                        maxWidth: "400px", outline: "none"
                      }}
                    />
                  </div>

                  <table className="dash-table user-table">
                    <thead>
                      <tr>
                        <th style={{ width: "25%" }}>Name</th>
                        <th style={{ width: "30%" }}>Email</th>
                        <th style={{ width: "15%" }}>Role</th>
                        <th style={{ width: "12%" }}>Team</th>
                        <th style={{ width: "12%" }}>Status</th>
                        <th style={{ width: "13%" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.length > 0 ? (
                        paginatedUsers.map((u) => {
                          const userTeam = teams.find((t) => t.id === u.team_id);
                          return (
                            <tr key={u.id} className="dash-table-row">
                              <td style={{ fontWeight: "600" }}>{u.full_name}</td>
                              <td>{u.email}</td>
                              <td>
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  disabled={u.id === profile.id}
                                  style={{
                                    padding: "6px 10px", background: "#12161D", border: "1px solid #2E3646",
                                    borderRadius: "6px", color: "#F1F3F6", fontSize: "13px",
                                    cursor: u.id === profile.id ? "not-allowed" : "pointer", outline: "none"
                                  }}
                                >
                                  <option value="employee">Employee</option>
                                  <option value="reviewer">Reviewer</option>
                                  <option value="manager">Manager</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>

                              <td>
                                {userTeam ? userTeam.name : "Not assigned"}
                              </td>

                              <td>
                                <span
                                  style={{
                                    display: "inline-block", padding: "4px 8px", borderRadius: "12px",
                                    fontSize: "11px", fontWeight: "700",
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
                                    borderRadius: "6px", fontSize: "12px",
                                    cursor: u.id === profile.id ? "not-allowed" : "pointer", transition: "all 0.2s"
                                  }}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
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
                        display: "flex", justifyContent: "center", alignItems: "center", gap: "12px",
                        marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)"
                      }}
                    >
                      <button
                        onClick={() => setCurrentUserPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentUserPage === 1}
                        style={{
                          padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)",
                          color: currentUserPage === 1 ? "var(--text-muted)" : "var(--text-primary)",
                          borderRadius: "6px", cursor: currentUserPage === 1 ? "not-allowed" : "pointer",
                          fontSize: "13px", fontWeight: "600"
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
                          padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border)",
                          color: currentUserPage === totalUserPages ? "var(--text-muted)" : "var(--text-primary)",
                          borderRadius: "6px", cursor: currentUserPage === totalUserPages ? "not-allowed" : "pointer",
                          fontSize: "13px", fontWeight: "600"
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p>Loading users...</p>
              )
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    {teams.length} {teams.length === 1 ? "team" : "teams"}
                  </span>
                  <button 
                    onClick={() => {
                      setCreateTeamName("");
                      setCreateTeamDesc("");
                      setCreateTeamManagerId("");
                      setShowCreateTeamModal(true);
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "8px 16px", background: "var(--accent)", border: "none",
                      color: "#0F1115", borderRadius: "6px", cursor: "pointer",
                      fontSize: "14px", fontWeight: "600"
                    }}
                  >
                    <Plus size={16} /> Create Team
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {loadingTeams && teams.length === 0 ? (
                    <p>Loading teams...</p>
                  ) : teams.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No teams created yet.</p>
                  ) : (
                    teams.map((t) => {
                      const isExpanded = !!expandedTeams[t.id];
                      const detail = teamDetails[t.id];
                      const managerUser = users?.find((u) => u.id === t.manager_id);
                      const nonMembers = (users || []).filter((u) => u.team_id !== t.id && u.role !== "admin");

                      return (
                        <div key={t.id} style={{
                          background: "#171A21", border: "1px solid #262B36", borderRadius: "8px", padding: "20px",
                          display: "flex", flexDirection: "column", gap: "16px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>{t.name}</h3>
                              <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--text-secondary)" }}>
                                Manager: <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{managerUser ? managerUser.full_name : "Not assigned"}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #262B36", paddingTop: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "14px" }}>
                              <Users size={16} />
                              <span>{t.member_count ?? 0} {t.member_count === 1 ? "member" : "members"}</span>
                            </div>
                            <div style={{ display: "flex", gap: "10px" }}>
                              <button
                                onClick={() => toggleTeamExpand(t.id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "6px",
                                  padding: "6px 12px", background: "transparent", border: "1px solid #2E3646",
                                  color: "var(--text-primary)", borderRadius: "6px", cursor: "pointer",
                                  fontSize: "13px", fontWeight: "600", outline: "none"
                                }}
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {isExpanded ? "Hide Members" : "View Members"}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTeamToEdit(t);
                                  setEditTeamName(t.name);
                                  setEditTeamDesc(t.description || "");
                                  setEditTeamManagerId(t.manager_id || "");
                                  setShowEditTeamModal(true);
                                }}
                                style={{
                                  display: "flex", alignItems: "center", gap: "6px",
                                  padding: "6px 12px", background: "transparent", border: "1px solid #2E3646",
                                  color: "var(--text-primary)", borderRadius: "6px", cursor: "pointer",
                                  fontSize: "13px", fontWeight: "600", outline: "none"
                                }}
                              >
                                <Pencil size={14} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTeam(t.id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "6px",
                                  padding: "6px 12px", background: "rgba(240, 85, 90, 0.08)", border: "1px solid var(--danger)",
                                  color: "var(--danger)", borderRadius: "6px", cursor: "pointer",
                                  fontSize: "13px", fontWeight: "600", outline: "none"
                                }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{
                              background: "#12161D", border: "1px solid #2E3646", borderRadius: "6px", padding: "16px",
                              display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px"
                            }}>
                              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>Team Members</h4>
                              {!detail ? (
                                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Loading members...</p>
                              ) : detail.members && detail.members.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  {detail.members.map((m) => (
                                    <div key={m.id} style={{
                                      display: "flex", justifyContent: "space-between", alignItems: "center",
                                      padding: "8px 12px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "4px"
                                    }}>
                                      <div>
                                        <div style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "13px" }}>{m.full_name}</div>
                                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{m.email}</div>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveMember(t.id, m.id)}
                                        style={{
                                          background: "transparent", border: "none", color: "var(--text-muted)",
                                          cursor: "pointer", display: "flex", alignItems: "center", padding: "4px"
                                        }}
                                        title="Remove from team"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No members in this team.</p>
                              )}

                              <div style={{
                                display: "flex", gap: "8px", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)"
                              }}>
                                <select
                                  value={selectedMemberToAdd[t.id] || ""}
                                  onChange={(e) => setSelectedMemberToAdd(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  style={{
                                    flex: 1, padding: "8px 12px", background: "#12161D", border: "1px solid #2E3646",
                                    borderRadius: "6px", color: "#F1F3F6", fontSize: "13px", outline: "none"
                                  }}
                                >
                                  <option value="">Select user to add...</option>
                                  {nonMembers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.full_name} ({u.role})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleAddMember(t.id)}
                                  disabled={!selectedMemberToAdd[t.id]}
                                  style={{
                                    padding: "8px 16px", background: selectedMemberToAdd[t.id] ? "var(--accent)" : "rgba(79, 209, 181, 0.2)",
                                    border: "none", color: "#0F1115", borderRadius: "6px", cursor: selectedMemberToAdd[t.id] ? "pointer" : "not-allowed",
                                    fontSize: "13px", fontWeight: "600", outline: "none"
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeView === "account" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="panel">
            <p className="panel-title">Profile Information</p>

            <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
              <div>
                <strong>Full Name</strong>
                <p>{profile.full_name}</p>
              </div>

              <div>
                <strong>Email</strong>
                <p>{profile.email}</p>
              </div>

              <div>
                <strong>Role</strong>
                <p style={{ textTransform: "capitalize" }}>{profile.role}</p>
              </div>

              <div>
                <strong>Team</strong>
                <p>
                 {profile.team_id
                   ? `Team ID: ${profile.team_id}`
                   : "Not assigned to a team"}
                </p>
             </div>
          </div>
       </div>

       <div className="panel">
         <p className="panel-title">Account Settings</p>
         <ChangePassword token={token} />
       </div>
      </div>
    )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ padding: "24px" }}>
            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
            <div style={{ marginTop: "12px" }}>
              <CreateDecision
                token={token}
                onCreated={() => {
                  setRefreshKey((k) => k + 1);
                  setShowCreateModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showCreateTeamModal && (
        <div className="modal-overlay" onClick={() => setShowCreateTeamModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ padding: "24px" }}>
            <button className="modal-close-btn" onClick={() => setShowCreateTeamModal(false)}>&times;</button>
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Create New Team</h3>
            <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Automation"
                  value={createTeamName}
                  onChange={(e) => setCreateTeamName(e.target.value)}
                  style={{
                    padding: "10px 12px", background: "#12161D", border: "1px solid #2E3646",
                    borderRadius: "6px", color: "#F1F3F6", fontSize: "14px", outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Description</label>
                <textarea
                  placeholder="Describe the team's scope..."
                  value={createTeamDesc}
                  onChange={(e) => setCreateTeamDesc(e.target.value)}
                  style={{
                    padding: "10px 12px", background: "#12161D", border: "1px solid #2E3646",
                    borderRadius: "6px", color: "#F1F3F6", fontSize: "14px", outline: "none",
                    minHeight: "80px", resize: "vertical", fontFamily: "inherit"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Team Manager</label>
                <select
                  value={createTeamManagerId}
                  onChange={(e) => setCreateTeamManagerId(e.target.value)}
                  style={{
                    padding: "10px 12px", background: "#12161D", border: "1px solid #2E3646",
                    borderRadius: "6px", color: "#F1F3F6", fontSize: "14px", outline: "none"
                  }}
                >
                  <option value="">Select a manager (optional)...</option>
                  {(users || []).filter((u) => u.role === "manager").map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: "8px", padding: "10px 16px", background: "var(--accent)", border: "none",
                  color: "#0F1115", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600"
                }}
              >
                Create Team
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditTeamModal && (
        <div className="modal-overlay" onClick={() => setShowEditTeamModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ padding: "24px" }}>
            <button className="modal-close-btn" onClick={() => setShowEditTeamModal(false)}>&times;</button>
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Edit Team</h3>
            <form onSubmit={handleEditTeam} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Automation"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  style={{
                    padding: "10px 12px", background: "#12161D", border: "1px solid #2E3646",
                    borderRadius: "6px", color: "#F1F3F6", fontSize: "14px", outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Description</label>
                <textarea
                  placeholder="Describe the team's scope..."
                  value={editTeamDesc}
                  onChange={(e) => setEditTeamDesc(e.target.value)}
                  style={{
                    padding: "10px 12px", background: "#12161D", border: "1px solid #2E3646",
                    borderRadius: "6px", color: "#F1F3F6", fontSize: "14px", outline: "none",
                    minHeight: "80px", resize: "vertical", fontFamily: "inherit"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>Team Manager</label>
                <select
                  value={editTeamManagerId}
                  onChange={(e) => setEditTeamManagerId(e.target.value)}
                  style={{
                    padding: "10px 12px", background: "#12161D", border: "1px solid #2E3646",
                    borderRadius: "6px", color: "#F1F3F6", fontSize: "14px", outline: "none"
                  }}
                >
                  <option value="">Select a manager (optional)...</option>
                  {(users || []).filter((u) => u.role === "manager").map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: "8px", padding: "10px 16px", background: "var(--accent)", border: "none",
                  color: "#0F1115", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600"
                }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default Dashboard;