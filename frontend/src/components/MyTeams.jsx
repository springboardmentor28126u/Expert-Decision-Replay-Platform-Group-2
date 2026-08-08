import { useEffect, useMemo, useState } from "react";
import { Building2, Users } from "lucide-react";
import apiClient, { authHeaders } from "../api/client";
import Badge from "./ui/Badge";

const ROLE_TONE = {
  administrator: "danger",
  manager: "accent",
  reviewer: "reviewer",
  employee: "neutral",
};

// Read-only: managers can see the team(s) they manage and who's on them,
// but every mutation (create/edit/delete/member assignment) stays behind
// the existing admin-facing TeamManagement UI, matching what the backend
// already scopes to Manager/Administrator vs. Administrator-only.
function MyTeams({ token, profile }) {
  const [teams, setTeams] = useState(null);
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [teamsRes, usersRes] = await Promise.all([
          apiClient.get("/api/v1/teams/?page=1&page_size=100", authHeaders(token)),
          apiClient.get("/api/v1/users/?page=1&page_size=100", authHeaders(token)),
        ]);
        setTeams(teamsRes.data.items);
        setUsers(usersRes.data.items);
        setError("");
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load your team.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const membersByTeam = useMemo(() => {
    const map = new Map();
    (users || []).forEach((u) => {
      if (!u.team?.id) return;
      if (!map.has(u.team.id)) map.set(u.team.id, []);
      map.get(u.team.id).push(u);
    });
    return map;
  }, [users]);

  const myTeams = (teams || []).filter((t) => t.manager_id === profile.id);

  if (loading) {
    return (
      <div className="list-skeleton">
        <div className="list-skeleton-row chart-skeleton-bar" />
        <div className="list-skeleton-row chart-skeleton-bar" />
      </div>
    );
  }

  if (error) {
    return <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>;
  }

  return (
    <section className="view-section">
      <div className="view-section-header">
        <div>
          <h2 className="view-section-title">{myTeams.length > 1 ? "My Teams" : "My Team"}</h2>
          <p className="view-section-subtitle">Teams you manage, and who's on them</p>
        </div>
      </div>

      {myTeams.length === 0 ? (
        <div className="empty-state">
          <Building2 size={26} strokeWidth={1.5} aria-hidden="true" />
          <p>You aren't currently set as the manager of any team. Contact an administrator if this looks wrong.</p>
        </div>
      ) : (
        myTeams.map((team) => {
          const members = membersByTeam.get(team.id) || [];
          return (
            <div className="team-card" key={team.id}>
              <div className="team-card-top">
                <div style={{ minWidth: 0 }}>
                  <p className="team-card-name">{team.name}</p>
                  <p className="team-card-manager">
                    Manager: <strong>{profile.full_name} (you)</strong>
                  </p>
                </div>
              </div>

              <div className="team-card-footer">
                <div className="team-card-meta-item">
                  <Users size={12} strokeWidth={2} aria-hidden="true" />
                  {members.length} member{members.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="team-members-panel">
                {members.length === 0 ? (
                  <p className="team-members-empty">No members assigned to this team yet.</p>
                ) : (
                  members.map((m) => (
                    <div className="team-member-row" key={m.id}>
                      <div className="team-member-identity">
                        <span className="team-member-name">{m.full_name}</span>
                        <span className="team-member-email">{m.email}</span>
                      </div>
                      <Badge tone={ROLE_TONE[m.role?.name] || "neutral"}>{m.role?.name}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

export default MyTeams;
