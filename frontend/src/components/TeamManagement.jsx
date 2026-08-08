import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Users, ChevronDown, ChevronUp, X, Search, Crown } from "lucide-react";
import apiClient, { authHeaders } from "../api/client";
import { useConfirm } from "./ui/ConfirmContext";
import { useToast } from "./ui/ToastContext";
import Button from "./ui/Button";

// Teams have exactly one manager (Team.manager_id) and members join via a
// plain users.team_id FK — there's no many-to-many membership table, so a
// user can only ever be on one team. All the data this view needs (member
// lists, manager names, per-team counts) is derived from the `users` list
// the User Management page already loads, rather than fetching per-team
// detail — GET /api/v1/teams/ (TeamOut) has no members/counts of its own.
function TeamManagement({ token, users, onUsersChanged }) {
  const confirm = useConfirm();
  const showToast = useToast();
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [modalTeam, setModalTeam] = useState(undefined); // undefined = closed, null = create, object = edit

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/v1/teams/?page=1&page_size=100", authHeaders(token));
      setTeams(res.data.items);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load teams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const usersById = useMemo(() => {
    const map = new Map();
    (users || []).forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const membersByTeam = useMemo(() => {
    const map = new Map();
    (users || []).forEach((u) => {
      if (!u.team?.id) return;
      if (!map.has(u.team.id)) map.set(u.team.id, []);
      map.get(u.team.id).push(u);
    });
    return map;
  }, [users]);

  const managers = (users || []).filter((u) => u.role?.name === "manager");

  const refreshAll = async () => {
    await fetchTeams();
    onUsersChanged?.();
  };

  const handleRemoveMember = async (team, userId) => {
    try {
      await apiClient.delete(`/api/v1/teams/${team.id}/members/${userId}`, authHeaders(token));
      await refreshAll();
      showToast("Member removed from team.", { tone: "success" });
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to remove member.", { tone: "error" });
    }
  };

  const handleDelete = async (team) => {
    const memberCount = (membersByTeam.get(team.id) || []).length;
    if (memberCount > 0) {
      showToast("Remove all members from this team before deleting it.", { tone: "error" });
      return;
    }
    const ok = await confirm(
      `Delete "${team.name}" permanently? Decisions previously linked to this team keep their history.`,
      { title: "Delete team", confirmLabel: "Delete", danger: true }
    );
    if (!ok) return;
    try {
      await apiClient.delete(`/api/v1/teams/${team.id}`, authHeaders(token));
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      showToast("Team deleted.", { tone: "success" });
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to delete team.", { tone: "error" });
    }
  };

  if (loading && !teams) {
    return (
      <div className="list-skeleton">
        <div className="list-skeleton-row chart-skeleton-bar" />
        <div className="list-skeleton-row chart-skeleton-bar" />
      </div>
    );
  }

  if (error && !teams) {
    return <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>;
  }

  return (
    <div>
      <div className="panel-toolbar">
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          {teams.length} team{teams.length === 1 ? "" : "s"}
        </p>
        <Button variant="primary" size="sm" onClick={() => setModalTeam(null)}>
          <Plus size={14} strokeWidth={2.25} aria-hidden="true" />
          Create Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="empty-state">
          <Users size={26} strokeWidth={1.5} aria-hidden="true" />
          <p>No teams yet. Create one to start organizing users and tracking team-level reporting.</p>
        </div>
      ) : (
        teams.map((team) => {
          const members = membersByTeam.get(team.id) || [];
          const manager = team.manager_id ? usersById.get(team.manager_id) : null;
          const expanded = expandedTeamId === team.id;
          return (
            <div className="team-card" key={team.id}>
              <div className="team-card-top">
                <div style={{ minWidth: 0 }}>
                  <p className="team-card-name">{team.name}</p>
                  <p className="team-card-manager">
                    Manager: <strong>{manager ? manager.full_name : "Unassigned"}</strong>
                  </p>
                </div>
              </div>

              <div className="team-card-footer">
                <div className="team-card-meta-item">
                  <Users size={12} strokeWidth={2} aria-hidden="true" />
                  {members.length} member{members.length === 1 ? "" : "s"}
                </div>

                <div className="team-card-actions">
                  <Button variant="secondary" size="sm" onClick={() => setExpandedTeamId(expanded ? null : team.id)}>
                    {expanded ? <ChevronUp size={13} strokeWidth={2} aria-hidden="true" /> : <ChevronDown size={13} strokeWidth={2} aria-hidden="true" />}
                    {expanded ? "Hide Members" : "View Members"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setModalTeam(team)}>
                    <Pencil size={13} strokeWidth={2} aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(team)}
                    disabled={members.length > 0}
                    title={members.length > 0 ? "Remove all members before deleting this team" : undefined}
                  >
                    <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </div>

              {expanded && (
                <div className="team-members-panel">
                  {members.length === 0 ? (
                    <p className="team-members-empty">No members yet. Use Edit to assign users to this team.</p>
                  ) : (
                    members.map((m) => (
                      <div className="team-member-row" key={m.id}>
                        <div className="team-member-identity">
                          <span className="team-member-name">
                            {m.full_name}
                            {m.id === team.manager_id && (
                              <Crown size={11} strokeWidth={2} style={{ marginLeft: 5, color: "var(--warning)", verticalAlign: -1 }} aria-label="Manager" />
                            )}
                          </span>
                          <span className="team-member-email">{m.email}</span>
                        </div>
                        <button
                          type="button"
                          className="team-member-remove-btn"
                          onClick={() => handleRemoveMember(team, m.id)}
                          aria-label={`Remove ${m.full_name} from ${team.name}`}
                          title="Remove from team"
                        >
                          <X size={14} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {modalTeam !== undefined && (
        <TeamFormModal
          token={token}
          team={modalTeam}
          users={users}
          managers={managers}
          membersByTeam={membersByTeam}
          onClose={() => setModalTeam(undefined)}
          onSaved={async () => {
            setModalTeam(undefined);
            await refreshAll();
          }}
        />
      )}
    </div>
  );
}

function TeamFormModal({ token, team, users, managers, membersByTeam, onClose, onSaved }) {
  const showToast = useToast();
  const isEdit = !!team;
  const existingMembers = isEdit ? membersByTeam.get(team.id) || [] : [];

  const [name, setName] = useState(team?.name || "");
  const [managerId, setManagerId] = useState(team?.manager_id || "");
  const [selectedIds, setSelectedIds] = useState(() => new Set(existingMembers.map((u) => u.id)));
  const [memberSearch, setMemberSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const filteredUsers = (users || []).filter((u) => {
    const q = memberSearch.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const toggleMember = (userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Team name is required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      let teamId = team?.id;
      const payload = { name: name.trim(), manager_id: managerId || null };

      if (isEdit) {
        await apiClient.patch(`/api/v1/teams/${teamId}`, payload, authHeaders(token));
      } else {
        const res = await apiClient.post("/api/v1/teams/", payload, authHeaders(token));
        teamId = res.data.id;
      }

      const originalIds = new Set(existingMembers.map((u) => u.id));
      const toAdd = [...selectedIds].filter((id) => !originalIds.has(id));
      const toRemove = [...originalIds].filter((id) => !selectedIds.has(id));

      for (const userId of toAdd) {
        await apiClient.post(`/api/v1/teams/${teamId}/members`, { user_id: userId }, authHeaders(token));
      }
      for (const userId of toRemove) {
        await apiClient.delete(`/api/v1/teams/${teamId}/members/${userId}`, authHeaders(token));
      }

      showToast(isEdit ? "Team updated." : "Team created.", { tone: "success" });
      onSaved();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to save team.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-modal-overlay" onMouseDown={onClose}>
      <div
        className="ui-modal ui-modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit team" : "Create team"}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="ui-modal-title">{isEdit ? `Edit ${team.name}` : "Create Team"}</p>

        <form onSubmit={handleSubmit}>
          <div className="ui-modal-form-field">
            <label className="ui-modal-form-label" htmlFor="team-name">Team Name</label>
            <input
              id="team-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering"
              required
            />
          </div>

          <div className="ui-modal-form-field">
            <label className="ui-modal-form-label" htmlFor="team-manager">Manager</label>
            <select id="team-manager" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
              <option value="">Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>

          <div className="ui-modal-form-field">
            <label className="ui-modal-form-label">
              Members ({selectedIds.size} selected)
            </label>
            <div className="search-field" style={{ maxWidth: "none", marginBottom: 8 }}>
              <Search size={14} strokeWidth={2} className="search-field-icon" aria-hidden="true" />
              <input
                type="text"
                className="search-input"
                placeholder="Search users by name or email..."
                aria-label="Search users to add"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="multi-select-box">
              {filteredUsers.length === 0 ? (
                <p className="multi-select-empty">No users matched your search.</p>
              ) : (
                filteredUsers.map((u) => {
                  const otherTeam = u.team && u.team.id !== team?.id ? u.team : null;
                  return (
                    <label className="multi-select-row" key={u.id}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleMember(u.id)}
                      />
                      <span className="multi-select-label">
                        <span className="multi-select-name">{u.full_name} — {u.email}</span>
                        {otherTeam && (
                          <span className="multi-select-hint">Currently in {otherTeam.name} — will be moved</span>
                        )}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {formError && (
            <p style={{ color: "var(--danger)", fontSize: "13px", marginBottom: "var(--space-3)" }}>{formError}</p>
          )}

          <div className="ui-modal-actions">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeamManagement;
