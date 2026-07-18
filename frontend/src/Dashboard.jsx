import { useState, useEffect } from "react";
import axios from "axios";
import "./dashboard.css";
import CreateDecision from "./CreateDecision";
import DecisionsList from "./DecisionsList";
import DecisionDetails from "./DecisionDetails";

function Dashboard({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
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
    return <div className="dash-loading">Loading dashboard...</div>;
  }

  const roleCounts = users
    ? users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {})
    : null;

  return (
    <div className="dash-wrapper">
      <nav className="dash-nav">
        <span className="dash-logo">EDRP</span>
        <div className="dash-nav-right">
          <span className="dash-user">{profile.full_name} · <b>{profile.role}</b></span>
          <button className="dash-logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <main className="dash-main">
        {selectedDecision ? (
          <div>
            <button className="dash-back-btn" onClick={() => { setSelectedDecision(null); setRefreshKey(prev => prev + 1); }}>
              &larr; Back to Dashboard
            </button>
            <DecisionDetails 
              decision={selectedDecision} 
              token={token} 
              profile={profile}
              onStatusUpdated={(updatedDecision) => setSelectedDecision(updatedDecision)}
            />
          </div>
        ) : (
          <>
            <h1 className="dash-heading">Welcome back, {profile.full_name.split(" ")[0]}</h1>
            <p className="dash-subheading">Here's what's happening on your dashboard today.</p>

            <div className="dash-grid">
              <div className="dash-section">
                <h2 className="dash-section-title">Decisions</h2>
                <CreateDecision token={token} onCreated={() => setRefreshKey((k) => k + 1)} />
                <DecisionsList token={token} refreshKey={refreshKey} onSelectDecision={setSelectedDecision} />
              </div>

              <div className="dash-card">
                <p className="dash-card-label">Pending Reviews</p>
                <p className="dash-card-value">0</p>
                <p className="dash-card-note">Nothing awaiting your review</p>
              </div>

              <div className="dash-card">
                <p className="dash-card-label">Account Created</p>
                <p className="dash-card-value">{new Date(profile.created_at).toLocaleDateString()}</p>
                <p className="dash-card-note">Member since registration</p>
              </div>

              {profile.role === "admin" && users && (
                <div className="dash-card">
                  <p className="dash-card-label">Total Users</p>
                  <p className="dash-card-value">{users.length}</p>
                  <p className="dash-card-note">Across all roles</p>
                </div>
              )}
            </div>

            {profile.role === "admin" && (
              <div className="dash-section">
                <h2 className="dash-section-title">User Management</h2>

                {roleCounts && (
                  <div className="dash-role-summary">
                    {Object.entries(roleCounts).map(([role, count]) => (
                      <span key={role} className="dash-role-pill">
                        {role}: {count}
                      </span>
                    ))}
                  </div>
                )}

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
                          <td><span className="dash-role-badge">{u.role}</span></td>
                          <td>{u.is_active ? "Active" : "Inactive"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="dash-card-note">Loading users...</p>
                )}
              </div>
            )}

            {profile.role !== "admin" && (
              <div className="dash-section">
                <h2 className="dash-section-title">Recent Activity</h2>
                <p className="dash-card-note">No recent activity to display yet.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;