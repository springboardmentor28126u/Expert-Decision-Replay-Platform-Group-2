import { useState, useEffect } from "react";
import axios from "axios";
import AppShell from "./AppShell";
import CreateDecision from "./CreateDecision";
import DecisionsList from "./DecisionsList";
import DecisionDetails from "./DecisionDetails";
import ChangePassword from "./ChangePassword";

function Dashboard({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedDecision, setSelectedDecision] = useState(null);

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

  if (!profile) {
    return <div style={{ padding: 40 }}>Loading dashboard...</div>;
  }

  const statusCounts = ["draft", "under_review", "approved", "rejected", "archived"].reduce(
    (acc, status) => {
      acc[status] = decisions.filter((d) => d.status === status).length;
      return acc;
    },
    {}
  );

  const handleNavigate = (view) => {
    setSelectedDecision(null);
    setActiveView(view);
  };

  const handleSelectDecision = (decision) => {
    setSelectedDecision(decision);
    setActiveView("decision-details");
  };

  return (
    <AppShell
      profile={profile}
      activeView={activeView}
      onNavigate={handleNavigate}
      onLogout={onLogout}
    >
      {activeView === "dashboard" && (
        <>
          <div className="stat-grid">
            <div className="stat-card draft">
              <p className="stat-card-label">Draft</p>
              <p className="stat-card-value">{statusCounts.draft}</p>
            </div>
            <div className="stat-card under_review">
              <p className="stat-card-label">Under Review</p>
              <p className="stat-card-value">{statusCounts.under_review}</p>
            </div>
            <div className="stat-card approved">
              <p className="stat-card-label">Approved</p>
              <p className="stat-card-value">{statusCounts.approved}</p>
            </div>
            <div className="stat-card rejected">
              <p className="stat-card-label">Rejected</p>
              <p className="stat-card-value">{statusCounts.rejected}</p>
            </div>
            <div className="stat-card archived">
              <p className="stat-card-label">Archived</p>
              <p className="stat-card-value">{statusCounts.archived}</p>
            </div>
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
            />
          </div>
        </>
      )}

      {activeView === "decisions" && (
        <div className="panel">
          <p className="panel-title">All Decisions</p>
          <CreateDecision token={token} onCreated={() => setRefreshKey((k) => k + 1)} />
          <DecisionsList
            token={token}
            refreshKey={refreshKey}
            role={profile.role}
            onSelectDecision={handleSelectDecision}
          />
        </div>
      )}

      {activeView === "decision-details" && selectedDecision && (
        <DecisionDetails
          decision={selectedDecision}
          token={token}
          profile={profile}
          onStatusUpdated={(updated) => setSelectedDecision(updated)}
        />
      )}

      {activeView === "users" && profile.role === "admin" && (
        <div className="panel">
          <p className="panel-title">User Management</p>
          {users ? (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.is_active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Loading users...</p>
          )}
        </div>
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