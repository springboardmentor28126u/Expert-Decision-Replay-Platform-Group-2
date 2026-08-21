import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { teamService } from '../services/teamService';
import { userService } from '../services/userService';
import type { Team, TeamMember } from '../types/team';
import type { User } from '../types/user';
import {
  IconHome,
  IconUserCog,
  IconUsers,
  IconUsersGroup,
  IconPlus,
  IconTrash,
  IconEdit,
  IconUserPlus,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/admin' },
  { label: 'Users', icon: IconUserCog, path: '/dashboard/admin/users' },
  { label: 'Teams', icon: IconUsers, path: '/dashboard/admin/teams' },
  { label: 'Groups', icon: IconUsersGroup, path: '/dashboard/admin/groups' },
];

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [showAddMember, setShowAddMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const fetchTeams = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await teamService.getTeams();
      setTeams(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load teams');
    }
    setLoading(false);
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleCreate = async () => {
    if (!createName) {
      setCreateError('Team name is required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await teamService.createTeam({ name: createName, description: createDescription || undefined });
      setShowCreate(false);
      setCreateName('');
      setCreateDescription('');
      fetchTeams();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create team');
    }
    setCreating(false);
  };

  const handleEdit = async () => {
    if (!editingTeam || !editName) return;
    setSaving(true);
    setEditError('');
    try {
      await teamService.updateTeam(editingTeam.id, { name: editName, description: editDescription || undefined });
      setEditingTeam(null);
      fetchTeams();
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to update team');
    }
    setSaving(false);
  };

  const handleDelete = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamService.deleteTeam(teamId);
      fetchTeams();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete team');
    }
  };

  const handleViewMembers = async (team: Team) => {
    setSelectedTeam(team);
    setLoadingMembers(true);
    try {
      const data = await teamService.getTeamMembers(team.id);
      setMembers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load members');
    }
    setLoadingMembers(false);
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUserId) return;
    setAddingMember(true);
    try {
      await teamService.addTeamMember(selectedTeam.id, { user_id: selectedUserId, role: 'member' });
      setShowAddMember(false);
      setSelectedUserId('');
      handleViewMembers(selectedTeam);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add member');
    }
    setAddingMember(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    if (!confirm('Remove this member from the team?')) return;
    try {
      await teamService.removeTeamMember(selectedTeam.id, userId);
      handleViewMembers(selectedTeam);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove member');
    }
  };

  const openAddMember = async () => {
    setShowAddMember(true);
    try {
      const data = await userService.getUsers({ limit: 100 });
      setAvailableUsers(data.items);
    } catch {
      console.error('Failed to load users');
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Team Management">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teams</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <IconPlus size={18} />
            Create Team
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No teams found. Create your first team!</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div key={team.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{team.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingTeam(team); setEditName(team.name); setEditDescription(team.description || ''); }}
                      className="p-1 text-gray-500 hover:text-blue-600"
                    >
                      <IconEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
                {team.description && (
                  <p className="text-sm text-gray-500 mb-3">{team.description}</p>
                )}
                <button
                  onClick={() => handleViewMembers(team)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View Members ({team.member_count || 0})
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Create Team</h2>
              {createError && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{createError}</div>}
              <input
                type="text"
                placeholder="Team Name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full mb-3 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                placeholder="Description (optional)"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className="w-full mb-4 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button onClick={handleCreate} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Edit Team</h2>
              {editError && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{editError}</div>}
              <input
                type="text"
                placeholder="Team Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full mb-3 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                placeholder="Description (optional)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full mb-4 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingTeam(null)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button onClick={handleEdit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Members of {selectedTeam.name}</h2>
                <button onClick={() => { setSelectedTeam(null); setMembers([]); }} className="text-gray-500 hover:text-gray-700">&times;</button>
              </div>

              <button
                onClick={openAddMember}
                className="mb-4 flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <IconUserPlus size={16} />
                Add Member
              </button>

              {loadingMembers ? (
                <div className="text-center py-4 text-gray-500">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No members in this team</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{member.full_name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">{member.role}</span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Add Team Member</h2>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full mb-4 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select a user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddMember(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button onClick={handleAddMember} disabled={addingMember || !selectedUserId} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {addingMember ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
