import { useState, useEffect } from "react";
import { Plus, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import apiClient, { authHeaders } from "../api/client";
import { useConfirm } from "../components/ui/ConfirmContext";
import { useToast } from "../components/ui/ToastContext";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import AppShell from "../components/AppShell";
import CreateDecision from "../components/CreateDecision";
import DecisionsList from "../components/DecisionsList";
import DecisionDetails from "./DecisionDetails";
import ChangePassword from "../components/ChangePassword";
import NotificationsPage from "./NotificationsPage";
import ReportsPage from "./ReportsPage";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import "../styles/dashboard.css";

function Dashboard({ token, onLogout }) {
  const confirm = useConfirm();
  const showToast = useToast();
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [decisionSearchQuery, setDecisionSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/api/v1/users/me", authHeaders(token));
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
      setSummaryLoading(true);
      try {
        const res = await apiClient.get("/api/v1/dashboard/summary", authHeaders(token));
        setSummary(res.data);
        setSummaryError("");
      } catch (err) {
        console.log("Failed to load dashboard summary", err);
        setSummaryError("Failed to load dashboard statistics.");
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [token, refreshKey]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!profile || profile.role?.name !== "administrator") return;
      try {
        const res = await apiClient.get("/api/v1/users/?page=1&page_size=100", authHeaders(token));
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
        const res = await apiClient.get("/api/v1/notifications", authHeaders(token));
        setNotifications(res.data);
      } catch (err) {
        console.log("Failed to load notifications", err);
      } finally {
        setNotificationsLoading(false);
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
        const approvalRes = await apiClient.get(
          `/api/v1/approvals/${notification.related_entity_id}`,
          authHeaders(token)
        );
        decisionId = approvalRes.data.decision_id;
      }

      if (!decisionId) {
        setStatusFilter("all");
        setActiveView("decisions");
        return;
      }

      const decisionRes = await apiClient.get(`/api/v1/decisions/${decisionId}`, authHeaders(token));
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
      await apiClient.patch(
        `/api/v1/notifications/${id}/read`,
        {},
        authHeaders(token)
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await apiClient.patch(
        "/api/v1/notifications/read-all",
        {},
        authHeaders(token)
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
      showToast(
        `Cannot assign "${newRoleName}" — no existing user currently holds that role, so its id can't be resolved.`,
        { tone: "error" }
      );
      return;
    }
    try {
      const res = await apiClient.patch(
        `/api/v1/users/${userId}/role`,
        { role_id: roleId },
        authHeaders(token)
      );
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
    } catch (err) {
      console.error("Failed to update role", err);
      showToast(err.response?.data?.detail || "Failed to update role", { tone: "error" });
    }
  };

  const handleDeleteUser = async (userId) => {
    const ok = await confirm("Are you sure you want to delete this user?", {
      title: "Delete user",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/api/v1/users/${userId}`, authHeaders(token));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Failed to delete user", err);
      showToast(err.response?.data?.detail || "Failed to delete user", { tone: "error" });
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
          <AnalyticsDashboard
            analytics={summary?.analytics}
            statusCounts={statusCounts}
            loading={summaryLoading}
            error={summaryError}
            onStatClick={handleStatCardClick}
            notifications={notifications}
            notificationsLoading={notificationsLoading}
          />

          {adminStats && (
            <section className="view-section">
              <div className="view-section-header">
                <h2 className="view-section-title">Organization Overview</h2>
              </div>
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
            </section>
          )}

          <section className="view-section">
            <div className="view-section-header">
              <h2 className="view-section-title">Welcome back, {profile.full_name.split(" ")[0]}</h2>
              <p className="view-section-subtitle">Create decision</p>
            </div>
            <CreateDecision token={token} onCreated={() => setRefreshKey((k) => k + 1)} />
          </section>

          <section className="view-section">
            <div className="view-section-header">
              <h2 className="view-section-title">Recent Decisions</h2>
            </div>
            <DecisionsList
              token={token}
              refreshKey={refreshKey}
              role={profile.role?.name}
              onSelectDecision={handleSelectDecision}
              pageSize={3}
              statusFilter="all"
            />
          </section>
        </>
      )}

      {activeView === "decisions" && (
        <section className="view-section">
          <div className="view-section-header">
            <h2 className="view-section-title">All Decisions</h2>
            <Button variant="primary" size="sm" onClick={() => setShowCreateForm((v) => !v)}>
              {showCreateForm ? (
                <X size={14} strokeWidth={2.25} aria-hidden="true" />
              ) : (
                <Plus size={14} strokeWidth={2.25} aria-hidden="true" />
              )}
              {showCreateForm ? "Cancel" : "New Decision"}
            </Button>
          </div>

          {showCreateForm && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <CreateDecision
                token={token}
                onCreated={() => {
                  setRefreshKey((k) => k + 1);
                  setShowCreateForm(false);
                }}
              />
            </div>
          )}

          <div className="filter-bar">
            <div className="filter-group filter-group-grow search-field">
              <Search size={15} strokeWidth={2} className="search-field-icon" aria-hidden="true" />
              <input
                id="decision-search"
                type="text"
                className="search-input"
                placeholder="Search decisions by title or category..."
                aria-label="Search decisions"
                value={decisionSearchQuery}
                onChange={(e) => setDecisionSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="status-filter" className="filter-label">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-select"
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
        </section>
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
                    className="search-input"
                    placeholder="🔍 Search users by name, email, or role..."
                    aria-label="Search users"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setCurrentUserPage(1);
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
                              className="status-select"
                              value={u.role?.name}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={u.id === profile.id}
                              aria-label={`Change role for ${u.full_name}`}
                              style={{ fontSize: "13px", padding: "6px 10px" }}
                            >
                              <option value="employee">Employee</option>
                              <option value="reviewer">Reviewer</option>
                              <option value="manager">Manager</option>
                              <option value="administrator">Admin</option>
                            </select>
                          </td>
                          <td>
                            <Badge tone={u.is_active ? "success" : "danger"}>
                              {u.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === profile.id}
                            >
                              Delete
                            </Button>
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
                  <div className="pagination-controls">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="pagination-btn"
                      onClick={() => setCurrentUserPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentUserPage === 1}
                    >
                      <ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
                      Previous
                    </Button>
                    <span className="pagination-status">
                      Page {currentUserPage} of {totalUserPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="pagination-btn"
                      onClick={() => setCurrentUserPage((prev) => Math.min(prev + 1, totalUserPages))}
                      disabled={currentUserPage === totalUserPages}
                    >
                      Next
                      <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                    </Button>
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