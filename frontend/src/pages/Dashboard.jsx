import { useState, useEffect } from "react";
import axios from "axios";
import AppShell from "../components/AppShell";
import CreateDecision from "../components/CreateDecision";
import DecisionsList from "../components/DecisionsList";
import DecisionDetails from "./DecisionDetails";
import ChangePassword from "../components/ChangePassword";
import NotificationsPage from "./NotificationsPage";
import ReportsPage from "./ReportsPage";
import "../styles/dashboard.css";

function Dashboard({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [decisionSearchQuery, setDecisionSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/users/me", {
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
    const fetchSummary = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/dashboard/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(res.data);
        setSummaryError("");
      } catch (err) {
        console.log("Failed to load dashboard summary", err);
        setSummaryError("Failed to load dashboard statistics.");
      }
    };
    fetchSummary();
  }, [token, refreshKey]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!profile || profile.role?.name !== "administrator") return;
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/users/?page=1&page_size=100", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.items);
      } catch (err) {
        console.log("Not authorized or failed to load users", err);
      }
    };
    fetchUsers();
  }, [profile, token]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        console.log("Failed to load notifications", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [token]);

  if (!profile) {
    return <div style={{ padding: 40 }}>Loading dashboard...</div>;
  }

  const statusCounts = summary?.decision_status_counts ?? {
    draft: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
  };
  const adminStats = summary?.admin_stats ?? null;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Backend roles are a UUID-keyed lookup table (no name-based role
  // assignment) and there's no dedicated roles-listing endpoint, so the
  // id for each role name is derived from whichever users are already
  // loaded. A role with zero current members has no derivable id.
  const roleIdByName = (users || []).reduce((acc, u) => {
    if (u.role?.name && u.role?.id) acc[u.role.name] = u.role.id;
    return acc;
  }, {});

  const handleNavigate = (view) => {
    setSelectedDecision(null);
    // When navigating to decisions tab directly, reset filter to 'all'
    if (view === "decisions") {
      setStatusFilter("all");
    }
    setActiveView(view);
  };

  const handleSelectDecision = (decision) => {
    setSelectedDecision(decision);
    setActiveView("decision-details");
  };

  // Notifications carry a polymorphic (related_entity_type, related_entity_id)
  // pointer rather than a URL — "decision" points straight at a Decision,
  // "approval" points at an Approval, which is resolved to its parent
  // Decision first. Anything else (or a lookup failure) falls back to the
  // Decisions tab rather than leaving the user stranded.
  const handleNavigateFromNotification = async (notification) => {
    try {
      let decisionId = null;

      if (notification.related_entity_type === "decision") {
        decisionId = notification.related_entity_id;
      } else if (notification.related_entity_type === "approval") {
        const approvalRes = await axios.get(
          `http://127.0.0.1:8000/api/v1/approvals/${notification.related_entity_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        decisionId = approvalRes.data.decision_id;
      }

      if (!decisionId) {
        setStatusFilter("all");
        setActiveView("decisions");
        return;
      }

      const decisionRes = await axios.get(`http://127.0.0.1:8000/api/v1/decisions/${decisionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleSelectDecision(decisionRes.data);
    } catch (err) {
      console.error("Failed to open decision from notification", err);
      setStatusFilter("all");
      setActiveView("decisions");
    }
  };

  const handleMarkNotificationAsRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/v1/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await axios.patch(
        "http://127.0.0.1:8000/api/v1/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const handleStatCardClick = (status) => {
    setStatusFilter(status);
    setActiveView("decisions");
  };

  const handleRoleChange = async (userId, newRoleName) => {
    const roleId = roleIdByName[newRoleName];
    if (!roleId) {
      alert(`Cannot assign "${newRoleName}" — no existing user currently holds that role, so its id can't be resolved.`);
      return;
    }
    try {
      const res = await axios.patch(
        `http://127.0.0.1:8000/api/v1/users/${userId}/role`,
        { role_id: roleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
    } catch (err) {
      console.error("Failed to update role", err);
      alert(err.response?.data?.detail || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Failed to delete user", err);
      alert(err.response?.data?.detail || "Failed to delete user");
    }
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
          <div className="stat-grid">
            <div className="stat-card draft" onClick={() => handleStatCardClick("draft")} role="button" tabIndex={0}>
              <p className="stat-card-label">Draft</p>
              <p className="stat-card-value">{statusCounts.draft}</p>
            </div>
            <div className="stat-card under_review" onClick={() => handleStatCardClick("under_review")} role="button" tabIndex={0}>
              <p className="stat-card-label">Under Review</p>
              <p className="stat-card-value">{statusCounts.under_review}</p>
            </div>
            <div className="stat-card approved" onClick={() => handleStatCardClick("approved")} role="button" tabIndex={0}>
              <p className="stat-card-label">Approved</p>
              <p className="stat-card-value">{statusCounts.approved}</p>
            </div>
            <div className="stat-card rejected" onClick={() => handleStatCardClick("rejected")} role="button" tabIndex={0}>
              <p className="stat-card-label">Rejected</p>
              <p className="stat-card-value">{statusCounts.rejected}</p>
            </div>
            <div className="stat-card archived" onClick={() => handleStatCardClick("archived")} role="button" tabIndex={0}>
              <p className="stat-card-label">Archived</p>
              <p className="stat-card-value">{statusCounts.archived}</p>
            </div>
          </div>

          {summaryError && (
            <p style={{ color: "var(--danger)", fontSize: "13px", margin: "0 0 16px" }}>{summaryError}</p>
          )}

          {adminStats && (
            <div className="panel">
              <p className="panel-title">Organization Overview</p>
              <div className="stat-grid">
                <div className="stat-card">
                  <p className="stat-card-label">Total Users</p>
                  <p className="stat-card-value">{adminStats.total_users}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-card-label">Active Users</p>
                  <p className="stat-card-value">{adminStats.active_users}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-card-label">Employees</p>
                  <p className="stat-card-value">{adminStats.users_by_role.employee}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-card-label">Reviewers</p>
                  <p className="stat-card-value">{adminStats.users_by_role.reviewer}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-card-label">Managers</p>
                  <p className="stat-card-value">{adminStats.users_by_role.manager}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-card-label">Administrators</p>
                  <p className="stat-card-value">{adminStats.users_by_role.administrator}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-card-label">Total Alternatives</p>
                  <p className="stat-card-value">{adminStats.total_alternatives}</p>
                </div>
              </div>
            </div>
          )}

          <div className="panel">
            <p className="panel-title">Welcome back, {profile.full_name.split(" ")[0]}</p>
            <CreateDecision token={token} onCreated={() => setRefreshKey((k) => k + 1)} />
          </div>

          <div className="panel">
            <p className="panel-title">Recent Decisions</p>
            <DecisionsList
              token={token}
              refreshKey={refreshKey}
              role={profile.role?.name}
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
            role={profile.role?.name}
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

      {activeView === "users" && profile.role?.name === "administrator" && (() => {
        const filteredUsers = (users || []).filter((u) => {
          const q = userSearchQuery.toLowerCase();
          return (
            u.full_name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role?.name?.toLowerCase().includes(q)
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
                              value={u.role?.name}
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
                              <option value="administrator">Admin</option>
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
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onNavigateToDecision={handleNavigateFromNotification}
        />
      )}

      {activeView === "reports" &&
        (profile.role?.name === "manager" || profile.role?.name === "administrator") && (
          <ReportsPage token={token} />
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